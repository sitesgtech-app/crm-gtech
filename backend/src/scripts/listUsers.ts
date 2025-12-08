import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUsers() {
    console.log('Listing all Users in DB:');
    try {
        const users = await prisma.user.findMany();
        console.table(users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role })));
    } catch (error) {
        console.error('Error listing users:', error);
    } finally {
        await prisma.$disconnect();
    }
}

listUsers();
