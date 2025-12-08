
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { DollarSign, Briefcase, CheckCircle, Clock, Trash2, TrendingUp, Users, Target, ListTodo, AlertCircle, Sparkles } from 'lucide-react';
import { db } from '../services/db';
import api from '../services/api';
import { User, OpportunityStage, TaskStatus, TaskPriority } from '../types';

interface DashboardProps {
  user: User;
}

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [opportunities, setOpportunities] = React.useState<any[]>([]);
  const [tasks, setTasks] = React.useState<any[]>([]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch real data
        const dealsRes = await api.get('/deals');
        const deals = dealsRes.data.map((d: any) => ({
          ...d,
          amount: d.value || 0,
          name: d.title
        }));
        setOpportunities(deals);

        // Tasks/Tickets still mixed? db.getTasks is used below.
        // Let's keep tasks local/db for now if no endpoint, or check routes. 
        // Routes has /tickets. Let's try to fetch /tickets if possible?
        // User specifically asked about "visualizar informacion de los demas", primarily deals/kanban.
        // Let's safely default tasks to local for dashboard to avoid breakage if ticket structure differs too much.
        setTasks(db.getTasks(user.id, user.role));
      } catch (error) {
        console.error("Dashboard fetch error", error);
      }
    };
    fetchData();
  }, [user]);

  // Calculate Stats on the fly from fetched opportunities
  const stats = React.useMemo(() => {
    // Mocking db.getStats logic but with real `opportunities` state
    const totalActive = opportunities.filter(o => o.stage !== OpportunityStage.GANADA && o.stage !== OpportunityStage.PERDIDA).length;
    const totalWon = opportunities.filter(o => o.stage === OpportunityStage.GANADA).length;
    const amountWon = opportunities.filter(o => o.stage === OpportunityStage.GANADA).reduce((acc, o) => acc + o.amount, 0);
    const amountPipeline = opportunities.filter(o => o.stage !== OpportunityStage.GANADA && o.stage !== OpportunityStage.PERDIDA).reduce((acc, o) => acc + o.amount, 0);
    const totalDeleted = opportunities.filter(o => o.stage === OpportunityStage.PERDIDA).length;

    return { totalActive, totalWon, amountWon, amountPipeline, totalDeleted };
  }, [opportunities]);

  const funnelData = React.useMemo(() => {
    const stages = Object.values(OpportunityStage);
    return stages.map(stage => ({
      name: stage,
      count: opportunities.filter(o => o.stage === stage).length,
      value: opportunities.filter(o => o.stage === stage).reduce((acc, curr) => acc + curr.amount, 0)
    }));
  }, [opportunities]);

  const pendingTasks = useMemo(() => {
    return tasks
      .filter(t => t.status !== TaskStatus.FINALIZADA)
      .sort((a, b) => {
        const pMap: Record<string, number> = { [TaskPriority.URGENTE]: 0, [TaskPriority.ALTA]: 1, [TaskPriority.MEDIA]: 2, [TaskPriority.BAJA]: 3 };
        return pMap[a.priority] - pMap[b.priority];
      })
      .slice(0, 5);
  }, [tasks]);

  const recentActivities = [
    { id: 1, text: "Juan Pérez (Tech Solutions) movido a Negociación", time: "2h atrás", type: 'update' },
    { id: 2, text: "Nueva oportunidad creada: Importadora S.A.", time: "4h atrás", type: 'new' },
    { id: 3, text: "Reunión agendada con María López", time: "5h atrás", type: 'meeting' },
    { id: 4, text: "Cierre exitoso: Ministerio de Educación", time: "1d atrás", type: 'win' },
  ];

  const KpiCard = ({ title, value, icon: Icon, colorClass, gradient }: any) => (
    <div className={`relative overflow-hidden rounded-2xl p-6 shadow-sm border border-slate-100 bg-white group hover:shadow-lg hover:-translate-y-1 transition-all duration-300`}>
      <div className="relative z-10 flex justify-between items-start">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-lato">{title}</p>
          <h3 className="text-3xl font-bold text-slate-800 tracking-tight font-lato">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${colorClass} shadow-inner`}>
          <Icon size={24} />
        </div>
      </div>
      {/* Decorative Gradient Blob */}
      <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full opacity-10 blur-2xl transition-transform group-hover:scale-150 ${gradient}`}></div>
    </div>
  );

  const getPriorityColor = (p: TaskPriority) => {
    switch (p) {
      case TaskPriority.URGENTE: return 'bg-red-100 text-red-700';
      case TaskPriority.ALTA: return 'bg-orange-100 text-orange-700';
      case TaskPriority.MEDIA: return 'bg-blue-100 text-blue-700';
      case TaskPriority.BAJA: return 'bg-slate-100 text-slate-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-8">

      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-brand-900 to-brand-800 p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 opacity-80">
              <Sparkles size={16} className="text-yellow-400" />
              <span className="text-xs font-bold uppercase tracking-widest">Panel de Control</span>
            </div>
            <h1 className="text-3xl font-bold font-lato tracking-tight">Hola, {user.name.split(' ')[0]} 👋</h1>
            <p className="text-slate-300 mt-1 font-light">Aquí tienes el resumen de tu actividad y rendimiento de hoy.</p>
          </div>
          <div className="text-right hidden md:block bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Fecha Actual</p>
            <p className="text-lg font-bold font-lato">{new Date().toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
        </div>
        {/* Background Abstract Shapes */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-brand-500 rounded-full opacity-20 blur-[80px]"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-purple-600 rounded-full opacity-20 blur-[80px]"></div>
      </div>

      {/* Modern KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <KpiCard
          title="Oportunidades Activas"
          value={stats.totalActive}
          icon={Briefcase}
          colorClass="bg-blue-50 text-blue-600"
          gradient="bg-blue-500"
        />
        <KpiCard
          title="Pipeline Total (Q)"
          value={`Q${(stats.amountPipeline / 1000).toFixed(1)}k`}
          icon={Target}
          colorClass="bg-violet-50 text-violet-600"
          gradient="bg-violet-500"
        />
        <KpiCard
          title="Cierres Ganados"
          value={stats.totalWon}
          icon={CheckCircle}
          colorClass="bg-emerald-50 text-emerald-600"
          gradient="bg-emerald-500"
        />
        <KpiCard
          title="Ingresos Reales"
          value={`Q${(stats.amountWon / 1000).toFixed(1)}k`}
          icon={DollarSign}
          colorClass="bg-indigo-50 text-indigo-600"
          gradient="bg-indigo-500"
        />
        <KpiCard
          title="Perdidas"
          value={stats.totalDeleted}
          icon={Trash2}
          colorClass="bg-red-50 text-red-500"
          gradient="bg-red-500"
        />
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Main Funnel Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-200/60">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-bold text-slate-800 font-lato">Flujo del Pipeline</h3>
              <p className="text-xs text-slate-400 mt-1">Distribución de valor por etapa de venta.</p>
            </div>
            <button className="text-xs font-bold bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">Ver Detalles</button>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={funnelData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  itemStyle={{ color: '#1e293b', fontWeight: 700 }}
                  formatter={(value: number) => [`Q${value.toLocaleString()}`, 'Valor']}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorCount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200/60 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 font-lato">
            <Clock size={20} className="text-brand-500" /> Actividad Reciente
          </h3>
          <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex gap-4 relative pl-2 group">
                <div className="absolute left-[7px] top-8 bottom-[-24px] w-px bg-slate-100 last:hidden group-hover:bg-brand-100 transition-colors"></div>
                <div className={`w-3.5 h-3.5 mt-1.5 rounded-full ring-4 ring-white shrink-0 shadow-sm ${activity.type === 'win' ? 'bg-emerald-500' :
                  activity.type === 'new' ? 'bg-blue-500' : 'bg-slate-300'
                  }`}></div>
                <div>
                  <p className="text-sm font-medium text-slate-700 leading-snug group-hover:text-brand-800 transition-colors">{activity.text}</p>
                  <span className="text-xs text-slate-400 font-bold mt-1 block">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-3 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-100 transition-colors">
            Ver Bitácora Completa
          </button>
        </div>
      </div>

      {/* Bottom Stats (Quick Glance) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200 relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2 opacity-80">
              <TrendingUp size={18} />
              <span className="text-xs font-bold uppercase tracking-wider font-lato">Tasa de Conversión</span>
            </div>
            <p className="text-4xl font-bold font-lato tracking-tight">18.5%</p>
            <p className="text-xs opacity-60 mt-2 font-medium bg-white/10 w-fit px-2 py-1 rounded">+2.4% vs mes anterior</p>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <TrendingUp size={120} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-6 group hover:border-orange-200 transition-colors">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500 shrink-0 group-hover:scale-110 transition-transform">
            <Users size={32} />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase font-lato tracking-wider mb-1">Nuevos Clientes</p>
            <p className="text-3xl font-bold text-slate-800 font-lato">12</p>
            <p className="text-xs text-slate-400 mt-1">Este mes</p>
          </div>
        </div>

        {/* Pending Tasks / Tickets List */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-red-100 text-red-600 rounded-lg">
                <ListTodo size={16} />
              </div>
              <p className="text-slate-700 text-sm font-bold uppercase font-lato">Tickets Urgentes</p>
            </div>
            <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-1 rounded-full border border-red-100">
              {pendingTasks.length} Activos
            </span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[120px] space-y-2 custom-scrollbar pr-1">
            {pendingTasks.length > 0 ? pendingTasks.map(task => (
              <div key={task.id} className="flex justify-between items-start p-2.5 hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-100 transition-all cursor-pointer group">
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-xs font-bold text-slate-700 truncate group-hover:text-brand-600 transition-colors">{task.title}</p>
                  <p className="text-[10px] text-slate-400 truncate font-medium">{task.department}</p>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs py-2">
                <CheckCircle size={24} className="mb-2 text-green-400 opacity-50" />
                Todo al día
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
