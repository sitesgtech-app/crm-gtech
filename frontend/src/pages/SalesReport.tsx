


import React, { useMemo, useState, useEffect } from 'react';
import { db } from '../services/db';
import { User, OpportunityStage, UserRole } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Download, User as UserIcon, AlertCircle, CheckCircle, XCircle, Clock, Target, Phone, Mail, MapPin } from 'lucide-react';

interface SalesReportProps {
  user: User;
}

export const SalesReport: React.FC<SalesReportProps> = ({ user }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [allOpps, setAllOpps] = useState<any[]>([]);
  const [salesGoals, setSalesGoals] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);

  useEffect(() => {
    setUsers(db.getUsers());
    // Fetch ALL data needed for calculations
    setAllOpps(db.getOpportunities(undefined, UserRole.ADMIN)); 
    setActivities(db.getAllActivities('', UserRole.ADMIN));
    setClients(db.getClients(undefined, UserRole.ADMIN));
    
    // Get Goals for CURRENT month
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    setSalesGoals(db.getSalesGoals(currentMonth, currentYear));

  }, []);

  const reportData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return users.filter(u => u.role === UserRole.VENDEDOR || u.role === UserRole.ADMIN).map(u => {
      // 1. Sales Data
      const userOpps = allOpps.filter(o => o.responsibleId === u.id || o.assignedAdvisor === u.id);
      
      const wonOpps = userOpps.filter(o => o.stage === OpportunityStage.GANADA);
      const wonAmount = wonOpps.reduce((sum, o) => sum + o.amount, 0);

      const lostOpps = userOpps.filter(o => o.stage === OpportunityStage.PERDIDA);
      const lostAmount = lostOpps.reduce((sum, o) => sum + o.amount, 0);

      const overdueOpps = userOpps.filter(o => {
        const isClosed = o.stage === OpportunityStage.GANADA || o.stage === OpportunityStage.PERDIDA;
        const closeDate = new Date(o.estimatedCloseDate);
        return !isClosed && closeDate < now;
      });
      const overdueAmount = overdueOpps.reduce((sum, o) => sum + o.amount, 0);

      // 2. Prospecting Data (Actuals vs Goals)
      const userGoal = salesGoals.find(g => g.userId === u.id) || {
          leadsTarget: 0, callsTarget: 0, emailsTarget: 0, visitsTarget: 0
      };

      // New Clients created this month
      const newClients = clients.filter(c => {
          if (c.responsibleId !== u.id && c.assignedAdvisor !== u.id) return false;
          const createdDate = new Date(c.createdAt);
          return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
      });
      const actualLeads = newClients.length;

      // Activities on New Clients (Cold Outreach)
      const outreachActs = activities.filter(a => {
          if (a.responsibleId !== u.id) return false;
          const actDate = new Date(a.date);
          const isSamePeriod = actDate.getMonth() === currentMonth && actDate.getFullYear() === currentYear;
          if (!isSamePeriod) return false;
          return newClients.some(nc => nc.id === a.clientId); 
      });

      const actualCalls = outreachActs.filter(a => a.type === 'Llamada').length;
      const actualEmails = outreachActs.filter(a => a.type === 'Correo').length;
      const actualVisits = outreachActs.filter(a => a.type === 'Visita en Frío').length;

      return {
        user: u,
        // Sales Stats
        wonCount: wonOpps.length,
        wonAmount,
        lostCount: lostOpps.length,
        lostAmount,
        overdueCount: overdueOpps.length,
        overdueAmount,
        totalOpps: userOpps.length,
        
        // Prospecting Stats
        goals: userGoal,
        actualLeads,
        actualCalls,
        actualEmails,
        actualVisits
      };
    });
  }, [users, allOpps, salesGoals, activities, clients]);

  // Data for Sales Chart
  const chartData = reportData.map(d => ({
    name: d.user.name.split(' ')[0], // First name for chart
    Ganadas: d.wonAmount,
    Perdidas: d.lostAmount,
    Vencidas: d.overdueAmount
  }));

  const GoalProgress = ({ label, current, target, icon: Icon, color }: any) => {
      const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
      return (
          <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs">
                  <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                      <Icon size={12} className={color}/> {label}
                  </span>
                  <span className="text-slate-500">
                      <strong className={color}>{current}</strong> / {target}
                  </span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${color.replace('text-', 'bg-')}`} style={{ width: `${percentage}%` }}></div>
              </div>
          </div>
      );
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Reporte de Rendimiento por Vendedor</h1>
          <p className="text-slate-500">Análisis de efectividad, pérdidas y cumplimiento de metas.</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-white border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar Datos
        </button>
      </div>

      {/* Chart Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="font-bold text-slate-800 mb-6">Comparativa de Montos de Venta (Q)</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `Q${Number(value).toLocaleString()}`} />
              <Legend />
              <Bar dataKey="Ganadas" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Vencidas" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Perdidas" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Cards */}
      <div className="grid grid-cols-1 gap-6">
        {reportData.map((data) => (
          <div key={data.user.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img 
                  src={data.user.avatar} 
                  alt={data.user.name}
                  className="w-10 h-10 rounded-full bg-white border border-slate-200 object-cover"
                />
                <div>
                  <h3 className="font-bold text-slate-800">{data.user.name}</h3>
                  <p className="text-xs text-slate-500">{data.user.email}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-400 uppercase">Total Oportunidades</span>
                <p className="font-bold text-slate-800">{data.totalOpps}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
              
              {/* Left Side: Sales Metrics */}
              <div className="p-4 grid grid-cols-3 gap-4">
                  <div className="col-span-3 pb-2 border-b border-slate-50 mb-2">
                       <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Resultado de Ventas</h4>
                  </div>

                  {/* Ganadas */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="p-1 bg-green-100 text-green-600 rounded-full">
                        <CheckCircle size={12} />
                      </div>
                      <span className="font-medium text-slate-700 text-sm">Ganadas</span>
                    </div>
                    <div>
                        <p className="text-lg font-bold text-slate-800">Q{data.wonAmount.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-400">{data.wonCount} ventas</p>
                    </div>
                  </div>

                  {/* Vencidas */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="p-1 bg-yellow-100 text-yellow-600 rounded-full">
                        <Clock size={12} />
                      </div>
                      <span className="font-medium text-slate-700 text-sm">Vencidas</span>
                    </div>
                    <div>
                        <p className="text-lg font-bold text-slate-800">Q{data.overdueAmount.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-400">{data.overdueCount} atrasadas</p>
                    </div>
                  </div>

                  {/* Perdidas */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="p-1 bg-red-100 text-red-600 rounded-full">
                        <XCircle size={12} />
                      </div>
                      <span className="font-medium text-slate-700 text-sm">Perdidas</span>
                    </div>
                    <div>
                        <p className="text-lg font-bold text-slate-800">Q{data.lostAmount.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-400">{data.lostCount} oportunidades</p>
                    </div>
                  </div>
              </div>

              {/* Right Side: Prospecting Goals */}
              <div className="p-4 bg-purple-50/20">
                   <div className="flex justify-between items-center pb-2 border-b border-purple-100 mb-4">
                       <h4 className="text-xs font-bold text-purple-600 uppercase tracking-widest flex items-center gap-2">
                           <Target size={14}/> Cumplimiento Metas de Prospección
                       </h4>
                       <span className="text-[10px] text-purple-400 font-medium bg-purple-50 px-2 py-0.5 rounded-full">Mes Actual</span>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                       <GoalProgress 
                           label="Prospectos Nuevos" 
                           current={data.actualLeads} 
                           target={data.goals.leadsTarget || 0}
                           icon={UserIcon}
                           color="text-purple-600"
                       />
                       <GoalProgress 
                           label="Llamadas en Frío" 
                           current={data.actualCalls} 
                           target={data.goals.callsTarget || 0}
                           icon={Phone}
                           color="text-indigo-600"
                       />
                       <GoalProgress 
                           label="Correos Enviados" 
                           current={data.actualEmails} 
                           target={data.goals.emailsTarget || 0}
                           icon={Mail}
                           color="text-yellow-600"
                       />
                       <GoalProgress 
                           label="Visitas en Frío" 
                           current={data.actualVisits} 
                           target={data.goals.visitsTarget || 0}
                           icon={MapPin}
                           color="text-red-500"
                       />
                   </div>
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
};