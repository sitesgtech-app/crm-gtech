
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Service, User } from '../types';
import { Plus, Search, Edit, Briefcase, Save, X } from 'lucide-react';

export const Services: React.FC<{ user: User }> = ({ user }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [currentService, setCurrentService] = useState<Partial<Service>>({
    name: '', description: '', minProfit: 0, active: true
  });

  useEffect(() => {
    setServices(db.getServices());
  }, []);

  const filteredServices = services.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (service: Service) => {
    setCurrentService(service);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentService.name) return;

    const service: Service = {
      id: currentService.id || `s${Date.now()}`,
      organizationId: user.organizationId || 'org1',
      name: currentService.name,
      description: currentService.description || '',
      minProfit: Number(currentService.minProfit),
      active: currentService.active !== undefined ? currentService.active : true
    };

    db.saveService(service);
    setServices(db.getServices());
    setIsModalOpen(false);
    setCurrentService({ name: '', description: '', minProfit: 0, active: true });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Catálogo de Servicios</h1>
          <p className="text-slate-500 text-sm">Administra los servicios ofrecidos.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              placeholder="Buscar servicio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => { setCurrentService({ name: '', description: '', minProfit: 0, active: true }); setIsModalOpen(true); }}
            className="flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Servicio
          </button>
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Nombre Servicio</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Descripción</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Ganancia Mínima (Q)</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredServices.map((service) => (
              <tr key={service.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
                      <Briefcase size={16} />
                    </div>
                    <p className="font-medium text-slate-900">{service.name}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {service.description}
                </td>
                <td className="px-6 py-4 font-medium text-slate-800">
                  Q{service.minProfit.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleEdit(service)} className="text-slate-400 hover:text-brand-600 transition-colors">
                    <Edit size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-slate-100 flex justify-between">
              <h2 className="text-xl font-bold text-slate-800">{currentService.id ? 'Editar Servicio' : 'Nuevo Servicio'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Servicio</label>
                <input required type="text" className="w-full border border-slate-300 rounded-lg p-2 bg-white" value={currentService.name} onChange={e => setCurrentService({ ...currentService, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                <textarea className="w-full border border-slate-300 rounded-lg p-2 h-20 bg-white" value={currentService.description} onChange={e => setCurrentService({ ...currentService, description: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ganancia Mínima (Q)</label>
                <input required type="number" className="w-full border border-slate-300 rounded-lg p-2 bg-white" value={currentService.minProfit} onChange={e => setCurrentService({ ...currentService, minProfit: Number(e.target.value) })} />
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
