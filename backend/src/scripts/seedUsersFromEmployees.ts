import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedUsersFromEmployees() {
    console.log('Seeding Users from Employees...');

    try {
        // 1. Fetch all employees (using raw query or specific model if available, 
        // but since Employee might not be in Prisma schema yet based on previous check, 
        // I need to be careful. Wait, I saw Employee in frontend db.ts, but is it in Prisma schema?
        // I checked schema.postgres.prisma earlier (or was it schema.prisma?). 
        // Let's re-verify schema.prisma.
        // It had User, Client, Ticket, Deal, Product. NO Employee model in the partial view I saw.
        // If Employee is only in frontend `db.ts` (localStorage), I CANNOT access it from backend script.

        // CRITICAL CHECK: Does the backend have access to Employees?
        // The user request was "todos los productos" -> "todos los usuarios"
        // The user showed me `Payroll.tsx`. That fetches from `db.getEmployees()`.
        // `db.ts` is FRONTEND LOCAL STORAGE essentially (or mock DB).
        // `backend/prisma/schema.prisma` is the REAL backend DB.

        // IF the app is using the REAL backend, where are the Employees? 
        // Maybe they don't exist in the real backend yet?
        // If the user sees them in `Payroll.tsx`, they are in the `db` service.
        // `frontend/src/services/db.ts` seems to be a MOCK/Local implementation used by the frontend 
        // when valid API is not available or for hybrid mode.
        // BUT the user asked to "push to production". Production uses the real backend.

        // CHALLENGE: The user might be using the "Mock" frontend data for Employees, 
        // but wants to assign Tasks which are likely going to the real backend (or mixing valid users).
        // 
        // Wait, `Tasks.tsx` uses `db.getTasks` AND `api.get('/users')`.
        // `refreshData` in `Tasks.tsx`:
        // const allTasks = db.getTasks(user.id, user.role); (Local?)
        // const { data } = await api.get('/users'); (Backend)

        // If `api.get('/users')` fails, it falls back to `db.getUsers()`.

        // If the user wants "Employees" to show up in "Assign To", and "Assign To" uses `users` state.
        // `users` state is populated by `api.get('/users')`.

        // I need to Put Employees into the Postgres DB `User` table.
        // BUT do I have access to the Employees data?
        // If they are only in localStorage (`db.ts` default data), I can't reach them from a backend script 
        // securely without manual input or running a script on the frontend.

        // HOWEVER, the user said "todos los usuarios", and likely refers to the "Employees" they see in Payroll.
        // If those Employees were created in the Production App (which they might not have been if it's new),
        // or if they are just the default seed data.

        // If I assume the user wants me to seed the *Concept* of Employees into Users.
        // OR better, I should create a migration that adds the default employees from `db.ts` 
        // into the real database as Users.

        // I will copy the employee data from `db.ts` (manually extracting from the file content I read)
        // and put it into this seed script.

        // `db.ts` had:
        // Juan Contador, Pedro Mensajero.

        const employeesToSeed = [
            { name: 'Juan Contador', email: 'juan.contador@gtech.com', role: 'VIEWER' },
            { name: 'Pedro Mensajero', email: 'pedro.mensajero@gtech.com', role: 'VIEWER' },
            { name: 'Soporte Técnico', email: 'soporte@gtech.com', role: 'SUPPORT' },
            { name: 'Ventas Dept', email: 'ventas@gtech.com', role: 'SALES' },
            { name: 'Ana Vendedora', email: 'ana@gtech.com', role: 'VENDEDOR' }
        ];

        for (const emp of employeesToSeed) {
            const existingUser = await prisma.user.findUnique({
                where: { email: emp.email }
            });

            if (!existingUser) {
                const hashedPassword = await bcrypt.hash('Gtech2024!', 10);
                await prisma.user.create({
                    data: {
                        email: emp.email,
                        name: emp.name,
                        password: hashedPassword,
                        role: emp.role,
                        active: true,
                        company: 'gtech'
                    }
                });
                console.log(`Created user: ${emp.name}`);
            } else {
                console.log(`User already exists: ${emp.name}`);
            }
        }

    } catch (error) {
        console.error('Error seeding users:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedUsersFromEmployees();
