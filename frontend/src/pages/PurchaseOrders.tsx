


import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/db';
import { User, Opportunity, OpportunityStage, UserRole } from '../types';
import { Search, FileCheck, Download, Eye, Building, Calendar, DollarSign, Upload, Filter, XCircle, Trash2 } from 'lucide-react';

interface PurchaseOrdersProps {
    user: User;
}

export const PurchaseOrders: React.FC<PurchaseOrdersProps> = ({ user }) => {
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Filtering State
    const [selectedMonth, setSelectedMonth] = useState<string>(''); // Format: "YYYY-MM"

    useEffect(() => {
        const loadOpportunities = async () => {
            // Fetch from API (Async)
            const allOpps = await db.fetchOpportunities(user.role === UserRole.ADMIN ? undefined : user.id, user.role);

            // Filter only those that are WON (Include those without files too, so we can upload)
            const wonOpps = allOpps.filter(o => o.stage === OpportunityStage.GANADA);

            // Sort by Last Updated (descending) effectively "Upload Date" or "Close Date"
            wonOpps.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());

            setOpportunities(wonOpps);
        };

        loadOpportunities();
    }, [user]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, opp: Opportunity) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 5000000) { // 5MB limit
                alert("El archivo es demasiado grande (Máx 5MB).");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                const updatedOpp = {
                    ...opp,
                    purchaseOrderFile: reader.result as string,
                    purchaseOrderFileName: file.name,
                    lastUpdated: new Date().toISOString() // Update timestamp to reflect upload
                };
                db.updateOpportunity(updatedOpp);

                // Update local state
                setOpportunities(prev => prev.map(o => o.id === updatedOpp.id ? updatedOpp : o));
                alert("Archivo cargado exitosamente.");
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDeleteFile = (opp: Opportunity) => {
        if (window.confirm('¿Está seguro de eliminar el archivo de Orden de Compra?')) {
            const updatedOpp: Opportunity = {
                ...opp,
                purchaseOrderFile: undefined,
                purchaseOrderFileName: undefined,
                purchaseOrderStatus: 'active' // Reset status if deleted
            };
            db.updateOpportunity(updatedOpp);
            setOpportunities(prev => prev.map(o => o.id === updatedOpp.id ? updatedOpp : o));
        }
    };

    const handleVoidOrder = (opp: Opportunity) => {
        if (window.confirm('¿Está seguro de ANULAR esta Orden de Compra?')) {
            const updatedOpp: Opportunity = {
                ...opp,
                purchaseOrderStatus: 'void'
            };
            db.updateOpportunity(updatedOpp);
            setOpportunities(prev => prev.map(o => o.id === updatedOpp.id ? updatedOpp : o));
        }
    };

    const availableMonths = useMemo(() => {
        const months = new Set<string>();
        opportunities.forEach(o => {
            const date = new Date(o.lastUpdated);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            months.add(key);
        });
        return Array.from(months).sort().reverse();
    }, [opportunities]);

    const filteredOpps = useMemo(() => {
        return opportunities.filter(o => {
            const matchesSearch = o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                o.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (o.purchaseOrderFileName || '').toLowerCase().includes(searchTerm.toLowerCase());

            if (!matchesSearch) return false;

            if (selectedMonth) {
                const date = new Date(o.lastUpdated);
                const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                if (key !== selectedMonth) return false;
            }

            return true;
        });
    }, [opportunities, searchTerm, selectedMonth]);

    const getMonthName = (key: string) => {
        const [year, month] = key.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    };

    // Preview State
    const [previewFile, setPreviewFile] = useState<{ url: string; name: string; type: 'pdf' | 'image' } | null>(null);

    const handlePreview = (opp: Opportunity) => {
        if (!opp.purchaseOrderFile) return;

        // Determine type roughly by extension or regex on base64 header
        // Base64 header: data:application/pdf;base64,..... or data:image/png;base64,....
        const isPdf = opp.purchaseOrderFile.includes('application/pdf') || (opp.purchaseOrderFileName || '').toLowerCase().endsWith('.pdf');

        setPreviewFile({
            url: opp.purchaseOrderFile,
            name: opp.purchaseOrderFileName || 'Documento',
            type: isPdf ? 'pdf' : 'image'
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Repositorio de Órdenes de Compra</h1>
                    <p className="text-slate-500 text-sm">Gestiona y consulta los documentos de cierre de ventas.</p>
                </div>

                <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative">
                        <select
                            className="appearance-none pl-10 pr-8 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-brand-500 w-full md:w-48 cursor-pointer"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                        >
                            <option value="">Todos los Meses</option>
                            {availableMonths.map(m => (
                                <option key={m} value={m}>{getMonthName(m)}</option>
                            ))}
                        </select>
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500 bg-white w-full md:w-64"
                            placeholder="Buscar orden..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOpps.map(opp => (
                    <div key={opp.id} className={`bg-white rounded-xl shadow-sm border overflow-hidden group hover:shadow-md transition-all ${!opp.purchaseOrderFile ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200'}`}>
                        <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-lg ${opp.purchaseOrderFile ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                                    <FileCheck size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-bold uppercase truncate max-w-[150px]">{opp.clientName}</p>
                                    <p className="font-bold text-slate-800 text-sm truncate max-w-[180px]" title={opp.name}>{opp.name}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500 flex items-center gap-2"><Calendar size={14} /> Fecha Carga:</span>
                                <span className="font-medium text-slate-700">{new Date(opp.lastUpdated).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500 flex items-center gap-2"><DollarSign size={14} /> Monto Venta:</span>
                                <span className="font-bold text-slate-800">Q{opp.amount.toLocaleString()}</span>
                            </div>

                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mt-3">
                                {opp.purchaseOrderFile ? (
                                    <>
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="text-xs text-slate-400">Archivo Adjunto:</p>
                                            {opp.purchaseOrderStatus === 'void' && (
                                                <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-full border border-red-200">
                                                    ANULADA
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs font-medium text-slate-700 truncate mb-3" title={opp.purchaseOrderFileName}>
                                            {opp.purchaseOrderFileName || 'Documento_Sin_Nombre.pdf'}
                                        </p>
                                        <div className="flex gap-2">
                                            {/* Preview Button */}
                                            <button
                                                onClick={() => handlePreview(opp)}
                                                className={`flex-1 flex items-center justify-center py-2 bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors gap-2 
                                                    ${opp.purchaseOrderStatus === 'void' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                disabled={opp.purchaseOrderStatus === 'void'}
                                            >
                                                <Eye size={14} /> Ver
                                            </button>

                                            <a
                                                href={opp.purchaseOrderFile}
                                                download={opp.purchaseOrderFileName || `OC_${opp.clientName}.pdf`}
                                                className={`px-3 py-2 text-white rounded-lg text-xs font-bold transition-colors gap-2 flex items-center justify-center ${opp.purchaseOrderStatus === 'void' ? 'bg-slate-400 cursor-not-allowed' : 'bg-brand-600 hover:bg-brand-700'
                                                    }`}
                                                style={{ pointerEvents: opp.purchaseOrderStatus === 'void' ? 'none' : 'auto' }}
                                                title="Descargar"
                                            >
                                                <Download size={14} />
                                            </a>

                                            {opp.purchaseOrderStatus !== 'void' && (
                                                <>
                                                    <label className="cursor-pointer px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg flex items-center justify-center group/upload relative" title="Reemplazar archivo">
                                                        <Upload size={14} className="text-slate-500" />
                                                        <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => handleFileUpload(e, opp)} />
                                                    </label>

                                                    <button
                                                        onClick={() => handleVoidOrder(opp)}
                                                        className="px-3 py-2 bg-white border border-red-200 hover:bg-red-50 rounded-lg flex items-center justify-center text-red-500 hover:text-red-700 transition-colors"
                                                        title="Anular Orden de Compra"
                                                    >
                                                        <XCircle size={14} />
                                                    </button>
                                                </>
                                            )}

                                            <button
                                                onClick={() => handleDeleteFile(opp)}
                                                className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
                                                title="Eliminar archivo permanentemente"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-2">
                                        <p className="text-xs text-amber-600 font-bold mb-2">Falta Cargar Orden de Compra</p>
                                        <label className="flex items-center justify-center w-full py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-xs font-bold transition-colors gap-2 cursor-pointer border border-amber-200">
                                            <Upload size={14} /> Cargar Archivo
                                            <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => handleFileUpload(e, opp)} />
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredOpps.length === 0 && (
                <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
                        <FileCheck size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-600">No se encontraron documentos</h3>
                    <p className="text-slate-400 text-sm max-w-md mx-auto mt-2">
                        Intente ajustar los filtros de fecha o búsqueda.
                    </p>
                </div>
            )}

            {/* Preview Modal */}
            {previewFile && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Eye size={18} className="text-brand-600" />
                                {previewFile.name}
                            </h3>
                            <div className="flex items-center gap-2">
                                <a
                                    href={previewFile.url}
                                    download={previewFile.name}
                                    className="p-2 hover:bg-slate-200 rounded-full text-slate-600 transition-colors"
                                    title="Descargar"
                                >
                                    <Download size={20} />
                                </a>
                                <button
                                    onClick={() => setPreviewFile(null)}
                                    className="p-2 hover:bg-red-100 hover:text-red-600 rounded-full text-slate-500 transition-colors"
                                >
                                    <XCircle size={24} />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 bg-slate-200 p-1 flex items-center justify-center overflow-auto">
                            {previewFile.type === 'pdf' ? (
                                <object
                                    data={previewFile.url}
                                    type="application/pdf"
                                    className="w-full h-full rounded-lg bg-white"
                                >
                                    <embed
                                        src={previewFile.url}
                                        type="application/pdf"
                                        className="w-full h-full rounded-lg bg-white"
                                    />
                                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                                        <p>No se pudo visualizar el PDF directamente.</p>
                                        <a href={previewFile.url} download={previewFile.name} className="text-brand-600 underline mt-2">Descargar en su lugar</a>
                                    </div>
                                </object>
                            ) : (
                                <img
                                    src={previewFile.url}
                                    alt="Preview"
                                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};