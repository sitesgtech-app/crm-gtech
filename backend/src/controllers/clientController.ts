import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { z } from 'zod';

const clientSchema = z.object({
    name: z.string(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    company: z.string().optional(),
    address: z.string().optional(),
    nit: z.string().optional(),
    sector: z.string().optional(),
    assignedAdvisor: z.string().optional(),
    tags: z.array(z.string()).optional(),
    companyPhone: z.string().optional(),
    extension: z.string().optional(),
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
        const { organizationId } = (req as AuthRequest).user!;
        const data = clientSchema.parse(req.body);
        const client = await prisma.client.create({
            data: {
                ...data,
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

        const client = await prisma.client.update({
            where: { id, organizationId: organizationId || 'org1' },
            data
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
