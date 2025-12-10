import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest } from '../middleware/authMiddleware';

const prisma = new PrismaClient();

const activitySchema = z.object({
    type: z.string().min(1, "Type is required"),
    description: z.string().min(1, "Description is required"),
    date: z.string().datetime(),
    dealId: z.string().uuid(),
    userId: z.string().optional(), // Can be inferred from token if missing
});

export const getActivities = async (req: Request, res: Response) => {
    try {
        const { dealId } = req.query;
        if (!dealId || typeof dealId !== 'string') {
            return res.status(400).json({ error: 'dealId query parameter is required' });
        }

        const activities = await prisma.activity.findMany({
            where: { dealId },
            include: { user: true },
            orderBy: { date: 'desc' }
        });

        const formatted = activities.map(a => ({
            id: a.id,
            type: a.type,
            description: a.description,
            date: a.date,
            responsibleId: a.userId,
            responsibleName: a.user?.name || 'Unknown',
            createdAt: a.createdAt
        }));

        res.json(formatted);
    } catch (error) {
        console.error("Error fetching activities:", error);
        res.status(500).json({ error: 'Failed to fetch activities' });
    }
};

export const createActivity = async (req: Request, res: Response) => {
    try {
        const { organizationId, id: userId } = (req as AuthRequest).user!;
        const data = activitySchema.parse(req.body);

        const activity = await prisma.activity.create({
            data: {
                type: data.type,
                description: data.description,
                date: new Date(data.date),
                dealId: data.dealId,
                userId: userId, // Use authenticated user
                organizationId
            },
            include: { user: true }
        });

        res.status(201).json({
            id: activity.id,
            type: activity.type,
            description: activity.description,
            date: activity.date,
            responsibleId: activity.userId,
            responsibleName: activity.user.name
        });
    } catch (error) {
        console.error("Error creating activity:", error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        res.status(500).json({ error: 'Failed to create activity' });
    }
};

export const updateActivity = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { description, date, type } = req.body;

        const updated = await prisma.activity.update({
            where: { id },
            data: {
                description,
                type,
                date: date ? new Date(date) : undefined
            }
        });

        res.json(updated);
    } catch (error) {
        console.error("Error updating activity:", error);
        res.status(500).json({ error: 'Failed to update activity' });
    }
};

export const deleteActivity = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.activity.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        console.error("Error deleting activity:", error);
        res.status(500).json({ error: 'Failed to delete activity' });
    }
};
