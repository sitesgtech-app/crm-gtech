
import React, { useMemo } from 'react';
import { db } from '../services/db';
import { User, OpportunityStage, UserRole } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { Download, Mail, DollarSign, TrendingDown, TrendingUp, CreditCard, FileText, Building, Building2 } from 'lucide-react';

interface ReportsProps {
  user: User;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a855f7', '#ec4899', '#6366f1'];
const FINANCIAL_COLORS = ['#10b981', '#3b82f6']; // Emerald (Services), Blue (Products)

export const Reports: React.FC<ReportsProps> = ({ user }) => {
  const opps = useMemo(() => db.getOpportunities(user.id, user.role), [user]);
  const activities = useMemo(() => db.getAllActivities(user.id, user.role), [user]);
  const users = useMemo(() => db.getUsers(), []);
  
  // Load Financial data
  const purchases = useMemo(() => db.getPurchases(), []);
  const expenses = useMemo(() => db.getExpenses(), []);
  const subscriptions = useMemo(() => db.getSubscriptions(), []);

  // --- GENERAL SALES STATS ---
  const stats = {
    totalQ: opps.filter(o => o.stage === OpportunityStage.GANADA).reduce((acc, curr) => acc + curr.amount, 0),
    countWon: opps.filter(o => o.stage === OpportunityStage.GANADA).length,
    countLost: opps.filter(o => o.stage === OpportunityStage.PERDIDA).length,
    negotiationQ: opps.filter(o => o.stage === OpportunityStage.NEGOCIACION).reduce((acc, curr) => acc + curr.amount, 0),
  };

  const weeklyData = [
    { name: 'Semana 1', ganadas: 4000, perdidas: 2400 },
    { name: 'Semana 2', ganadas: 3000, perdidas: 1398 },
    { name: 'Semana 3', ganadas: 2000, perdidas: 9800 },
    { name: 'Semana 4', ganadas: 2780, perdidas: 3908 },
    { name: 'Esta Semana', ganadas: 1890, perdidas: 4800 },
  ];

  // --- QUOTATIONS BY SECTOR (WEEKLY) ---
  const quotationsStats = useMemo(() => {
      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())); // Start of current week (Sunday)
      startOfWeek.setHours(0, 0, 0, 0);

      // Filter opportunities that have a quotation and were created/quoted this week
      // Using quotation date if available, otherwise opp creation date fallback
      const weeklyQuotes = opps.filter(o => {
          if (!o.quotation) return false;
          const quoteDate = new Date(o.quotation.date); // Format usually YYYY-MM-DD or Locale String
          // Fallback parsing
          const qDateObj = isNaN(quoteDate.getTime()) ? new Date(o.lastUpdated) : quoteDate;
          return qDateObj >= startOfWeek;
      });

      const privateCount = weeklyQuotes.filter(o => !o.sector || o.sector === 'Privado').length;
      const publicCount = weeklyQuotes.filter(o => o.sector === 'Gubernamental').length;

      return {
          privateCount,
          publicCount,
          total: privateCount + publicCount
      };
  }, [opps]);

  // --- ORIGIN STATISTICS ---
  const originData = useMemo(() => {
      const counts: Record<string, number> = {};
      opps.forEach(o => {
          const origin = o.origin || 'Desconocido';
          counts[origin] = (counts[origin] || 0) + 1;
      });
      return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  }, [opps]);

  // --- ACTIVITY BY USER ---
  const activityByUserData = useMemo(() => {
      const relevantUsers = users.filter(u => u.role === UserRole.VENDEDOR || u.role === UserRole.ADMIN);
      return relevantUsers.map(u => {
          const userActs = activities.filter(a => a.responsibleId === u.id);
          return {
              name: u.name.split(' ')[0], 
              Llamadas: userActs.filter(a => a.type === 'Llamada').length,
              Correos: userActs.filter(a => a.type === 'Correo').length,
              WhatsApp: userActs.filter(a => a.type === 'WhatsApp').length,
              Reuniones: userActs.filter(a => a.type === 'Reunión').length,
              Visitas: userActs.filter(a => a.type === 'Visita Técnica').length,
              Total: userActs.length
          };
      });
  }, [users, activities]);

  // --- FINANCIAL BREAKDOWN (NEW SECTION) ---
  const financialData = useMemo(() => {
      // 1. Income Breakdown (Services vs Products)
      const wonOpps = opps.filter(o => o.stage === OpportunityStage.GANADA);
      
      const incomeServices = wonOpps
        .filter(o => o.itemType === 'Servicio')
        .reduce((sum, o) => sum + o.amount, 0);

      const incomeProducts = wonOpps
        .filter(o => !o.itemType || o.itemType === 'Producto')
        .reduce((sum, o) => sum + o.amount, 0);

      // 2. Expenses Breakdown
      const totalOperationalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
      const totalEquipmentPurchases = purchases.reduce((sum, p) => sum + p.amount, 0);
      
      // 3. Subscriptions (Monthly Burn Rate)
      const monthlySubscriptionsCost = subscriptions
        .filter(s => s.active)
        .reduce((sum, s) => {
            // Normalize Annual to Monthly for "Monthly Cost" view
            const monthlyAmount = s.frequency === 'Anual' ? s.amount / 12 : s.amount;
            return sum + monthlyAmount;
        }, 0);

      const totalOutflow = totalOperationalExpenses + totalEquipmentPurchases;
      const netProfit = (incomeServices + incomeProducts) - totalOutflow;

      return {
          incomeServices,
          incomeProducts,
          totalOperationalExpenses,
          totalEquipmentPurchases,
          monthlySubscriptionsCost,
          totalOutflow,
          netProfit,
          incomeData: [
              { name: 'Servicios', value: incomeServices },
              { name: 'Productos', value: incomeProducts }
          ],
          expenseData: [
              { name: 'Gastos Operativos', value: totalOperationalExpenses },
              { name: 'Compras Equipo', value: totalEquipmentPurchases }
          ]
      };
  }, [opps, expenses, purchases, subscriptions]);


  // --- TOP SUPPLIERS ---
  const topSuppliersData = useMemo(() => {
      const supplierTotals: Record<string, number> = {};
      const allOutflow = [
          ...purchases.map(p => ({ supplier: p.supplier, amount: p.amount })),
          ...expenses.filter(e => e.supplier).map(e => ({ supplier: e.supplier, amount: e.amount }))
      ];
      allOutflow.forEach(item => {
          const name = item.supplier || 'Desconocido';
          supplierTotals[name] = (supplierTotals[name] || 0) + item.amount;
      });
      return Object.keys(supplierTotals)
          .map(key => ({ name: key, value: supplierTotals[key] }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5);
  }, [purchases, expenses]);

  const handleSendReport = () => {
    alert(`Reporte generado y enviado a: ${user.email}\n\nResumen:\nVentas: Q${stats.totalQ}\nUtilidad Bruta Est.: Q${financialData.netProfit.toLocaleString()}`);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 font-lato">Reportes Globales</h1>
          <p className="text-slate-500">Métricas comerciales, operativas y financieras.</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={handleSendReport}
                className="flex items-center px-4 py-2 border border-brand-600 text-brand-600 rounded-lg hover:bg-brand-50 transition-colors"
            >
                <Mail className="w-4 h-4 mr-2" />
                Enviar Reporte
            </button>
            <button className="flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors">
                <Download className="w-4 h-4 mr-2" />
                Exportar Excel
            </button>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
          <p className="text-xs font-bold text-slate-400 uppercase">Total Cerrado (Q)</p>
          <p className="text-2xl font-bold text-slate-800">Q{stats.totalQ.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
          <p className="text-xs font-bold text-slate-400 uppercase">En Negociación (Q)</p>
          <p className="text-2xl font-bold text-slate-800">Q{stats.negotiationQ.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-indigo-500">
          <p className="text-xs font-bold text-slate-400 uppercase">Oportunidades Ganadas</p>
          <p className="text-2xl font-bold text-slate-800">{stats.countWon}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-red-500">
          <p className="text-xs font-bold text-slate-400 uppercase">Oportunidades Perdidas</p>
          <p className="text-2xl font-bold text-slate-800">{stats.countLost}</p>
        </div>
      </div>

      {/* --- NEW: QUOTATIONS WEEKLY STATS --- */}
      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 font-lato">
              <FileText size={20} className="text-brand-600"/> Métricas de Cotización (Semana Actual)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                  <div className="p-3 bg-blue-50 text-brand-600 rounded-full">
                      <FileText size={24} />
                  </div>
                  <div>
                      <p className="text-2xl font-bold text-slate-800">{quotationsStats.total}</p>
                      <p className="text-xs text-slate-500 font-medium uppercase">Total Enviadas</p>
                  </div>
              </div>
              
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                  <div className="p-3 bg-slate-100 text-slate-600 rounded-full">
                      <Building size={24} />
                  </div>
                  <div>
                      <p className="text-2xl font-bold text-slate-800">{quotationsStats.privateCount}</p>
                      <p className="text-xs text-slate-500 font-medium uppercase">Sector Privado</p>
                  </div>
                  <div className="ml-auto h-1 w-16 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-500" style={{width: `${quotationsStats.total ? (quotationsStats.privateCount/quotationsStats.total)*100 : 0}%`}}></div>
                  </div>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-full">
                      <Building2 size={24} />
                  </div>
                  <div>
                      <p className="text-2xl font-bold text-slate-800">{quotationsStats.publicCount}</p>
                      <p className="text-xs text-slate-500 font-medium uppercase">Sector Público</p>
                  </div>
                  <div className="ml-auto h-1 w-16 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500" style={{width: `${quotationsStats.total ? (quotationsStats.publicCount/quotationsStats.total)*100 : 0}%`}}></div>
                  </div>
              </div>
          </div>
      </div>

      {/* Charts Section 1: SALES TRENDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 font-lato">Ventas vs Perdidas por Semana</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="ganadas" stroke="#2563eb" strokeWidth={2} />
                <Line type="monotone" dataKey="perdidas" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 font-lato">Distribución del Pipeline</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                 {name: 'Contactado', val: opps.filter(o => o.stage === OpportunityStage.CONTACTADO).length},
                 {name: 'Propuesta', val: opps.filter(o => o.stage === OpportunityStage.PROPUESTA).length},
                 {name: 'Negociación', val: opps.filter(o => o.stage === OpportunityStage.NEGOCIACION).length},
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="val" fill="#3b82f6" name="Cantidad" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Section 2: ORIGIN & ACTIVITIES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4 font-lato">Origen de Prospectos (Leads)</h3>
              <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie
                              data={originData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              fill="#8884d8"
                              paddingAngle={5}
                              dataKey="value"
                              label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                              {originData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                      </PieChart>
                  </ResponsiveContainer>
              </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4 font-lato">Desempeño por Usuario</h3>
              <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={activityByUserData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="Llamadas" stackId="a" fill="#3b82f6" />
                          <Bar dataKey="Correos" stackId="a" fill="#eab308" />
                          <Bar dataKey="WhatsApp" stackId="a" fill="#22c55e" />
                          <Bar dataKey="Reuniones" stackId="a" fill="#6366f1" />
                          <Bar dataKey="Visitas" stackId="a" fill="#a855f7" />
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>
      </div>

      {/* --- FINANCIAL CONSOLIDATED SECTION --- */}
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2 font-lato">
              <DollarSign className="text-brand-600" /> Consolidado Financiero
          </h2>

          {/* Financial KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-emerald-100">
                  <p className="text-xs font-bold text-emerald-600 uppercase mb-1 flex items-center gap-1">
                      <TrendingUp size={14}/> Total Ingresos
                  </p>
                  <p className="text-2xl font-bold text-slate-800">Q{(stats.totalQ).toLocaleString()}</p>
                  <p className="text-[10px] text-slate-400">Ventas Ganadas Históricas</p>
              </div>
              
              <div className="bg-white p-4 rounded-xl shadow-sm border border-red-100">
                  <p className="text-xs font-bold text-red-600 uppercase mb-1 flex items-center gap-1">
                      <TrendingDown size={14}/> Total Egresos
                  </p>
                  <p className="text-2xl font-bold text-slate-800">Q{financialData.totalOutflow.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-400">Gastos Ops. + Compras Equipo</p>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-sm border border-indigo-100">
                  <p className="text-xs font-bold text-indigo-600 uppercase mb-1 flex items-center gap-1">
                      <CreditCard size={14}/> Suscripciones (Mes)
                  </p>
                  <p className="text-2xl font-bold text-slate-800">Q{financialData.monthlySubscriptionsCost.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-400">Costo Fijo Mensual Activo</p>
              </div>

              <div className="bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-700 text-white">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                      <DollarSign size={14}/> Utilidad Bruta (Est.)
                  </p>
                  <p className="text-2xl font-bold text-emerald-400">Q{financialData.netProfit.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-400">Ingresos - Egresos Totales</p>
              </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Income Breakdown Chart */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <h3 className="font-bold text-slate-800 mb-2 font-lato">Ingresos: Servicios vs Productos</h3>
                  <p className="text-xs text-slate-500 mb-4">Desglose basado en oportunidades ganadas.</p>
                  <div className="h-64 flex flex-col md:flex-row items-center gap-6">
                      <div className="flex-1 w-full h-full">
                          <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                  <Pie
                                      data={financialData.incomeData}
                                      cx="50%"
                                      cy="50%"
                                      innerRadius={50}
                                      outerRadius={70}
                                      paddingAngle={5}
                                      dataKey="value"
                                  >
                                      {financialData.incomeData.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={FINANCIAL_COLORS[index]} />
                                      ))}
                                  </Pie>
                                  <Tooltip formatter={(value) => `Q${Number(value).toLocaleString()}`} />
                              </PieChart>
                          </ResponsiveContainer>
                      </div>
                      <div className="w-full md:w-40 space-y-3">
                          <div className="flex items-start gap-2">
                              <div className="w-3 h-3 rounded-full bg-emerald-500 mt-1"></div>
                              <div>
                                  <p className="text-xs text-slate-500">Servicios</p>
                                  <p className="font-bold text-sm">Q{financialData.incomeServices.toLocaleString()}</p>
                              </div>
                          </div>
                          <div className="flex items-start gap-2">
                              <div className="w-3 h-3 rounded-full bg-blue-500 mt-1"></div>
                              <div>
                                  <p className="text-xs text-slate-500">Productos</p>
                                  <p className="font-bold text-sm">Q{financialData.incomeProducts.toLocaleString()}</p>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Expense Breakdown Chart */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <h3 className="font-bold text-slate-800 mb-2 font-lato">Desglose de Egresos</h3>
                  <p className="text-xs text-slate-500 mb-4">Gastos operativos vs Inversión en Equipo.</p>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={financialData.expenseData} layout="vertical" margin={{ left: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={110} tick={{fontSize: 11}} />
                          <Tooltip formatter={(value) => `Q${Number(value).toLocaleString()}`} />
                          <Bar dataKey="value" name="Monto (Q)" fill="#ef4444" radius={[0, 4, 4, 0]}>
                            {financialData.expenseData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : '#3b82f6'} />
                            ))}
                          </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
              </div>
          </div>
      </div>
      
      {/* Top Suppliers (Moved to bottom) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-4 font-lato">Top 5 Proveedores (Compras + Gastos)</h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topSuppliersData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} tick={{fontSize: 11}} />
                <Tooltip formatter={(value) => `Q${Number(value).toLocaleString()}`} />
                <Legend />
                <Bar dataKey="value" name="Monto Total Comprado" fill="#64748b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
      </div>
    </div>
  );
};
