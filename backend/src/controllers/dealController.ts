import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { z } from 'zod';

const dealSchema = z.object({
    title: z.string(),
    value: z.number(),
    stage: z.enum(['LEAD', 'CONTACTED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST']),
    clientId: z.string(),
    ownerId: z.string(),
    probability: z.number().optional(),
    expectedCloseDate: z.string().optional(),
});

export const getDeals = async (req: Request, res: Response) => {
    try {
        const deals = await prisma.deal.findMany({
            include: { client: true, owner: true },
            orderBy: { createdAt: 'desc' },
        });
        res.json(deals);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch deals' });
    }
};

export const createDeal = async (req: Request, res: Response) => {
    try {
        const data = dealSchema.parse(req.body);
        const deal = await prisma.deal.create({
            data: {
                ...data,
                expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : undefined,
            },
        });
        res.status(201).json(deal);
    } catch (error) {
        res.status(400).json({ error: 'Invalid input' });
    }
};

export const updateDealStage = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { stage } = req.body;
        const deal = await prisma.deal.update({
            where: { id },
            data: { stage },
        });
        res.json(deal);
    } catch (error) {
        res.status(400).json({ error: 'Failed to update deal' });
    }
};
