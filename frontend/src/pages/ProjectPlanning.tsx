
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/db';
import { Project, ProjectStatus, Client, InventoryItem, Product, ProjectMaterial, UserRole, Opportunity, OpportunityStage, Expense } from '../types';
import { Plus, Search, Edit, Calendar, DollarSign, Wrench, CheckCircle, Clock, Ban, Trash2, Save, X, Package, Briefcase, Receipt, TrendingDown, AlertCircle, FileCheck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const ProjectPlanning: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSelectOppModalOpen, setIsSelectOppModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'planning' | 'finance'>('planning');

  // Add Expense Modal State
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [newProjectExpense, setNewProjectExpense] = useState<Partial<Expense>>({
      description: '', amount: 0, date: new Date().toISOString().split('T')[0], category: 'Materiales Proyecto'
  });

  const [currentProject, setCurrentProject] = useState<Partial<Project>>({
      name: '',
      clientId: '',
      status: ProjectStatus.PLANIFICACION,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      materials: [],
      laborDays: 1,
      laborCostPerDay: 0,
      totalMaterialCost: 0,
      totalLaborCost: 0,
      marginPercentage: 20,
      finalPrice: 0,
      description: ''
  });

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setProjects(db.getProjects());
    setClients(db.getClients(undefined, UserRole.ADMIN));
    setInventory(db.getInventoryItems());
    setProducts(db.getProducts());
    setOpportunities(db.getOpportunities(undefined, UserRole.ADMIN));
    setExpenses(db.getExpenses());
  };

  // Filter Won Opportunities that DO NOT have a project yet
  const availableOpportunities = useMemo(() => {
      return opportunities.filter(o => 
          o.stage === OpportunityStage.GANADA && 
          !projects.some(p => p.opportunityId === o.id)
      );
  }, [opportunities, projects]);

  // Filter Expenses for Current Project
  const projectExpenses = useMemo(() => {
      if (!currentProject.id) return [];
      return expenses.filter(e => e.projectId === currentProject.id);
  }, [expenses, currentProject.id]);

  const calculateTotals = (proj: Partial<Project>) => {
      const matCost = (proj.materials || []).reduce((sum, m) => sum + m.totalCost, 0);
      
      // Calculate duration in days
      const start = new Date(proj.startDate || new Date());
      const end = new Date(proj.endDate || new Date());
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      const days = proj.laborDays || diffDays;
      const labCost = days * (proj.laborCostPerDay || 0);
      const subTotal = matCost + labCost;
      
      const margin = proj.marginPercentage || 0;
      const price = margin < 100 ? subTotal / (1 - (margin/100)) : 0;

      return { 
          totalMaterialCost: matCost, 
          totalLaborCost: labCost, 
          finalPrice: price,
          laborDays: days
      };
  };

  const handleFieldChange = (field: keyof Project, value: any) => {
      const updated = { ...currentProject, [field]: value };
      const totals = calculateTotals(updated);
      setCurrentProject({ ...updated, ...totals });
  };

  const addMaterial = () => {
      const newMat: ProjectMaterial = {
          id: `pm${Date.now()}`,
          name: '',
          quantity: 1,
          unitCost: 0,
          totalCost: 0
      };
      const newMaterials = [...(currentProject.materials || []), newMat];
      handleFieldChange('materials', newMaterials);
  };

  const updateMaterial = (id: string, field: keyof ProjectMaterial, value: any) => {
      const newMaterials = (currentProject.materials || []).map(m => {
          if (m.id === id) {
              const updatedMat = { ...m, [field]: value };
              if (field === 'quantity' || field === 'unitCost') {
                  updatedMat.totalCost = updatedMat.quantity * updatedMat.unitCost;
              }
              return updatedMat;
          }
          return m;
      });
      handleFieldChange('materials', newMaterials);
  };

  const removeMaterial = (id: string) => {
      const newMaterials = (currentProject.materials || []).filter(m => m.id !== id);
      handleFieldChange('materials', newMaterials);
  };

  const handleSelectInventoryItem = (materialId: string, itemId: string) => {
      const item = inventory.find(i => i.id === itemId) || products.find(p => p.id === itemId);
      if (item) {
          const cost = 'unitCost' in item ? item.unitCost : (item as Product).cost; 
          const newMaterials = (currentProject.materials || []).map(m => {
              if (m.id === materialId) {
                  return { 
                      ...m, 
                      name: item.name, 
                      unitCost: cost || 0, 
                      totalCost: (cost || 0) * m.quantity 
                  };
              }
              return m;
          });
          handleFieldChange('materials', newMaterials);
      }
  };

  const handleSave = (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentProject.name || !currentProject.clientId) return;

      const projectToSave = {
          ...currentProject,
          id: currentProject.id || `pj${Date.now()}`,
      } as Project;

      db.saveProject(projectToSave);
      refreshData();
      setIsModalOpen(false);
  };

  const updateProjectStatus = (status: ProjectStatus) => {
      if (!currentProject.name || !currentProject.clientId) return;
      
      const projectToSave = {
          ...currentProject,
          id: currentProject.id || `pj${Date.now()}`,
          status: status
      } as Project;

      db.saveProject(projectToSave);
      refreshData();
      setIsModalOpen(false);
      alert(`Estado del proyecto actualizado a: ${status}`);
  };

  // New Project from Opportunity Flow
  const startNewProject = () => {
      setIsSelectOppModalOpen(true);
  };

  const selectOpportunity = (opp: Opportunity) => {
      // Populate project data from opportunity
      setCurrentProject({
          name: opp.name,
          clientId: opp.clientId,
          opportunityId: opp.id,
          status: ProjectStatus.PLANIFICACION,
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
          materials: [],
          laborDays: 5,
          laborCostPerDay: 0,
          totalMaterialCost: 0,
          totalLaborCost: 0,
          marginPercentage: opp.profitMargin || 20,
          finalPrice: opp.amount, // Start with sold amount
          description: opp.description
      });
      setIsSelectOppModalOpen(false);
      setIsModalOpen(true);
      setActiveTab('planning');
  };

  const handleAddProjectExpense = (e: React.FormEvent) => {
      e.preventDefault();
      if(!newProjectExpense.amount || !newProjectExpense.description) return;

      const expense: Expense = {
          id: `exp${Date.now()}`,
          date: newProjectExpense.date || new Date().toISOString(),
          category: newProjectExpense.category || 'Materiales Proyecto',
          description: newProjectExpense.description,
          amount: Number(newProjectExpense.amount),
          projectId: currentProject.id,
          registeredBy: 'system', // Simplified
          supplier: '', // Optional in this quick view
      };

      db.addExpense(expense);
      setExpenses(db.getExpenses()); // Update local state
      setIsAddExpenseModalOpen(false);
      setNewProjectExpense({ description: '', amount: 0, date: new Date().toISOString().split('T')[0], category: 'Materiales Proyecto' });
  };

  const filteredProjects = projects.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getClientName = (id: string) => clients.find(c => c.id === id)?.company || 'Desconocido';

  // Financial Report Data
  const totalActualExpenses = projectExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalEstimatedCost = (currentProject.totalMaterialCost || 0) + (currentProject.totalLaborCost || 0);
  const budgetHealth = totalActualExpenses > totalEstimatedCost ? 'negative' : 'positive';
  const remainingBudget = totalEstimatedCost - totalActualExpenses;

  const chartData = [
      { name: 'Estimado', value: totalEstimatedCost },
      { name: 'Real (Ejecutado)', value: totalActualExpenses }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Planificación de Proyectos</h1>
          <p className="text-slate-500 text-sm">Gestión de ejecuciones y control de costos por proyecto.</p>
        </div>
        
        <div className="flex gap-3">
          <div className="relative">
             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
             <input 
               className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500 bg-white"
               placeholder="Buscar proyecto..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
          <button 
            onClick={startNewProject}
            className="flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Proyecto
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.map(p => (
              <div key={p.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all group">
                  <div className="p-5 border-b border-slate-100 relative">
                      <div className="flex justify-between items-start mb-2">
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                              p.status === ProjectStatus.EN_EJECUCION ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              p.status === ProjectStatus.FINALIZADO ? 'bg-green-50 text-green-700 border-green-200' :
                              p.status === ProjectStatus.APROBADO ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              p.status === ProjectStatus.REVISADO ? 'bg-purple-50 text-purple-700 border-purple-200' :
                              'bg-yellow-50 text-yellow-700 border-yellow-200'
                          }`}>
                              {p.status}
                          </span>
                      </div>
                      <h3 className="font-bold text-slate-800 text-lg mb-1 pr-8">{p.name}</h3>
                      <p className="text-sm text-slate-500 flex items-center gap-1"><Package size={14}/> {getClientName(p.clientId)}</p>
                      
                      {/* Opportunity Link Indicator */}
                      {p.opportunityId && (
                          <div className="absolute top-5 right-5 text-brand-200 group-hover:text-brand-500 transition-colors" title="Vinculado a Oportunidad">
                              <Briefcase size={20} />
                          </div>
                      )}
                  </div>
                  
                  <div className="p-5 space-y-3">
                      <div className="flex justify-between text-sm">
                          <span className="text-slate-500 flex items-center gap-2"><Calendar size={14}/> Entrega:</span>
                          <span className="font-medium">{new Date(p.endDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                          <span className="text-slate-500 flex items-center gap-2"><DollarSign size={14}/> Presupuesto:</span>
                          <span className="font-medium">Q{((p.totalMaterialCost || 0) + (p.totalLaborCost || 0)).toLocaleString()}</span>
                      </div>
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                      <button 
                        onClick={() => {
                            if(window.confirm('¿Eliminar proyecto?')) {
                                db.deleteProject(p.id);
                                refreshData();
                            }
                        }}
                        className="text-red-400 hover:text-red-600 p-2"
                      >
                          <Trash2 size={18} />
                      </button>
                      <button 
                        onClick={() => { setCurrentProject(p); setIsModalOpen(true); setActiveTab('planning'); }}
                        className="flex items-center gap-2 text-sm font-bold text-brand-600 hover:text-brand-800"
                      >
                          <Edit size={16} /> Gestionar
                      </button>
                  </div>
              </div>
          ))}
          
          {filteredProjects.length === 0 && (
              <div className="col-span-full py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-400">
                  <Wrench size={40} className="mx-auto mb-4 opacity-50"/>
                  <p>No hay proyectos activos.</p>
                  <button onClick={startNewProject} className="mt-2 text-brand-600 font-bold hover:underline">Crear desde Oportunidad</button>
              </div>
          )}
      </div>

      {/* OPPORTUNITY SELECTION MODAL */}
      {isSelectOppModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                      <h2 className="text-xl font-bold text-slate-800">Seleccionar Oportunidad Ganada</h2>
                      <button onClick={() => setIsSelectOppModalOpen(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6">
                      {availableOpportunities.length > 0 ? (
                          <div className="space-y-3">
                              {availableOpportunities.map(opp => (
                                  <div 
                                    key={opp.id} 
                                    onClick={() => selectOpportunity(opp)}
                                    className="p-4 border border-slate-200 rounded-lg hover:border-brand-500 hover:bg-brand-50 cursor-pointer transition-all flex justify-between items-center group"
                                  >
                                      <div>
                                          <h4 className="font-bold text-slate-800 group-hover:text-brand-700">{opp.name}</h4>
                                          <p className="text-sm text-slate-500">{opp.clientName} • Q{opp.amount.toLocaleString()}</p>
                                      </div>
                                      <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                                          GANADA
                                      </div>
                                  </div>
                              ))}
                          </div>
                      ) : (
                          <div className="text-center py-10 text-slate-500">
                              <CheckCircle size={40} className="mx-auto mb-3 text-slate-300"/>
                              <p>No hay oportunidades ganadas pendientes de proyecto.</p>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* MAIN PROJECT MODAL */}
      {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col">
                  {/* Header */}
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                      <div>
                          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                              <Wrench className="text-brand-600" /> {currentProject.name}
                          </h2>
                          <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                                  currentProject.status === ProjectStatus.EN_EJECUCION ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                  currentProject.status === ProjectStatus.APROBADO ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                  currentProject.status === ProjectStatus.REVISADO ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                  'bg-yellow-100 text-yellow-700 border-yellow-200'
                              }`}>
                                  {currentProject.status}
                              </span>
                              <p className="text-sm text-slate-500">Gestión Integral</p>
                          </div>
                      </div>
                      <div className="flex gap-3">
                          <div className="flex bg-white rounded-lg p-1 border border-slate-200">
                              <button 
                                onClick={() => setActiveTab('planning')}
                                className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${activeTab === 'planning' ? 'bg-brand-100 text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                              >
                                  Planificación
                              </button>
                              <button 
                                onClick={() => setActiveTab('finance')}
                                className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${activeTab === 'finance' ? 'bg-brand-100 text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                              >
                                  Finanzas & Gastos
                              </button>
                          </div>
                          <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                      </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                      
                      {/* --- TAB: PLANNING --- */}
                      {activeTab === 'planning' && (
                          <form id="project-form" onSubmit={handleSave} className="space-y-8">
                              {/* General Info */}
                              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                  <div className="flex justify-between items-center mb-4">
                                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Datos Generales</h3>
                                      
                                      {/* Workflow Buttons */}
                                      <div className="flex gap-2">
                                          {currentProject.status === ProjectStatus.PLANIFICACION && (
                                              <button 
                                                type="button"
                                                onClick={() => updateProjectStatus(ProjectStatus.APROBADO)}
                                                className="flex items-center gap-1 bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700 shadow-sm"
                                              >
                                                  <CheckCircle size={14} /> Aprobar Proyecto
                                              </button>
                                          )}
                                          {currentProject.status === ProjectStatus.APROBADO && (
                                              <button 
                                                type="button"
                                                onClick={() => updateProjectStatus(ProjectStatus.REVISADO)}
                                                className="flex items-center gap-1 bg-purple-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-purple-700 shadow-sm"
                                              >
                                                  <FileCheck size={14} /> Proyecto Revisado (Compras)
                                              </button>
                                          )}
                                          {(currentProject.status === ProjectStatus.REVISADO || currentProject.status === ProjectStatus.EN_EJECUCION) && (
                                              <span className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200 flex items-center gap-1">
                                                  <CheckCircle size={14}/> Listo para Compras
                                              </span>
                                          )}
                                      </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                      <div className="md:col-span-2">
                                          <label className="block text-sm font-bold text-slate-700 mb-1">Nombre del Proyecto</label>
                                          <input required type="text" className="w-full border border-slate-300 rounded-lg p-2 bg-white" value={currentProject.name} onChange={e => handleFieldChange('name', e.target.value)} />
                                      </div>
                                      <div>
                                          <label className="block text-sm font-bold text-slate-700 mb-1">Estado</label>
                                          <select className="w-full border border-slate-300 rounded-lg p-2 bg-white" value={currentProject.status} onChange={e => handleFieldChange('status', e.target.value)}>
                                              {Object.values(ProjectStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                          </select>
                                      </div>
                                      <div>
                                          <label className="block text-sm font-bold text-slate-700 mb-1">Fecha Inicio</label>
                                          <input type="date" className="w-full border border-slate-300 rounded-lg p-2 bg-white" value={currentProject.startDate?.split('T')[0]} onChange={e => handleFieldChange('startDate', e.target.value)} />
                                      </div>
                                      <div>
                                          <label className="block text-sm font-bold text-slate-700 mb-1">Fecha Fin</label>
                                          <input type="date" className="w-full border border-slate-300 rounded-lg p-2 bg-white" value={currentProject.endDate?.split('T')[0]} onChange={e => handleFieldChange('endDate', e.target.value)} />
                                      </div>
                                  </div>
                              </div>

                              {/* Materials & Costs */}
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                  {/* LEFT: Materials List */}
                                  <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                      <div className="flex justify-between items-center mb-4">
                                          <h3 className="font-bold text-slate-800">Hoja de Materiales (Presupuesto)</h3>
                                          <button type="button" onClick={addMaterial} className="text-xs bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 px-3 py-1.5 rounded transition-colors">+ Item</button>
                                      </div>
                                      
                                      <div className="overflow-hidden border border-slate-200 rounded-lg">
                                          <table className="w-full text-left text-sm">
                                              <thead className="bg-slate-50 text-slate-500">
                                                  <tr>
                                                      <th className="p-3 font-bold">Item / Descripción</th>
                                                      <th className="p-3 font-bold w-20">Cant.</th>
                                                      <th className="p-3 font-bold w-24">Costo U.</th>
                                                      <th className="p-3 font-bold w-24 text-right">Total</th>
                                                      <th className="w-10"></th>
                                                  </tr>
                                              </thead>
                                              <tbody className="divide-y divide-slate-100">
                                                  {currentProject.materials?.map((mat, idx) => (
                                                      <tr key={mat.id}>
                                                          <td className="p-2">
                                                              <input 
                                                                className="w-full border border-slate-300 rounded p-1 text-sm mb-1 outline-none focus:border-brand-500" 
                                                                placeholder="Nombre material..." 
                                                                value={mat.name}
                                                                onChange={e => updateMaterial(mat.id, 'name', e.target.value)}
                                                              />
                                                              <select 
                                                                className="w-full text-xs bg-transparent text-slate-400 outline-none cursor-pointer"
                                                                onChange={(e) => handleSelectInventoryItem(mat.id, e.target.value)}
                                                                defaultValue=""
                                                              >
                                                                  <option value="" disabled>Cargar de Inventario...</option>
                                                                  <optgroup label="Insumos & Herramientas">
                                                                      {inventory.map(i => <option key={i.id} value={i.id}>{i.name} (Q{i.unitCost})</option>)}
                                                                  </optgroup>
                                                                  <optgroup label="Productos Venta">
                                                                      {products.map(p => <option key={p.id} value={p.id}>{p.name} (Q{p.cost})</option>)}
                                                                  </optgroup>
                                                              </select>
                                                          </td>
                                                          <td className="p-2 align-top">
                                                              <input type="number" className="w-full border border-slate-300 rounded p-1 text-center outline-none" value={mat.quantity} onChange={e => updateMaterial(mat.id, 'quantity', Number(e.target.value))} />
                                                          </td>
                                                          <td className="p-2 align-top">
                                                              <input type="number" className="w-full border border-slate-300 rounded p-1 text-right outline-none" value={mat.unitCost} onChange={e => updateMaterial(mat.id, 'unitCost', Number(e.target.value))} />
                                                          </td>
                                                          <td className="p-2 align-top text-right font-bold text-slate-700">
                                                              Q{mat.totalCost.toFixed(2)}
                                                          </td>
                                                          <td className="p-2 align-top text-center">
                                                              <button type="button" onClick={() => removeMaterial(mat.id)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                                                          </td>
                                                      </tr>
                                                  ))}
                                              </tbody>
                                          </table>
                                      </div>
                                  </div>

                                  {/* RIGHT: Totals & Labor */}
                                  <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 h-fit space-y-6">
                                      <div>
                                          <h3 className="font-bold text-blue-800 mb-3 border-b border-blue-200 pb-1">Mano de Obra & Tiempo</h3>
                                          <div className="space-y-3">
                                              <div className="flex justify-between items-center">
                                                  <label className="text-sm text-slate-600">Días Estimados</label>
                                                  <input type="number" className="w-20 border border-blue-200 rounded p-1 text-right outline-none focus:ring-1 focus:ring-blue-400" value={currentProject.laborDays} onChange={e => handleFieldChange('laborDays', Number(e.target.value))} />
                                              </div>
                                              <div className="flex justify-between items-center">
                                                  <label className="text-sm text-slate-600">Costo Diario (Q)</label>
                                                  <input type="number" className="w-24 border border-blue-200 rounded p-1 text-right outline-none focus:ring-1 focus:ring-blue-400" value={currentProject.laborCostPerDay} onChange={e => handleFieldChange('laborCostPerDay', Number(e.target.value))} />
                                              </div>
                                              <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                                                  <span className="font-bold text-sm text-blue-900">Total Mano Obra</span>
                                                  <span className="font-bold text-blue-900">Q{currentProject.totalLaborCost?.toFixed(2)}</span>
                                              </div>
                                          </div>
                                      </div>

                                      <div>
                                          <h3 className="font-bold text-slate-800 mb-3 border-b border-slate-200 pb-1">Resumen Económico</h3>
                                          <div className="space-y-2 text-sm">
                                              <div className="flex justify-between">
                                                  <span className="text-slate-600">Total Materiales</span>
                                                  <span>Q{currentProject.totalMaterialCost?.toFixed(2)}</span>
                                              </div>
                                              <div className="flex justify-between">
                                                  <span className="text-slate-600">Total Mano de Obra</span>
                                                  <span>Q{currentProject.totalLaborCost?.toFixed(2)}</span>
                                              </div>
                                              <div className="flex justify-between items-center pt-2">
                                                  <span className="text-slate-600 font-bold">Margen (%)</span>
                                                  <input 
                                                    type="number" 
                                                    className="w-16 border border-slate-300 rounded p-1 text-right font-bold text-brand-600 outline-none" 
                                                    value={currentProject.marginPercentage}
                                                    onChange={e => handleFieldChange('marginPercentage', Number(e.target.value))}
                                                  />
                                              </div>
                                              <div className="flex justify-between pt-3 border-t-2 border-slate-300 mt-2">
                                                  <span className="font-bold text-lg text-slate-800">Precio Final</span>
                                                  <span className="font-bold text-lg text-emerald-600">Q{currentProject.finalPrice?.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          </form>
                      )}

                      {/* --- TAB: FINANCE & EXPENSES --- */}
                      {activeTab === 'finance' && (
                          <div className="space-y-6">
                              
                              {/* 1. Financial Report KPI */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Costo Presupuestado (Est.)</p>
                                      <p className="text-2xl font-bold text-slate-800">Q{totalEstimatedCost.toLocaleString()}</p>
                                      <p className="text-xs text-slate-400 mt-1">Materiales + Mano de Obra</p>
                                  </div>
                                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Costo Ejecutado (Real)</p>
                                      <p className={`text-2xl font-bold ${budgetHealth === 'positive' ? 'text-blue-600' : 'text-red-600'}`}>
                                          Q{totalActualExpenses.toLocaleString()}
                                      </p>
                                      <p className="text-xs text-slate-400 mt-1">Total Gastos Registrados</p>
                                      <div className={`absolute top-0 right-0 p-4 opacity-10 ${budgetHealth === 'positive' ? 'bg-blue-500' : 'bg-red-500'}`}>
                                          <Receipt size={40} />
                                      </div>
                                  </div>
                                  <div className={`p-6 rounded-xl border shadow-sm ${budgetHealth === 'positive' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                      <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${budgetHealth === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                                          {budgetHealth === 'positive' ? 'Remanente (A favor)' : 'Sobrecosto (Alerta)'}
                                      </p>
                                      <p className={`text-2xl font-bold ${budgetHealth === 'positive' ? 'text-green-700' : 'text-red-700'}`}>
                                          Q{Math.abs(remainingBudget).toLocaleString()}
                                      </p>
                                      {budgetHealth === 'negative' && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={12}/> Revisa los gastos</p>}
                                  </div>
                              </div>

                              {/* 2. Chart & Table */}
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                  {/* Chart */}
                                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                      <h3 className="font-bold text-slate-800 mb-4">Comparativa de Costos</h3>
                                      <div className="h-64">
                                          <ResponsiveContainer width="100%" height="100%">
                                              <BarChart data={chartData}>
                                                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                  <XAxis dataKey="name" tick={{fontSize: 12}} />
                                                  <YAxis />
                                                  <Tooltip formatter={(value) => `Q${Number(value).toLocaleString()}`} />
                                                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                                      {chartData.map((entry, index) => (
                                                          <Cell key={`cell-${index}`} fill={index === 0 ? '#94a3b8' : (budgetHealth === 'positive' ? '#3b82f6' : '#ef4444')} />
                                                      ))}
                                                  </Bar>
                                              </BarChart>
                                          </ResponsiveContainer>
                                      </div>
                                  </div>

                                  {/* Expenses List */}
                                  <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
                                      <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                                          <h3 className="font-bold text-slate-800 flex items-center gap-2"><Receipt size={16}/> Historial de Gastos</h3>
                                          <button 
                                            onClick={() => setIsAddExpenseModalOpen(true)}
                                            className="bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors shadow-sm"
                                          >
                                              <Plus size={14}/> Registrar Compra/Gasto
                                          </button>
                                      </div>
                                      <div className="flex-1 overflow-y-auto p-0">
                                          {projectExpenses.length > 0 ? (
                                              <table className="w-full text-left text-sm">
                                                  <thead className="bg-slate-50 text-slate-500 sticky top-0">
                                                      <tr>
                                                          <th className="p-3 pl-5">Fecha</th>
                                                          <th className="p-3">Descripción</th>
                                                          <th className="p-3">Categoría</th>
                                                          <th className="p-3 pr-5 text-right">Monto</th>
                                                      </tr>
                                                  </thead>
                                                  <tbody className="divide-y divide-slate-100">
                                                      {projectExpenses.map(exp => (
                                                          <tr key={exp.id} className="hover:bg-slate-50">
                                                              <td className="p-3 pl-5 text-slate-600">{new Date(exp.date).toLocaleDateString()}</td>
                                                              <td className="p-3 font-medium text-slate-800">{exp.description}</td>
                                                              <td className="p-3"><span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs">{exp.category}</span></td>
                                                              <td className="p-3 pr-5 text-right font-bold text-slate-700">Q{exp.amount.toLocaleString()}</td>
                                                          </tr>
                                                      ))}
                                                  </tbody>
                                              </table>
                                          ) : (
                                              <div className="p-10 text-center text-slate-400 flex flex-col items-center">
                                                  <Receipt size={32} className="mb-2 opacity-50"/>
                                                  <p>No se han registrado gastos para este proyecto aún.</p>
                                              </div>
                                          )}
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )}

                  </div>

                  {/* Footer Actions */}
                  <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-between items-center">
                      <p className="text-xs text-slate-400">
                          {activeTab === 'planning' 
                            ? 'Los costos calculados aquí son una estimación para la cotización.' 
                            : 'Los gastos registrados aquí afectan el reporte global de la empresa.'}
                      </p>
                      <div className="flex gap-3">
                          <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">Cerrar</button>
                          {activeTab === 'planning' && (
                              <button onClick={handleSave} className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-bold shadow-lg shadow-brand-500/30 flex items-center gap-2 transition-colors">
                                  <Save size={18} /> Guardar Cambios
                              </button>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* ADD EXPENSE MODAL (Nested) */}
      {isAddExpenseModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                  <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="font-bold text-slate-800">Registrar Gasto del Proyecto</h3>
                      <button onClick={() => setIsAddExpenseModalOpen(false)}><X size={20} className="text-slate-400"/></button>
                  </div>
                  <form onSubmit={handleAddProjectExpense} className="p-6 space-y-4">
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Fecha</label>
                          <input type="date" className="w-full border border-slate-300 rounded-lg p-2" value={newProjectExpense.date} onChange={e => setNewProjectExpense({...newProjectExpense, date: e.target.value})} />
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Descripción</label>
                          <input required type="text" className="w-full border border-slate-300 rounded-lg p-2" placeholder="Ej. Compra de cableado" value={newProjectExpense.description} onChange={e => setNewProjectExpense({...newProjectExpense, description: e.target.value})} />
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Monto (Q)</label>
                          <input required type="number" step="0.01" className="w-full border border-slate-300 rounded-lg p-2 font-bold" value={newProjectExpense.amount} onChange={e => setNewProjectExpense({...newProjectExpense, amount: Number(e.target.value)})} />
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Categoría</label>
                          <select className="w-full border border-slate-300 rounded-lg p-2" value={newProjectExpense.category} onChange={e => setNewProjectExpense({...newProjectExpense, category: e.target.value})}>
                              <option value="Materiales Proyecto">Materiales</option>
                              <option value="Mano de Obra Extra">Mano de Obra</option>
                              <option value="Transporte">Transporte</option>
                              <option value="Otros">Otros</option>
                          </select>
                      </div>
                      <div className="pt-4 flex justify-end">
                          <button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm">
                              Registrar Gasto
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};
