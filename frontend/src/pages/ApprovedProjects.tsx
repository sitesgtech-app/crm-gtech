
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Project, ProjectStatus, User, Client } from '../types';
import { Search, Calendar, CheckCircle, Play, CheckSquare, Package, DollarSign, Clock, Briefcase, AlertTriangle } from 'lucide-react';

interface ApprovedProjectsProps {
  user: User;
}

export const ApprovedProjects: React.FC<ApprovedProjectsProps> = ({ user }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    const allProjects = db.getProjects();
    // Filter only Approved, Reviewed (Ready for purchase), or In Execution projects
    const activeProjects = allProjects.filter(p => 
        p.status === ProjectStatus.APROBADO || 
        p.status === ProjectStatus.REVISADO || 
        p.status === ProjectStatus.EN_EJECUCION
    );
    setProjects(activeProjects);
    setClients(db.getClients());
  };

  const getClientName = (id: string) => clients.find(c => c.id === id)?.company || 'Desconocido';

  const filteredProjects = projects.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getClientName(p.clientId).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const updateStatus = (project: Project, newStatus: ProjectStatus) => {
      if (!window.confirm(`¿Cambiar estado del proyecto a: ${newStatus}?`)) return;
      
      const updatedProject = { ...project, status: newStatus };
      db.saveProject(updatedProject);
      refreshData();
  };

  const getStatusColor = (status: ProjectStatus) => {
      switch (status) {
          case ProjectStatus.APROBADO: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
          case ProjectStatus.REVISADO: return 'bg-purple-100 text-purple-700 border-purple-200';
          case ProjectStatus.EN_EJECUCION: return 'bg-blue-100 text-blue-700 border-blue-200';
          default: return 'bg-slate-100 text-slate-700';
      }
  };

  const getProgress = (start: string, end: string) => {
      const startDate = new Date(start).getTime();
      const endDate = new Date(end).getTime();
      const now = new Date().getTime();
      const total = endDate - startDate;
      const elapsed = now - startDate;
      
      if (elapsed < 0) return 0;
      if (elapsed > total) return 100;
      return Math.round((elapsed / total) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 font-lato">Ejecución de Proyectos</h1>
          <p className="text-slate-500 text-sm">Seguimiento operativo de proyectos aprobados.</p>
        </div>
        
        <div className="relative">
             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
             <input 
               className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500 bg-white w-full md:w-64"
               placeholder="Buscar proyecto..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.map(p => {
              const progress = getProgress(p.startDate, p.endDate);
              const budget = (p.totalMaterialCost || 0) + (p.totalLaborCost || 0);
              
              return (
                  <div key={p.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all flex flex-col">
                      {/* Header */}
                      <div className="p-5 border-b border-slate-100 bg-slate-50/30 relative">
                          <div className="flex justify-between items-start mb-2">
                              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getStatusColor(p.status)}`}>
                                  {p.status}
                              </span>
                              {progress >= 100 && p.status !== ProjectStatus.FINALIZADO && (
                                  <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                                      <AlertTriangle size={10}/> Vencido
                                  </span>
                              )}
                          </div>
                          <h3 className="font-bold text-slate-800 text-lg mb-1 leading-tight">{p.name}</h3>
                          <p className="text-sm text-slate-500 flex items-center gap-1"><Briefcase size={14}/> {getClientName(p.clientId)}</p>
                      </div>

                      {/* Body */}
                      <div className="p-5 space-y-4 flex-1">
                          {/* Dates & Progress */}
                          <div>
                              <div className="flex justify-between text-xs text-slate-500 mb-1">
                                  <span>Inicio: {new Date(p.startDate).toLocaleDateString()}</span>
                                  <span>Fin: {new Date(p.endDate).toLocaleDateString()}</span>
                              </div>
                              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${progress >= 100 ? 'bg-red-500' : 'bg-brand-500'}`} style={{ width: `${progress}%` }}></div>
                              </div>
                              <p className="text-right text-[10px] text-slate-400 mt-1">{progress}% Tiempo Transcurrido</p>
                          </div>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-2 gap-3">
                              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                  <p className="text-xs text-slate-400 font-bold uppercase flex items-center gap-1"><Package size={12}/> Materiales</p>
                                  <p className="text-sm font-bold text-slate-700">{p.materials?.length || 0} items</p>
                              </div>
                              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                  <p className="text-xs text-slate-400 font-bold uppercase flex items-center gap-1"><DollarSign size={12}/> Presupuesto</p>
                                  <p className="text-sm font-bold text-slate-700">Q{budget.toLocaleString()}</p>
                              </div>
                          </div>
                      </div>

                      {/* Actions Footer */}
                      <div className="p-4 bg-slate-50 border-t border-slate-100">
                          {p.status === ProjectStatus.APROBADO && (
                              <button 
                                onClick={() => updateStatus(p, ProjectStatus.REVISADO)}
                                className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-colors"
                              >
                                  <CheckSquare size={14}/> Marcar como Revisado
                              </button>
                          )}
                          
                          {p.status === ProjectStatus.REVISADO && (
                              <button 
                                onClick={() => updateStatus(p, ProjectStatus.EN_EJECUCION)}
                                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-colors"
                              >
                                  <Play size={14}/> Iniciar Ejecución
                              </button>
                          )}

                          {p.status === ProjectStatus.EN_EJECUCION && (
                              <button 
                                onClick={() => updateStatus(p, ProjectStatus.FINALIZADO)}
                                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-colors"
                              >
                                  <CheckCircle size={14}/> Finalizar Proyecto
                              </button>
                          )}
                      </div>
                  </div>
              );
          })}

          {filteredProjects.length === 0 && (
              <div className="col-span-full py-16 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-400">
                  <Briefcase size={48} className="mx-auto mb-4 opacity-20"/>
                  <p className="font-medium">No hay proyectos aprobados o en ejecución.</p>
                  <p className="text-xs mt-1">Los proyectos deben ser aprobados desde la etapa de Planificación.</p>
              </div>
          )}
      </div>
    </div>
  );
};
