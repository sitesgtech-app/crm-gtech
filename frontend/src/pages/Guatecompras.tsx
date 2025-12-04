
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { User, GuatecomprasEvent } from '../types';
import { Plus, Search, X, Award, Building, User as UserIcon, Phone, Mail, Hash, DollarSign } from 'lucide-react';

interface GuatecomprasProps {
  user: User;
}

export const Guatecompras: React.FC<GuatecomprasProps> = ({ user }) => {
  const [events, setEvents] = useState<GuatecomprasEvent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [newEvent, setNewEvent] = useState<Partial<GuatecomprasEvent>>({
    nog: '',
    awardedAmount: 0,
    profit: 0,
    purchasingEntity: '',
    contactName: '',
    contactEmail: '',
    contactPhone: ''
  });

  useEffect(() => {
    setEvents(db.getGuatecomprasEvents());
  }, []);

  const filteredEvents = events.filter(e => 
    e.nog.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.purchasingEntity.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.nog || !newEvent.purchasingEntity) return;

    const event: GuatecomprasEvent = {
      id: `gc${Date.now()}`,
      nog: newEvent.nog,
      awardedAmount: Number(newEvent.awardedAmount),
      profit: Number(newEvent.profit),
      purchasingEntity: newEvent.purchasingEntity,
      contactName: newEvent.contactName || '',
      contactEmail: newEvent.contactEmail || '',
      contactPhone: newEvent.contactPhone || '',
      createdAt: new Date().toISOString(),
      createdBy: user.id
    };

    db.addGuatecomprasEvent(event);
    setEvents(db.getGuatecomprasEvents());
    setIsModalOpen(false);
    setNewEvent({ nog: '', awardedAmount: 0, profit: 0, purchasingEntity: '', contactName: '', contactEmail: '', contactPhone: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-800">Eventos Ganados en Guatecompras</h1>
            <p className="text-slate-500 text-sm">Registro histórico de adjudicaciones del estado.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
             <input 
               className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500 bg-white"
               placeholder="Buscar NOG o Entidad..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Crear Nuevo Evento
          </button>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">NOG</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Entidad Compradora</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Monto Adjudicado</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Ganancia Estimada</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Contacto</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Datos Contacto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEvents.map((event) => (
                <tr key={event.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 font-mono text-sm font-bold text-slate-700">
                        <Hash size={14} className="text-slate-400"/> {event.nog}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-2">
                        <Building size={16} className="text-slate-400"/>
                        <span className="font-medium text-slate-800">{event.purchasingEntity}</span>
                     </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-700">
                     Q{event.awardedAmount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-green-600">
                     Q{event.profit.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                     {event.contactName ? (
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                           <UserIcon size={14} className="text-slate-400"/> {event.contactName}
                        </div>
                     ) : <span className="text-slate-400 text-xs">No registrado</span>}
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex flex-col gap-1 text-xs text-slate-600">
                        {event.contactEmail && <span className="flex items-center gap-1"><Mail size={10}/> {event.contactEmail}</span>}
                        {event.contactPhone && <span className="flex items-center gap-1"><Phone size={10}/> {event.contactPhone}</span>}
                     </div>
                  </td>
                </tr>
              ))}
              {filteredEvents.length === 0 && (
                  <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                          No se encontraron eventos.
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                 <Award className="text-brand-600 w-6 h-6" />
                 <h2 className="text-xl font-bold text-slate-800">Registrar Adjudicación</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                        <Hash size={16}/> Datos del Evento
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">NOG (Número de Operación)</label>
                            <input required type="text" className="w-full border border-slate-300 rounded-lg p-2 bg-white" placeholder="Ej. 12345678" value={newEvent.nog} onChange={e => setNewEvent({...newEvent, nog: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Entidad Compradora</label>
                            <input required type="text" className="w-full border border-slate-300 rounded-lg p-2 bg-white" placeholder="Ej. Ministerio de Salud" value={newEvent.purchasingEntity} onChange={e => setNewEvent({...newEvent, purchasingEntity: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Monto Adjudicado (Q)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 font-bold text-xs">Q</span>
                                <input required type="number" step="0.01" className="w-full pl-8 border border-slate-300 rounded-lg p-2 bg-white" value={newEvent.awardedAmount} onChange={e => setNewEvent({...newEvent, awardedAmount: Number(e.target.value)})} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Ganancia Estimada (Q)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 font-bold text-xs">Q</span>
                                <input required type="number" step="0.01" className="w-full pl-8 border border-slate-300 rounded-lg p-2 bg-white" value={newEvent.profit} onChange={e => setNewEvent({...newEvent, profit: Number(e.target.value)})} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <h3 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
                        <UserIcon size={16}/> Datos de Contacto (Encargado de Compras)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <div className="md:col-span-3">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                            <input type="text" className="w-full border border-blue-200 rounded-lg p-2 bg-white" value={newEvent.contactName} onChange={e => setNewEvent({...newEvent, contactName: e.target.value})} />
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                            <input type="text" className="w-full border border-blue-200 rounded-lg p-2 bg-white" value={newEvent.contactPhone} onChange={e => setNewEvent({...newEvent, contactPhone: e.target.value})} />
                         </div>
                         <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
                            <input type="email" className="w-full border border-blue-200 rounded-lg p-2 bg-white" value={newEvent.contactEmail} onChange={e => setNewEvent({...newEvent, contactEmail: e.target.value})} />
                         </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">Cancelar</button>
                    <button type="submit" className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium shadow-sm">Registrar Adjudicación</button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
