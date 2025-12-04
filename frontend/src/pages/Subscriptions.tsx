
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Subscription, User } from '../types';
import { Plus, Search, X, CreditCard, Calendar, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

export const Subscriptions: React.FC<{ user: User }> = ({ user }) => {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [newSub, setNewSub] = useState<Partial<Subscription>>({
      name: '',
      provider: '',
      amount: 0,
      paymentDate: new Date().toISOString().split('T')[0],
      frequency: 'Mensual',
      active: true
  });

  useEffect(() => {
      setSubs(db.getSubscriptions());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(!newSub.name || !newSub.amount) return;

      const sub: Subscription = {
          id: newSub.id || `sub${Date.now()}`,
          name: newSub.name,
          provider: newSub.provider || '',
          amount: Number(newSub.amount),
          paymentDate: newSub.paymentDate || new Date().toISOString(),
          frequency: newSub.frequency || 'Mensual',
          active: newSub.active ?? true
      };

      if (newSub.id) {
          db.updateSubscription(sub);
      } else {
          db.addSubscription(sub);
      }
      
      setSubs(db.getSubscriptions());
      setIsModalOpen(false);
      setNewSub({ name: '', provider: '', amount: 0, paymentDate: new Date().toISOString().split('T')[0], frequency: 'Mensual', active: true });
  };

  const handleEdit = (s: Subscription) => {
      setNewSub(s);
      setIsModalOpen(true);
  };

  const filteredSubs = subs.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.provider.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDaysUntilDue = (dateStr: string) => {
      const due = new Date(dateStr);
      const now = new Date();
      const diffTime = due.getTime() - now.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  };

  return (
      <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                  <h1 className="text-2xl font-bold text-slate-800">Pagos de Suscripciones</h1>
                  <p className="text-slate-500 text-sm">Gestión de pagos recurrentes y recordatorios.</p>
              </div>
              <div className="flex gap-3">
                  <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input 
                          className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                          placeholder="Buscar suscripción..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                      />
                  </div>
                  <button 
                      onClick={() => { setNewSub({ name: '', provider: '', amount: 0, paymentDate: new Date().toISOString().split('T')[0], frequency: 'Mensual', active: true }); setIsModalOpen(true); }}
                      className="flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"
                  >
                      <Plus className="w-4 h-4 mr-2" />
                      Nueva Suscripción
                  </button>
              </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Servicio</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Proveedor</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Frecuencia</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Próximo Pago</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Monto</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Estado</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {filteredSubs.map((s) => {
                          const days = getDaysUntilDue(s.paymentDate);
                          return (
                            <tr key={s.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => handleEdit(s)}>
                                <td className="px-6 py-4 font-medium text-slate-800">{s.name}</td>
                                <td className="px-6 py-4 text-sm text-slate-600">{s.provider}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1 text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-full w-fit">
                                        <RefreshCw size={12} /> {s.frequency}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-slate-400" />
                                        <span>{new Date(s.paymentDate).toLocaleDateString()}</span>
                                        {days <= 5 && days >= 0 && (
                                            <span className="text-xs text-red-500 font-bold flex items-center"><AlertCircle size={12} className="mr-1"/> Vence pronto</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right font-bold text-slate-800">Q{s.amount.toLocaleString()}</td>
                                <td className="px-6 py-4 text-right">
                                    {s.active ? (
                                        <span className="text-xs text-green-600 font-bold flex items-center justify-end gap-1"><CheckCircle size={12}/> Activo</span>
                                    ) : (
                                        <span className="text-xs text-slate-400 font-bold flex items-center justify-end gap-1">Inactivo</span>
                                    )}
                                </td>
                            </tr>
                          );
                      })}
                  </tbody>
              </table>
          </div>

          {/* Modal */}
          {isModalOpen && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                      <div className="p-6 border-b border-slate-100 flex justify-between">
                          <div className="flex items-center gap-2">
                              <CreditCard className="text-brand-600 w-5 h-5" />
                              <h2 className="text-xl font-bold text-slate-800">{newSub.id ? 'Editar Suscripción' : 'Nueva Suscripción'}</h2>
                          </div>
                          <button onClick={() => setIsModalOpen(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
                      </div>
                      <form onSubmit={handleSubmit} className="p-6 space-y-4">
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Servicio</label>
                              <input required type="text" className="w-full border border-slate-300 rounded-lg p-2 bg-white" value={newSub.name} onChange={e => setNewSub({...newSub, name: e.target.value})} />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Proveedor</label>
                              <input type="text" className="w-full border border-slate-300 rounded-lg p-2 bg-white" value={newSub.provider} onChange={e => setNewSub({...newSub, provider: e.target.value})} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-1">Monto (Q)</label>
                                  <input required type="number" step="0.01" className="w-full border border-slate-300 rounded-lg p-2 bg-white" value={newSub.amount} onChange={e => setNewSub({...newSub, amount: Number(e.target.value)})} />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-1">Frecuencia</label>
                                  <select className="w-full border border-slate-300 rounded-lg p-2 bg-white" value={newSub.frequency} onChange={e => setNewSub({...newSub, frequency: e.target.value as 'Mensual' | 'Anual'})}>
                                      <option value="Mensual">Mensual</option>
                                      <option value="Anual">Anual</option>
                                  </select>
                              </div>
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Próxima Fecha de Pago</label>
                              <input required type="date" className="w-full border border-slate-300 rounded-lg p-2 bg-white" value={newSub.paymentDate} onChange={e => setNewSub({...newSub, paymentDate: e.target.value})} />
                              <p className="text-xs text-slate-400 mt-1">Este pago aparecerá sincronizado en el calendario.</p>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                              <input type="checkbox" id="active" checked={newSub.active} onChange={e => setNewSub({...newSub, active: e.target.checked})} />
                              <label htmlFor="active" className="text-sm text-slate-700 cursor-pointer">Suscripción Activa</label>
                          </div>
                          
                          <div className="flex justify-end gap-3 pt-2">
                              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">Cancelar</button>
                              <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium">Guardar</button>
                          </div>
                      </form>
                  </div>
              </div>
          )}
      </div>
  );
};
