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
});

interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: string;
        organizationId: string;
    };
}

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
    } catch (error) {
        console.error("Create Client Error", error);
        res.status(400).json({ error: 'Invalid input' });
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
