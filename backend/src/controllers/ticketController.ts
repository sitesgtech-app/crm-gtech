import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { z } from 'zod';

const ticketSchema = z.object({
    title: z.string(),
    description: z.string(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
    clientId: z.string(),
    assignedToId: z.string().optional(),
    department: z.string().optional(),
    requesterId: z.string().optional(),
});

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

export const createTicket = async (req: Request, res: Response) => {
    try {
        const data = ticketSchema.parse(req.body);
        const ticket = await prisma.ticket.create({ data });
        res.status(201).json(ticket);
    } catch (error) {
        res.status(400).json({ error: 'Invalid input' });
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
