
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/db';
import { User, UserRole, Activity, Opportunity, OpportunityStage } from '../types';
import { Phone, Mail, MessageCircle, Users, MapPin, Calendar, Search, Filter, FileText, DollarSign } from 'lucide-react';

interface ActivitiesProps {
  user: User;
}

export const Activities: React.FC<ActivitiesProps> = ({ user }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [allOpps, setAllOpps] = useState<Opportunity[]>([]);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  useEffect(() => {
    // Load users based on role permission
    const allUsers = db.getUsers();
    if (user.role === UserRole.ADMIN) {
        setUsers(allUsers);
        setAllOpps(db.getOpportunities(undefined, UserRole.ADMIN));
    } else {
        setUsers(allUsers.filter(u => u.id === user.id));
        setAllOpps(db.getOpportunities(user.id, user.role));
    }

    // Load all activities
    setActivities(db.getAllActivities(user.id, user.role));
  }, [user]);

  // Helper to filter activities by date
  const filterActivitiesByDate = (acts: Activity[]) => {
    const now = new Date();
    return acts.filter(a => {
        const actDate = new Date(a.date);
        if (dateFilter === 'today') {
            return actDate.toDateString() === now.toDateString();
        }
        if (dateFilter === 'week') {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(now.getDate() - 7);
            return actDate >= oneWeekAgo;
        }
        if (dateFilter === 'month') {
            return actDate.getMonth() === now.getMonth() && actDate.getFullYear() === now.getFullYear();
        }
        return true;
    });
  };

  // Process data grouped by user
  const activityReport = useMemo(() => {
    const filteredTotal = filterActivitiesByDate(activities);

    return users.map(u => {
        const userActs = filteredTotal.filter(a => a.responsibleId === u.id);
        
        // Proposal Calculations (Taken from Opportunities stage: 'Envío de propuesta')
        // We filter proposals that are CURRENTLY in proposal stage, or we could track history if we had a history table.
        // For this requirement, we look at opportunities in 'PROPUESTA' stage.
        const userProposals = allOpps.filter(o => o.responsibleId === u.id && o.stage === OpportunityStage.PROPUESTA);
        const proposalAmount = userProposals.reduce((acc, curr) => acc + curr.amount, 0);
        const proposalCount = userProposals.length;

        return {
            user: u,
            total: userActs.length,
            calls: userActs.filter(a => a.type === 'Llamada').length,
            emails: userActs.filter(a => a.type === 'Correo').length,
            whatsapp: userActs.filter(a => a.type === 'WhatsApp').length,
            meetings: userActs.filter(a => a.type === 'Reunión').length,
            technical: userActs.filter(a => a.type === 'Visita Técnica').length,
            recent: userActs.slice(0, 3), // Last 3 activities
            proposalCount,
            proposalAmount
        };
    }).sort((a, b) => b.total - a.total); // Sort by most active
  }, [users, activities, dateFilter, allOpps]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Reporte de Actividades</h1>
          <p className="text-slate-500 text-sm">Seguimiento detallado y control de propuestas enviadas.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm overflow-x-auto max-w-full">
            <button 
                onClick={() => setDateFilter('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${dateFilter === 'all' ? 'bg-brand-100 text-brand-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
                Histórico
            </button>
            <button 
                onClick={() => setDateFilter('month')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${dateFilter === 'month' ? 'bg-brand-100 text-brand-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
                Este Mes
            </button>
            <button 
                onClick={() => setDateFilter('week')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${dateFilter === 'week' ? 'bg-brand-100 text-brand-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
                Esta Semana
            </button>
            <button 
                onClick={() => setDateFilter('today')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${dateFilter === 'today' ? 'bg-brand-100 text-brand-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
                Hoy
            </button>
        </div>
      </div>

      {/* New Section: Sent Quotations/Proposals Report */}
      <div className="bg-slate-800 rounded-xl shadow-md overflow-hidden">
          <div className="p-4 border-b border-slate-700 flex items-center gap-2">
              <FileText className="text-blue-400 w-5 h-5" />
              <h3 className="text-lg font-bold text-white">Control de Cotizaciones Enviadas (Propuestas Activas)</h3>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activityReport.map(data => (
                  <div key={data.user.id} className="bg-slate-700 rounded-lg p-4 border border-slate-600 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                          <img 
                            src={data.user.avatar} 
                            className="w-10 h-10 rounded-full border-2 border-slate-500" 
                            alt={data.user.name}
                          />
                          <div>
                              <p className="text-white font-medium text-sm">{data.user.name}</p>
                              <p className="text-slate-400 text-xs">{data.proposalCount} propuestas</p>
                          </div>
                      </div>
                      <div className="text-right">
                          <p className="text-xs text-slate-400 uppercase">Monto Total</p>
                          <p className="text-lg font-bold text-emerald-400">Q{data.proposalAmount.toLocaleString()}</p>
                      </div>
                  </div>
              ))}
          </div>
      </div>

      {/* Activity Breakdown Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {activityReport.map((data) => (
            <div key={data.user.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Card Header */}
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <img 
                            src={data.user.avatar || `https://ui-avatars.com/api/?name=${data.user.name}`} 
                            alt={data.user.name} 
                            className="w-10 h-10 rounded-full bg-white border border-slate-200 object-cover"
                        />
                        <div>
                            <h3 className="font-bold text-slate-800">{data.user.name}</h3>
                            <p className="text-xs text-slate-500">{data.user.role}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-bold text-slate-400 uppercase">Total Gestiones</p>
                        <p className="text-xl font-bold text-brand-600">{data.total}</p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="p-4">
                    <div className="grid grid-cols-5 gap-2 mb-6">
                        <div className="flex flex-col items-center p-2 bg-blue-50 rounded-lg border border-blue-100">
                            <Phone className="w-4 h-4 text-brand-600 mb-1" />
                            <span className="text-lg font-bold text-slate-800">{data.calls}</span>
                            <span className="text-[10px] text-slate-500 uppercase">Llamadas</span>
                        </div>
                        <div className="flex flex-col items-center p-2 bg-yellow-50 rounded-lg border border-yellow-100">
                            <Mail className="w-4 h-4 text-yellow-600 mb-1" />
                            <span className="text-lg font-bold text-slate-800">{data.emails}</span>
                            <span className="text-[10px] text-slate-500 uppercase">Correos</span>
                        </div>
                        <div className="flex flex-col items-center p-2 bg-green-50 rounded-lg border border-green-100">
                            <MessageCircle className="w-4 h-4 text-green-600 mb-1" />
                            <span className="text-lg font-bold text-slate-800">{data.whatsapp}</span>
                            <span className="text-[10px] text-slate-500 uppercase">WA</span>
                        </div>
                        <div className="flex flex-col items-center p-2 bg-indigo-50 rounded-lg border border-indigo-100">
                            <Users className="w-4 h-4 text-indigo-600 mb-1" />
                            <span className="text-lg font-bold text-slate-800">{data.meetings}</span>
                            <span className="text-[10px] text-slate-500 uppercase">Reunión</span>
                        </div>
                        <div className="flex flex-col items-center p-2 bg-purple-50 rounded-lg border border-purple-100">
                            <MapPin className="w-4 h-4 text-purple-600 mb-1" />
                            <span className="text-lg font-bold text-slate-800">{data.technical}</span>
                            <span className="text-[10px] text-slate-500 uppercase">Visita</span>
                        </div>
                    </div>

                    {/* Recent Activity List */}
                    <div>
                        <h4 className="text-xs font-bold text-slate-700 mb-3 uppercase flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Últimas Gestiones
                        </h4>
                        <div className="space-y-3">
                            {data.recent.length > 0 ? (
                                data.recent.map(act => (
                                    <div key={act.id} className="flex gap-3 items-start text-sm border-b border-slate-50 pb-2 last:border-0">
                                        <div className={`w-1.5 h-1.5 mt-1.5 rounded-full shrink-0 ${
                                            act.type === 'Llamada' ? 'bg-brand-500' :
                                            act.type === 'Visita Técnica' ? 'bg-purple-500' :
                                            'bg-slate-400'
                                        }`} />
                                        <div>
                                            <div className="flex justify-between w-full gap-2">
                                                <p className="font-medium text-slate-700 text-xs">{act.type}</p>
                                                <span className="text-[10px] text-slate-400">{new Date(act.date).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-xs text-slate-500 line-clamp-1">{act.description}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-slate-400 italic text-center py-2">Sin actividad reciente</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};
