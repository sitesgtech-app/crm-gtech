
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Expense, User, Supplier, Project } from '../types';
import { Plus, Search, X, Receipt, Calendar, DollarSign, FileText, Truck, Briefcase, Upload, Download } from 'lucide-react';

export const Expenses: React.FC<{ user: User }> = ({ user }) => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [newExpense, setNewExpense] = useState<Partial<Expense>>({
        date: new Date().toISOString().split('T')[0],
        category: 'Oficina',
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
        setExpenses(db.getExpenses());
        setSuppliers(db.getSuppliers());
        setProjects(db.getProjects());
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newExpense.description || !newExpense.amount) return;

        const expense: Expense = {
            id: `exp${Date.now()}`,
            organizationId: user.organizationId || 'org1',
            date: newExpense.date || new Date().toISOString(),
            category: newExpense.category || 'Varios',
            supplier: newExpense.supplier || '',
            supplierId: newExpense.supplierId,
            description: newExpense.description,
            amount: Number(newExpense.amount),
            registeredBy: user.id,
            dte: newExpense.dte || '',
            projectId: newExpense.projectId,
            fileName: newExpense.fileName,
            fileUrl: newExpense.fileUrl
        };

        db.addExpense(expense);
        setExpenses(db.getExpenses());
        setIsModalOpen(false);
        setNewExpense({ date: new Date().toISOString().split('T')[0], category: 'Oficina', supplier: '', supplierId: '', description: '', amount: 0, dte: '', projectId: '', fileName: '', fileUrl: '' });
    };

    const handleSupplierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        const supplierObj = suppliers.find(s => s.id === id);
        if (supplierObj) {
            setNewExpense({ ...newExpense, supplier: supplierObj.name, supplierId: supplierObj.id });
        } else {
            setNewExpense({ ...newExpense, supplier: '', supplierId: '' });
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
                setNewExpense({
                    ...newExpense,
                    fileName: file.name,
                    fileUrl: reader.result as string
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const filteredExpenses = expenses.filter(e =>
        e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.supplier && e.supplier.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (e.dte && e.dte.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Gastos Operativos</h1>
                    <p className="text-slate-500 text-sm">Control de egresos y costos operativos.</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                            placeholder="Buscar gasto, DTE..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Registrar Gasto
                    </button>
                </div>
            </div>

            {/* KPI Box */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 inline-flex items-center gap-4">
                <div className="p-2 bg-red-50 rounded-lg text-red-600">
                    <DollarSign size={24} />
                </div>
                <div>
                    <p className="text-xs text-slate-500 font-bold uppercase">Total Gastos</p>
                    <p className="text-xl font-bold text-slate-800">Q{totalAmount.toLocaleString()}</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Fecha</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">DTE</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Proveedor</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Categoría</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Descripción</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Monto</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Archivo</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredExpenses.map((e) => (
                            <tr key={e.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 text-sm text-slate-600">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-slate-400" />
                                        {new Date(e.date).toLocaleDateString()}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                                    {e.dte || '-'}
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-800 font-medium flex items-center gap-1">
                                    {e.supplier ? <><Truck size={12} className="text-slate-400" /> {e.supplier}</> : '-'}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-full w-fit">{e.category}</span>
                                        {e.projectId && (
                                            <span className="text-[10px] text-brand-600 flex items-center gap-1"><Briefcase size={10} /> Proyecto</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">{e.description}</td>
                                <td className="px-6 py-4 text-right font-bold text-red-600">-Q{e.amount.toLocaleString()}</td>
                                <td className="px-6 py-4 text-right">
                                    {e.fileUrl ? (
                                        <a
                                            href={e.fileUrl}
                                            download={e.fileName || 'comprobante.pdf'}
                                            className="inline-block p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded transition-colors"
                                            title="Descargar Comprobante"
                                        >
                                            <Download size={16} />
                                        </a>
                                    ) : <span className="text-slate-300 text-xs">-</span>}
                                </td>
                            </tr>
                        ))}
                        {filteredExpenses.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-8 text-center text-slate-400">No se encontraron registros.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="p-6 border-b border-slate-100 flex justify-between">
                            <div className="flex items-center gap-2">
                                <Receipt className="text-red-600 w-5 h-5" />
                                <h2 className="text-xl font-bold text-slate-800">Registrar Gasto</h2>
                            </div>
                            <button onClick={() => setIsModalOpen(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
                                <input type="date" className="w-full border border-slate-300 rounded-lg p-2 bg-white" value={newExpense.date} onChange={e => setNewExpense({ ...newExpense, date: e.target.value })} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Número de DTE</label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <input type="text" className="w-full pl-9 border border-slate-300 rounded-lg p-2 bg-white" placeholder="No. de Factura / DTE" value={newExpense.dte} onChange={e => setNewExpense({ ...newExpense, dte: e.target.value })} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Proveedor</label>
                                {suppliers.length > 0 ? (
                                    <select
                                        className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                                        value={newExpense.supplierId}
                                        onChange={handleSupplierChange}
                                    >
                                        <option value="">Seleccionar Proveedor...</option>
                                        {suppliers.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="text-sm text-red-500">
                                        <input
                                            type="text"
                                            className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                                            placeholder="Nombre del proveedor"
                                            value={newExpense.supplier}
                                            onChange={e => setNewExpense({ ...newExpense, supplier: e.target.value })}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Project Link (Optional) */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Asignar a Proyecto (Opcional)</label>
                                <select
                                    className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                                    value={newExpense.projectId}
                                    onChange={e => setNewExpense({ ...newExpense, projectId: e.target.value })}
                                >
                                    <option value="">Ninguno / Gasto General</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
                                <select className="w-full border border-slate-300 rounded-lg p-2 bg-white" value={newExpense.category} onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}>
                                    <option value="Oficina">Oficina</option>
                                    <option value="Hospedaje">Hospedaje</option>
                                    <option value="Transporte">Transporte</option>
                                    <option value="Alimentos">Alimentos</option>
                                    <option value="Servicios Básicos">Servicios Básicos</option>
                                    <option value="Mantenimiento">Mantenimiento</option>
                                    <option value="Publicidad">Publicidad</option>
                                    <option value="Materiales Proyecto">Materiales Proyecto</option>
                                    <option value="Otros">Otros</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                                <input required type="text" className="w-full border border-slate-300 rounded-lg p-2 bg-white" placeholder="Detalle del gasto" value={newExpense.description} onChange={e => setNewExpense({ ...newExpense, description: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Monto (Q)</label>
                                <input required type="number" step="0.01" className="w-full border border-slate-300 rounded-lg p-2 bg-white" value={newExpense.amount} onChange={e => setNewExpense({ ...newExpense, amount: Number(e.target.value) })} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Adjuntar Factura</label>
                                <div className="flex items-center gap-2">
                                    <label className="flex items-center justify-center px-4 py-2 border border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 text-sm text-slate-600 w-full">
                                        <Upload size={16} className="mr-2" />
                                        {newExpense.fileName ? newExpense.fileName : 'Subir PDF o Imagen'}
                                        <input type="file" accept="application/pdf,image/*" className="hidden" onChange={handleFileUpload} />
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">Guardar Gasto</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
