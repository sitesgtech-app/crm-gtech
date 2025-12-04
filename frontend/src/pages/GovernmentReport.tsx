
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/db';
import { User } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Building2, DollarSign, Award, TrendingUp } from 'lucide-react';

interface GovernmentReportProps {
  user: User;
}

export const GovernmentReport: React.FC<GovernmentReportProps> = ({ user }) => {
  const [reportData, setReportData] = useState<any[]>([]);
  const [totals, setTotals] = useState({ awarded: 0, profit: 0, events: 0 });

  useEffect(() => {
    const events = db.getGuatecomprasEvents();
    
    // Aggregate data by Entity
    const aggregation: Record<string, { entity: string, count: number, awarded: number, profit: number }> = {};

    let totalAwarded = 0;
    let totalProfit = 0;

    events.forEach(e => {
        const entity = e.purchasingEntity;
        if (!aggregation[entity]) {
            aggregation[entity] = { entity, count: 0, awarded: 0, profit: 0 };
        }
        aggregation[entity].count += 1;
        aggregation[entity].awarded += e.awardedAmount;
        aggregation[entity].profit += e.profit;

        totalAwarded += e.awardedAmount;
        totalProfit += e.profit;
    });

    // Convert to array and sort by Profit desc
    const dataArray = Object.values(aggregation).sort((a, b) => b.profit - a.profit);
    
    setReportData(dataArray);
    setTotals({ awarded: totalAwarded, profit: totalProfit, events: events.length });
  }, []);

  return (
    <div className="space-y-8">
      <div>
          <h1 className="text-2xl font-bold text-slate-800">Reporte de Ventas Gubernamentales</h1>
          <p className="text-slate-500">Análisis de rentabilidad por entidad adjudicadora.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                  <p className="text-sm font-medium text-slate-500">Monto Total Adjudicado</p>
                  <p className="text-2xl font-bold text-slate-800">Q{totals.awarded.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                  <DollarSign size={24} />
              </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                  <p className="text-sm font-medium text-slate-500">Ganancia Total Estimada</p>
                  <p className="text-2xl font-bold text-green-600">Q{totals.profit.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg text-green-600">
                  <TrendingUp size={24} />
              </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                  <p className="text-sm font-medium text-slate-500">Eventos Ganados</p>
                  <p className="text-2xl font-bold text-slate-800">{totals.events}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
                  <Award size={24} />
              </div>
          </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-6">Top Entidades por Ganancia</h3>
          <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportData.slice(0, 10)} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis type="number" />
                      <YAxis dataKey="entity" type="category" width={150} tick={{fontSize: 11}} />
                      <Tooltip formatter={(value) => `Q${Number(value).toLocaleString()}`} />
                      <Legend />
                      <Bar dataKey="profit" name="Ganancia" fill="#22c55e" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="awarded" name="Monto Adjudicado" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
              </ResponsiveContainer>
          </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Detalle por Entidad</h3>
          </div>
          <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Entidad</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Eventos</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Monto Adjudicado</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Ganancia</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                  {reportData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-6 py-4 font-medium text-slate-800 flex items-center gap-2">
                              <Building2 size={16} className="text-slate-400" />
                              {row.entity}
                          </td>
                          <td className="px-6 py-4 text-center text-slate-600">
                              {row.count}
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-slate-800">
                              Q{row.awarded.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-green-600">
                              Q{row.profit.toLocaleString()}
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>
    </div>
  );
};
