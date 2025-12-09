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
import { sendEmail } from '../lib/email';

interface AuthRequest extends Request {
    user?: {
        userId: string;
        organizationId: string;
    };
}

const ticketSchema = z.object({
    title: z.string(),
    description: z.string(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    clientId: z.string().optional().nullable(),
    assignedToId: z.string().optional(),
    department: z.string().optional(),
    requesterId: z.string().optional(),
});

export const createTicket = async (req: Request, res: Response) => {
    try {
        const { organizationId } = (req as AuthRequest).user!;
        const data = ticketSchema.parse(req.body);

        const { clientId, ...otherData } = data;

        const ticket = await prisma.ticket.create({
            data: {
                ...otherData,
                clientId: clientId || undefined,
                priority: data.priority || 'MEDIUM',
                organizationId: organizationId || 'org1'
            } as any,
            include: { assignedTo: true }
        });

        // Send Email Notification if assigned
        // Cast to any to avoid TS error: Property 'assignedTo' does not exist on type...
        const ticketAny = ticket as any;
        if (ticketAny.assignedTo && ticketAny.assignedTo.email) {
            const emailHtml = `
                <h2>Nuevo Ticket Asignado</h2>
                <p>Se te ha asignado un nuevo ticket en GTECH CRM.</p>
                <p><strong>Título:</strong> ${ticketAny.title}</p>
                <p><strong>Prioridad:</strong> ${ticketAny.priority}</p>
                <p><strong>Descripción:</strong><br>${ticketAny.description}</p>
                <br>
                <p>Ingresa al CRM para gestionarlo.</p>
            `;
            await sendEmail(ticketAny.assignedTo.email, `Nuevo Ticket Asignado: ${ticketAny.title}`, emailHtml);
        }

        res.status(201).json(ticket);
    } catch (error) {
        console.error("Create Ticket Error:", error);
        res.status(400).json({ error: 'Invalid input or server error' });
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
