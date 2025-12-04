import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { z } from 'zod';

const clientSchema = z.object({
    name: z.string(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    company: z.string().optional(),
    address: z.string().optional(),
});

export const getClients = async (req: Request, res: Response) => {
    try {
        const clients = await prisma.client.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.json(clients);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch clients' });
    }
};

export const createClient = async (req: Request, res: Response) => {
    try {
        const data = clientSchema.parse(req.body);
        const client = await prisma.client.create({ data });
        res.status(201).json(client);
    } catch (error) {
        res.status(400).json({ error: 'Invalid input' });
    }
};

export const getClient = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const client = await prisma.client.findUnique({
            where: { id },
            include: { deals: true, tickets: true },
        });
        if (!client) return res.status(404).json({ error: 'Client not found' });
        res.json(client);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch client' });
    }
};
