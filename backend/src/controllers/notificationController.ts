import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { z } from 'zod';

export const getNotifications = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        console.log("Fetching notifications for user payload:", JSON.stringify(user));
        const { userId } = user;

        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        console.log(`Found ${notifications.length} notifications for user ${userId}`);
        res.json(notifications);
    } catch (error) {
        console.error("Get Notifications Error:", error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
};

export const markAsRead = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { userId } = (req as any).user;

        // Verify ownership
        const notification = await prisma.notification.findUnique({ where: { id } });
        if (!notification || notification.userId !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await prisma.notification.update({
            where: { id },
            data: { read: true }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
};

// Internal Helper for other controllers
export const createNotification = async (userId: string, title: string, message: string, type: string = 'info', organizationId: string = 'org1') => {
    try {
        await prisma.notification.create({
            data: {
                userId,
                title,
                message,
                type,
                organizationId
            }
        });
    } catch (error) {
        console.error("Failed to create notification internal", error);
    }
};
