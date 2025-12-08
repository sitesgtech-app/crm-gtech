
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Expense, User, Supplier, Project, UserRole, ProjectStatus } from '../types';
import { Plus, Search, X, Receipt, Calendar, FileText, Truck, Upload, Download, Briefcase, Hammer } from 'lucide-react';

export const ProjectSupplies: React.FC<{ user: User }> = ({ user }) => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [newSupply, setNewSupply] = useState<Partial<Expense>>({
        date: new Date().toISOString().split('T')[0],
        category: 'Materiales Proyecto',
        supplier: '',
        supplierId: '',
        description: '',
        amount: 0,
        dte: '',
        projectId: '',
        fileName: '',
        fileUrl: ''
    });

    useEffect(() => {
        refreshData();
    }, []);

    const refreshData = () => {
        setExpenses(db.getExpenses());
        setSuppliers(db.getSuppliers());
        setProjects(db.getProjects());
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSupply.description || !newSupply.amount || !newSupply.projectId) {
            alert("Debe seleccionar un proyecto y completar los campos obligatorios.");
            return;
        }

        const expense: Expense = {
            id: `exp${Date.now()}`,
            organizationId: user.organizationId || 'org1',
            date: newSupply.date || new Date().toISOString(),
            category: 'Materiales Proyecto', // Enforced category
            supplier: newSupply.supplier || '',
            supplierId: newSupply.supplierId,
            description: newSupply.description,
            amount: Number(newSupply.amount),
            registeredBy: user.id,
            dte: newSupply.dte || '',
            projectId: newSupply.projectId,
            fileName: newSupply.fileName,
            fileUrl: newSupply.fileUrl
        };

        db.addExpense(expense);
        refreshData();
        setIsModalOpen(false);
        setNewSupply({ date: new Date().toISOString().split('T')[0], category: 'Materiales Proyecto', supplier: '', supplierId: '', description: '', amount: 0, dte: '', projectId: '', fileName: '', fileUrl: '' });
    };

    const handleSupplierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        const supplierObj = suppliers.find(s => s.id === id);
        if (supplierObj) {
            setNewSupply({ ...newSupply, supplier: supplierObj.name, supplierId: supplierObj.id });
        } else {
            setNewSupply({ ...newSupply, supplier: '', supplierId: '' });
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
                setNewSupply({
                    ...newSupply,
                    fileName: file.name,
                    fileUrl: reader.result as string
                });
            };
            reader.readAsDataURL(file);
        }
    };

    // Filter only Project related expenses
    const filteredExpenses = expenses.filter(e =>
        (e.category === 'Materiales Proyecto' || e.projectId) &&
        (e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (e.supplier && e.supplier.toLowerCase().includes(searchTerm.toLowerCase())))
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const getProjectName = (id?: string) => projects.find(p => p.id === id)?.name || 'Proyecto Desconocido';

    // Only show projects that are REVIEWED or IN EXECUTION
    const approvedProjects = projects.filter(p => p.status === ProjectStatus.REVISADO || p.status === ProjectStatus.EN_EJECUCION);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 font-lato">Compra de Insumos para Proyectos</h1>
                    <p className="text-slate-500 text-sm">Registro específico de materiales cargados a proyectos.</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500 bg-white w-full md:w-64"
                            placeholder="Buscar insumo o proveedor..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium shadow-sm"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Registrar Insumo
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase font-lato">Fecha</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase font-lato">Proyecto Asignado</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase font-lato">Insumo / Descripción</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase font-lato">Proveedor</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase font-lato text-right">Monto</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase font-lato text-right">Comprobante</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredExpenses.map((e) => (
                            <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 text-sm text-slate-600">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-slate-400" />
                                        {new Date(e.date).toLocaleDateString()}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-sm font-bold text-brand-700 bg-brand-50 px-2 py-1 rounded-lg w-fit">
                                        <Briefcase size={14} />
                                        <span className="truncate max-w-[200px]">{getProjectName(e.projectId)}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-700 font-medium">
                                    {e.description}
                                    {e.dte && <span className="block text-xs text-slate-400 font-mono mt-0.5">DTE: {e.dte}</span>}
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">
                                    {e.supplier ? <span className="flex items-center gap-1"><Truck size={12} /> {e.supplier}</span> : '-'}
                                </td>
                                <td className="px-6 py-4 text-right font-bold text-slate-800">Q{e.amount.toLocaleString()}</td>
                                <td className="px-6 py-4 text-right">
                                    {e.fileUrl ? (
                                        <a
                                            href={e.fileUrl}
                                            download={e.fileName || 'comprobante.pdf'}
                                            className="inline-block p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded transition-colors"
                                            title="Descargar"
                                        >
                                            <Download size={16} />
                                        </a>
                                    ) : <span className="text-slate-300 text-xs">-</span>}
                                </td>
                            </tr>
                        ))}
                        {filteredExpenses.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                    <Hammer size={32} className="mx-auto mb-2 opacity-30" />
                                    <p>No hay compras de insumos registradas.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-white rounded-lg border border-slate-200">
                                    <Hammer className="text-brand-600 w-5 h-5" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-800 font-lato">Registrar Insumo</h2>
                            </div>
                            <button onClick={() => setIsModalOpen(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">

                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                <label className="block text-xs font-bold text-blue-800 mb-1.5 uppercase">Proyecto (Revisado / En Ejecución)</label>
                                {approvedProjects.length > 0 ? (
                                    <select
                                        required
                                        className="w-full border border-blue-200 rounded-lg p-2 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-200"
                                        value={newSupply.projectId}
                                        onChange={e => setNewSupply({ ...newSupply, projectId: e.target.value })}
                                    >
                                        <option value="">Seleccionar Proyecto...</option>
                                        {approvedProjects.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <p className="text-sm text-red-500">No hay proyectos aprobados para compras.</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
                                    <input type="date" className="w-full border border-slate-300 rounded-lg p-2 bg-white text-sm" value={newSupply.date} onChange={e => setNewSupply({ ...newSupply, date: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Número DTE</label>
                                    <input type="text" className="w-full border border-slate-300 rounded-lg p-2 bg-white text-sm" placeholder="Factura..." value={newSupply.dte} onChange={e => setNewSupply({ ...newSupply, dte: e.target.value })} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Proveedor</label>
                                {suppliers.length > 0 ? (
                                    <select
                                        className="w-full border border-slate-300 rounded-lg p-2 bg-white text-sm"
                                        value={newSupply.supplierId}
                                        onChange={handleSupplierChange}
                                    >
                                        <option value="">Seleccionar Proveedor...</option>
                                        {suppliers.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        className="w-full border border-slate-300 rounded-lg p-2 bg-white text-sm"
                                        placeholder="Nombre proveedor..."
                                        value={newSupply.supplier}
                                        onChange={e => setNewSupply({ ...newSupply, supplier: e.target.value })}
                                    />
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción del Insumo</label>
                                <input required type="text" className="w-full border border-slate-300 rounded-lg p-2 bg-white text-sm" placeholder="Ej. 100mts Cable UTP" value={newSupply.description} onChange={e => setNewSupply({ ...newSupply, description: e.target.value })} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Monto Total (Q)</label>
                                <input required type="number" step="0.01" className="w-full border border-slate-300 rounded-lg p-2 bg-white font-bold" value={newSupply.amount} onChange={e => setNewSupply({ ...newSupply, amount: Number(e.target.value) })} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Comprobante (Opcional)</label>
                                <label className="flex items-center justify-center px-4 py-2 border border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 text-xs font-bold text-slate-500 w-full">
                                    <Upload size={14} className="mr-2" />
                                    {newSupply.fileName ? newSupply.fileName : 'Subir PDF / Foto'}
                                    <input type="file" accept="application/pdf,image/*" className="hidden" onChange={handleFileUpload} />
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-medium">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-bold text-sm shadow-lg shadow-brand-500/30">Guardar Compra</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
