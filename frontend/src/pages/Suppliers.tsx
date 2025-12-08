
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Supplier, User } from '../types';
import { Plus, Search, Edit, Truck, Save, X, Phone, Mail, MapPin, UserCircle } from 'lucide-react';

export const Suppliers: React.FC<{ user: User }> = ({ user }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [currentSupplier, setCurrentSupplier] = useState<Partial<Supplier>>({
    name: '', contactName: '', phone: '', email: '', address: ''
  });

  useEffect(() => {
    setSuppliers(db.getSuppliers());
  }, []);

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.contactName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (supplier: Supplier) => {
    setCurrentSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSupplier.name) return;

    const supplier: Supplier = {
      id: currentSupplier.id || `sup${Date.now()}`,
      organizationId: user.organizationId || 'org1',
      name: currentSupplier.name,
      contactName: currentSupplier.contactName || '',
      phone: currentSupplier.phone || '',
      email: currentSupplier.email || '',
      address: currentSupplier.address || '',
      createdAt: currentSupplier.createdAt || new Date().toISOString()
    };

    db.saveSupplier(supplier);
    setSuppliers(db.getSuppliers());
    setIsModalOpen(false);
    setCurrentSupplier({ name: '', contactName: '', phone: '', email: '', address: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Directorio de Proveedores</h1>
          <p className="text-slate-500 text-sm">Gestión de empresas proveedoras y contactos.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              placeholder="Buscar proveedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => { setCurrentSupplier({ name: '', contactName: '', phone: '', email: '', address: '' }); setIsModalOpen(true); }}
            className="flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Proveedor
          </button>
        </div>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSuppliers.map((supplier) => (
          <div key={supplier.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
                  <Truck size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{supplier.name}</h3>
                  <p className="text-xs text-slate-500">Proveedor</p>
                </div>
              </div>
              <button onClick={() => handleEdit(supplier)} className="text-slate-300 hover:text-brand-600">
                <Edit size={16} />
              </button>
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-3">
              <div className="flex items-center text-sm text-slate-700 gap-2">
                <UserCircle size={14} className="text-slate-400" />
                <span className="font-medium">{supplier.contactName || 'Sin contacto'}</span>
              </div>
              <div className="flex items-center text-sm text-slate-600 gap-2">
                <Phone size={14} className="text-slate-400" /> {supplier.phone || '---'}
              </div>
              <div className="flex items-center text-sm text-slate-600 gap-2">
                <Mail size={14} className="text-slate-400" /> {supplier.email || '---'}
              </div>
              {supplier.address && (
                <div className="flex items-center text-sm text-slate-600 gap-2">
                  <MapPin size={14} className="text-slate-400" /> {supplier.address}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-slate-100 flex justify-between">
              <h2 className="text-xl font-bold text-slate-800">{currentSupplier.id ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Empresa Proveedora *</label>
                <input required type="text" className="w-full border border-slate-300 rounded-lg p-2 bg-white" value={currentSupplier.name} onChange={e => setCurrentSupplier({ ...currentSupplier, name: e.target.value })} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Asesor Asignado (Contacto) *</label>
                <input required type="text" className="w-full border border-slate-300 rounded-lg p-2 bg-white" placeholder="Nombre del vendedor/asesor" value={currentSupplier.contactName} onChange={e => setCurrentSupplier({ ...currentSupplier, contactName: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                  <input type="text" className="w-full border border-slate-300 rounded-lg p-2 bg-white" value={currentSupplier.phone} onChange={e => setCurrentSupplier({ ...currentSupplier, phone: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Correo</label>
                  <input type="email" className="w-full border border-slate-300 rounded-lg p-2 bg-white" value={currentSupplier.email} onChange={e => setCurrentSupplier({ ...currentSupplier, email: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
                <input type="text" className="w-full border border-slate-300 rounded-lg p-2 bg-white" value={currentSupplier.address} onChange={e => setCurrentSupplier({ ...currentSupplier, address: e.target.value })} />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 flex items-center gap-2">
                  <Save size={16} /> Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
