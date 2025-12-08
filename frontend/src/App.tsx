
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Kanban } from './pages/Kanban';
import { Clients } from './pages/Clients';
import { Reports } from './pages/Reports';
import { SalesReport } from './pages/SalesReport';
import { Activities } from './pages/Activities';
import { Calendar } from './pages/Calendar';
import { Inventory } from './pages/Inventory';
import { Services } from './pages/Services';
import { SalesTeam } from './pages/SalesTeam';
import { Guatecompras } from './pages/Guatecompras';
import { GuatecomprasClients } from './pages/GuatecomprasClients';
import { GovernmentReport } from './pages/GovernmentReport';
import { Tasks } from './pages/Tasks';
import { Purchases } from './pages/Purchases';
import { Expenses } from './pages/Expenses';
import { Subscriptions } from './pages/Subscriptions';
import { FinancialReport } from './pages/FinancialReport';
import { Suppliers } from './pages/Suppliers';
import { SalesGoals } from './pages/SalesGoals';
import { PurchaseOrders } from './pages/PurchaseOrders';
import { ProjectPlanning } from './pages/ProjectPlanning';
import { ApprovedProjects } from './pages/ApprovedProjects';
import { ProjectSupplies } from './pages/ProjectSupplies';
import { Payroll } from './pages/Payroll';
import { Settings } from './pages/Settings';
import { CompanyDocuments } from './pages/CompanyDocuments';
import { QuotationsHistory } from './pages/QuotationsHistory';
import { IssuedInvoices } from './pages/IssuedInvoices';
import { db } from './services/db';
import api from './services/api';
import { User, UserRole } from './types';
import { Target, Eye, X, Rocket, CheckSquare, Square, ShieldCheck, ArrowRight, Lock } from 'lucide-react';

import Login from './pages/Login';

// --- WELCOME MODAL COMPONENT ---
const WelcomeModal = ({ onClose }: { onClose: () => void }) => {
    const [progress, setProgress] = useState(100);

    useEffect(() => {
        const duration = 10000; // 10 seconds
        const interval = 50; // Update every 50ms
        const steps = duration / interval;
        const decrement = 100 / steps;

        const timer = setInterval(() => {
            setProgress((prev) => {
                if (prev <= 0) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - decrement;
            });
        }, interval);

        const closeTimer = setTimeout(() => {
            onClose();
        }, duration);

        return () => {
            clearInterval(timer);
            clearTimeout(closeTimer);
        };
    }, [onClose]);

    return (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-fade-in">
            <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden relative flex flex-col transform transition-all min-h-[500px]">

                {/* Progress Bar (Top) */}
                <div className="h-1.5 w-full bg-slate-100">
                    <div
                        className="h-full bg-gradient-to-r from-brand-500 to-brand-700 transition-all duration-100 ease-linear"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors z-20"
                >
                    <X size={24} />
                </button>

                {/* Main Content */}
                <div className="flex flex-col md:flex-row h-full flex-1">

                    {/* Brand Sidebar */}
                    <div className="md:w-1/3 bg-slate-900 text-white p-8 md:p-12 flex flex-col justify-center relative overflow-hidden">
                        {/* Abstract Background */}
                        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                            <div className="absolute -top-20 -left-20 w-64 h-64 bg-brand-500 rounded-full mix-blend-overlay filter blur-3xl animate-pulse"></div>
                            <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500 rounded-full mix-blend-overlay filter blur-3xl animate-pulse"></div>
                        </div>

                        <div className="relative z-10">
                            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 border border-white/20 shadow-lg">
                                <span className="text-3xl font-bold font-lato">g</span>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold font-lato mb-4 leading-tight">gtech<br /><span className="text-brand-400">Soluciones Tecnológicas</span></h2>
                            <p className="text-slate-400 text-sm font-medium uppercase tracking-widest mb-8">Innovación • Inspiración • Talento</p>

                            <div className="space-y-4 border-t border-white/10 pt-6">
                                <div className="flex items-center gap-3 text-sm text-slate-300">
                                    <div className="w-2 h-2 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                                    <span className="font-medium tracking-wide">Honestidad</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-300">
                                    <div className="w-2 h-2 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                                    <span className="font-medium tracking-wide">Responsabilidad</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-300">
                                    <div className="w-2 h-2 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                                    <span className="font-medium tracking-wide">Iniciativa</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mission & Vision Content */}
                    <div className="md:w-2/3 p-8 md:p-12 flex flex-col justify-center bg-white relative">
                        <div className="grid grid-cols-1 gap-12">
                            {/* Mision */}
                            <div className="group">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2.5 bg-blue-50 text-brand-600 rounded-xl group-hover:bg-brand-600 group-hover:text-white transition-colors shadow-sm">
                                        <Target size={24} />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800 font-lato tracking-wide">MISIÓN</h3>
                                </div>
                                <p className="text-slate-600 leading-relaxed text-base border-l-2 border-slate-100 pl-5 group-hover:border-brand-500 transition-colors text-justify">
                                    Ofrecer una amplia gama de productos de tecnología, servicios técnicos y capacitaciones en las últimas tendencias de tecnología brindando oportunidades laborales.
                                </p>
                                <p className="text-slate-500 leading-relaxed text-base italic pl-5 mt-2">
                                    Con procesos de atención personalizada al consumidor, eficaces y eficientes.
                                </p>
                            </div>

                            {/* Vision */}
                            <div className="group">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-colors shadow-sm">
                                        <Eye size={24} />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800 font-lato tracking-wide">VISIÓN</h3>
                                </div>
                                <p className="text-slate-600 leading-relaxed text-base border-l-2 border-slate-100 pl-5 group-hover:border-purple-500 transition-colors text-justify">
                                    Ser una empresa líder en innovación tecnológica, capacitación y servicios técnicos en la región, a través de procesos de calidad y excelencia.
                                </p>
                                <p className="text-slate-500 leading-relaxed text-base italic pl-5 mt-2 text-justify">
                                    Innovación, inspiración y talento son nuestras bases principales para el crecimiento tecnológico en la región con nuestros 3 valores pilares: honestidad, responsabilidad e iniciativa.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

function App() {
    const [user, setUser] = useState<User | null>(null);
    const [showWelcomeModal, setShowWelcomeModal] = useState(false);

    useEffect(() => {
        const sessionUser = localStorage.getItem('gtech_session');
        if (sessionUser) {
            const parsedUser = JSON.parse(sessionUser);
            // If stored user somehow still has flag true (e.g. cleared localstorage mid-flow), force logout to re-verify
            if (parsedUser.mustChangePassword) {
                localStorage.removeItem('gtech_session');
            } else {
                setUser(parsedUser);
            }
        }
    }, []);

    useEffect(() => {
        if (!user || user.role !== UserRole.VENDEDOR) return;

        const checkDailyActivity = () => {
            const now = new Date();
            const day = now.getDay();
            const hour = now.getHours();

            if (day >= 1 && day <= 5 && hour >= 16) {
                const alreadySent = db.hasSentDailyMotivation(user.id);
                if (alreadySent) return;

                const hasActivity = db.checkUserDailyActivity(user.id);

                if (!hasActivity) {
                    db.addNotification({
                        id: `notif-${Date.now()}`,
                        organizationId: user.organizationId || 'org1',
                        userId: user.id,
                        title: 'Ánimo, mañana será mejor',
                        message: 'Hoy no generaste ninguna oportunidad, animo tu eres increible, mañana tendras exito',
                        date: new Date().toISOString(),
                        read: false,
                        type: 'motivation'
                    });
                }
            }
        };

        checkDailyActivity();
        const interval = setInterval(checkDailyActivity, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [user]);


    const handleLoginSuccess = (loggedUser: User) => {
        setUser(loggedUser);
        localStorage.setItem('gtech_session', JSON.stringify(loggedUser));
        // Trigger Welcome Modal on Login
        setShowWelcomeModal(true);
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('gtech_session');
        setShowWelcomeModal(false);
    };

    const handleUserUpdate = (updatedUser: User) => {
        setUser(updatedUser);
        localStorage.setItem('gtech_session', JSON.stringify(updatedUser));
    };

    if (!user) {
        return <Login onLoginSuccess={handleLoginSuccess} />;
    }

    return (
        <Router>
            {/* Welcome Modal Overlay */}
            {showWelcomeModal && <WelcomeModal onClose={() => setShowWelcomeModal(false)} />}

            <Layout user={user} onLogout={handleLogout} onUserUpdate={handleUserUpdate}>
                <Routes>
                    <Route path="/" element={<Dashboard user={user} />} />
                    <Route path="/pipeline" element={<Kanban user={user} />} />
                    <Route path="/quotations" element={<QuotationsHistory user={user} />} />
                    <Route path="/tasks" element={<Tasks user={user} />} />
                    <Route path="/clients" element={<Clients user={user} />} />
                    <Route path="/calendar" element={<Calendar user={user} />} />
                    <Route path="/sales-goals" element={<SalesGoals user={user} />} />
                    <Route path="/purchase-orders" element={<PurchaseOrders user={user} />} />
                    <Route path="/projects" element={<ProjectPlanning />} />
                    <Route path="/execution" element={<ApprovedProjects user={user} />} />
                    <Route path="/project-supplies" element={<ProjectSupplies user={user} />} />
                    <Route path="/inventory" element={<Inventory user={user} />} />
                    <Route path="/products" element={<Navigate to="/inventory" />} />
                    <Route path="/services" element={<Services user={user} />} />
                    <Route path="/team" element={<SalesTeam user={user} />} />
                    <Route path="/sales-report" element={<SalesReport user={user} />} />
                    <Route path="/guatecompras" element={<Guatecompras user={user} />} />
                    <Route path="/gc-clients" element={<GuatecomprasClients user={user} />} />
                    <Route path="/gov-report" element={<GovernmentReport user={user} />} />
                    <Route path="/reports" element={<Reports user={user} />} />
                    <Route path="/activities" element={<Activities user={user} />} />
                    <Route path="/purchases" element={<Purchases user={user} />} />
                    <Route path="/expenses" element={<Expenses user={user} />} />
                    <Route path="/payroll" element={<Payroll user={user} />} />
                    <Route path="/subscriptions" element={<Subscriptions user={user} />} />
                    <Route path="/financial" element={<FinancialReport user={user} />} />
                    <Route path="/suppliers" element={<Suppliers user={user} />} />
                    <Route path="/settings" element={<Settings user={user} />} />
                    <Route path="/documents" element={<CompanyDocuments user={user} />} />
                    <Route path="/issued-invoices" element={<IssuedInvoices user={user} />} />
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </Layout>
        </Router>
    );
}

export default App;