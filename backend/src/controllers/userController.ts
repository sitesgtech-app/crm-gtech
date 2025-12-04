import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import bcrypt from 'bcrypt';

export const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, name: true, email: true, role: true, active: true, phone: true },
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

export const createUser = async (req: Request, res: Response) => {
    try {
        const { email, password, name, role, phone } = req.body;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'El correo electrónico ya está en uso' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: role || 'VIEWER',
                phone: phone || '',
                company: 'gtech', // Default for internal creation
                active: true
            },
        });

        res.status(201).json(user);
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Error al crear usuario' });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, email, role, phone, password, active } = req.body;

        const dataToUpdate: any = { name, email, role, phone, active };

        if (password && password.trim() !== '') {
            dataToUpdate.password = await bcrypt.hash(password, 10);
        }

        const user = await prisma.user.update({
            where: { id },
            data: dataToUpdate,
        });

        res.json(user);
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Error al actualizar usuario' });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        // Soft delete or hard delete? Let's do soft delete by setting active to false if schema supports it, 
        // but schema has no active field shown in previous view. 
        // Wait, I need to check schema again. The mock DB had 'active', let's check real schema.
        // Re-reading schema...
        // Schema: id, email, password, name, role, company, resetToken, resetTokenExpiry, createdAt, updatedAt.
        // Missing: phone, active. 
        // I need to update schema first!

        // For now, I will assume I need to update schema.
        // Let's hold on this edit and check schema first.

        // Actually, I'll just implement hard delete for now to match current schema capabilities, 
        // OR better, I will update the schema to match the frontend requirements (phone, active).

        await prisma.user.delete({
            where: { id },
        });

        res.json({ message: 'Usuario eliminado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar usuario' });
    }
};
