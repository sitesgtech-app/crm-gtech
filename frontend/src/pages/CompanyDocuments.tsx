
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { CompanyDocument, User, UserRole } from '../types';
import { Search, Upload, FileText, Trash2, Download, Folder, Shield, Book, FileCheck, AlertCircle } from 'lucide-react';

interface CompanyDocumentsProps {
    user: User;
}

export const CompanyDocuments: React.FC<CompanyDocumentsProps> = ({ user }) => {
    const [documents, setDocuments] = useState<CompanyDocument[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todos');

    // Form State (Admin Only)
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [newDoc, setNewDoc] = useState<Partial<CompanyDocument>>({
        title: '',
        category: 'Políticas',
        fileName: '',
        fileUrl: ''
    });

    useEffect(() => {
        setDocuments(db.getDocuments());
    }, []);

    const filteredDocs = documents.filter(doc => {
        const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.fileName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'Todos' || doc.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // 3MB Limit Check
            if (file.size > 3000000) {
                alert('El archivo es demasiado grande. Máximo 3MB.');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewDoc({
                    ...newDoc,
                    fileName: file.name,
                    fileUrl: reader.result as string
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDoc.title || !newDoc.fileUrl) return;

        const doc: CompanyDocument = {
            id: `doc-${Date.now()}`,
            organizationId: user.organizationId || 'org1',
            title: newDoc.title,
            category: newDoc.category as any,
            fileName: newDoc.fileName || 'documento',
            fileUrl: newDoc.fileUrl || '',
            uploadDate: new Date().toISOString(),
            uploadedBy: user.name
        };

        db.addDocument(doc);
        setDocuments(db.getDocuments());
        setNewDoc({ title: '', category: 'Políticas', fileName: '', fileUrl: '' });
        setIsUploadOpen(false);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('¿Está seguro de eliminar este documento permanentemente?')) {
            db.deleteDocument(id);
            setDocuments(db.getDocuments());
        }
    };

    const getCategoryIcon = (cat: string) => {
        switch (cat) {
            case 'Legal': return <Shield size={20} className="text-slate-600" />;
            case 'Políticas': return <Book size={20} className="text-brand-600" />;
            case 'RRHH': return <FileCheck size={20} className="text-green-600" />;
            default: return <FileText size={20} className="text-blue-400" />;
        }
    };

    const getCategoryColor = (cat: string) => {
        switch (cat) {
            case 'Legal': return 'bg-slate-100 text-slate-700 border-slate-200';
            case 'Políticas': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'RRHH': return 'bg-green-50 text-green-700 border-green-100';
            default: return 'bg-gray-50 text-gray-600 border-gray-200';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Documentos Corporativos</h1>
                    <p className="text-slate-500 text-sm">Repositorio central de políticas, formatos y documentos legales.</p>
                </div>

                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500 bg-white w-full md:w-64"
                            placeholder="Buscar documento..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {user.role === UserRole.ADMIN && (
                        <button
                            onClick={() => setIsUploadOpen(!isUploadOpen)}
                            className={`flex items-center px-4 py-2 rounded-lg transition-colors text-sm font-medium ${isUploadOpen ? 'bg-slate-200 text-slate-700' : 'bg-brand-600 text-white hover:bg-brand-700'}`}
                        >
                            {isUploadOpen ? <span className="flex items-center gap-2"><AlertCircle size={16} /> Cancelar</span> : <span className="flex items-center gap-2"><Upload size={16} /> Cargar Documento</span>}
                        </button>
                    )}
                </div>
            </div>

            {/* CATEGORY TABS */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {['Todos', 'Políticas', 'Legal', 'RRHH', 'Fiscal', 'Otro'].map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${selectedCategory === cat
                                ? 'bg-slate-800 text-white border-slate-800'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* ADMIN UPLOAD AREA */}
            {isUploadOpen && user.role === UserRole.ADMIN && (
                <div className="bg-brand-50 border border-brand-100 rounded-xl p-6 animate-fade-in">
                    <h3 className="font-bold text-brand-800 mb-4 flex items-center gap-2">
                        <Upload size={18} /> Subir Nuevo Documento
                    </h3>
                    <form onSubmit={handleSave} className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <label className="block text-xs font-bold text-brand-700 mb-1">Título del Documento</label>
                            <input
                                required
                                type="text"
                                className="w-full border border-brand-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                                placeholder="Ej. Política de Vacaciones 2024"
                                value={newDoc.title}
                                onChange={e => setNewDoc({ ...newDoc, title: e.target.value })}
                            />
                        </div>
                        <div className="w-full md:w-48">
                            <label className="block text-xs font-bold text-brand-700 mb-1">Categoría</label>
                            <select
                                className="w-full border border-brand-200 rounded-lg p-2 text-sm bg-white outline-none"
                                value={newDoc.category}
                                onChange={e => setNewDoc({ ...newDoc, category: e.target.value as any })}
                            >
                                <option value="Políticas">Políticas</option>
                                <option value="Legal">Legal</option>
                                <option value="RRHH">RRHH</option>
                                <option value="Fiscal">Fiscal</option>
                                <option value="Otro">Otro</option>
                            </select>
                        </div>
                        <div className="flex-1 w-full">
                            <label className="block text-xs font-bold text-brand-700 mb-1">Archivo (PDF/Imagen)</label>
                            <input
                                required
                                type="file"
                                accept="application/pdf,image/*"
                                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-white file:text-brand-700 hover:file:bg-brand-100"
                                onChange={handleFileUpload}
                            />
                        </div>
                        <button type="submit" className="bg-brand-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-brand-700 w-full md:w-auto">
                            Guardar
                        </button>
                    </form>
                </div>
            )}

            {/* DOCUMENTS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredDocs.map(doc => (
                    <div key={doc.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-all group relative flex flex-col h-full">
                        <div className="flex justify-between items-start mb-3">
                            <div className={`p-2.5 rounded-lg ${getCategoryColor(doc.category)}`}>
                                {getCategoryIcon(doc.category)}
                            </div>
                            {user.role === UserRole.ADMIN && (
                                <button
                                    onClick={() => handleDelete(doc.id)}
                                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                    title="Eliminar (Solo Admin)"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>

                        <div className="flex-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border mb-2 inline-block ${getCategoryColor(doc.category)}`}>
                                {doc.category}
                            </span>
                            <h3 className="font-bold text-slate-800 text-sm leading-tight mb-1 line-clamp-2" title={doc.title}>
                                {doc.title}
                            </h3>
                            <p className="text-xs text-slate-400">
                                Subido: {new Date(doc.uploadDate).toLocaleDateString()}
                            </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                            <div className="flex items-center gap-1 text-xs text-slate-400 truncate max-w-[120px]">
                                <FileText size={12} />
                                <span className="truncate" title={doc.fileName}>{doc.fileName}</span>
                            </div>
                            <a
                                href={doc.fileUrl}
                                download={doc.fileName}
                                className="flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-800 bg-brand-50 px-2 py-1 rounded hover:bg-brand-100 transition-colors"
                            >
                                <Download size={12} /> Descargar
                            </a>
                        </div>
                    </div>
                ))}
            </div>

            {filteredDocs.length === 0 && (
                <div className="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400">
                    <Folder size={48} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No se encontraron documentos.</p>
                    {user.role === UserRole.ADMIN && <p className="text-xs mt-1">Utiliza el botón "Cargar Documento" para agregar uno.</p>}
                </div>
            )}
        </div>
    );
};
