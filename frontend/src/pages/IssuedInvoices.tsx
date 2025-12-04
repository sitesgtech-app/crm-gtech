
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { IssuedInvoice, User, Client } from '../types';
import { Search, Upload, FileText, Trash2, Download, Eye, Filter, CheckCircle, XCircle, FileCheck, Plus } from 'lucide-react';

interface IssuedInvoicesProps {
  user: User;
}

export const IssuedInvoices: React.FC<IssuedInvoicesProps> = ({ user }) => {
  const [invoices, setInvoices] = useState<IssuedInvoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [newInvoice, setNewInvoice] = useState<Partial<IssuedInvoice>>({
      number: '',
      date: new Date().toISOString().split('T')[0],
      clientId: '',
      amount: 0,
      status: 'Pagada',
      fileUrl: '',
      fileName: ''
  });

  useEffect(() => {
    setInvoices(db.getIssuedInvoices());
    setClients(db.getClients(undefined, user.role)); // Admin sees all, seller sees theirs
  }, [user]);

  const filteredInvoices = invoices.filter(inv => {
      const matchesSearch = 
        inv.number.toLowerCase().includes(searchTerm.toLowerCase()) || 
        inv.clientName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          if (file.size > 3000000) {
              alert('El archivo es demasiado grande. Máximo 3MB.');
              return;
          }
          const reader = new FileReader();
          reader.onloadend = () => {
              setNewInvoice({ 
                  ...newInvoice, 
                  fileName: file.name,
                  fileUrl: reader.result as string 
              });
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSave = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newInvoice.number || !newInvoice.clientId || !newInvoice.amount || !newInvoice.fileUrl) {
          alert("Por favor complete todos los campos y suba el documento.");
          return;
      }

      const client = clients.find(c => c.id === newInvoice.clientId);

      const inv: IssuedInvoice = {
          id: `inv-${Date.now()}`,
          number: newInvoice.number,
          date: newInvoice.date || new Date().toISOString(),
          clientId: newInvoice.clientId,
          clientName: client ? client.name : 'Cliente Desconocido',
          amount: Number(newInvoice.amount),
          status: newInvoice.status as any,
          fileName: newInvoice.fileName || 'Factura.pdf',
          fileUrl: newInvoice.fileUrl
      };

      db.addIssuedInvoice(inv);
      setInvoices(db.getIssuedInvoices());
      setNewInvoice({ number: '', date: new Date().toISOString().split('T')[0], clientId: '', amount: 0, status: 'Pagada', fileUrl: '', fileName: '' });
      setIsUploadOpen(false);
  };

  const handleDelete = (id: string) => {
      if (window.confirm('¿Eliminar este registro de factura?')) {
          db.deleteIssuedInvoice(id);
          setInvoices(db.getIssuedInvoices());
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 font-lato">Facturas Emitidas</h1>
          <p className="text-slate-500 text-sm">Repositorio de documentos tributarios (FEL) para contabilidad.</p>
        </div>
        
        <div className="flex gap-3">
             <div className="relative">
                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                 <input 
                   className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500 bg-white w-full md:w-64"
                   placeholder="Buscar factura o cliente..."
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                 />
             </div>
             <button 
                onClick={() => setIsUploadOpen(true)}
                className="flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium shadow-sm"
             >
                <Plus size={16} className="mr-2"/> Cargar Factura
             </button>
        </div>
      </div>

      {/* UPLOAD MODAL */}
      {isUploadOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all scale-100">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
                      <h2 className="text-xl font-bold text-slate-800 font-lato flex items-center gap-2">
                          <Upload size={20} className="text-brand-600"/> Registrar Factura Emitida
                      </h2>
                      <button onClick={() => setIsUploadOpen(false)} className="text-slate-400 hover:text-slate-600"><XCircle size={24}/></button>
                  </div>
                  
                  <form onSubmit={handleSave} className="p-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-slate-600 mb-1 font-lato">Número de DTE/Factura</label>
                              <input 
                                required
                                type="text" 
                                className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                                placeholder="Serie-Numero"
                                value={newInvoice.number}
                                onChange={e => setNewInvoice({...newInvoice, number: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-600 mb-1 font-lato">Fecha Emisión</label>
                              <input 
                                required
                                type="date" 
                                className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                                value={newInvoice.date}
                                onChange={e => setNewInvoice({...newInvoice, date: e.target.value})}
                              />
                          </div>
                      </div>

                      <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1 font-lato">Cliente</label>
                          <select 
                            required
                            className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                            value={newInvoice.clientId}
                            onChange={e => setNewInvoice({...newInvoice, clientId: e.target.value})}
                          >
                              <option value="">Seleccionar Cliente...</option>
                              {clients.map(c => <option key={c.id} value={c.id}>{c.name} - {c.company}</option>)}
                          </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-slate-600 mb-1 font-lato">Monto Total (Q)</label>
                              <input 
                                required
                                type="number" 
                                step="0.01"
                                className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white font-bold text-slate-800"
                                value={newInvoice.amount}
                                onChange={e => setNewInvoice({...newInvoice, amount: Number(e.target.value)})}
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-600 mb-1 font-lato">Estado Pago</label>
                              <select 
                                className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white"
                                value={newInvoice.status}
                                onChange={e => setNewInvoice({...newInvoice, status: e.target.value as any})}
                              >
                                  <option value="Pagada">Pagada</option>
                                  <option value="Pendiente">Pendiente</option>
                                  <option value="Anulada">Anulada</option>
                              </select>
                          </div>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300 text-center">
                          <label className="cursor-pointer block">
                              <span className="block text-xs font-bold text-slate-500 mb-2">Archivo PDF o Imagen</span>
                              <div className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-brand-600 hover:bg-brand-50 transition-colors font-bold shadow-sm w-fit mx-auto">
                                  <Upload size={16} /> Seleccionar Archivo
                              </div>
                              <input type="file" accept="application/pdf,image/*" className="hidden" onChange={handleFileUpload} />
                          </label>
                          {newInvoice.fileName && (
                              <p className="text-xs text-emerald-600 mt-2 font-medium flex items-center justify-center gap-1">
                                  <FileCheck size={12}/> {newInvoice.fileName}
                              </p>
                          )}
                      </div>

                      <div className="pt-2 flex justify-end">
                          <button type="submit" className="bg-brand-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/30">
                              Guardar Factura
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* INVOICES GRID */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase font-lato">Fecha / No.</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase font-lato">Cliente</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase font-lato">Monto</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase font-lato">Estado</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase font-lato">Archivo</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase font-lato text-right">Acciones</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                              <div className="flex flex-col">
                                  <span className="font-bold text-slate-800 text-sm">{inv.number}</span>
                                  <span className="text-xs text-slate-500">{new Date(inv.date).toLocaleDateString()}</span>
                              </div>
                          </td>
                          <td className="px-6 py-4">
                              <div className="font-medium text-slate-800 text-sm">{inv.clientName}</div>
                          </td>
                          <td className="px-6 py-4">
                              <span className="font-bold text-slate-800 text-sm">Q{inv.amount.toLocaleString()}</span>
                          </td>
                          <td className="px-6 py-4">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${
                                  inv.status === 'Pagada' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                  inv.status === 'Anulada' ? 'bg-red-50 text-red-700 border-red-200' :
                                  'bg-orange-50 text-orange-700 border-orange-200'
                              }`}>
                                  {inv.status}
                              </span>
                          </td>
                          <td className="px-6 py-4">
                              <div className="flex items-center gap-1 text-xs text-slate-500 max-w-[150px] truncate" title={inv.fileName}>
                                  <FileText size={14} className="text-slate-400 flex-shrink-0"/> 
                                  <span className="truncate">{inv.fileName}</span>
                              </div>
                          </td>
                          <td className="px-6 py-4 text-right flex justify-end gap-2">
                              <a 
                                href={inv.fileUrl} 
                                download={inv.fileName}
                                className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-full transition-colors"
                                title="Descargar"
                              >
                                  <Download size={16}/>
                              </a>
                              <button 
                                onClick={() => handleDelete(inv.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                title="Eliminar"
                              >
                                  <Trash2 size={16}/>
                              </button>
                          </td>
                      </tr>
                  ))}
                  {filteredInvoices.length === 0 && (
                      <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                              <FileCheck size={48} className="mx-auto mb-2 opacity-20"/>
                              <p>No se encontraron facturas registradas.</p>
                          </td>
                      </tr>
                  )}
              </tbody>
          </table>
      </div>
    </div>
  );
};
