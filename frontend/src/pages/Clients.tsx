import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/db';
import api from '../services/api';
import { Client, User, OpportunityStage, UserRole } from '../types';
import { Plus, Search, Phone, Mail, Building, Hash, User as UserIcon, Download, Filter, ShoppingBag, Tag, UserCircle, X } from 'lucide-react';

export const Clients: React.FC<{ user: User }> = ({ user }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [purchaseCounts, setPurchaseCounts] = useState<Record<string, number>>({});

  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState<'Todos' | 'Privado' | 'Gubernamental'>('Todos');
  const [advisorFilter, setAdvisorFilter] = useState('Todos');
  const [tagFilter, setTagFilter] = useState('Todas');

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [newClient, setNewClient] = useState<Partial<Client>>({
    name: '', company: '', email: '', phone: '', address: '', nit: '', companyPhone: '', extension: '', sector: 'Privado', tags: []
  });

  // Tag Input State for Modal
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    refreshData();
  }, [user]);

  const refreshData = async () => {
    try {
      const [clientsRes, usersRes] = await Promise.all([
        api.get('/clients'),
        api.get('/users')
      ]);
      setClients(clientsRes.data);
      setUsers(usersRes.data);

      const allOpps = db.getOpportunities(undefined, UserRole.ADMIN);
      const counts: Record<string, number> = {};

      allOpps.forEach(o => {
        if (o.stage === OpportunityStage.GANADA) {
          counts[o.clientId] = (counts[o.clientId] || 0) + 1;
        }
      });
      setPurchaseCounts(counts);
    } catch (error) {
      console.error("Failed to fetch data", error);
    }
  };

  // Extract all unique tags for the filter dropdown
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    clients.forEach(c => {
      if (c.tags) c.tags.forEach(t => tags.add(t));
    });
    return Array.from(tags).sort();
  }, [clients]);

  const filteredClients = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = sectorFilter === 'Todos' || c.sector === sectorFilter;

    // Advisor Filter Logic (Check assignedAdvisor OR responsibleId)
    const matchesAdvisor = advisorFilter === 'Todos' ||
      c.assignedAdvisor === advisorFilter ||
      c.responsibleId === advisorFilter;

    // Tag Filter Logic
    const matchesTag = tagFilter === 'Todas' || (c.tags && c.tags.includes(tagFilter));

    return matchesSearch && matchesSector && matchesAdvisor && matchesTag;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.name || !newClient.company) return;

    return;
  }

  if (newClient.companyPhone && !validatePhone(newClient.companyPhone)) {
    alert("El teléfono empresarial no es válido. Debe contener al menos 8 dígitos numéricos.");
    return;
  }

  const client: Client = {
    id: newClient.id || `c${Date.now()}`,
    organizationId: user.organizationId || 'org1',
    name: newClient.name || '',
    company: newClient.company || '',
    email: newClient.email || '',
    phone: newClient.phone || '',
    address: newClient.address || '',
    nit: newClient.nit || '',
    companyPhone: newClient.companyPhone || '',
    extension: newClient.extension || '',
    createdAt: newClient.createdAt || new Date().toISOString(),
    tags: newClient.tags || ['Nuevo'],
    responsibleId: newClient.responsibleId || user.id,
    assignedAdvisor: newClient.assignedAdvisor || user.id,
    sector: newClient.sector || 'Privado'
  };

  if (newClient.id) {
    // Update not implemented in backend yet for this demo
    alert("Update not fully implemented in API yet");
  } else {
    api.post('/clients', client).then(() => {
      refreshData();
      setIsModalOpen(false);
      setNewClient({ name: '', company: '', email: '', phone: '', address: '', nit: '', companyPhone: '', extension: '', sector: 'Privado', tags: [] });
    }).catch((err: any) => {
      const msg = err.response?.data?.error || err.message || "Error creating client";
      alert(`Error: ${msg}`);
    });
  }

  refreshData();
  setIsModalOpen(false);
  setNewClient({ name: '', company: '', email: '', phone: '', address: '', nit: '', companyPhone: '', extension: '', sector: 'Privado', tags: [] });
};

const handleEdit = (client: Client) => {
  setNewClient(client);
  setIsModalOpen(true);
};

const addTag = () => {
  if (tagInput.trim() && newClient.tags) {
    if (!newClient.tags.includes(tagInput.trim())) {
      setNewClient({ ...newClient, tags: [...newClient.tags, tagInput.trim()] });
    }
    setTagInput('');
  } else if (tagInput.trim()) {
    setNewClient({ ...newClient, tags: [tagInput.trim()] });
    setTagInput('');
  }
};

const removeTag = (tagToRemove: string) => {
  if (newClient.tags) {
    setNewClient({ ...newClient, tags: newClient.tags.filter(t => t !== tagToRemove) });
  }
};

const handleExportCSV = () => {
  const headers = ['Nombre Cliente', 'Empresa', 'Sector', 'Etiquetas', 'Compras Realizadas', 'NIT', 'Correo', 'Teléfono', 'Tel. Empresa', 'Ext', 'Dirección', 'Asesor Asignado'];

  const rows = filteredClients.map(client => [
    `"${client.name}"`,
    `"${client.company}"`,
    `"${client.sector || 'Privado'}"`,
    `"${(client.tags || []).join(', ')}"`,
    `"${purchaseCounts[client.id] || 0}"`,
    `"${client.nit || ''}"`,
    `"${client.email}"`,
    `"${client.phone}"`,
    `"${client.companyPhone || ''}"`,
    `"${client.extension || ''}"`,
    `"${client.address}"`,
    `"${getUserName(client.assignedAdvisor)}"`
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `clientes_gtech_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const getUserName = (id?: string) => {
  if (!id) return 'Sin asignar';
  const u = users.find(u => u.id === id);
  return u ? u.name : 'Desconocido';
};

return (
  <div className="space-y-6">
    <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Cartera de Clientes</h1>
        <p className="text-slate-500 text-sm hidden md:block">Gestión, segmentación y directorio de clientes.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center flex-wrap">

        {/* FILTERS GROUP */}
        <div className="flex flex-wrap gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">

          {/* Sector Filter */}
          <div className="flex items-center gap-2 px-3 py-1.5 border-r border-slate-100">
            <Filter size={14} className="text-slate-400" />
            <select
              className="text-xs bg-transparent outline-none text-slate-600 font-medium cursor-pointer hover:text-brand-600"
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value as any)}
            >
              <option value="Todos">Todos los Sectores</option>
              <option value="Privado">Sector Privado</option>
              <option value="Gubernamental">Gubernamental</option>
            </select>
          </div>

          {/* Advisor Filter */}
          <div className="flex items-center gap-2 px-3 py-1.5 border-r border-slate-100">
            <UserCircle size={14} className="text-slate-400" />
            <select
              className="text-xs bg-transparent outline-none text-slate-600 font-medium cursor-pointer hover:text-brand-600 max-w-[100px] truncate"
              value={advisorFilter}
              onChange={(e) => setAdvisorFilter(e.target.value)}
            >
              <option value="Todos">Todos los Asesores</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          {/* Tag Filter */}
          <div className="flex items-center gap-2 px-3 py-1.5">
            <Tag size={14} className="text-slate-400" />
            <select
              className="text-xs bg-transparent outline-none text-slate-600 font-medium cursor-pointer hover:text-brand-600 max-w-[100px] truncate"
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
            >
              <option value="Todas">Todas las Etiquetas</option>
              {availableTags.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-1 gap-3 w-full lg:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500 bg-white w-full"
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center px-3 py-2 border border-slate-300 bg-white text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
            title="Exportar a Excel/CSV"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setNewClient({ name: '', company: '', email: '', phone: '', address: '', nit: '', companyPhone: '', extension: '', sector: 'Privado', tags: ['Nuevo'] }); setIsModalOpen(true); }}
            className="flex items-center justify-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium whitespace-nowrap"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Cliente
          </button>
        </div>
      </div>
    </div>

    {/* Clients Table */}
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Cliente / NIT</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Etiquetas</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Compras</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase hidden md:table-cell">Contacto</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase hidden lg:table-cell">Empresa</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase hidden lg:table-cell">Asesor</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredClients.map((client) => (
              <tr key={client.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => handleEdit(client)}>
                <td className="px-6 py-4">
                  <p className="font-medium text-slate-900">{client.name}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1"><Hash size={10} /> {client.nit || 'S/N'}</p>
                  <span className={`mt-1 inline-block text-[10px] font-bold px-1.5 py-0.5 rounded border ${client.sector === 'Gubernamental'
                    ? 'bg-amber-50 text-amber-700 border-amber-100'
                    : 'bg-slate-50 text-slate-500 border-slate-100'
                    }`}>
                    {client.sector || 'Privado'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1 max-w-[150px]">
                    {(client.tags || []).map((tag, i) => (
                      <span key={i} className="text-[10px] bg-brand-50 text-brand-600 px-1.5 py-0.5 rounded border border-brand-100">
                        {tag}
                      </span>
                    ))}
                    {(!client.tags || client.tags.length === 0) && <span className="text-xs text-slate-300">-</span>}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-1 font-semibold text-slate-700">
                    <ShoppingBag size={14} className="text-slate-400" />
                    {purchaseCounts[client.id] || 0}
                  </div>
                </td>
                <td className="px-6 py-4 hidden md:table-cell">
                  <div className="flex flex-col gap-1 text-sm text-slate-600">
                    <div className="flex items-center"><Mail className="w-3 h-3 mr-2" /> {client.email}</div>
                    <div className="flex items-center"><Phone className="w-3 h-3 mr-2" /> {client.phone}</div>
                  </div>
                </td>
                <td className="px-6 py-4 hidden lg:table-cell text-sm text-slate-600">
                  <div className="font-medium">{client.company}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <Building size={10} /> {client.companyPhone} {client.extension ? `ext ${client.extension}` : ''}
                  </div>
                </td>
                <td className="px-6 py-4 hidden lg:table-cell text-sm text-slate-600">
                  <div className="flex items-center gap-1">
                    <UserIcon size={12} className="text-slate-400" />
                    {getUserName(client.assignedAdvisor || client.responsibleId)}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={(e) => { e.stopPropagation(); handleEdit(client) }} className="text-brand-600 hover:text-brand-800 text-sm font-medium">
                      Editar
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('¿Está seguro de eliminar este cliente?')) {
                          api.delete(`/clients/${client.id}`).then(() => refreshData()).catch(e => alert("Error al eliminar"));
                        }
                      }}
                      className="text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredClients.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center">
                    <Search size={32} className="mb-2 opacity-20" />
                    <p>No se encontraron clientes con los filtros seleccionados.</p>
                  </div>
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
          <div className="p-6 border-b border-slate-100 sticky top-0 bg-white z-10 flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800">{newClient.id ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
            <button onClick={() => setIsModalOpen(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4 mb-2">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <label className="block text-xs font-bold text-blue-800 mb-1">Asesor Asignado</label>
                <select
                  className="w-full border border-blue-200 rounded-lg p-1.5 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-200"
                  value={newClient.assignedAdvisor || newClient.responsibleId || user.id}
                  onChange={e => setNewClient({ ...newClient, assignedAdvisor: e.target.value, responsibleId: e.target.value })}
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <label className="block text-xs font-bold text-slate-800 mb-1">Tipo de Sector</label>
                <select
                  className="w-full border border-slate-300 rounded-lg p-1.5 bg-white text-sm outline-none"
                  value={newClient.sector || 'Privado'}
                  onChange={e => setNewClient({ ...newClient, sector: e.target.value as any })}
                >
                  <option value="Privado">Sector Privado</option>
                  <option value="Gubernamental">Sector Gubernamental</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo *</label>
                <input required type="text" className="w-full border border-slate-300 rounded-lg p-2 bg-white" value={newClient.name} onChange={e => setNewClient({ ...newClient, name: e.target.value })} />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">NIT (Código Tributario)</label>
                <input type="text" className="w-full border border-slate-300 rounded-lg p-2 bg-white" value={newClient.nit} onChange={e => setNewClient({ ...newClient, nit: e.target.value })} />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Empresa *</label>
                <input required type="text" className="w-full border border-slate-300 rounded-lg p-2 bg-white" value={newClient.company} onChange={e => setNewClient({ ...newClient, company: e.target.value })} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono Personal</label>
                <input type="text" className="w-full border border-slate-300 rounded-lg p-2 bg-white" value={newClient.phone} onChange={e => setNewClient({ ...newClient, phone: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
                <input type="email" className="w-full border border-slate-300 rounded-lg p-2 bg-white" value={newClient.email} onChange={e => setNewClient({ ...newClient, email: e.target.value })} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono Empresarial</label>
                <input type="text" className="w-full border border-slate-300 rounded-lg p-2 bg-white" value={newClient.companyPhone} onChange={e => setNewClient({ ...newClient, companyPhone: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Extensión</label>
                <input type="text" className="w-full border border-slate-300 rounded-lg p-2 bg-white" value={newClient.extension} onChange={e => setNewClient({ ...newClient, extension: e.target.value })} />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
                <input type="text" className="w-full border border-slate-300 rounded-lg p-2 bg-white" value={newClient.address} onChange={e => setNewClient({ ...newClient, address: e.target.value })} />
              </div>

              {/* Tag Management */}
              <div className="col-span-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <label className="block text-xs font-bold text-slate-700 mb-1">Etiquetas (Segmentación)</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    className="flex-1 border border-slate-300 rounded px-2 py-1 text-sm bg-white"
                    placeholder="Nueva etiqueta..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <button type="button" onClick={addTag} className="bg-slate-200 text-slate-600 px-3 py-1 rounded text-sm font-bold hover:bg-slate-300">Agregar</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(newClient.tags || []).map((tag, i) => (
                    <span key={i} className="text-xs bg-white border border-slate-300 px-2 py-1 rounded-full flex items-center gap-1">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="text-slate-400 hover:text-red-500"><X size={10} /></button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">Cancelar</button>
              <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700">Guardar Cliente</button>
            </div>
          </form>
        </div>
      </div>
    )}
  </div>
);
};