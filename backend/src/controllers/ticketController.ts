import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { z } from 'zod';

// Schema moved below to include optional fields

export const getTickets = async (req: Request, res: Response) => {
    try {
        const tickets = await prisma.ticket.findMany({
            where: { deletedAt: null },
            include: { client: true, assignedTo: true },
            orderBy: { createdAt: 'desc' },
        });
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch tickets' });
    }
};

// Email service import handled separately or assume dynamic import to avoid relative path issues if strictly enforced, 
// using relative path normally:


interface AuthRequest extends Request {
    user?: {
        userId: string;
        organizationId: string;
    };
}

const ticketSchema = z.object({
    title: z.string(),
    description: z.string(),
    priority: z.enum(['Baja', 'Media', 'Alta', 'Urgente']).optional(),
    clientId: z.string().optional().nullable(),
    assignedToId: z.string().optional(),
    department: z.string().optional(),
    requesterId: z.string().optional(),
});

export const createTicket = async (req: Request, res: Response) => {
    try {
        console.log("Creating Ticket Payload:", JSON.stringify(req.body, null, 2));
        const { organizationId } = (req as AuthRequest).user!;
        const data = ticketSchema.parse(req.body);

        const { clientId, assignedToId, requesterId, department, ...otherData } = data;

        const ticket = await prisma.ticket.create({
            data: {
                ...otherData,
                clientId: clientId || undefined,
                assignedToId: assignedToId || undefined, // Fix: Empty string -> undefined
                requesterId: requesterId || undefined,   // Fix: Empty string -> undefined
                department: department || 'General',
                priority: data.priority || 'Media',
                organizationId: organizationId || 'org1'
            } as any,
            include: { assignedTo: true }
        });

        // NOTIFICATION LOGIC
        if (assignedToId) {
            try {
                // Ensure notificationController is imported or use prisma directly here to avoid circular deps if any
                // Using prisma directly for simplicity in controller-to-controller calls
                await prisma.notification.create({
                    data: {
                        userId: assignedToId,
                        organizationId: organizationId || 'org1',
                        title: 'Nuevo Ticket Asignado',
                        message: `Se te ha asignado el ticket: ${data.title}`,
                        type: 'info'
                    }
                });
            } catch (e) {
                console.error("Failed to send notification", e);
            }
        }



        res.status(201).json(ticket);
    } catch (error) {
        console.error("Create Ticket Error:", error);
        // Helper to extract Prisma error message if possible
        const errorMessage = (error as any).message || 'Invalid input or server error';
        if ((error as any).code) {
            console.error("Prisma Error Code:", (error as any).code);
        }
        res.status(400).json({ error: errorMessage, details: (error as any).meta || {} });
    }
};

export const updateTicketStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const ticket = await prisma.ticket.update({
            where: { id },
            data: { status },
        });
        res.json(ticket);
    } catch (error) {
        res.status(400).json({ error: 'Failed to update ticket' });
    }
};

export const softDeleteTicket = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        await prisma.ticket.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                deletionReason: reason
            },
        });
        res.json({ message: 'Ticket moved to trash' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete ticket' });
    }
};

export const restoreTicket = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.ticket.update({
            where: { id },
            data: {
                deletedAt: null,
                deletionReason: null
            },
        });
        res.json({ message: 'Ticket restored' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to restore ticket' });
    }
};

export const getTrashedTickets = async (req: Request, res: Response) => {
    try {
        const tickets = await prisma.ticket.findMany({
            where: { NOT: { deletedAt: null } },
            include: { client: true, assignedTo: true },
            orderBy: { deletedAt: 'desc' },
        });
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch trashed tickets' });
    }
};
