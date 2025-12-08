
import { Client, Opportunity, OpportunityStage, User, UserRole, Activity, Product, Service, Notification, GuatecomprasEvent, Task, TaskStatus, Purchase, Expense, Subscription, Supplier, InventoryItem, SalesGoal, TaskPriority, Project, ProjectStatus, Employee, Organization, CompanyDocument, IssuedInvoice, PurchasePayment } from '../types';

const STORAGE_KEY = 'gtech_crm_db_v25'; // Increment version for Security Update

interface DB {
    organization: Organization;
    users: User[];
    clients: Client[];
    suppliers: Supplier[];
    opportunities: Opportunity[];
    activities: Activity[];
    products: Product[];
    services: Service[];
    inventoryItems: InventoryItem[];
    notifications: Notification[];
    guatecomprasEvents: GuatecomprasEvent[];
    tasks: Task[];
    purchases: Purchase[];
    expenses: Expense[];
    subscriptions: Subscription[];
    salesGoals: SalesGoal[];
    projects: Project[];
    employees: Employee[];
    documents: CompanyDocument[];
    issuedInvoices: IssuedInvoice[];
}

// Initial Seed Data
const initialData: DB = {
    organization: {
        id: 'org1',
        name: 'gtech Soluciones Tecnológicas',
        commercialName: 'gtech',
        nit: '88766888',
        address: '20 calle 5-35 edificio Plaza Los Arcos, Local 19, zona 10, Ciudad de Guatemala',
        phone: '3685-7540 PBX. 2393-8515',
        email: 'ventas@gtechguate.com',
        website: 'www.gtechguate.com',
        currency: 'GTQ',
        saasPlan: 'Enterprise',
        saasStatus: 'Active',
        nextBillingDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
        initialBalance: 0,
        brandColors: {
            primary: '#3b82f6', // Default Blue
            secondary: '#64748b', // Default Slate
            sidebar: '#0f172a' // Default Dark Slate
        }
    },
    users: [
        {
            id: 'u1',
            organizationId: 'org1',
            name: 'Erick Admin',
            email: 'erick@gtechguate.com',
            password: 'RivGonzalo24**',
            role: UserRole.ADMIN,
            avatar: 'https://ui-avatars.com/api/?name=Erick+Admin&background=0D8ABC&color=fff',
            phone: '5555-0001',
            active: true,
            permissions: [],
            mustChangePassword: false
        },
        {
            id: 'u2',
            organizationId: 'org1',
            name: 'Ana Vendedora',
            email: 'ana@gtech.com',
            password: '123',
            role: UserRole.VENDEDOR,
            avatar: 'https://ui-avatars.com/api/?name=Ana+Vendedora&background=random',
            phone: '5555-0002',
            active: true,
            permissions: ['/', '/pipeline', '/clients', '/calendar', '/activities'],
            mustChangePassword: false
        },
    ],
    clients: [
        { id: 'c1', organizationId: 'org1', name: 'Juan Pérez', company: 'Tech Solutions', phone: '555-0101', email: 'juan@tech.com', address: 'Zona 10, Guatemala', createdAt: new Date().toISOString(), tags: ['VIP', 'Software'], responsibleId: 'u1', nit: '123456-7', industry: 'Tecnología', companyPhone: '2222-0001', assignedAdvisor: 'u1', sector: 'Privado' },
        { id: 'c2', organizationId: 'org1', name: 'María López', company: 'Importadora S.A.', phone: '555-0102', email: 'maria@import.com', address: 'Zona 4, Guatemala', createdAt: new Date().toISOString(), tags: ['Retail'], responsibleId: 'u2', nit: '987654-3', industry: 'Retail', companyPhone: '2222-0002', assignedAdvisor: 'u2', sector: 'Privado' },
        { id: 'c3', organizationId: 'org1', name: 'Lic. Sonia Martínez', company: 'Ministerio de Educación', phone: '555-0103', email: 'compras@mineduc.gob.gt', address: 'Zona 1, Guatemala', createdAt: new Date().toISOString(), tags: ['Gobierno'], responsibleId: 'u2', nit: '11111-K', industry: 'Gobierno', companyPhone: '2222-5555', assignedAdvisor: 'u2', sector: 'Gubernamental' },
    ],
    suppliers: [
        { id: 'sup1', organizationId: 'org1', name: 'Intelaf', contactName: 'Pedro Ventas', email: 'ventas@intelaf.com', phone: '2323-0000', address: 'Zona 9', createdAt: new Date().toISOString() },
        { id: 'sup2', organizationId: 'org1', name: 'Max Distribuidores', contactName: 'Luisa Mayorista', email: 'luisa@max.com', phone: '2222-1111', address: 'Zona 10', createdAt: new Date().toISOString() }
    ],
    opportunities: [
        {
            id: 'o1', organizationId: 'org1', clientId: 'c1', clientName: 'Tech Solutions', name: 'Licencia Enterprise', description: 'Renovación anual',
            amount: 15000, createdAt: new Date(Date.now() - 86400000 * 20).toISOString(), lastUpdated: new Date().toISOString(), estimatedCloseDate: '2023-12-31', stage: OpportunityStage.NEGOCIACION,
            responsibleId: 'u1', probability: 90, notes: 'Cliente interesado en descuento por pronto pago', origin: 'Sitio Web', profitMargin: 25, sector: 'Privado', status: 'active'
        },
        {
            id: 'o2', organizationId: 'org1', clientId: 'c2', clientName: 'Importadora S.A.', name: 'Implementación CRM', description: 'Servicio completo',
            amount: 45000, createdAt: new Date().toISOString(), lastUpdated: new Date().toISOString(), estimatedCloseDate: '2024-01-15', stage: OpportunityStage.PROPUESTA,
            responsibleId: 'u2', probability: 60, notes: 'Enviada propuesta v2', origin: 'Referido', profitMargin: 30, sector: 'Privado', status: 'active'
        },
        {
            id: 'o3', organizationId: 'org1', clientId: 'c3', clientName: 'Ministerio de Educación', name: 'Consultoría IT', description: 'Auditoría de seguridad',
            amount: 5000, createdAt: new Date(Date.now() - 86400000 * 16).toISOString(), lastUpdated: new Date().toISOString(), estimatedCloseDate: '2023-11-20', stage: OpportunityStage.CONTACTADO,
            responsibleId: 'u2', probability: 30, notes: 'Primer contacto realizado', origin: 'LinkedIn', profitMargin: 40, sector: 'Gubernamental', status: 'active'
        },
        {
            id: 'o4', organizationId: 'org1', clientId: 'c2', clientName: 'Importadora S.A.', name: 'Equipos Hardware', description: 'Laptops nuevas',
            amount: 120000, createdAt: new Date().toISOString(), lastUpdated: new Date().toISOString(), estimatedCloseDate: '2023-10-10', stage: OpportunityStage.GANADA,
            responsibleId: 'u1', probability: 100, notes: 'Venta cerrada exitosamente', origin: 'Evento', profitMargin: 15, sector: 'Privado', status: 'active'
        }
    ],
    activities: [
        { id: 'a1', organizationId: 'org1', opportunityId: 'o1', clientId: 'c1', type: 'Llamada', date: new Date().toISOString(), description: 'Seguimiento de propuesta', responsibleId: 'u1', responsibleName: 'Erick Admin' }
    ],
    products: [
        { id: 'p1', organizationId: 'org1', name: 'Licencia Software Base', sku: 'SW-001', description: 'Licencia anual por usuario', price: 1200, cost: 800, stock: 1000, active: true },
        { id: 'p2', organizationId: 'org1', name: 'Servidor Rack 2U', sku: 'HW-SRV-02', description: 'Servidor físico de alta disponibilidad', price: 15000, cost: 11000, stock: 5, active: true }
    ],
    services: [
        { id: 's1', organizationId: 'org1', name: 'Implementación CRM', description: 'Configuración y capacitación', minProfit: 5000, active: true },
        { id: 's2', organizationId: 'org1', name: 'Soporte Técnico Mensual', description: 'SLA 24/7', minProfit: 800, active: true }
    ],
    inventoryItems: [
        { id: 'i1', organizationId: 'org1', name: 'Papel Bond Carta', category: 'Insumos', quantity: 20, description: 'Resmas de 500 hojas', location: 'Bodega 1', unitCost: 35 },
        { id: 'i2', organizationId: 'org1', name: 'Laptop Dell Latitude (Uso Interno)', category: 'Equipo de Oficina', quantity: 3, description: 'Asignadas a Ventas', location: 'Oficina', purchaseDate: '2023-01-15', warranty: '3 años', unitCost: 8500 },
        { id: 'i3', organizationId: 'org1', name: 'Kit de Destornilladores', category: 'Herramientas', quantity: 2, description: 'Para soporte técnico', location: 'Taller', unitCost: 250 }
    ],
    notifications: [],
    guatecomprasEvents: [],
    tasks: [
        {
            id: 't1',
            organizationId: 'org1',
            title: 'Cotización Ministerio Salud',
            description: 'Preparar licitación completa incluyendo fianzas.',
            assignedTo: 'u2',
            requesterId: 'u1',
            department: 'Ventas',
            priority: TaskPriority.ALTA,
            status: TaskStatus.EN_PROCESO,
            createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
            startedAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
            id: 't2',
            organizationId: 'org1',
            title: 'Mantenimiento Impresoras',
            description: 'Coordinar con técnico externo revisión de impresoras de contabilidad.',
            assignedTo: 'u1',
            requesterId: 'u2',
            department: 'Administración',
            priority: TaskPriority.MEDIA,
            status: TaskStatus.RECIBIDA,
            createdAt: new Date().toISOString()
        }
    ],
    purchases: [],
    expenses: [],
    subscriptions: [],
    salesGoals: [
        {
            id: 'g1',
            organizationId: 'org1',
            userId: 'u1',
            month: new Date().getMonth(),
            year: new Date().getFullYear(),
            revenueTarget: 50000,
            dealsTarget: 5,
            leadsTarget: 10,
            callsTarget: 50,
            emailsTarget: 30,
            visitsTarget: 5
        },
        {
            id: 'g2',
            organizationId: 'org1',
            userId: 'u2',
            month: new Date().getMonth(),
            year: new Date().getFullYear(),
            revenueTarget: 35000,
            dealsTarget: 4,
            leadsTarget: 15,
            callsTarget: 60,
            emailsTarget: 40,
            visitsTarget: 8
        }
    ],
    projects: [
        {
            id: 'pj1',
            organizationId: 'org1',
            name: 'Cableado Estructurado Oficinas Zona 14',
            clientId: 'c1',
            status: ProjectStatus.PLANIFICACION,
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 86400000 * 5).toISOString(),
            laborDays: 5,
            laborCostPerDay: 500,
            totalLaborCost: 2500,
            materials: [
                { id: 'm1', name: 'Cable UTP Cat6 (Bobina)', quantity: 2, unitCost: 1200, totalCost: 2400 },
                { id: 'm2', name: 'Jacks RJ45', quantity: 50, unitCost: 25, totalCost: 1250 }
            ],
            totalMaterialCost: 3650,
            marginPercentage: 30,
            finalPrice: 8785.71,
            description: 'Instalación de 25 puntos de red nuevos.'
        }
    ],
    employees: [
        {
            id: 'emp1',
            organizationId: 'org1',
            name: 'Juan Contador',
            position: 'Contador General',
            contractType: 'Planilla',
            baseSalary: 6000,
            paysIGSS: true,
            otherInsurance: 0,
            active: true,
            startDate: '2022-01-01'
        },
        {
            id: 'emp2',
            organizationId: 'org1',
            name: 'Pedro Mensajero',
            position: 'Mensajería',
            contractType: 'Servicios Profesionales',
            baseSalary: 3500,
            paysIGSS: false,
            otherInsurance: 150,
            active: true,
            startDate: '2023-03-15'
        }
    ],
    documents: [],
    issuedInvoices: []
};

// Database Service
export const db = {
    init: () => {
        if (!localStorage.getItem(STORAGE_KEY)) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
        } else {
            // Migration check
            const data = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
            let changed = false;

            // Security Migration
            if (data.users) {
                data.users.forEach((u: any) => {
                    if (u.mustChangePassword === undefined) {
                        u.mustChangePassword = false;
                        changed = true;
                    }
                    if (!u.organizationId) { u.organizationId = 'org1'; changed = true; }
                });
            }
            // Organization Isolation Migration
            const entities = ['clients', 'suppliers', 'opportunities', 'activities', 'products', 'services', 'inventoryItems', 'notifications', 'guatecomprasEvents', 'tasks', 'purchases', 'expenses', 'subscriptions', 'salesGoals', 'projects', 'employees', 'documents', 'issuedInvoices'];

            entities.forEach(entity => {
                if (data[entity]) {
                    data[entity].forEach((item: any) => {
                        if (!item.organizationId) {
                            item.organizationId = 'org1';
                            changed = true;
                        }
                    });
                }
            });

            if (!data.organization) { data.organization = initialData.organization; changed = true; }
            if (data.organization && data.organization.initialBalance === undefined) {
                data.organization.initialBalance = 0;
                changed = true;
            }
            if (data.organization && !data.organization.brandColors) {
                data.organization.brandColors = initialData.organization.brandColors;
                changed = true;
            }

            if (data.purchases) {
                data.purchases.forEach((p: any) => {
                    if (p.paymentStatus === undefined) {
                        p.isCredit = false;
                        p.paymentStatus = 'Pagado';
                        p.balance = 0;
                        p.payments = [];
                        changed = true;
                    }
                });
            }

            if (!data.employees) { data.employees = initialData.employees; changed = true; }
            if (!data.issuedInvoices) { data.issuedInvoices = []; changed = true; }
            if (!data.notifications) { data.notifications = []; changed = true; }
            if (!data.guatecomprasEvents) { data.guatecomprasEvents = []; changed = true; }
            if (!data.tasks) { data.tasks = []; changed = true; }
            if (!data.purchases) { data.purchases = []; changed = true; }
            if (!data.expenses) { data.expenses = []; changed = true; }
            if (!data.subscriptions) { data.subscriptions = []; changed = true; }
            if (!data.projects) { data.projects = initialData.projects; changed = true; }
            if (!data.suppliers) { data.suppliers = initialData.suppliers; changed = true; }
            if (!data.inventoryItems) { data.inventoryItems = initialData.inventoryItems; changed = true; }
            if (!data.documents) { data.documents = []; changed = true; }

            // Cleanup: Permanently delete tasks older than 30 days
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).getTime();
            if (data.tasks) {
                const originalLength = data.tasks.length;
                data.tasks = data.tasks.filter((t: any) => {
                    if (t.status === 'Eliminada' && t.deletedAt) {
                        const deletedTime = new Date(t.deletedAt).getTime();
                        return deletedTime > thirtyDaysAgo;
                    }
                    return true;
                });
                if (data.tasks.length !== originalLength) {
                    changed = true;
                    console.log('Cleanup: Permanently deleted old tasks from trash.');
                }
            }

            if (changed) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            }
        }
    },

    // Suppliers
    getSuppliers: (): Supplier[] => {
        return db.getData().suppliers || [];
    },
    saveSupplier: (supplier: Supplier) => {
        const data = db.getData();
        if (!data.suppliers) data.suppliers = [];
        const index = data.suppliers.findIndex(s => s.id === supplier.id);
        if (index > -1) {
            data.suppliers[index] = supplier;
        } else {
            data.suppliers.push(supplier);
        }
        db.saveData(data);
    },

    // Cleanup: Permanently delete tasks older than 30 days


    getData: (): DB => {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : initialData;
    },
    saveData: (data: DB) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    },

    // Organization (SaaS)
    getOrganization: (): Organization => {
        return db.getData().organization || initialData.organization;
    },
    saveOrganization: (org: Organization) => {
        const data = db.getData();
        data.organization = org;
        db.saveData(data);
    },

    // Users & Security
    login: (email: string, password: string): User | undefined => {
        const data = db.getData();
        return data.users.find(u => u.email === email && u.password === password && u.active === true);
    },

    generateVerificationCode: (userId: string) => {
        const data = db.getData();
        const index = data.users.findIndex(u => u.id === userId);
        if (index > -1) {
            // Generate 6 digit code
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            data.users[index].verificationCode = code;
            db.saveData(data);

            // Simulate Email Send
            db.sendEmailNotification(
                data.users[index].email,
                "Código de Verificación - gtech ERP",
                `Su código de seguridad para cambiar contraseña es: ${code}\n\nEste código es válido para un solo uso.`
            );
            return true;
        }
        return false;
    },

    verifyAndChangePassword: (userId: string, code: string, newPassword: string): boolean => {
        const data = db.getData();
        const index = data.users.findIndex(u => u.id === userId);
        if (index > -1) {
            const user = data.users[index];
            if (user.verificationCode === code) {
                user.password = newPassword;
                user.mustChangePassword = false;
                user.verificationCode = undefined; // Clear code
                db.saveData(data);
                return true;
            }
        }
        return false;
    },

    adminResetPassword: (userId: string): string => {
        const data = db.getData();
        const index = data.users.findIndex(u => u.id === userId);
        if (index > -1) {
            // Generate temp password
            const tempPass = Math.random().toString(36).slice(-8);
            data.users[index].password = tempPass;
            data.users[index].mustChangePassword = true;
            db.saveData(data);
            return tempPass;
        }
        return '';
    },

    getUsers: (): User[] => {
        return db.getData().users;
    },
    saveUser: (user: User) => {
        const data = db.getData();
        const index = data.users.findIndex(u => u.id === user.id);
        if (index > -1) {
            if (!user.password) {
                user.password = data.users[index].password;
            }
            data.users[index] = user;
        } else {
            data.users.push(user);
        }
        db.saveData(data);
    },

    // Clients
    getClients: (userId?: string, role?: UserRole): Client[] => {
        const data = db.getData();
        const orgId = 'org1';
        const orgData = data.clients.filter(c => c.organizationId === orgId);

        if (role === UserRole.ADMIN) return orgData;

        // Users see clients they are responsible for
        return orgData.filter(c => c.responsibleId === userId);
    },

    // ... opportunities ...
    getOpportunities: (userId?: string, role?: UserRole): Opportunity[] => {
        const data = db.getData();
        const orgId = 'org1';
        const orgData = data.opportunities.filter(o => o.organizationId === orgId);

        if (role === UserRole.ADMIN) return orgData;

        // Users see opportunities they are responsible for
        return orgData.filter(o => o.responsibleId === userId);
    },

    // ... tasks ...
    getTasks: (userId?: string, role?: UserRole): Task[] => {
        const data = db.getData();
        const orgId = 'org1';
        const orgData = data.tasks.filter(t => t.organizationId === orgId);

        if (role === UserRole.ADMIN) return orgData;

        // Users see tasks assigned to them OR requested by them
        return orgData.filter(t => t.assignedTo === userId || t.requesterId === userId);
    },

    // Expenses
    getExpenses: (): Expense[] => {
        const data = db.getData();
        return (data.expenses || []).filter(e => !e.organizationId || e.organizationId === 'org1');
    },
    addExpense: (expense: Expense) => {
        const data = db.getData();
        if (!data.expenses) data.expenses = [];
        data.expenses.push(expense);
        db.saveData(data);
    },

    // Purchases
    getPurchases: (): Purchase[] => {
        const data = db.getData();
        return (data.purchases || []).filter(p => !p.organizationId || p.organizationId === 'org1');
    },
    addPurchase: (purchase: Purchase) => {
        const data = db.getData();
        if (!data.purchases) data.purchases = [];
        data.purchases.push(purchase);
        db.saveData(data);
    },
    registerPurchasePayment: (purchaseId: string, payment: PurchasePayment) => {
        const data = db.getData();
        if (data.purchases) {
            const index = data.purchases.findIndex(p => p.id === purchaseId);
            if (index > -1) {
                const purchase = data.purchases[index];
                if (!purchase.payments) purchase.payments = [];
                purchase.payments.push(payment);
                // Update balance
                purchase.balance = Math.max(0, (purchase.balance || 0) - payment.amount);
                if (purchase.balance <= 0) {
                    purchase.paymentStatus = 'Pagado';
                } else {
                    purchase.paymentStatus = 'Parcial';
                }
                db.saveData(data);
            }
        }
    },

    // Projects
    getProjects: (): Project[] => {
        const data = db.getData();
        return (data.projects || []).filter(p => !p.organizationId || p.organizationId === 'org1');
    },
    saveProject: (project: Project) => {
        const data = db.getData();
        if (!data.projects) data.projects = [];
        const index = data.projects.findIndex(p => p.id === project.id);
        if (index > -1) {
            data.projects[index] = project;
        } else {
            data.projects.push(project);
        }
        db.saveData(data);
    },
    deleteProject: (id: string) => {
        const data = db.getData();
        if (data.projects) {
            data.projects = data.projects.filter(p => p.id !== id);
            db.saveData(data);
        }
    },

    // Employees
    getEmployees: (): Employee[] => {
        const data = db.getData();
        return (data.employees || []).filter(e => !e.organizationId || e.organizationId === 'org1');
    },
    saveEmployee: (employee: Employee) => {
        const data = db.getData();
        if (!data.employees) data.employees = [];
        const index = data.employees.findIndex(e => e.id === employee.id);
        if (index > -1) {
            data.employees[index] = employee;
        } else {
            data.employees.push(employee);
        }
        db.saveData(data);
    },
    deleteEmployee: (id: string) => {
        const data = db.getData();
        if (data.employees) {
            data.employees = data.employees.filter(e => e.id !== id);
            db.saveData(data);
        }
    },

    // Subscriptions
    getSubscriptions: (): Subscription[] => {
        const data = db.getData();
        return (data.subscriptions || []).filter(s => !s.organizationId || s.organizationId === 'org1');
    },
    addSubscription: (sub: Subscription) => {
        const data = db.getData();
        if (!data.subscriptions) data.subscriptions = [];
        data.subscriptions.push(sub);
        db.saveData(data);
    },
    updateSubscription: (sub: Subscription) => {
        const data = db.getData();
        const index = data.subscriptions.findIndex(s => s.id === sub.id);
        if (index > -1) {
            data.subscriptions[index] = sub;
            db.saveData(data);
        }
    },



    // Activities
    getAllActivities: (userId?: string, role?: UserRole): Activity[] => {
        const data = db.getData();
        const orgId = 'org1';
        const orgActivities = data.activities ? data.activities.filter((a: any) => !a.organizationId || a.organizationId === orgId) : [];

        if (role === UserRole.ADMIN) return orgActivities;

        return orgActivities.filter(a => a.responsibleId === userId);
    },
    addActivity: (activity: Activity) => {
        const data = db.getData();
        if (!data.activities) data.activities = [];
        data.activities.push(activity);
        db.saveData(data);
    },

    // Clients Bulk
    bulkAddClients: (clients: Client[]) => {
        const data = db.getData();
        if (!data.clients) data.clients = [];
        data.clients.push(...clients);
        db.saveData(data);
    },

    // ... stats ...
    getStats: (userId?: string, role?: UserRole) => {
        // Reuse the logic from getOpportunities to respect permissions
        const opps = db.getOpportunities(userId, role);
        const activeOpps = opps.filter(o => o.status !== 'deleted' && o.stage !== OpportunityStage.GANADA && o.stage !== OpportunityStage.PERDIDA);
        const wonOpps = opps.filter(o => o.status !== 'deleted' && o.stage === OpportunityStage.GANADA);
        const deletedOpps = opps.filter(o => o.status === 'deleted');

        return {
            totalActive: activeOpps.length,
            totalWon: wonOpps.length,
            amountPipeline: activeOpps.reduce((sum, o) => sum + o.amount, 0),
            amountWon: wonOpps.reduce((sum, o) => sum + o.amount, 0),
            totalDeleted: deletedOpps.length
        };
    },

    // ... notifications ...
    getNotifications: (userId: string): Notification[] => {
        const data = db.getData();
        const orgId = 'org1'; // Enforce Org Isolation
        return data.notifications
            .filter(n => n.organizationId === orgId && n.userId === userId)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
    hasSentDailyMotivation: (userId: string): boolean => {
        const data = db.getData();
        const today = new Date().toDateString();
        const orgId = 'org1';
        return data.notifications.some(n =>
            n.organizationId === orgId &&
            n.userId === userId &&
            n.type === 'motivation' &&
            new Date(n.date).toDateString() === today
        );
    },
    addClient: (client: Client) => {
        const data = db.getData();
        data.clients.push(client);
        db.saveData(data);
    },
    // ... (keep existing)

    // Opportunities

    addOpportunity: (opp: Opportunity) => {
        const data = db.getData();
        data.opportunities.push(opp);
        // Add activity log
        data.activities.push({
            id: `act${Date.now()}`,
            organizationId: 'org1',
            opportunityId: opp.id,
            clientId: opp.clientId,
            type: 'Sistema',
            description: 'Oportunidad Creada',
            date: new Date().toISOString(),
            responsibleId: opp.responsibleId,
            responsibleName: 'Sistema'
        });
        db.saveData(data);
    },
    updateOpportunity: (opp: Opportunity) => {
        const data = db.getData();
        const index = data.opportunities.findIndex(o => o.id === opp.id);
        if (index > -1) {
            data.opportunities[index] = opp;
            db.saveData(data);
        }
    },
    deleteOpportunity: (id: string) => {
        const data = db.getData();
        const index = data.opportunities.findIndex(o => o.id === id);
        if (index > -1) {
            data.opportunities[index].status = 'deleted'; // Soft delete
            db.saveData(data);
        }
    },
    updateOpportunityStage: (id: string, stage: OpportunityStage, reason?: string) => {
        const data = db.getData();
        const index = data.opportunities.findIndex(o => o.id === id);
        if (index > -1) {
            const oldStage = data.opportunities[index].stage;
            data.opportunities[index].stage = stage;
            data.opportunities[index].lastUpdated = new Date().toISOString();

            if (reason) {
                const note = `[Cambio a ${stage}]: ${reason}`;
                data.opportunities[index].notes = (data.opportunities[index].notes || '') + '\n' + note;
            }

            // Log activity
            data.activities.push({
                id: `act${Date.now()}`,
                organizationId: 'org1',
                opportunityId: id,
                clientId: data.opportunities[index].clientId,
                type: 'Sistema',
                description: `Cambio de etapa de ${oldStage} a ${stage}`,
                date: new Date().toISOString(),
                responsibleId: 'system',
                responsibleName: 'Sistema'
            });

            db.saveData(data);
        }
    },

    getActivities: (opportunityId: string): Activity[] => {
        const data = db.getData();
        return data.activities
            .filter(a => a.opportunityId === opportunityId)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },


    // ...

    // Tasks / Tickets

    addTask: (task: Task) => {
        const data = db.getData();
        data.tasks.push(task);

        // Notification
        if (task.assignedTo) {
            db.addNotification({
                id: Date.now().toString(),
                organizationId: 'org1',
                userId: task.assignedTo,
                title: 'Nueva Tarea Asignada',
                message: `Se te ha asignado la tarea: ${task.title}`,
                date: new Date().toISOString(),
                read: false,
                type: 'info'
            });
        }

        db.saveData(data);
    },
    updateTask: (task: Task) => {
        const data = db.getData();
        const index = data.tasks.findIndex(t => t.id === task.id);
        if (index > -1) {
            const oldTask = data.tasks[index];
            const oldStatus = oldTask.status;
            const newStatus = task.status;

            // Status Logic
            if (oldStatus === TaskStatus.RECIBIDA && newStatus === TaskStatus.EN_PROCESO && !task.startedAt) {
                task.startedAt = new Date().toISOString();
            }
            if (newStatus === TaskStatus.FINALIZADA && !task.finishedAt) {
                task.finishedAt = new Date().toISOString();
            }

            // Notification Logic
            if (task.assignedTo && task.assignedTo !== oldTask.assignedTo) {
                db.addNotification({
                    id: Date.now().toString(),
                    organizationId: 'org1',
                    userId: task.assignedTo,
                    title: 'Tarea Reasignada',
                    message: `Se te ha reasignado la tarea: ${task.title}`,
                    date: new Date().toISOString(),
                    read: false,
                    type: 'info'
                });
            }

            data.tasks[index] = task;
            db.saveData(data);
        }
    },



    // Sales Goals
    getSalesGoals: (month: number, year: number): SalesGoal[] => {
        const data = db.getData();
        const orgId = 'org1';
        return (data.salesGoals || []).filter(g => (!g.organizationId || g.organizationId === orgId) && g.month === month && g.year === year);
    },
    saveSalesGoal: (goal: SalesGoal) => {
        const data = db.getData();
        if (!data.salesGoals) data.salesGoals = [];
        const index = data.salesGoals.findIndex(g => g.userId === goal.userId && g.month === goal.month && g.year === goal.year);
        if (index > -1) {
            data.salesGoals[index] = goal;
        } else {
            data.salesGoals.push(goal);
        }
        db.saveData(data);
    },



    // Products
    getProducts: (): Product[] => {
        return db.getData().products;
    },
    saveProduct: (product: Product) => {
        const data = db.getData();
        const index = data.products.findIndex(p => p.id === product.id);
        if (index > -1) {
            data.products[index] = product;
        } else {
            data.products.push(product);
        }
        db.saveData(data);
    },
    registerProductSale: (productId: string, quantity: number, saleOpp: Opportunity) => {
        const data = db.getData();
        const prodIndex = data.products.findIndex(p => p.id === productId);
        if (prodIndex > -1) {
            const currentStock = data.products[prodIndex].stock || 0;
            data.products[prodIndex].stock = Math.max(0, currentStock - quantity);
        }
        if (!saleOpp.status) saleOpp.status = 'active';
        data.opportunities.push(saleOpp);
        db.saveData(data);
    },

    // Inventory
    getInventoryItems: (): InventoryItem[] => {
        return db.getData().inventoryItems || [];
    },
    saveInventoryItem: (item: InventoryItem) => {
        const data = db.getData();
        if (!data.inventoryItems) data.inventoryItems = [];
        const index = data.inventoryItems.findIndex(i => i.id === item.id);
        if (index > -1) {
            data.inventoryItems[index] = item;
        } else {
            data.inventoryItems.push(item);
        }
        db.saveData(data);
    },

    // Services
    getServices: (): Service[] => {
        return db.getData().services;
    },
    saveService: (service: Service) => {
        const data = db.getData();
        const index = data.services.findIndex(s => s.id === service.id);
        if (index > -1) {
            data.services[index] = service;
        } else {
            data.services.push(service);
        }
        db.saveData(data);
    },

    // Documents
    getDocuments: (): CompanyDocument[] => {
        return db.getData().documents || [];
    },
    addDocument: (doc: CompanyDocument) => {
        const data = db.getData();
        if (!data.documents) data.documents = [];
        data.documents.push(doc);
        db.saveData(data);
    },
    deleteDocument: (id: string) => {
        const data = db.getData();
        if (!data.documents) return;
        data.documents = data.documents.filter(d => d.id !== id);
        db.saveData(data);
    },

    // Issued Invoices (Facturas Emitidas)
    getIssuedInvoices: (): IssuedInvoice[] => {
        return db.getData().issuedInvoices || [];
    },
    addIssuedInvoice: (inv: IssuedInvoice) => {
        const data = db.getData();
        if (!data.issuedInvoices) data.issuedInvoices = [];
        data.issuedInvoices.push(inv);
        db.saveData(data);
    },
    deleteIssuedInvoice: (id: string) => {
        const data = db.getData();
        if (!data.issuedInvoices) return;
        data.issuedInvoices = data.issuedInvoices.filter(i => i.id !== id);
        db.saveData(data);
    },

    // Notifications & Logic

    addNotification: (notification: Notification) => {
        const data = db.getData();
        data.notifications.push(notification);
        db.saveData(data);
    },
    markNotificationRead: (id: string) => {
        const data = db.getData();
        const index = data.notifications.findIndex(n => n.id === id);
        if (index > -1) {
            data.notifications[index].read = true;
            db.saveData(data);
        }
    },

    checkUserDailyActivity: (userId: string): boolean => {
        const data = db.getData();
        const today = new Date().toDateString();
        const hasActivity = data.activities.some(a =>
            a.responsibleId === userId && new Date(a.date).toDateString() === today
        );
        const hasOpp = data.opportunities.some(o =>
            o.responsibleId === userId && new Date(o.createdAt).toDateString() === today
        );
        return hasActivity || hasOpp;
    },

    // Guatecompras
    getGuatecomprasEvents: (): GuatecomprasEvent[] => {
        const data = db.getData();
        return data.guatecomprasEvents || [];
    },
    addGuatecomprasEvent: (event: GuatecomprasEvent) => {
        const data = db.getData();
        if (!data.guatecomprasEvents) data.guatecomprasEvents = [];
        data.guatecomprasEvents.push(event);
        db.saveData(data);
    },

    // Utils
    sendEmailNotification: (to: string, subject: string, body: string) => {
        console.log(`%c 📧 EMAIL SIMULADO ENVIADO A ${to}`, 'background: #10b981; color: white; padding: 4px; border-radius: 4px;');
        console.log(`Subject: ${subject}`);
        console.log(body);
        alert(`✅ [EMAIL ENVIADO]\n\nPara: ${to}\nAsunto: ${subject}\n\n${body.substring(0, 150)}...`);
    },


};

db.init();
