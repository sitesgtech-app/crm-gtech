
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/db';
import { Purchase, User, Supplier, PurchasePayment, UserRole } from '../types';
import { Plus, Search, X, ShoppingCart, Calendar, DollarSign, FileText, Truck, Clock, AlertTriangle, CheckCircle, Wallet, Upload, Download, Shield } from 'lucide-react';

export const Purchases: React.FC<{ user: User }> = ({ user }) => {
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'history' | 'payables'>('history');

    // Modals
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    // State for New Purchase
    const [newPurchase, setNewPurchase] = useState<Partial<Purchase>>({
        date: new Date().toISOString().split('T')[0],
        supplier: '',
        supplierId: '',
        description: '',
        amount: 0,
        dte: '',
        isCredit: false,
        paymentDueDate: '',
        paymentStatus: 'Pagado',
        fileName: '',
        fileUrl: ''
    });

    // State for New Payment
    const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
    const [paymentAmount, setPaymentAmount] = useState<string>('');
    const [paymentRef, setPaymentRef] = useState('');

    useEffect(() => {
        refreshData();
    }, []);

    const refreshData = () => {
        setPurchases(db.getPurchases());
        setSuppliers(db.getSuppliers());
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPurchase.supplier || !newPurchase.amount) return;

        if (newPurchase.isCredit && !newPurchase.paymentDueDate) {
            alert("Por favor ingrese la fecha de vencimiento del crédito.");
            return;
        }

        const purchase: Purchase = {
            id: `pur${Date.now()}`,
            organizationId: user.organizationId || 'org1',
            date: newPurchase.date || new Date().toISOString(),
            supplier: newPurchase.supplier,
            supplierId: newPurchase.supplierId,
            description: newPurchase.description || '',
            amount: Number(newPurchase.amount),
            registeredBy: user.id,
            dte: newPurchase.dte || '',
            isCredit: newPurchase.isCredit,
            paymentDueDate: newPurchase.isCredit ? newPurchase.paymentDueDate : undefined,
            paymentStatus: newPurchase.isCredit ? 'Pendiente' : 'Pagado',
            balance: newPurchase.isCredit ? Number(newPurchase.amount) : 0,
            payments: [],
            fileUrl: newPurchase.fileUrl,
            fileName: newPurchase.fileName
        };

        db.addPurchase(purchase);
        refreshData();
        setIsModalOpen(false);
        setNewPurchase({
            date: new Date().toISOString().split('T')[0],
            supplier: '',
            supplierId: '',
            description: '',
            amount: 0,
            dte: '',
            isCredit: false,
            paymentStatus: 'Pagado',
            fileName: '',
            fileUrl: ''
        });
    };

    const handleRegisterPayment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPurchase || !paymentAmount) return;

        const amount = Number(paymentAmount);
        if (amount <= 0 || amount > (selectedPurchase.balance || 0)) {
            alert("El monto debe ser válido y no mayor al saldo pendiente.");
            return;
        }

        const payment: PurchasePayment = {
            id: `pay-${Date.now()}`,
            date: new Date().toISOString(),
            amount: amount,
            reference: paymentRef,
            recordedBy: user.id
        };

        db.registerPurchasePayment(selectedPurchase.id, payment);
        refreshData();
        setIsPaymentModalOpen(false);
        setPaymentAmount('');
        setPaymentRef('');
        setSelectedPurchase(null);
    };

    const handleSupplierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        const supplierObj = suppliers.find(s => s.id === id);
        if (supplierObj) {
            setNewPurchase({ ...newPurchase, supplier: supplierObj.name, supplierId: supplierObj.id });
        } else {
            setNewPurchase({ ...newPurchase, supplier: '', supplierId: '' });
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 3000000) {
                alert('El archivo es demasiado grande. Máximo 3MB.');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewPurchase({
                    ...newPurchase,
                    fileName: file.name,
                    fileUrl: reader.result as string
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const openPaymentModal = (purchase: Purchase) => {
        setSelectedPurchase(purchase);
        setPaymentAmount(purchase.balance?.toString() || '');
        setIsPaymentModalOpen(true);
    };

    // Security Check
    if (user.role !== UserRole.ADMIN && !user.permissions?.includes('/purchases')) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <Shield size={64} className="mb-4 text-slate-300" />
                <h2 className="text-xl font-bold text-slate-700">Acceso Restringido</h2>
                <p>No tienes permisos para ver el módulo de Compras.</p>
            </div>
        );
    }

    // Filter Logic
    const filteredPurchases = useMemo(() => {
        let list = purchases.filter(p =>
            p.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.dte && p.dte.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        if (activeTab === 'payables') {
            return list.filter(p => p.isCredit && p.paymentStatus !== 'Pagado').sort((a, b) => {
                return new Date(a.paymentDueDate || '').getTime() - new Date(b.paymentDueDate || '').getTime();
            });
        }

        return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [purchases, searchTerm, activeTab]);

    // Stats for Payables
    const payableStats = useMemo(() => {
        const pending = purchases.filter(p => p.isCredit && p.paymentStatus !== 'Pagado');
        const totalDebt = pending.reduce((sum, p) => sum + (p.balance || 0), 0);

        const now = new Date();
        const overdue = pending.filter(p => p.paymentDueDate && new Date(p.paymentDueDate) < now);
        const overdueAmount = overdue.reduce((sum, p) => sum + (p.balance || 0), 0);

        return { totalDebt, count: pending.length, overdueCount: overdue.length, overdueAmount };
    }, [purchases]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Pagado': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Pendiente': return 'bg-red-100 text-red-700 border-red-200';
            case 'Parcial': return 'bg-orange-100 text-orange-700 border-orange-200';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Compras y Cuentas por Pagar</h1>
                    <p className="text-slate-500 text-sm">Control de inventario, créditos y pagos a proveedores.</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                            placeholder="Buscar proveedor, DTE..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => { setNewPurchase({ date: new Date().toISOString().split('T')[0], supplier: '', supplierId: '', description: '', amount: 0, dte: '', isCredit: false, paymentStatus: 'Pagado', fileUrl: '', fileName: '' }); setIsModalOpen(true); }}
                        className="flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium shadow-sm"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Nueva Compra
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-4 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('history')}
                    className={`pb-3 px-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'history' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Historial de Compras
                </button>
                <button
                    onClick={() => setActiveTab('payables')}
                    className={`pb-3 px-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'payables' ? 'border-red-500 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Cuentas por Pagar (Deudas)
                    {payableStats.count > 0 && <span className="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full">{payableStats.count}</span>}
                </button>
            </div>

            {/* KPI Boxes (Visible on Payables Tab) */}
            {activeTab === 'payables' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                        <div className="p-3 bg-red-50 rounded-full text-red-600"><Wallet size={24} /></div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase">Deuda Total Pendiente</p>
                            <p className="text-2xl font-bold text-slate-800">Q{payableStats.totalDebt.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                        <div className="p-3 bg-orange-50 rounded-full text-orange-600"><AlertTriangle size={24} /></div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase">Deuda Vencida</p>
                            <p className="text-2xl font-bold text-orange-600">Q{payableStats.overdueAmount.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Fecha</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Proveedor / DTE</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Descripción</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Estado Pago</th>
                            {activeTab === 'payables' && <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Vencimiento</th>}
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">
                                {activeTab === 'payables' ? 'Saldo Pendiente' : 'Monto Total'}
                            </th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredPurchases.map((p) => {
                            const isOverdue = p.paymentDueDate && new Date(p.paymentDueDate) < new Date();
                            return (
                                <tr key={p.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-slate-400" />
                                            {new Date(p.date).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-slate-800 text-sm flex items-center gap-2"><Truck size={14} className="text-slate-400" /> {p.supplier}</p>
                                        <p className="text-xs text-slate-500 font-mono">{p.dte || 'S/N'}</p>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">{p.description}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase border ${getStatusBadge(p.paymentStatus || 'Pagado')}`}>
                                            {p.paymentStatus || 'Pagado'}
                                        </span>
                                    </td>

                                    {activeTab === 'payables' && (
                                        <td className="px-6 py-4 text-sm">
                                            {p.paymentDueDate ? (
                                                <span className={`font-bold flex items-center gap-1 ${isOverdue ? 'text-red-600' : 'text-slate-600'}`}>
                                                    {isOverdue && <AlertTriangle size={12} />}
                                                    {new Date(p.paymentDueDate).toLocaleDateString()}
                                                </span>
                                            ) : '-'}
                                        </td>
                                    )}

                                    <td className="px-6 py-4 text-right font-bold text-slate-800">
                                        Q{(activeTab === 'payables' ? (p.balance || 0) : p.amount).toLocaleString()}
                                    </td>

                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        {p.fileUrl && (
                                            <a
                                                href={p.fileUrl}
                                                download={p.fileName || 'factura.pdf'}
                                                className="text-slate-400 hover:text-brand-600 p-1.5 hover:bg-slate-100 rounded transition-colors"
                                                title="Descargar Factura"
                                            >
                                                <Download size={16} />
                                            </a>
                                        )}
                                        {activeTab === 'payables' && (
                                            <button
                                                onClick={() => openPaymentModal(p)}
                                                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded font-bold transition-colors shadow-sm"
                                            >
                                                Abonar
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredPurchases.length === 0 && (
                            <tr>
                                <td colSpan={activeTab === 'payables' ? 7 : 7} className="px-6 py-12 text-center text-slate-400">
                                    <CheckCircle size={32} className="mx-auto mb-2 opacity-30" />
                                    <p>{activeTab === 'payables' ? 'No tienes deudas pendientes.' : 'No se encontraron compras.'}</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* NEW PURCHASE MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-100 flex justify-between">
                            <div className="flex items-center gap-2">
                                <ShoppingCart className="text-brand-600 w-5 h-5" />
                                <h2 className="text-xl font-bold text-slate-800">Registrar Compra</h2>
                            </div>
                            <button onClick={() => setIsModalOpen(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Compra</label>
                                <input type="date" className="w-full border border-slate-300 rounded-lg p-2 bg-white" value={newPurchase.date} onChange={e => setNewPurchase({ ...newPurchase, date: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Número de DTE</label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <input type="text" className="w-full pl-9 border border-slate-300 rounded-lg p-2 bg-white" placeholder="No. de Factura / DTE" value={newPurchase.dte} onChange={e => setNewPurchase({ ...newPurchase, dte: e.target.value })} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Proveedor</label>
                                {suppliers.length > 0 ? (
                                    <select
                                        required
                                        className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                                        value={newPurchase.supplierId}
                                        onChange={handleSupplierChange}
                                    >
                                        <option value="">Seleccionar Proveedor...</option>
                                        {suppliers.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="text-sm text-red-500">
                                        No hay proveedores.
                                        <input
                                            type="text"
                                            className="w-full border border-slate-300 rounded-lg p-2 bg-white mt-1"
                                            placeholder="Nombre manual..."
                                            value={newPurchase.supplier}
                                            onChange={e => setNewPurchase({ ...newPurchase, supplier: e.target.value })}
                                        />
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción del Equipo</label>
                                <input type="text" className="w-full border border-slate-300 rounded-lg p-2 bg-white" placeholder="Ej. 5 Laptops Dell Latitude" value={newPurchase.description} onChange={e => setNewPurchase({ ...newPurchase, description: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Monto Total (Q)</label>
                                <input required type="number" step="0.01" className="w-full border border-slate-300 rounded-lg p-2 bg-white font-bold" value={newPurchase.amount} onChange={e => setNewPurchase({ ...newPurchase, amount: Number(e.target.value) })} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Adjuntar Factura</label>
                                <div className="flex items-center gap-2">
                                    <label className="flex items-center justify-center px-4 py-2 border border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 text-sm text-slate-600 w-full">
                                        <Upload size={16} className="mr-2" />
                                        {newPurchase.fileName ? newPurchase.fileName : 'Subir PDF o Imagen'}
                                        <input type="file" accept="application/pdf,image/*" className="hidden" onChange={handleFileUpload} />
                                    </label>
                                </div>
                            </div>

                            {/* CREDIT LOGIC */}
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-slate-700">Tipo de Compra</span>
                                    <div className="flex bg-white rounded-lg p-1 border border-slate-300">
                                        <button
                                            type="button"
                                            onClick={() => setNewPurchase({ ...newPurchase, isCredit: false })}
                                            className={`px-3 py-1 text-xs font-bold rounded ${!newPurchase.isCredit ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500'}`}
                                        >
                                            Contado
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setNewPurchase({ ...newPurchase, isCredit: true })}
                                            className={`px-3 py-1 text-xs font-bold rounded ${newPurchase.isCredit ? 'bg-orange-100 text-orange-700' : 'text-slate-500'}`}
                                        >
                                            Crédito
                                        </button>
                                    </div>
                                </div>

                                {newPurchase.isCredit && (
                                    <div className="animate-fade-in">
                                        <label className="block text-xs font-bold text-orange-700 mb-1">Fecha Vencimiento Pago</label>
                                        <input
                                            type="date"
                                            required
                                            className="w-full border border-orange-200 rounded-lg p-2 bg-white text-sm"
                                            value={newPurchase.paymentDueDate || ''}
                                            onChange={e => setNewPurchase({ ...newPurchase, paymentDueDate: e.target.value })}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium">Guardar Compra</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* PAYMENT MODAL */}
            {isPaymentModalOpen && selectedPurchase && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
                        <div className="p-6 border-b border-slate-100 bg-slate-50 rounded-t-xl">
                            <h2 className="text-lg font-bold text-slate-800">Registrar Abono</h2>
                            <p className="text-xs text-slate-500 mt-1">Proveedor: {selectedPurchase.supplier}</p>
                        </div>
                        <form onSubmit={handleRegisterPayment} className="p-6 space-y-4">
                            <div className="bg-slate-100 p-3 rounded-lg text-center">
                                <p className="text-xs text-slate-500 uppercase">Saldo Pendiente</p>
                                <p className="text-xl font-bold text-red-600">Q{selectedPurchase.balance?.toLocaleString()}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Monto a Pagar (Q)</label>
                                <input
                                    required
                                    type="number"
                                    step="0.01"
                                    max={selectedPurchase.balance}
                                    className="w-full border border-slate-300 rounded-lg p-2 bg-white font-bold text-lg"
                                    value={paymentAmount}
                                    onChange={e => setPaymentAmount(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Referencia (Opcional)</label>
                                <input
                                    type="text"
                                    className="w-full border border-slate-300 rounded-lg p-2 bg-white text-sm"
                                    placeholder="No. Cheque / Transferencia"
                                    value={paymentRef}
                                    onChange={e => setPaymentRef(e.target.value)}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg text-sm">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold text-sm shadow-lg shadow-emerald-500/30">Confirmar Pago</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
