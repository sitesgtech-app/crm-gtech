








import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/db';
import { User, SalesGoal, Opportunity, OpportunityStage, UserRole, Client, Activity } from '../types';
import { Target, TrendingUp, DollarSign, Award, ChevronLeft, ChevronRight, Edit, Save, Trophy, Phone, Users, Calendar, Mail, MapPin } from 'lucide-react';

interface SalesGoalsProps {
  user: User;
}

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export const SalesGoals: React.FC<SalesGoalsProps> = ({ user }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const [users, setUsers] = useState<User[]>([]);
  const [goals, setGoals] = useState<SalesGoal[]>([]);
  
  // Data for calculation
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  
  // Edit State
  const [editingGoal, setEditingGoal] = useState<SalesGoal | null>(null);

  useEffect(() => {
    // Only load sellers or admins
    const allUsers = db.getUsers().filter(u => u.role === UserRole.VENDEDOR || u.role === UserRole.ADMIN);
    setUsers(allUsers);
    
    // Load Goals for period
    setGoals(db.getSalesGoals(selectedMonth, selectedYear));
    
    // Load ALL data for accurate calculations across team
    setOpportunities(db.getOpportunities(undefined, UserRole.ADMIN));
    setClients(db.getClients(undefined, UserRole.ADMIN));
    setActivities(db.getAllActivities('', UserRole.ADMIN));
  }, [selectedMonth, selectedYear]);

  const changeMonth = (delta: number) => {
    let newMonth = selectedMonth + delta;
    let newYear = selectedYear;
    
    if (newMonth > 11) {
        newMonth = 0;
        newYear++;
    } else if (newMonth < 0) {
        newMonth = 11;
        newYear--;
    }
    
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  const handleEditGoal = (userId: string) => {
    // Only Admin can edit
    if (user.role !== UserRole.ADMIN) return;

    const existing = goals.find(g => g.userId === userId);
    if (existing) {
        setEditingGoal(existing);
    } else {
        setEditingGoal({
            id: `g-${userId}-${selectedMonth}-${selectedYear}`,
            userId,
            month: selectedMonth,
            year: selectedYear,
            revenueTarget: 0,
            dealsTarget: 0,
            leadsTarget: 0,
            callsTarget: 0,
            emailsTarget: 0,
            visitsTarget: 0
        });
    }
  };

  const handleSaveGoal = (e: React.FormEvent) => {
      e.preventDefault();
      if (editingGoal) {
          db.saveSalesGoal(editingGoal);
          setGoals(db.getSalesGoals(selectedMonth, selectedYear));
          setEditingGoal(null);
      }
  };

  // --- KPI CALCULATION ENGINE ---
  const getPerformance = (userId: string) => {
      // 1. REVENUE & DEALS (Bottom of Funnel)
      const userWonOpps = opportunities.filter(o => {
          if (o.responsibleId !== userId) return false;
          if (o.stage !== OpportunityStage.GANADA) return false;
          
          const closeDate = new Date(o.lastUpdated); 
          return closeDate.getMonth() === selectedMonth && closeDate.getFullYear() === selectedYear;
      });

      const actualRevenue = userWonOpps.reduce((sum, o) => sum + o.amount, 0);
      const actualDeals = userWonOpps.length;

      // 2. NEW PROSPECTS (Top of Funnel)
      // Count clients created in this month assigned to this user with tags like 'Nuevo' or simply created this month
      const newClients = clients.filter(c => {
          if (c.responsibleId !== userId && c.assignedAdvisor !== userId) return false;
          const createdDate = new Date(c.createdAt);
          return createdDate.getMonth() === selectedMonth && createdDate.getFullYear() === selectedYear;
      });
      const actualNewLeads = newClients.length;

      // 3. OUTREACH / TELEMARKETING (Activities on NEW CLIENTS)
      // Filter activities done by this user in this month, linked to New Clients
      const outreachActs = activities.filter(a => {
          if (a.responsibleId !== userId) return false;
          const actDate = new Date(a.date);
          
          // Check if activity was done in selected month
          const isSamePeriod = actDate.getMonth() === selectedMonth && actDate.getFullYear() === selectedYear;
          if (!isSamePeriod) return false;

          // Check if linked to a new client (Prospecting)
          const isNewClient = newClients.some(nc => nc.id === a.clientId);
          
          return isNewClient; 
      });

      const actualCalls = outreachActs.filter(a => a.type === 'Llamada').length;
      const actualEmails = outreachActs.filter(a => a.type === 'Correo').length;
      const actualVisits = outreachActs.filter(a => a.type === 'Visita en Frío').length;

      const userGoal = goals.find(g => g.userId === userId) || { 
          revenueTarget: 0, dealsTarget: 0, leadsTarget: 0, callsTarget: 0, emailsTarget: 0, visitsTarget: 0 
      };

      return {
          actualRevenue,
          actualDeals,
          actualNewLeads,
          actualCalls,
          actualEmails,
          actualVisits,
          
          targetRevenue: userGoal.revenueTarget || 0,
          targetDeals: userGoal.dealsTarget || 0,
          targetLeads: userGoal.leadsTarget || 0,
          targetCalls: userGoal.callsTarget || 0,
          targetEmails: userGoal.emailsTarget || 0,
          targetVisits: userGoal.visitsTarget || 0,
          
          // Percentages
          revenuePercent: userGoal.revenueTarget > 0 ? (actualRevenue / userGoal.revenueTarget) * 100 : 0,
          dealsPercent: userGoal.dealsTarget > 0 ? (actualDeals / userGoal.dealsTarget) * 100 : 0,
          leadsPercent: (userGoal.leadsTarget || 0) > 0 ? (actualNewLeads / (userGoal.leadsTarget || 1)) * 100 : 0,
          
          callsPercent: (userGoal.callsTarget || 0) > 0 ? (actualCalls / (userGoal.callsTarget || 1)) * 100 : 0,
          emailsPercent: (userGoal.emailsTarget || 0) > 0 ? (actualEmails / (userGoal.emailsTarget || 1)) * 100 : 0,
          visitsPercent: (userGoal.visitsTarget || 0) > 0 ? (actualVisits / (userGoal.visitsTarget || 1)) * 100 : 0,
      };
  };

  const MetricBar = ({ label, actual, target, color, icon: Icon }: any) => {
      const percent = target > 0 ? (actual / target) * 100 : 0;
      return (
          <div className="mb-3">
              <div className="flex justify-between items-end mb-1">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><Icon size={12}/> {label}</span>
                  <div className="text-right text-xs">
                      <span className={`font-bold ${color}`}>{actual}</span>
                      <span className="text-slate-400 mx-1">/</span>
                      <span className="text-slate-500">{target}</span>
                  </div>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${color.replace('text-', 'bg-')}`} 
                    style={{ width: `${Math.min(percent, 100)}%` }}
                  ></div>
              </div>
          </div>
      );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Metas & Objetivos</h1>
          <p className="text-slate-500 text-sm">Control de ventas, prospección y telemarketing mensual.</p>
        </div>
        
        {/* Month Selector */}
        <div className="flex items-center bg-white rounded-lg shadow-sm border border-slate-200 p-1">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 rounded-md text-slate-600">
                <ChevronLeft size={20} />
            </button>
            <span className="font-bold text-slate-800 w-40 text-center select-none flex items-center justify-center gap-2">
                <Calendar size={16} className="text-brand-500"/> {MONTHS[selectedMonth]} {selectedYear}
            </span>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 rounded-md text-slate-600">
                <ChevronRight size={20} />
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {users.map(u => {
              const stats = getPerformance(u.id);
              const isRevenueMet = stats.actualRevenue >= stats.targetRevenue && stats.targetRevenue > 0;
              
              return (
                  <div key={u.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden group flex flex-col h-full">
                      {/* Card Header */}
                      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                              <img src={u.avatar} alt={u.name} className="w-12 h-12 rounded-full border border-slate-200" />
                              <div>
                                  <h3 className="font-bold text-slate-800 text-lg">{u.name}</h3>
                                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full uppercase tracking-wider">{u.role}</span>
                              </div>
                          </div>
                          {isRevenueMet && (
                              <div className="text-yellow-500 animate-pulse bg-yellow-50 p-2 rounded-full shadow-sm">
                                  <Trophy size={24} />
                              </div>
                          )}
                      </div>

                      <div className="p-0 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 flex-1">
                          
                          {/* COLUMN 1: CIERRE & FACTURACION */}
                          <div className="p-5 space-y-6">
                              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                  <DollarSign size={14}/> Cierre & Ventas
                              </h4>

                              {/* Revenue Progress */}
                              <div>
                                  <div className="flex justify-between items-end mb-2">
                                      <span className="text-sm font-bold text-slate-700">Facturación</span>
                                      <div className="text-right">
                                          <span className="text-lg font-bold text-emerald-600">Q{stats.actualRevenue.toLocaleString()}</span>
                                          <span className="text-xs text-slate-400 mx-1">/</span>
                                          <span className="text-xs font-medium text-slate-500">Q{stats.targetRevenue.toLocaleString()}</span>
                                      </div>
                                  </div>
                                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full rounded-full transition-all duration-1000 ${
                                            stats.revenuePercent >= 100 ? 'bg-emerald-500' : 
                                            stats.revenuePercent >= 50 ? 'bg-emerald-400' : 'bg-emerald-300'
                                        }`} 
                                        style={{ width: `${Math.min(stats.revenuePercent, 100)}%` }}
                                      ></div>
                                  </div>
                              </div>

                              {/* Deals Progress */}
                              <MetricBar 
                                  label="Cierres Ganados" 
                                  actual={stats.actualDeals} 
                                  target={stats.targetDeals} 
                                  color="text-blue-500"
                                  icon={Award}
                              />
                          </div>

                          {/* COLUMN 2: PROSPECCION DETALLADA */}
                          <div className="p-5 bg-slate-50/30">
                              <h4 className="text-xs font-bold text-purple-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                  <Phone size={14}/> Prospección (En Frío)
                              </h4>
                              
                              <div className="space-y-4">
                                  {/* Prospectos Nuevos */}
                                  <MetricBar 
                                      label="Prospectos Nuevos" 
                                      actual={stats.actualNewLeads} 
                                      target={stats.targetLeads} 
                                      color="text-purple-600"
                                      icon={Users}
                                  />
                                  
                                  <div className="pt-2 border-t border-slate-100 space-y-3">
                                      <MetricBar 
                                          label="Llamadas en Frío" 
                                          actual={stats.actualCalls} 
                                          target={stats.targetCalls} 
                                          color="text-indigo-600"
                                          icon={Phone}
                                      />
                                      <MetricBar 
                                          label="Correos Enviados" 
                                          actual={stats.actualEmails} 
                                          target={stats.targetEmails} 
                                          color="text-yellow-600"
                                          icon={Mail}
                                      />
                                      <MetricBar 
                                          label="Visitas en Frío" 
                                          actual={stats.actualVisits} 
                                          target={stats.targetVisits} 
                                          color="text-red-500"
                                          icon={MapPin}
                                      />
                                  </div>
                              </div>
                          </div>

                      </div>

                      {/* Footer Actions - ONLY ADMIN CAN EDIT */}
                      {user.role === UserRole.ADMIN && (
                          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end mt-auto">
                              <button 
                                onClick={() => handleEditGoal(u.id)}
                                className="flex items-center gap-2 text-sm text-brand-600 font-bold hover:text-brand-800 transition-colors bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm"
                              >
                                  <Edit size={14} /> Asignar Metas
                              </button>
                          </div>
                      )}
                  </div>
              );
          })}
      </div>

      {/* Edit Modal (Admin Only) */}
      {editingGoal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl transform transition-all scale-100 max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                      <div>
                          <h2 className="text-xl font-bold text-slate-800">Asignar Metas Mensuales</h2>
                          <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                              <Calendar size={14}/> {MONTHS[selectedMonth]} {selectedYear}
                          </p>
                      </div>
                      <div className="text-right hidden sm:block">
                          <p className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-1 rounded">
                             Configuración Admin
                          </p>
                      </div>
                  </div>
                  
                  <form onSubmit={handleSaveGoal} className="p-6 grid grid-cols-2 gap-6">
                      
                      {/* Section: Sales */}
                      <div className="col-span-2 md:col-span-1 space-y-4">
                          <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
                              <DollarSign size={14} /> Ventas (Cierre)
                          </h3>
                          <div>
                              <label className="block text-sm font-bold text-slate-700 mb-1">Facturación (Q)</label>
                              <input 
                                type="number" 
                                className="w-full border border-slate-300 rounded-lg p-2.5 bg-white font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                                value={editingGoal.revenueTarget}
                                onChange={(e) => setEditingGoal({...editingGoal, revenueTarget: Number(e.target.value)})}
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-bold text-slate-700 mb-1">Cierres (Cantidad)</label>
                              <input 
                                type="number" 
                                className="w-full border border-slate-300 rounded-lg p-2.5 bg-white font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                                value={editingGoal.dealsTarget}
                                onChange={(e) => setEditingGoal({...editingGoal, dealsTarget: Number(e.target.value)})}
                              />
                          </div>
                      </div>

                      {/* Section: Prospecting */}
                      <div className="col-span-2 md:col-span-1 space-y-4 bg-purple-50 p-4 rounded-xl border border-purple-100">
                          <h3 className="text-xs font-bold text-purple-600 uppercase tracking-wider border-b border-purple-200 pb-2 flex items-center gap-2">
                              <Phone size={14} /> Metas de Prospección
                          </h3>
                          
                          <div>
                              <label className="block text-sm font-bold text-slate-700 mb-1">Prospectos Nuevos</label>
                              <input 
                                type="number" 
                                className="w-full border border-purple-200 rounded-lg p-2.5 bg-white font-bold text-slate-800 focus:ring-2 focus:ring-purple-500 outline-none"
                                value={editingGoal.leadsTarget || 0}
                                onChange={(e) => setEditingGoal({...editingGoal, leadsTarget: Number(e.target.value)})}
                              />
                              <p className="text-[10px] text-purple-400 mt-1">Clientes Nuevos a crear</p>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                             <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Llamadas</label>
                                <input 
                                    type="number" 
                                    className="w-full border border-purple-200 rounded p-2 bg-white text-sm"
                                    value={editingGoal.callsTarget || 0}
                                    onChange={(e) => setEditingGoal({...editingGoal, callsTarget: Number(e.target.value)})}
                                />
                             </div>
                             <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Correos</label>
                                <input 
                                    type="number" 
                                    className="w-full border border-purple-200 rounded p-2 bg-white text-sm"
                                    value={editingGoal.emailsTarget || 0}
                                    onChange={(e) => setEditingGoal({...editingGoal, emailsTarget: Number(e.target.value)})}
                                />
                             </div>
                             <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Visitas Frío</label>
                                <input 
                                    type="number" 
                                    className="w-full border border-purple-200 rounded p-2 bg-white text-sm"
                                    value={editingGoal.visitsTarget || 0}
                                    onChange={(e) => setEditingGoal({...editingGoal, visitsTarget: Number(e.target.value)})}
                                />
                             </div>
                          </div>
                          <p className="text-[10px] text-purple-400 mt-1 text-center">Actividades a realizar sobre los nuevos prospectos</p>
                      </div>

                      <div className="col-span-2 flex justify-end gap-3 pt-4 border-t border-slate-100 sticky bottom-0 bg-white">
                          <button type="button" onClick={() => setEditingGoal(null)} className="px-5 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium transition-colors">Cancelar</button>
                          <button type="submit" className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-bold flex items-center gap-2 shadow-lg shadow-brand-500/30">
                              <Save size={16} /> Guardar Metas
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};
