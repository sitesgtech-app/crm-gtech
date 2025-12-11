import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { z } from 'zod';

const clientSchema = z.object({
    name: z.string(),
    company: z.string().optional().or(z.literal('')), // Making company optional too just in case, though usually required.
    // Allow null, undefined, empty string, whatever. We clean it later.
    email: z.any().optional(),
    phone: z.any().optional(),
    address: z.any().optional(),
    nit: z.any().optional(),
    sector: z.any().optional(),
    assignedAdvisor: z.any().optional(),
    responsibleId: z.any().optional(),
    tags: z.any().optional(),
    companyPhone: z.any().optional(),
    extension: z.any().optional(),
});

interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: string;
        organizationId: string;
        // id is commonly used in my code too?
        id: string; // Add this just in case
    };
}
// Note: AuthRequest re-definition here might conflict if I don't check imports but valid locally.
// Actually AuthRequest is usually imported. I'll stick to the schema update and updateClient function.

export const getClients = async (req: Request, res: Response) => {
    try {
        const { organizationId } = (req as AuthRequest).user!;
        const clients = await prisma.client.findMany({
            where: { organizationId: organizationId || 'org1' },
            orderBy: { createdAt: 'desc' },
        });
        res.json(clients);
    } catch (error) {
        console.error("Get Clients Error", error);
        res.status(500).json({ error: 'Failed to fetch clients' });
    }
};

export const createClient = async (req: Request, res: Response) => {
    try {
        const { organizationId, userId } = (req as AuthRequest).user!;
        const data = clientSchema.parse(req.body);

        // Sanitize data: Convert empty strings to null/undefined for ALL optional fields
        const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
            if (typeof value === 'string' && value.trim() === '') {
                acc[key] = undefined; // Prisma will treat undefined as "do not set" or null if nullable
            } else if (typeof value === 'string') {
                acc[key] = value.trim();
            } else {
                acc[key] = value;
            }
            return acc;
        }, {} as any);

        const advisorId = cleanData.assignedAdvisor || (req.body.responsibleId as string) || userId;

        const client = await prisma.client.create({
            data: {
                ...cleanData,
                assignedAdvisor: advisorId, // Explicitly set it
                organizationId: organizationId || 'org1'
            }
        });
        res.status(201).json(client);
    } catch (error: any) {
        console.error("Create Client Error", error);

        let errorMessage = 'Invalid input';
        if (error instanceof z.ZodError) {
            errorMessage = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        } else if (error.message) {
            errorMessage = error.message;
        }

        res.status(400).json({ error: errorMessage });
    }
};

export const getClient = async (req: Request, res: Response) => {
    try {
        const { organizationId } = (req as AuthRequest).user!;
        const { id } = req.params;
        const client = await prisma.client.findFirst({
            where: { id, organizationId: organizationId || 'org1' },
            include: { deals: true, tickets: true },
        });
        if (!client) return res.status(404).json({ error: 'Client not found or access denied' });
        res.json(client);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch client' });
    }
};

export const updateClient = async (req: Request, res: Response) => {
    try {
        const { organizationId } = (req as AuthRequest).user!;
        const { id } = req.params;
        const data = clientSchema.partial().parse(req.body);

        // Sanitize data: same as createClient
        const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
            if (typeof value === 'string' && value.trim() === '') {
                acc[key] = null; // Use null for update to explicitly clear if needed, or undefined. 
                // Prisma update: undefined means "do not touch", null means "set to null".
                // Ideally if user sends "", they might mean "clear it". 
                // But for now let's use undefined (do not touch) if it's just empty "update", 
                // OR if they intended to clear, we should send null.
                // Given the "no restrictions" request, let's treat "" as NULL (clear field).
                acc[key] = null;
            } else if (typeof value === 'string') {
                acc[key] = value.trim();
            } else {
                acc[key] = value;
            }
            return acc;
        }, {} as any);

        // Handle assignedAdvisor specifically
        // If the user sends a new assignedAdvisor, use it.
        // If cleanData.assignedAdvisor is explicitly set (even null), use it.
        // If it's undefined (not sent), don't touch it.
        // BUT, we also have responsibleId.

        // Merge responsibleId into assignedAdvisor if present and assignedAdvisor is missing
        if (cleanData.responsibleId && !cleanData.assignedAdvisor) {
            cleanData.assignedAdvisor = cleanData.responsibleId;
        }

        const client = await prisma.client.update({
            where: { id, organizationId: organizationId || 'org1' },
            data: cleanData
        });
        res.json(client);
    } catch (error) {
        console.error("Update Client Error", error);
        res.status(500).json({ error: 'Failed to update client' });
    }
};

export const deleteClient = async (req: Request, res: Response) => {
    try {
        const { organizationId } = (req as AuthRequest).user!;
        const { id } = req.params;

        // Ensure client belongs to organization before deleting
        const client = await prisma.client.findFirst({
            where: { id, organizationId: organizationId || 'org1' }
        });

        if (!client) {
            return res.status(404).json({ error: 'Client not found or access denied' });
        }

        await prisma.client.delete({ where: { id } });
        res.json({ message: 'Client deleted successfully' });
    } catch (error) {
        console.error("Delete Client Error", error);
        res.status(500).json({ error: 'Failed to delete client' });
    }
};
