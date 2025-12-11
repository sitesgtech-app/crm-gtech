import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { z } from 'zod';

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string(),
    role: z.enum(['ADMIN', 'SALES', 'SUPPORT', 'VIEWER']).optional(),
    companyName: z.string(),
    companyPassword: z.string()
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, name, role, companyName, companyPassword } = registerSchema.parse(req.body);

        // Company Validation
        if (companyName.toLowerCase() !== 'gtech' || companyPassword !== 'gtech2026') {
            return res.status(403).json({ error: 'Credenciales de empresa inválidas. No está autorizado para registrarse.' });
        }

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
                company: companyName
            },
        });

        const token = jwt.sign({ userId: user.id, role: user.role, organizationId: (user as any).organizationId }, process.env.JWT_SECRET as string, {
            expiresIn: '1h',
        });

        res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Datos inválidos: ' + error.errors.map(e => e.message).join(', ') });
        }
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Error al registrar usuario' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = loginSchema.parse(req.body);

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            console.log(`[LOGIN FAILED] User not found: ${email}`);
            return res.status(401).json({ error: 'Usuario no encontrado (Debug)' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            console.log(`[LOGIN FAILED] Invalid password for: ${email}`);
            return res.status(401).json({ error: 'Contraseña incorrecta (Debug)' });
        }

        const token = jwt.sign({ userId: user.id, role: user.role, organizationId: (user as any).organizationId }, process.env.JWT_SECRET as string, {
            expiresIn: '1h',
        });

        res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    } catch (error) {
        console.error("Login Error:", error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Datos inválidos: ' + error.errors.map(e => e.message).join(', ') });
        }
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email requerido' });

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            // For security, don't reveal if user exists, but for this internal tool we can be more explicit or just fake success
            // Let's fake success to avoid enumeration but log it
            console.log(`Password reset requested for non-existent email: ${email}`);
            return res.json({ message: 'Si el correo existe, se ha enviado un código de recuperación.' });
        }

        // Generate a simple 6 digit code
        const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken,
                resetTokenExpiry
            }
        });

        // MOCK EMAIL SENDING
        console.log('================================================================');
        console.log(`[MOCK EMAIL] Password Reset Code for ${email}: ${resetToken}`);
        console.log('================================================================');

        res.json({ message: 'Si el correo existe, se ha enviado un código de recuperación.' });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { email, code, newPassword } = req.body;

        if (!email || !code || !newPassword) {
            return res.status(400).json({ error: 'Todos los campos son requeridos' });
        }

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || user.resetToken !== code || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
            return res.status(400).json({ error: 'Código inválido o expirado' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null
            }
        });

        res.json({ message: 'Contraseña actualizada exitosamente' });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Error al restablecer contraseña' });
    }
};
