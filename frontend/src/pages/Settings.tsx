
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Organization, User, UserRole, Client } from '../types';
import { Save, Building, Lock, CreditCard, CheckCircle, Upload, Database, FileDown, PlusCircle, Palette } from 'lucide-react';

export const Settings: React.FC<{ user: User }> = ({ user }) => {
  const [org, setOrg] = useState<Organization>(db.getOrganization());
  const [activeTab, setActiveTab] = useState<'general' | 'billing' | 'migration' | 'branding'>('general');
  
  // Migration State
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedClients, setParsedClients] = useState<Client[]>([]);
  const [importStatus, setImportStatus] = useState<'idle' | 'preview' | 'success' | 'error'>('idle');

  useEffect(() => {
      // Reload to get fresh state if needed
      setOrg(db.getOrganization());
  }, []);

  const handleSave = (e: React.FormEvent) => {
      e.preventDefault();
      if(user.role !== UserRole.ADMIN) return;
      
      db.saveOrganization(org);
      alert('Configuración de empresa actualizada. Los cambios se reflejarán en el sistema.');
      // Force reload to update sidebar/layout instantly (simple way)
      window.location.reload();
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setOrg({ ...org, logoUrl: reader.result as string });
          };
          reader.readAsDataURL(file);
      }
  };

  // --- CSV IMPORT LOGIC ---
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setCsvFile(file);
          const reader = new FileReader();
          reader.onload = (event) => {
              try {
                  const text = event.target?.result as string;
                  const rows = text.split('\n').map(row => row.split(','));
                  
                  // Simple CSV parsing (Assumes header: Nombre, Empresa, Correo, Telefono, NIT, Direccion)
                  // Skip header row
                  const clients: Client[] = [];
                  for (let i = 1; i < rows.length; i++) {
                      const cols = rows[i];
                      if (cols.length < 3) continue; // Skip empty rows
                      
                      clients.push({
                          id: `c-imp-${Date.now()}-${i}`,
                          name: cols[0]?.trim() || 'Desconocido',
                          company: cols[1]?.trim() || cols[0]?.trim(),
                          email: cols[2]?.trim() || '',
                          phone: cols[3]?.trim() || '',
                          nit: cols[4]?.trim() || 'CF',
                          address: cols[5]?.trim() || 'Ciudad',
                          createdAt: new Date().toISOString(),
                          tags: ['Importado'],
                          responsibleId: user.id, // Assign to Admin by default
                          sector: 'Privado'
                      });
                  }
                  setParsedClients(clients);
                  setImportStatus('preview');
              } catch (err) {
                  console.error(err);
                  setImportStatus('error');
              }
          };
          reader.readAsText(file);
      }
  };

  const confirmImport = () => {
      if (parsedClients.length > 0) {
          db.bulkAddClients(parsedClients);
          setImportStatus('success');
          setParsedClients([]);
          setCsvFile(null);
          alert(`${parsedClients.length} clientes importados exitosamente.`);
      }
  };

  const downloadTemplate = () => {
      const headers = ['Nombre,Empresa,Correo,Telefono,NIT,Direccion'];
      const example = ['Juan Perez,Empresa Demo S.A.,juan@demo.com,55550000,12345678,Zona 10 Guatemala'];
      const csvContent = [headers, example].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'plantilla_clientes_gtech.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  if (user.role !== UserRole.ADMIN) {
      return (
          <div className="p-10 text-center bg-white rounded-xl border border-slate-200">
              <Lock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h2 className="text-lg font-bold text-slate-700">Acceso Restringido</h2>
              <p className="text-slate-500">Solo los administradores pueden configurar los datos de la empresa.</p>
          </div>
      );
  }

  return (
    <div className="space-y-6">
      <div>
          <h1 className="text-2xl font-bold text-slate-800">Configuración de Empresa (SaaS)</h1>
          <p className="text-slate-500 text-sm">Administra la identidad de tu organización y tu suscripción.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Tabs Header */}
          <div className="flex border-b border-slate-100 overflow-x-auto">
              <button 
                onClick={() => setActiveTab('general')}
                className={`px-6 py-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'general' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                  <Building size={16} /> Datos Generales
              </button>
              <button 
                onClick={() => setActiveTab('branding')}
                className={`px-6 py-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'branding' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                  <Palette size={16} /> Identidad Visual
              </button>
              <button 
                onClick={() => setActiveTab('billing')}
                className={`px-6 py-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'billing' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                  <CreditCard size={16} /> Suscripción y Pagos
              </button>
              <button 
                onClick={() => setActiveTab('migration')}
                className={`px-6 py-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'migration' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                  <Database size={16} /> Migración de Datos
              </button>
          </div>

          <div className="p-8">
              {activeTab === 'general' && (
                  <form onSubmit={handleSave} className="space-y-8 max-w-4xl">
                      {/* Branding Section */}
                      <div className="flex items-start gap-8 pb-8 border-b border-slate-100">
                          <div className="w-32 h-32 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center relative overflow-hidden group">
                              {org.logoUrl ? (
                                  <img src={org.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                              ) : (
                                  <Building size={32} className="text-slate-300" />
                              )}
                              <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-xs font-bold">
                                  <Upload size={20} className="mb-1"/> Cambiar
                                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                              </label>
                          </div>
                          <div className="flex-1 space-y-4">
                              <div>
                                  <label className="block text-sm font-bold text-slate-700 mb-1">Nombre Comercial (Marca)</label>
                                  <input 
                                    type="text" 
                                    className="w-full border border-slate-300 rounded-lg p-2.5 bg-white"
                                    value={org.commercialName}
                                    onChange={(e) => setOrg({...org, commercialName: e.target.value})}
                                    placeholder="Ej. gtech"
                                  />
                                  <p className="text-xs text-slate-400 mt-1">Este nombre aparecerá en el menú principal.</p>
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-slate-700 mb-1">Razón Social (Fiscal)</label>
                                  <input 
                                    type="text" 
                                    className="w-full border border-slate-300 rounded-lg p-2.5 bg-white"
                                    value={org.name}
                                    onChange={(e) => setOrg({...org, name: e.target.value})}
                                  />
                              </div>
                          </div>
                      </div>

                      {/* Fiscal Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                              <label className="block text-sm font-bold text-slate-700 mb-1">NIT / Tax ID</label>
                              <input 
                                type="text" 
                                className="w-full border border-slate-300 rounded-lg p-2.5 bg-white"
                                value={org.nit}
                                onChange={(e) => setOrg({...org, nit: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-bold text-slate-700 mb-1">Sitio Web</label>
                              <input 
                                type="text" 
                                className="w-full border border-slate-300 rounded-lg p-2.5 bg-white"
                                value={org.website}
                                onChange={(e) => setOrg({...org, website: e.target.value})}
                              />
                          </div>
                          <div className="md:col-span-2">
                              <label className="block text-sm font-bold text-slate-700 mb-1">Dirección Fiscal</label>
                              <input 
                                type="text" 
                                className="w-full border border-slate-300 rounded-lg p-2.5 bg-white"
                                value={org.address}
                                onChange={(e) => setOrg({...org, address: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-bold text-slate-700 mb-1">Teléfono Contacto</label>
                              <input 
                                type="text" 
                                className="w-full border border-slate-300 rounded-lg p-2.5 bg-white"
                                value={org.phone}
                                onChange={(e) => setOrg({...org, phone: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-bold text-slate-700 mb-1">Email Contacto</label>
                              <input 
                                type="email" 
                                className="w-full border border-slate-300 rounded-lg p-2.5 bg-white"
                                value={org.email}
                                onChange={(e) => setOrg({...org, email: e.target.value})}
                              />
                          </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex justify-end">
                          <button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-sm flex items-center gap-2">
                              <Save size={18} /> Guardar Cambios
                          </button>
                      </div>
                  </form>
              )}

              {activeTab === 'branding' && (
                  <form onSubmit={handleSave} className="max-w-2xl space-y-8">
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
                          <p className="text-sm text-blue-800 flex items-center gap-2">
                              <Palette size={18}/> 
                              Personaliza los colores para que coincidan con la identidad de tu marca.
                          </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                          <div>
                              <label className="block text-sm font-bold text-slate-700 mb-2">Color Primario</label>
                              <div className="flex items-center gap-3">
                                  <input 
                                    type="color" 
                                    className="w-12 h-12 p-1 rounded cursor-pointer border border-slate-200 bg-white"
                                    value={org.brandColors?.primary || '#3b82f6'}
                                    onChange={(e) => setOrg({...org, brandColors: { ...org.brandColors!, primary: e.target.value }})}
                                  />
                                  <span className="text-sm font-mono text-slate-500 uppercase">{org.brandColors?.primary || '#3b82f6'}</span>
                              </div>
                              <p className="text-xs text-slate-400 mt-2">Botones principales, enlaces y énfasis.</p>
                          </div>

                          <div>
                              <label className="block text-sm font-bold text-slate-700 mb-2">Color Secundario</label>
                              <div className="flex items-center gap-3">
                                  <input 
                                    type="color" 
                                    className="w-12 h-12 p-1 rounded cursor-pointer border border-slate-200 bg-white"
                                    value={org.brandColors?.secondary || '#64748b'}
                                    onChange={(e) => setOrg({...org, brandColors: { ...org.brandColors!, secondary: e.target.value }})}
                                  />
                                  <span className="text-sm font-mono text-slate-500 uppercase">{org.brandColors?.secondary || '#64748b'}</span>
                              </div>
                              <p className="text-xs text-slate-400 mt-2">Elementos de apoyo, iconos inactivos.</p>
                          </div>

                          <div>
                              <label className="block text-sm font-bold text-slate-700 mb-2">Fondo Menú (Sidebar)</label>
                              <div className="flex items-center gap-3">
                                  <input 
                                    type="color" 
                                    className="w-12 h-12 p-1 rounded cursor-pointer border border-slate-200 bg-white"
                                    value={org.brandColors?.sidebar || '#0f172a'}
                                    onChange={(e) => setOrg({...org, brandColors: { ...org.brandColors!, sidebar: e.target.value }})}
                                  />
                                  <span className="text-sm font-mono text-slate-500 uppercase">{org.brandColors?.sidebar || '#0f172a'}</span>
                              </div>
                              <p className="text-xs text-slate-400 mt-2">Color de fondo de la barra lateral de navegación.</p>
                          </div>
                      </div>

                      <div className="pt-6 border-t border-slate-100">
                          <h4 className="text-sm font-bold text-slate-800 mb-4">Vista Previa</h4>
                          <div className="flex rounded-lg overflow-hidden border border-slate-200 h-32">
                              <div className="w-1/4 p-4 text-white" style={{ backgroundColor: org.brandColors?.sidebar || '#0f172a' }}>
                                  <div className="w-6 h-6 bg-white/20 rounded mb-2"></div>
                                  <div className="space-y-2">
                                      <div className="h-2 w-3/4 bg-white/20 rounded"></div>
                                      <div className="h-2 w-1/2 bg-white/20 rounded"></div>
                                  </div>
                              </div>
                              <div className="flex-1 bg-slate-50 p-4">
                                  <div className="flex gap-3 mb-4">
                                      <button className="px-4 py-2 rounded text-white text-xs font-bold" style={{ backgroundColor: org.brandColors?.primary || '#3b82f6' }}>
                                          Botón Primario
                                      </button>
                                      <button className="px-4 py-2 rounded bg-white border text-xs font-bold" style={{ borderColor: org.brandColors?.secondary || '#64748b', color: org.brandColors?.secondary || '#64748b' }}>
                                          Botón Secundario
                                      </button>
                                  </div>
                              </div>
                          </div>
                      </div>

                      <div className="pt-4 flex justify-end">
                          <button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-sm flex items-center gap-2">
                              <Save size={18} /> Guardar Colores
                          </button>
                      </div>
                  </form>
              )}

              {activeTab === 'billing' && (
                  <div className="max-w-3xl">
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8 flex items-start justify-between">
                          <div>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Plan Actual</p>
                              <h2 className="text-3xl font-bold text-slate-800 mb-2">{org.saasPlan}</h2>
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                  <CheckCircle size={16} className="text-green-500" />
                                  Estado: <span className="font-bold text-green-600">{org.saasStatus}</span>
                              </div>
                              <p className="text-xs text-slate-400 mt-2">Próxima facturación: {new Date(org.nextBillingDate || Date.now()).toLocaleDateString()}</p>
                          </div>
                          <button className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-bold shadow-sm">
                              Gestionar Pagos
                          </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Pricing Cards (Mockup for SaaS) */}
                          <div className={`border rounded-xl p-6 ${org.saasPlan === 'Free' ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'border-slate-200'}`}>
                              <h3 className="font-bold text-slate-800">Free</h3>
                              <p className="text-2xl font-bold mt-2">$0 <span className="text-sm font-normal text-slate-500">/mes</span></p>
                              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                                  <li>• 2 Usuarios</li>
                                  <li>• 100 Clientes</li>
                                  <li>• Funciones básicas</li>
                              </ul>
                              {org.saasPlan !== 'Free' && <button className="mt-6 w-full py-2 border border-slate-300 rounded text-sm font-bold text-slate-600">Downgrade</button>}
                          </div>

                          <div className={`border rounded-xl p-6 ${org.saasPlan === 'Pro' ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'border-slate-200'}`}>
                              <h3 className="font-bold text-slate-800">Pro</h3>
                              <p className="text-2xl font-bold mt-2">$29 <span className="text-sm font-normal text-slate-500">/mes</span></p>
                              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                                  <li>• 5 Usuarios</li>
                                  <li>• Clientes Ilimitados</li>
                                  <li>• CRM + Inventario</li>
                              </ul>
                              {org.saasPlan !== 'Pro' && <button className="mt-6 w-full py-2 bg-brand-600 text-white rounded text-sm font-bold hover:bg-brand-700">Upgrade</button>}
                          </div>

                          <div className={`border rounded-xl p-6 ${org.saasPlan === 'Enterprise' ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'border-slate-200'}`}>
                              <h3 className="font-bold text-slate-800">Enterprise</h3>
                              <p className="text-2xl font-bold mt-2">$99 <span className="text-sm font-normal text-slate-500">/mes</span></p>
                              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                                  <li>• Usuarios Ilimitados</li>
                                  <li>• Todo Incluido</li>
                                  <li>• Soporte Prioritario</li>
                              </ul>
                              {org.saasPlan === 'Enterprise' ? (
                                  <button className="mt-6 w-full py-2 bg-green-600 text-white rounded text-sm font-bold cursor-default">Plan Actual</button>
                              ) : (
                                  <button className="mt-6 w-full py-2 bg-brand-600 text-white rounded text-sm font-bold hover:bg-brand-700">Contactar Ventas</button>
                              )}
                          </div>
                      </div>
                  </div>
              )}

              {activeTab === 'migration' && (
                  <div className="max-w-4xl space-y-12">
                      
                      {/* 1. Initial Balance Config */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                          <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                              <CreditCard className="text-brand-600"/> Saldo Inicial Financiero
                          </h3>
                          <p className="text-sm text-slate-500 mb-6">
                              Establece el saldo de apertura (Caja/Bancos) para que los reportes financieros reflejen la disponibilidad real.
                          </p>
                          <form onSubmit={handleSave} className="flex items-end gap-4">
                              <div className="w-full max-w-xs">
                                  <label className="block text-xs font-bold text-slate-700 mb-1">Monto Inicial (Q)</label>
                                  <input 
                                    type="number" 
                                    step="0.01"
                                    className="w-full border border-slate-300 rounded-lg p-2.5 bg-white font-bold text-slate-800"
                                    value={org.initialBalance || 0}
                                    onChange={(e) => setOrg({...org, initialBalance: Number(e.target.value)})}
                                  />
                              </div>
                              <button type="submit" className="bg-brand-600 text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-brand-700 shadow-sm">
                                  Guardar Saldo
                              </button>
                          </form>
                      </div>

                      {/* 2. CSV Import */}
                      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                          <div className="flex justify-between items-start mb-6">
                              <div>
                                  <h3 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
                                      <Database className="text-brand-600"/> Carga Masiva de Clientes
                                  </h3>
                                  <p className="text-sm text-slate-500">Importa tu base de datos de clientes desde un archivo CSV.</p>
                              </div>
                              <button 
                                onClick={downloadTemplate}
                                className="text-sm text-brand-600 font-bold hover:underline flex items-center gap-1"
                              >
                                  <FileDown size={16}/> Descargar Plantilla CSV
                              </button>
                          </div>

                          <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors mb-6">
                              <label className="cursor-pointer block">
                                  <Upload size={40} className="mx-auto text-slate-300 mb-3" />
                                  <span className="block text-sm font-bold text-slate-700">Haz clic para subir tu archivo CSV</span>
                                  <span className="block text-xs text-slate-400 mt-1">Formato: Nombre, Empresa, Correo, Telefono, NIT, Direccion</span>
                                  <input type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
                              </label>
                          </div>

                          {importStatus === 'preview' && parsedClients.length > 0 && (
                              <div className="animate-fade-in">
                                  <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                      <CheckCircle size={16} className="text-green-500"/> Vista Previa ({parsedClients.length} clientes detectados)
                                  </h4>
                                  <div className="border border-slate-200 rounded-lg overflow-hidden mb-4 max-h-60 overflow-y-auto">
                                      <table className="w-full text-left text-xs">
                                          <thead className="bg-slate-50 text-slate-500 sticky top-0">
                                              <tr>
                                                  <th className="p-2">Nombre</th>
                                                  <th className="p-2">Empresa</th>
                                                  <th className="p-2">Correo</th>
                                                  <th className="p-2">NIT</th>
                                              </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-100">
                                              {parsedClients.slice(0, 10).map((c, i) => (
                                                  <tr key={i}>
                                                      <td className="p-2">{c.name}</td>
                                                      <td className="p-2">{c.company}</td>
                                                      <td className="p-2">{c.email}</td>
                                                      <td className="p-2">{c.nit}</td>
                                                  </tr>
                                              ))}
                                          </tbody>
                                      </table>
                                      {parsedClients.length > 10 && <div className="p-2 text-center text-xs text-slate-400 bg-slate-50">... y {parsedClients.length - 10} más</div>}
                                  </div>
                                  <div className="flex gap-3">
                                      <button onClick={confirmImport} className="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700 transition-colors">
                                          Confirmar Importación
                                      </button>
                                      <button onClick={() => { setParsedClients([]); setImportStatus('idle'); }} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">
                                          Cancelar
                                      </button>
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};
