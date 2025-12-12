import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { z } from 'zod';

interface AuthRequest extends Request {
    user?: {
        organizationId: string;
        role: string;
        userId: string;
    };
}

const opportunitySchema = z.object({
    title: z.string().optional(),
    value: z.number().optional(),
    stage: z.string().optional(),
    probability: z.number().optional(),
    expectedCloseDate: z.string().optional(), // ISO String
    clientId: z.string().optional(),
    ownerId: z.string().optional(),
    notes: z.string().optional(),
    purchaseOrderFile: z.string().optional().nullable(),
    purchaseOrderFileName: z.string().optional().nullable(),
    purchaseOrderStatus: z.string().optional().nullable()
});

export const getOpportunities = async (req: Request, res: Response) => {
    try {
        const { organizationId, role, userId } = (req as AuthRequest).user!;

        let where: any = { organizationId };

        // If not admin, only show own deals
        if (role !== 'ADMIN') {
            where.ownerId = userId;
        }

        const deals = await prisma.deal.findMany({
            where,
            include: {
                client: true,
                activities: true
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });

        // Map Prisma Deal to Frontend Opportunity Interface if needed
        // Frontend expects "Opportunity" interface, Prisma has "Deal"
        const opportunities = deals.map((d: any) => ({
            id: d.id,
            organizationId: d.organizationId,
            clientId: d.clientId,
            clientName: d.client ? d.client.name : 'Unknown',
            name: d.title,
            description: d.title, // Map title to description for now if needed, or keep generic
            amount: d.value,
            createdAt: d.createdAt.toISOString(),
            lastUpdated: d.updatedAt.toISOString(),
            estimatedCloseDate: d.expectedCloseDate ? d.expectedCloseDate.toISOString().split('T')[0] : '',
            stage: d.stage === 'CLOSED_WON' ? 'Ganada' : d.stage, // Simple mapping
            responsibleId: d.ownerId,
            probability: d.probability,
            notes: '',
            origin: 'System',
            profitMargin: 0,
            sector: d.client?.sector || 'Privado',
            status: 'active',
            // PO Fields
            purchaseOrderFile: d.purchaseOrderFile,
            purchaseOrderFileName: d.purchaseOrderFileName,
            purchaseOrderStatus: d.purchaseOrderStatus
        }));

        res.json(opportunities);
    } catch (error) {
        console.error("Get Opportunities Error", error);
        res.status(500).json({ error: 'Failed to fetch opportunities' });
    }
};

export const updateOpportunity = async (req: Request, res: Response) => {
    try {
        // const { organizationId } = req.user as any; 
        // We trust middleware for auth but good to use orgId
        const { id } = req.params;
        const data = opportunitySchema.parse(req.body);

        const updatedDeal = await prisma.deal.update({
            where: { id },
            data: {
                ...data,
                // If mapping needed:
                // title: data.name, etc.
            }
        });

        res.json(updatedDeal);
    } catch (error) {
        console.error("Update Opportunity Error", error);
        res.status(500).json({ error: 'Failed to update opportunity' });
    }
}
