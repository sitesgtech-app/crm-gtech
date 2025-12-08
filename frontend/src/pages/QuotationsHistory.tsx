
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/db';
import { User, Opportunity, UserRole, Quotation } from '../types';
import { Search, FileText, User as UserIcon, Calendar, Building, Filter, Eye, Download } from 'lucide-react';
import { QuotationGenerator } from '../components/QuotationGenerator';

interface QuotationsHistoryProps {
    user: User;
}

export const QuotationsHistory: React.FC<QuotationsHistoryProps> = ({ user }) => {
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Filters
    const [sectorFilter, setSectorFilter] = useState('Todos');
    const [sellerFilter, setSellerFilter] = useState('Todos');

    // Modal for viewing quote
    const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
    const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

    useEffect(() => {
        // Admin sees all, Seller sees theirs
        const allOpps = db.getOpportunities(user.role === UserRole.ADMIN ? undefined : user.id, user.role);
        // Only keep opportunities that have a generated quotation
        const quotedOpps = allOpps.filter(o => o.quotation !== undefined);

        setOpportunities(quotedOpps);
        setUsers(db.getUsers());
    }, [user]);

    const filteredOpps = useMemo(() => {
        return opportunities.filter(o => {
            const quote = o.quotation as Quotation;
            const matchesSearch =
                quote.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                quote.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                o.name.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesSector = sectorFilter === 'Todos' || o.sector === sectorFilter;
            const matchesSeller = sellerFilter === 'Todos' || o.responsibleId === sellerFilter;

            return matchesSearch && matchesSector && matchesSeller;
        }).sort((a, b) => new Date(b.quotation!.date).getTime() - new Date(a.quotation!.date).getTime());
    }, [opportunities, searchTerm, sectorFilter, sellerFilter]);

    const handleViewQuote = (opp: Opportunity) => {
        setSelectedOpp(opp);
        setIsQuoteModalOpen(true);
    };

    const getUserName = (id: string) => users.find(u => u.id === id)?.name || 'Desconocido';

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 font-lato">Historial de Cotizaciones</h1>
                    <p className="text-slate-500 text-sm">Consulta de propuestas enviadas y generadas en el sistema.</p>
                </div>

                <div className="flex flex-col lg:flex-row gap-3">
                    {/* Filters */}
                    <div className="flex items-center bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                        <div className="px-3 border-r border-slate-100 flex items-center gap-2">
                            <Filter size={14} className="text-slate-400" />
                            <select
                                className="text-sm bg-transparent outline-none text-slate-600"
                                value={sectorFilter}
                                onChange={(e) => setSectorFilter(e.target.value)}
                            >
                                <option value="Todos">Todos los Sectores</option>
                                <option value="Privado">Sector Privado</option>
                                <option value="Gubernamental">Gubernamental</option>
                            </select>
                        </div>
                        {user.role === UserRole.ADMIN && (
                            <div className="px-3 flex items-center gap-2">
                                <UserIcon size={14} className="text-slate-400" />
                                <select
                                    className="text-sm bg-transparent outline-none text-slate-600"
                                    value={sellerFilter}
                                    onChange={(e) => setSellerFilter(e.target.value)}
                                >
                                    <option value="Todos">Todos los Vendedores</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500 bg-white w-full lg:w-64"
                            placeholder="Buscar por cliente, No..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Quotations List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Desktop Table */}
                <table className="w-full text-left border-collapse hidden md:table">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase font-lato">No. / Fecha</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase font-lato">Cliente / Proyecto</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase font-lato">Sector</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase font-lato">Monto Total</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase font-lato">Vendedor</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase font-lato text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredOpps.map(opp => {
                            const quote = opp.quotation!;
                            return (
                                <tr key={opp.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-800 text-sm">{quote.number}</span>
                                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                                <Calendar size={10} /> {quote.date}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-800 text-sm">{quote.clientName}</div>
                                        <div className="text-xs text-slate-500 truncate max-w-[200px]">{opp.name}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${opp.sector === 'Gubernamental'
                                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                : 'bg-slate-50 text-slate-600 border-slate-200'
                                            }`}>
                                            {opp.sector || 'Privado'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-bold text-slate-800 text-sm">Q{opp.amount.toLocaleString()}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-xs text-slate-600">
                                            <UserIcon size={14} className="text-slate-300" />
                                            {getUserName(opp.responsibleId)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleViewQuote(opp)}
                                            className="inline-flex items-center justify-center px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 transition-all"
                                        >
                                            <Eye size={14} className="mr-1" /> Ver Documento
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-slate-100">
                    {filteredOpps.map(opp => {
                        const quote = opp.quotation!;
                        return (
                            <div key={opp.id} className="p-4 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="font-bold text-slate-800 text-sm block">{quote.number}</span>
                                        <span className="text-xs text-slate-500 flex items-center gap-1">
                                            <Calendar size={12} /> {quote.date}
                                        </span>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${opp.sector === 'Gubernamental'
                                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                                            : 'bg-slate-50 text-slate-600 border-slate-200'
                                        }`}>
                                        {opp.sector || 'Privado'}
                                    </span>
                                </div>

                                <div>
                                    <div className="font-medium text-slate-800 text-sm">{quote.clientName}</div>
                                    <div className="text-xs text-slate-500">{opp.name}</div>
                                </div>

                                <div className="flex justify-between items-center pt-2">
                                    <div>
                                        <span className="text-xs text-slate-500 block">Monto Total</span>
                                        <span className="font-bold text-slate-800 text-base">Q{opp.amount.toLocaleString()}</span>
                                    </div>
                                    <button
                                        onClick={() => handleViewQuote(opp)}
                                        className="inline-flex items-center justify-center px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-all"
                                    >
                                        <Eye size={16} className="mr-1" /> Ver
                                    </button>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-slate-500 pt-1 border-t border-slate-50">
                                    <UserIcon size={12} />
                                    Vendedor: {getUserName(opp.responsibleId)}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {filteredOpps.length === 0 && (
                    <div className="px-6 py-12 text-center text-slate-400">
                        <FileText size={48} className="mx-auto mb-2 opacity-20" />
                        <p>No se encontraron cotizaciones con los filtros aplicados.</p>
                    </div>
                )}
            </div>

            {/* View Modal (Reusing Generator in "Edit" mode which serves as View) */}
            {isQuoteModalOpen && selectedOpp && (
                <QuotationGenerator
                    opportunity={selectedOpp}
                    client={undefined} // Client info is already in the quotation object inside opportunity
                    user={user}
                    onClose={() => setIsQuoteModalOpen(false)}
                    onSave={() => setIsQuoteModalOpen(false)} // Read-only essentially, or re-save if needed
                />
            )}
        </div>
    );
};
