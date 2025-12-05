import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'erick@gtechguate.com';
    const password = 'RivGonzalo24**';
    const name = 'Admin User';
    const role = 'ADMIN';

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const user = await prisma.user.upsert({
            where: { email },
            update: {
                password: hashedPassword,
                role: role,
                name: name,
            },
            create: {
                email,
                password: hashedPassword,
                name,
                role,
                phone: '5555-0000',
                active: true,
                company: 'gtech'
            },
        });
        console.log(`User created/updated: ${user.email}`);
    } catch (e) {
        console.error(e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
