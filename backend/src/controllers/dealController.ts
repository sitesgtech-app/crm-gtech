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

interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: string;
        organizationId: string;
    };
}

export const getDeals = async (req: Request, res: Response) => {
    try {
        const { userId, role, organizationId } = (req as AuthRequest).user!;

        const whereClause: any = { organizationId: organizationId || 'org1' }; // Fallback for legacy
        if (role !== 'ADMIN') {
            whereClause.ownerId = userId;
        }

        const deals = await prisma.deal.findMany({
            where: whereClause,
            include: { client: true, owner: true },
            orderBy: { createdAt: 'desc' },
        });
        res.json(deals);
    } catch (error) {
        console.error('Get Deals Error:', error);
        res.status(500).json({ error: 'Failed to fetch deals' });
    }
};

export const createDeal = async (req: Request, res: Response) => {
    try {
        const { userId, organizationId } = (req as AuthRequest).user!;
        const data = dealSchema.parse(req.body);

        const deal = await prisma.deal.create({
            data: {
                ...data,
                ownerId: userId,
                organizationId: organizationId || 'org1',
                expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : undefined,
            } as any, // Cast to any to bypass strict type check for now
        });
        res.status(201).json(deal);
    } catch (error) {
        res.status(400).json({ error: 'Invalid input' });
    }
};

export const updateDealStage = async (req: Request, res: Response) => {
    try {
        const { organizationId } = (req as AuthRequest).user!;
        const { id } = req.params;
        const { stage } = req.body;

        // Verify ownership/org
        const existing = await prisma.deal.findFirst({
            where: { id, organizationId: organizationId || 'org1' } as any
        });

        if (!existing) {
            return res.status(404).json({ error: 'Deal not found or access denied' });
        }

        const deal = await prisma.deal.update({
            where: { id },
            data: { stage },
        });
        res.json(deal);
    } catch (error) {
        res.status(400).json({ error: 'Failed to update deal' });
    }
};
