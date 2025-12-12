
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Trello, Activity, BarChart, LogOut, CalendarDays, Package, Briefcase, BadgeCheck, FileText, Menu, X, Bell, Award, Building2, Landmark, ClipboardList, ShoppingCart, Receipt, CreditCard, PieChart, Truck, Settings as SettingsIcon, Check, Box, ChevronDown, ChevronRight, Wrench, Monitor, ShoppingBag, ListTodo, Wallet, Search, Palette, Target, FileCheck, Ticket, Construction, HeartHandshake, Book, ScrollText, Files, Hammer, HardHat, PlayCircle } from 'lucide-react';
import { User, Notification, UserRole, Organization } from '../types';
import { db } from '../services/db';

interface LayoutProps {
    children: React.ReactNode;
    user: User | null;
    onLogout: () => void;
    onUserUpdate: (user: User) => void;
}

interface MenuItemDef {
    icon: any;
    label: string;
    path?: string;
    state?: any;
    children?: MenuItemDef[];
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, onUserUpdate }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [menuSearchTerm, setMenuSearchTerm] = useState('');
    const [org, setOrg] = useState<Organization | null>(null);

    // Submenu State
    const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
        'Gestión Comercial': true,
        'Operaciones': true,
        'Inventarios': false,
        'Finanzas & Ops': false,
        'Reportes': false,
        'Administración': true
    });

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);

    // Theme Menu State
    const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
    const themeRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Load Organization Data including Brand Colors
        const currentOrg = db.getOrganization();
        setOrg(currentOrg);

        if (user) {
            const fetchNotifs = async () => {
                const notifs = await db.fetchNotifications();
                setNotifications(notifs);
            };
            fetchNotifs();
            const interval = setInterval(fetchNotifs, 60000); // Poll every minute
            return () => clearInterval(interval);
        }
    }, [user]);

    // ...

    const handleMarkRead = async (id: string) => {
        // Optimistic Update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        await db.markNotificationAsRead(id);
    };

    const toggleSubmenu = (label: string) => {
        setExpandedMenus(prev => ({ ...prev, [label]: !prev[label] }));
    };

    const handleThemeChange = (theme: string) => {
        if (user) {
            const updatedUser = { ...user, theme };
            db.saveUser(updatedUser); // Persist to DB
            onUserUpdate(updatedUser); // Update App State
        }
        setIsThemeMenuOpen(false);
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    // --- MENU STRUCTURE ---
    const allMenuItems: MenuItemDef[] = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },

        // VENTAS (SALES) GROUP
        {
            icon: Briefcase,
            label: 'Gestión Comercial',
            children: [
                { icon: Trello, label: 'Pipeline & Oportunidades', path: '/pipeline' },
                { icon: ScrollText, label: 'Historial Cotizaciones', path: '/quotations' },
                { icon: FileCheck, label: 'Ordenes de Compra', path: '/purchase-orders' },
                { icon: Users, label: 'Cartera de Clientes', path: '/clients' },
                { icon: CalendarDays, label: 'Calendario & Citas', path: '/calendar' },
                { icon: Target, label: 'Metas & KPIs', path: '/sales-goals' },
                { icon: Activity, label: 'Bitácora de Actividades', path: '/activities' },
                { icon: FileText, label: 'Catálogo de Servicios', path: '/services' },
                { icon: Award, label: 'Licitaciones (Guatecompras)', path: '/guatecompras' },
                { icon: Building2, label: 'Contactos Gobierno', path: '/gc-clients' },
            ]
        },

        // OPERATIONS GROUP (NEW)
        {
            icon: HardHat,
            label: 'Operaciones',
            children: [
                { icon: Construction, label: 'Planificación de Proyectos', path: '/projects' },
                { icon: PlayCircle, label: 'Ejecución de Proyectos', path: '/execution' }, // NEW ITEM
            ]
        },

        // INVENTORY GROUP
        {
            icon: Box,
            label: 'Inventarios',
            children: [
                { icon: ClipboardList, label: 'Insumos', path: '/inventory', state: { tab: 'Insumos' } },
                { icon: Monitor, label: 'Equipo de Oficina', path: '/inventory', state: { tab: 'Equipo de Oficina' } },
                { icon: Wrench, label: 'Herramientas', path: '/inventory', state: { tab: 'Herramientas' } },
                { icon: ShoppingBag, label: 'Productos para Venta', path: '/inventory', state: { tab: 'Productos para la Venta' } },
            ]
        },

        // FINANCE & OPS GROUP
        {
            icon: Wallet,
            label: 'Finanzas & Ops',
            children: [
                { icon: Files, label: 'Facturas Emitidas (FEL)', path: '/issued-invoices' },
                { icon: Truck, label: 'Proveedores', path: '/suppliers' },
                { icon: Hammer, label: 'Compra de Insumos', path: '/project-supplies' },
                { icon: ShoppingCart, label: 'Compras de Equipo', path: '/purchases' },
                { icon: Receipt, label: 'Gastos Operativos', path: '/expenses' },
                { icon: HeartHandshake, label: 'Planilla / RH', path: '/payroll' },
                { icon: CreditCard, label: 'Suscripciones', path: '/subscriptions' },
            ]
        },

        // REPORTS GROUP
        {
            icon: BarChart,
            label: 'Reportes',
            children: [
                { icon: BarChart, label: 'Reportes Globales', path: '/reports' },
                { icon: Users, label: 'Reporte por Vendedor', path: '/sales-report' },
                { icon: PieChart, label: 'Estados Financieros', path: '/financial' },
                { icon: Landmark, label: 'Reporte Gobierno', path: '/gov-report' },
            ]
        },

        // ADMIN
        {
            icon: SettingsIcon,
            label: 'Administración',
            children: [
                { icon: Ticket, label: 'Actividades / Tickets', path: '/tasks' },
                { icon: Book, label: 'Políticas & Documentos', path: '/documents' },
                { icon: BadgeCheck, label: 'Equipo de Ventas', path: '/team' },
                // New Settings Link for SaaS config
                { icon: Building2, label: 'Configuración Empresa', path: '/settings' },
            ]
        }
    ];

    // 1. First, filter by Permissions
    const accessibleMenuItems = useMemo(() => {
        // FIX TS18047: 'user' is possibly 'null'.
        if (!user) return [];

        const currentUser = user;
        const userRole = currentUser.role;
        const userPermissions = currentUser.permissions || [];

        return allMenuItems.filter(item => {
            if (userRole === UserRole.ADMIN) return true;
            // Allow Dashboard by default
            if (item.path === '/') return true;

            if (item.children) {
                const filteredChildren = item.children.filter(child =>
                    userPermissions.includes(child.path!) ||
                    child.path === '/documents' ||
                    child.path === '/quotations' ||
                    child.path === '/issued-invoices' ||
                    child.path === '/project-supplies' ||
                    child.path === '/execution'
                );
                return filteredChildren.length > 0;
            }
            return userPermissions.includes(item.path!);
        }).map(item => {
            if (item.children && userRole !== UserRole.ADMIN) {
                return {
                    ...item,
                    children: item.children.filter(child =>
                        userPermissions.includes(child.path!) ||
                        child.path === '/documents' ||
                        child.path === '/quotations' ||
                        child.path === '/issued-invoices' ||
                        child.path === '/project-supplies' ||
                        child.path === '/execution'
                    )
                };
            }
            return item;
        });
    }, [user]);

    // 2. Then, filter by Search Term (if exists)
    const filteredMenuItems = useMemo(() => {
        if (!menuSearchTerm) return accessibleMenuItems;

        const lowerTerm = menuSearchTerm.toLowerCase();

        return accessibleMenuItems.map(item => {
            const groupMatches = item.label.toLowerCase().includes(lowerTerm);
            let filteredChildren = item.children;
            let hasMatchingChild = false;

            if (item.children) {
                const matchingKids = item.children.filter(child =>
                    child.label.toLowerCase().includes(lowerTerm)
                );
                if (matchingKids.length > 0) {
                    hasMatchingChild = true;
                    if (!groupMatches) {
                        filteredChildren = matchingKids;
                    }
                }
            }

            if (groupMatches || hasMatchingChild) {
                return { ...item, children: filteredChildren };
            }
            return null;
        }).filter(Boolean) as MenuItemDef[];
    }, [accessibleMenuItems, menuSearchTerm]);

    if (!user) return <div>Cargando...</div>;

    const sidebarStyle = { backgroundColor: 'var(--sidebar-bg)' };
    const sidebarTextClass = 'text-white';
    const sidebarTextSecondaryClass = 'text-white/60';
    const sidebarHoverClass = 'hover:bg-white/10 hover:text-white';
    const sidebarActiveClass = 'bg-brand-600 text-white shadow-lg shadow-brand-500/30';

    const SidebarContent = () => {
        if (!user) return null;

        return (
            <div className="flex flex-col h-full">
                {/* Header Logo */}
                <div className={`p-6 pb-4 flex items-center gap-3 border-b border-white/10`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-lg overflow-hidden bg-white/10 text-white`}>
                        {org?.logoUrl ? (
                            <img src={org.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                            <span className="font-bold text-lg font-lato">{org?.commercialName?.charAt(0) || 'G'}</span>
                        )}
                    </div>
                    <div className="overflow-hidden">
                        <h1 className={`text-lg font-bold font-lato tracking-tight leading-none truncate ${sidebarTextClass}`}>
                            {org?.commercialName || 'gtech'}<span className="text-brand-500">.</span>
                        </h1>
                        <p className={`text-[10px] uppercase tracking-widest mt-1 truncate ${sidebarTextSecondaryClass}`}>Enterprise ERP</p>
                    </div>
                </div>

                {/* Menu Search Bar */}
                <div className="px-4 mb-2 mt-4">
                    <div className={`relative rounded-lg transition-colors bg-white/10`}>
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${sidebarTextSecondaryClass}`} />
                        <input
                            type="text"
                            placeholder="Buscar módulo..."
                            value={menuSearchTerm}
                            onChange={(e) => setMenuSearchTerm(e.target.value)}
                            className={`w-full pl-9 pr-7 py-2 bg-transparent border-none outline-none text-xs font-medium ${sidebarTextClass} placeholder-white/40`}
                        />
                        {menuSearchTerm && (
                            <button
                                onClick={() => setMenuSearchTerm('')}
                                className={`absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-black/10 ${sidebarTextClass}`}
                            >
                                <X size={10} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar py-4">
                    {filteredMenuItems.map((item, idx) => {
                        const Icon = item.icon;

                        if (item.children) {
                            const isSearching = menuSearchTerm.length > 0;
                            const isExpanded = isSearching ? true : expandedMenus[item.label];
                            const isActiveParent = item.children.some(child => location.pathname === child.path);

                            return (
                                <div key={idx} className="mb-2">
                                    <button
                                        onClick={() => toggleSubmenu(item.label)}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group ${isActiveParent ? sidebarTextClass : `${sidebarTextSecondaryClass} hover:${sidebarTextClass}`
                                            }`}
                                    >
                                        <div className="flex items-center">
                                            <Icon className={`w-5 h-5 mr-3 transition-colors ${isActiveParent ? 'text-brand-500' : 'opacity-70'}`} />
                                            {item.label}
                                        </div>
                                        <ChevronRight size={14} className={`transition-transform duration-200 opacity-50 ${isExpanded ? 'rotate-90' : ''}`} />
                                    </button>

                                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                        <div className={`pl-3 mt-1 space-y-0.5 border-l-2 ml-5 mb-2 border-white/10`}>
                                            {item.children.map((child, cIdx) => {
                                                const ChildIcon = child.icon;
                                                const isChildActive = location.pathname === child.path &&
                                                    (!child.state?.tab || location.state?.tab === child.state?.tab);

                                                return (
                                                    <Link
                                                        key={cIdx}
                                                        to={child.path!}
                                                        state={child.state}
                                                        onClick={() => { setIsMobileMenuOpen(false); if (isSearching) setMenuSearchTerm(''); }}
                                                        className={`flex items-center px-4 py-2 text-xs font-medium rounded-r-lg transition-all relative ${isChildActive
                                                                ? `text-white font-bold bg-brand-600 -ml-[2px] border-l-2 border-white`
                                                                : `${sidebarTextSecondaryClass} hover:${sidebarTextClass} hover:bg-white/5`
                                                            }`}
                                                    >
                                                        {ChildIcon && <ChildIcon className={`w-3.5 h-3.5 mr-3 ${isChildActive ? 'text-white' : 'opacity-50'}`} />}
                                                        {child.label}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path!}
                                onClick={() => { setIsMobileMenuOpen(false); setMenuSearchTerm(''); }}
                                className={`flex items-center px-3 py-2.5 mb-1 text-sm font-medium rounded-lg transition-all duration-200 ${isActive
                                        ? sidebarActiveClass
                                        : `${sidebarTextSecondaryClass} ${sidebarHoverClass}`
                                    }`}
                            >
                                <Icon className={`w-5 h-5 mr-3 ${isActive ? '' : 'opacity-70'}`} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Profile & Settings Footer */}
                <div className={`p-4 border-t border-white/10 bg-black/10`}>
                    <div className="flex items-center justify-between mb-4 relative">
                        <div className="flex items-center gap-3">
                            <img
                                src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}`}
                                alt="User"
                                className="w-9 h-9 rounded-full bg-slate-200 object-cover border border-white/20"
                            />
                            <div className="min-w-0">
                                <p className={`text-sm font-semibold truncate ${sidebarTextClass}`}>{user?.name}</p>
                                <p className={`text-[10px] truncate uppercase tracking-wider ${sidebarTextSecondaryClass}`}>{user?.role}</p>
                            </div>
                        </div>

                        {/* Theme / Settings Dropdown */}
                        <div className="relative" ref={themeRef}>
                            <button
                                onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                                className={`p-1.5 rounded-lg ${sidebarTextSecondaryClass} hover:text-white hover:bg-white/10 transition-colors`}
                                title="Cambiar Tema"
                            >
                                <SettingsIcon size={16} />
                            </button>

                            {isThemeMenuOpen && (
                                <div className="absolute bottom-full right-0 mb-2 w-40 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 animate-fade-in-up">
                                    <p className="text-xs font-bold text-slate-400 px-2 py-1 uppercase mb-1">Tema Visual</p>
                                    <div className="space-y-1">
                                        {[
                                            { id: 'blue', label: 'Azul Gtech', color: '#3b82f6' },
                                            { id: 'green', label: 'Esmeralda', color: '#10b981' },
                                            { id: 'purple', label: 'Violeta', color: '#8b5cf6' },
                                            { id: 'red', label: 'Ejecutivo', color: '#ef4444' },
                                            { id: 'dark', label: 'Modo Oscuro', color: '#1e293b' },
                                        ].map(t => (
                                            <button
                                                key={t.id}
                                                onClick={() => handleThemeChange(t.id)}
                                                className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50 text-xs font-medium text-slate-700"
                                            >
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }}></div>
                                                {t.label}
                                                {user?.theme === t.id && <Check size={12} className="ml-auto text-brand-600" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={onLogout}
                        className={`flex items-center justify-center w-full px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors border border-white/10 text-white/50 hover:bg-white/10 hover:text-white`}
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-screen bg-slate-50/50 overflow-hidden font-sans">
            <aside
                className={`w-72 hidden md:flex flex-col shadow-xl z-20 transition-colors duration-500 relative`}
                style={sidebarStyle}
            >
                {!org?.brandColors && <div className="absolute inset-0 bg-[#0f172a] -z-10"></div>}
                <SidebarContent />
            </aside>

            <div
                className={`md:hidden fixed top-0 left-0 right-0 h-16 z-30 flex items-center justify-between px-4 shadow-sm`}
                style={sidebarStyle}
            >
                {!org?.brandColors && <div className="absolute inset-0 bg-[#0f172a] -z-10"></div>}
                <div className="flex items-center gap-3 relative z-10">
                    <button onClick={() => setIsMobileMenuOpen(true)} className="text-white"><Menu size={24} /></button>
                    <span className="font-bold text-lg font-lato text-white">{org?.commercialName || 'gtech ERP'}</span>
                </div>
                <div className="flex items-center gap-4 relative z-10">
                    <div className="relative" onClick={() => setIsNotifOpen(!isNotifOpen)}>
                        <Bell className="w-6 h-6 text-white/80" />
                        {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full ring-2 ring-white"></span>}
                    </div>
                    <img src={user.avatar} className="w-8 h-8 rounded-full border border-slate-200" alt="User" />
                </div>
            </div>

            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-40 md:hidden">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
                    <div
                        className={`absolute top-0 left-0 bottom-0 w-80 shadow-2xl transition-transform h-full`}
                        style={sidebarStyle}
                    >
                        {!org?.brandColors && <div className="absolute inset-0 bg-[#0f172a] -z-10"></div>}
                        <button onClick={() => setIsMobileMenuOpen(false)} className={`absolute top-4 right-4 ${sidebarTextSecondaryClass}`}><X size={24} /></button>
                        <SidebarContent />
                    </div>
                </div>
            )}

            <main className="flex-1 overflow-hidden flex flex-col w-full h-full pt-16 md:pt-0 relative bg-[#f8fafc]">

                <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white/80 backdrop-blur-md border-b border-slate-200 z-10 sticky top-0">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span className="font-medium text-slate-800 font-lato">{org?.commercialName || 'Gtech ERP'}</span>
                        <span className="text-slate-300">/</span>
                        <span className="capitalize">{location.pathname === '/' ? 'Dashboard' : location.pathname.substring(1).replace('-', ' ')}</span>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-brand-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Búsqueda global..."
                                className="pl-9 pr-4 py-2 rounded-full bg-slate-100 border-none text-sm w-64 focus:ring-2 focus:ring-brand-500/20 focus:bg-white transition-all outline-none text-slate-600 placeholder:text-slate-400"
                            />
                        </div>

                        <div className="h-6 w-px bg-slate-200"></div>

                        <div className="relative" ref={notifRef}>
                            <button
                                onClick={() => setIsNotifOpen(!isNotifOpen)}
                                className="relative p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
                            >
                                <Bell size={20} />
                                {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>}
                            </button>
                            {isNotifOpen && (
                                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animation-fade-in-up">
                                    <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                                        <h3 className="font-bold text-sm text-slate-800">Notificaciones</h3>
                                        <span className="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">{unreadCount} nuevas</span>
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto">
                                        {notifications.length > 0 ? notifications.map(n => (
                                            <div key={n.id} onClick={() => handleMarkRead(n.id)} className={`p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer flex gap-3 ${!n.read ? 'bg-blue-50/30' : ''}`}>
                                                <div className={`w-2 h-2 mt-2 rounded-full shrink-0 ${!n.read ? 'bg-brand-500' : 'bg-slate-300'}`}></div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-800">{n.title}</p>
                                                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>
                                                    <p className="text-[10px] text-slate-400 mt-2 font-medium">{new Date(n.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                            </div>
                                        )) : <div className="p-8 text-center text-slate-400 text-sm">Todo al día 🎉</div>}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-4 md:p-8 scroll-smooth">
                    <div className="max-w-7xl mx-auto animate-fade-in pb-10">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
};