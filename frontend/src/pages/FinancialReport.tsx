
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/db';
import { User, InventoryItem, Product, Opportunity, Expense, Purchase, OpportunityStage, IssuedInvoice, Organization } from '../types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Calendar, FileText, Package, Printer, Calculator, Table, AlertTriangle, CheckCircle, Wallet } from 'lucide-react';

interface FinancialReportProps {
  user: User;
}

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export const FinancialReport: React.FC<FinancialReportProps> = ({ user }) => {
  // Global Data
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [issuedInvoices, setIssuedInvoices] = useState<IssuedInvoice[]>([]);
  const [organization, setOrganization] = useState<Organization | null>(null);

  // Filter State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'statement'>('statement');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [taxRegime, setTaxRegime] = useState<'simplificado' | 'utilidades'>('simplificado');

  useEffect(() => {
    setPurchases(db.getPurchases());
    setExpenses(db.getExpenses());
    setOpportunities(db.getOpportunities());
    setInventoryItems(db.getInventoryItems());
    setProducts(db.getProducts());
    setIssuedInvoices(db.getIssuedInvoices());
    setOrganization(db.getOrganization());
  }, []);

  // --- CALCULATION ENGINE (The Accountant Logic) ---
  const financialStatement = useMemo(() => {
      // 1. Filter Data by Period
      const filterDate = (dateStr: string) => {
          const d = new Date(dateStr);
          return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
      };

      const periodOpps = opportunities.filter(o => o.stage === OpportunityStage.GANADA && filterDate(o.lastUpdated));
      const periodExpenses = expenses.filter(e => filterDate(e.date));
      const periodPurchases = purchases.filter(p => filterDate(p.date)); // Compras de Activos/Equipo
      const periodInvoices = issuedInvoices.filter(i => filterDate(i.date) && i.status !== 'Anulada');

      // 2. INGRESOS (Ventas)
      // Comparativa de CRM vs Facturación Real
      const revenueCRM = periodOpps.reduce((sum, o) => sum + o.amount, 0);
      const revenueInvoiced = periodInvoices.reduce((sum, i) => sum + i.amount, 0);
      
      // For the Statement, we use CRM data as "Management View", but highlight Invoiced for Tax view
      const totalRevenueGross = revenueCRM; 
      const totalRevenueNet = totalRevenueGross / 1.12; 
      const debitFiscalIVA = totalRevenueGross - totalRevenueNet;

      // 3. COSTO DE VENTAS
      // Costo directo asociado a lo vendido en este periodo
      const costOfSales = periodOpps.reduce((sum, o) => {
          const qty = o.quantity || 1;
          const unitCost = o.unitCost || 0;
          return sum + (qty * unitCost);
      }, 0);

      // 4. UTILIDAD BRUTA
      const grossProfit = totalRevenueNet - costOfSales;

      // 5. GASTOS Y COMPRAS (Para Crédito Fiscal)
      const totalOperatingExpensesGross = periodExpenses.reduce((sum, e) => sum + e.amount, 0);
      const totalPurchasesGross = periodPurchases.reduce((sum, p) => sum + p.amount, 0);
      
      const totalOutflowGross = totalOperatingExpensesGross + totalPurchasesGross;
      const totalOutflowNet = totalOutflowGross / 1.12;
      
      // Crédito Fiscal Real (IVA pagado en gastos + compras de equipo)
      const creditFiscalIVA = totalOutflowGross - totalOutflowNet;

      // Gastos netos para el Estado de Resultados (sin IVA)
      const operatingExpensesNet = totalOperatingExpensesGross / 1.12;

      // 6. UTILIDAD DE OPERACION (EBITDA aprox)
      const operatingIncome = grossProfit - operatingExpensesNet;

      // 7. IMPUESTOS (ISR GUATEMALA)
      let isrAmount = 0;
      
      if (taxRegime === 'simplificado') {
          // Régimen Opcional Simplificado sobre Ingresos
          // 5% sobre los primeros 30,000 mensuales
          // 7% sobre el excedente
          // Base es la Renta Bruta (Ingresos Netos sin IVA)
          if (totalRevenueNet <= 30000) {
              isrAmount = totalRevenueNet * 0.05;
          } else {
              isrAmount = 1500 + ((totalRevenueNet - 30000) * 0.07);
          }
      } else {
          // Régimen Sobre las Utilidades
          // 25% sobre la Utilidad Neta Imponible
          // (Asumiendo que todos los gastos registrados son deducibles para este demo)
          if (operatingIncome > 0) {
              isrAmount = operatingIncome * 0.25;
          }
      }

      // 8. UTILIDAD NETA
      const netIncome = operatingIncome - isrAmount;

      // 9. IVA NETO (A Pagar o A Favor)
      // Débito - Crédito. 
      const ivaNetResult = debitFiscalIVA - creditFiscalIVA;

      return {
          revenueCRM,
          revenueInvoiced,
          totalRevenueGross,
          totalRevenueNet,
          debitFiscalIVA,
          costOfSales,
          grossProfit,
          operatingExpensesNet,
          creditFiscalIVA,
          operatingIncome,
          isrAmount,
          netIncome,
          ivaNetResult,
          totalOutflowGross
      };

  }, [opportunities, expenses, purchases, issuedInvoices, selectedMonth, selectedYear, taxRegime]);

  // --- CASH FLOW CALCULATION (ACUMULADO) ---
  const cashFlowStats = useMemo(() => {
      const initialBalance = organization?.initialBalance || 0;
      
      // Total historical income (won opportunities)
      const allIncome = opportunities
          .filter(o => o.stage === OpportunityStage.GANADA)
          .reduce((sum, o) => sum + o.amount, 0);
          
      // Total historical expenses
      const allExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
      const allPurchases = purchases.reduce((sum, p) => sum + p.amount, 0);
      
      const currentBalance = initialBalance + allIncome - (allExpenses + allPurchases);
      
      return {
          initialBalance,
          allIncome,
          allOutflow: allExpenses + allPurchases,
          currentBalance
      };
  }, [organization, opportunities, expenses, purchases]);

  // --- INVENTORY VALUATION ---
  const inventoryValuation = useMemo(() => {
      const insumosVal = inventoryItems.filter(i => i.category === 'Insumos').reduce((s, i) => s + (i.quantity * (i.unitCost || 0)), 0);
      const productsVal = products.reduce((s, p) => s + (p.stock * (p.cost || 0)), 0);
      const assetsVal = inventoryItems.filter(i => i.category === 'Equipo de Oficina').reduce((s, i) => s + (i.quantity * (i.unitCost || 0)), 0); // Valor libro simple
      
      return { insumosVal, productsVal, assetsVal, total: insumosVal + productsVal + assetsVal };
  }, [inventoryItems, products]);

  const handlePrint = () => {
      window.print();
  };

  const changePeriod = (delta: number) => {
      let m = selectedMonth + delta;
      let y = selectedYear;
      if (m > 11) { m = 0; y++; }
      else if (m < 0) { m = 11; y--; }
      setSelectedMonth(m);
      setSelectedYear(y);
  };

  return (
    <div className="space-y-6 print:space-y-0 print:p-0">
      {/* Header Controls (Hidden on Print) */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 print:hidden">
          <div>
              <h1 className="text-2xl font-bold text-slate-800">Estados Financieros</h1>
              <p className="text-slate-500">Reportes contables y fiscales basados en NIIF Pymes / Ley Tributaria GT.</p>
          </div>
          
          <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
              <button onClick={() => changePeriod(-1)} className="p-2 hover:bg-slate-100 rounded-lg"><Calendar size={16}/></button>
              <span className="font-bold text-slate-700 w-32 text-center">{MONTHS[selectedMonth]} {selectedYear}</span>
              <button onClick={() => changePeriod(1)} className="p-2 hover:bg-slate-100 rounded-lg"><Calendar size={16}/></button>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-lg">
              <button 
                onClick={() => setActiveTab('statement')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'statement' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
              >
                  <FileText size={16} className="inline mr-2"/> Estado de Resultados
              </button>
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'dashboard' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
              >
                  <Table size={16} className="inline mr-2"/> Tablero Gráfico
              </button>
          </div>
      </div>

      {/* --- VIEW 1: FINANCIAL STATEMENT (The "Accountant" View) --- */}
      {activeTab === 'statement' && (
          <div className="max-w-4xl mx-auto bg-white shadow-2xl print:shadow-none min-h-[29.7cm] p-12 print:p-0 relative">
              
              {/* Print Controls */}
              <div className="absolute top-6 right-6 flex gap-2 print:hidden">
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1">
                      <Calculator size={14} className="text-slate-400" />
                      <select 
                        className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
                        value={taxRegime}
                        onChange={(e) => setTaxRegime(e.target.value as any)}
                      >
                          <option value="simplificado">Régimen Opcional Simplificado (5% - 7%)</option>
                          <option value="utilidades">Régimen Sobre Utilidades (25%)</option>
                      </select>
                  </div>
                  <button onClick={handlePrint} className="p-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors" title="Imprimir / Guardar PDF">
                      <Printer size={18} />
                  </button>
              </div>

              {/* HEADER */}
              <div className="text-center mb-8 border-b border-slate-800 pb-6">
                  <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-wide mb-1">gtech Soluciones Tecnológicas</h2>
                  <h3 className="text-xl font-semibold text-slate-700">Estado de Resultados</h3>
                  <p className="text-slate-500 mt-2 text-sm">
                      Del 1 al {new Date(selectedYear, selectedMonth + 1, 0).getDate()} de {MONTHS[selectedMonth]} de {selectedYear}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 italic">(Cifras expresadas en Quetzales)</p>
              </div>

              {/* RECONCILIATION WARNING */}
              {Math.abs(financialStatement.revenueCRM - financialStatement.revenueInvoiced) > 100 && (
                  <div className="mb-6 bg-orange-50 border border-orange-200 p-3 rounded-lg flex items-start gap-3 text-xs print:hidden">
                      <AlertTriangle size={16} className="text-orange-500 mt-0.5" />
                      <div>
                          <p className="font-bold text-orange-800">Aviso de Conciliación de Ingresos</p>
                          <p className="text-orange-700 mt-1">
                              Existe una diferencia entre las Ventas Ganadas en CRM (Q{financialStatement.revenueCRM.toLocaleString()}) 
                              y las Facturas Emitidas cargadas (Q{financialStatement.revenueInvoiced.toLocaleString()}). 
                              Este reporte utiliza los datos del CRM para la proyección.
                          </p>
                      </div>
                  </div>
              )}

              {/* STATEMENT TABLE */}
              <div className="space-y-0 text-sm text-slate-800 font-mono">
                  
                  {/* INGRESOS */}
                  <div className="flex justify-between py-2 font-bold">
                      <span>INGRESOS DE OPERACIÓN</span>
                      <span></span>
                  </div>
                  <div className="flex justify-between py-1 pl-4">
                      <span>Ventas Brutas (Servicios y Productos)</span>
                      <span>Q{financialStatement.totalRevenueNet.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between py-1 pl-4 border-b border-slate-300 mb-2">
                      <span>(-) Devoluciones y Rebajas sobre ventas</span>
                      <span>Q0.00</span>
                  </div>
                  <div className="flex justify-between py-2 font-bold bg-slate-50 px-2">
                      <span>VENTAS NETAS</span>
                      <span>Q{financialStatement.totalRevenueNet.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>

                  {/* COSTOS */}
                  <div className="flex justify-between py-2 mt-4 font-bold">
                      <span>COSTO DE VENTAS</span>
                      <span></span>
                  </div>
                  <div className="flex justify-between py-1 pl-4 border-b border-slate-300 mb-2">
                      <span>(-) Costo de servicios y productos vendidos (Estimado)</span>
                      <span className="text-red-600">(Q{financialStatement.costOfSales.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})})</span>
                  </div>
                  <div className="flex justify-between py-2 font-bold bg-slate-100 px-2 border-t border-slate-800">
                      <span>UTILIDAD BRUTA EN VENTAS</span>
                      <span>Q{financialStatement.grossProfit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>

                  {/* GASTOS OPERATIVOS */}
                  <div className="flex justify-between py-2 mt-6 font-bold">
                      <span>GASTOS DE OPERACIÓN</span>
                      <span></span>
                  </div>
                  <div className="flex justify-between py-1 pl-4">
                      <span>Gastos Administrativos y Ventas</span>
                      <span>(Q{financialStatement.operatingExpensesNet.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})})</span>
                  </div>
                  <div className="flex justify-between py-1 pl-4 border-b border-slate-300 mb-2">
                      <span>Depreciaciones y Amortizaciones</span>
                      <span>Q0.00</span>
                  </div>
                  
                  <div className="flex justify-between py-2 font-bold bg-slate-50 px-2">
                      <span>UTILIDAD DE OPERACIÓN (EBITDA)</span>
                      <span className={financialStatement.operatingIncome >= 0 ? 'text-slate-800' : 'text-red-600'}>
                          Q{financialStatement.operatingIncome.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </span>
                  </div>

                  {/* IMPUESTOS */}
                  <div className="flex justify-between py-2 mt-6 font-bold">
                      <span>IMPUESTOS Y RESERVAS</span>
                      <span></span>
                  </div>
                  <div className="flex justify-between py-1 pl-4 border-b border-slate-300 mb-2">
                      <span>(-) Impuesto Sobre la Renta (ISR) - {taxRegime === 'simplificado' ? 'Régimen Simplificado' : 'Sobre Utilidades'}</span>
                      <span className="text-red-600">(Q{financialStatement.isrAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})})</span>
                  </div>

                  {/* NET INCOME */}
                  <div className="flex justify-between py-4 mt-4 font-bold text-lg border-y-2 border-double border-slate-800 bg-slate-100 px-4">
                      <span>UTILIDAD NETA DEL EJERCICIO</span>
                      <span className={financialStatement.netIncome >= 0 ? 'text-emerald-700' : 'text-red-600'}>
                          Q{financialStatement.netIncome.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </span>
                  </div>
              </div>

              {/* TAX APPENDIX (IVA) */}
              <div className="mt-12">
                  <h4 className="font-bold mb-3 uppercase text-slate-600 text-xs border-b border-slate-300 pb-1">Anexo: Determinación del Impuesto al Valor Agregado (IVA)</h4>
                  <div className="border border-slate-300 rounded-md overflow-hidden text-xs font-mono bg-white">
                      
                      {/* Débito Fiscal */}
                      <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50/50 p-2">
                          <div>
                              <p className="font-bold text-slate-700">VENTAS Y SERVICIOS PRESTADOS (BRUTO)</p>
                              <p className="text-slate-500">Base Imponible: Q{financialStatement.totalRevenueNet.toLocaleString(undefined, {maximumFractionDigits:2})}</p>
                          </div>
                          <div className="text-right self-center font-bold">
                              (+) Q{financialStatement.debitFiscalIVA.toLocaleString(undefined, {minimumFractionDigits: 2})}
                          </div>
                      </div>

                      {/* Crédito Fiscal */}
                      <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50/50 p-2">
                          <div>
                              <p className="font-bold text-slate-700">COMPRAS Y SERVICIOS ADQUIRIDOS (BRUTO)</p>
                              <p className="text-slate-500">Base Compras: Q{(financialStatement.totalOutflowGross/1.12).toLocaleString(undefined, {maximumFractionDigits:2})}</p>
                          </div>
                          <div className="text-right self-center font-bold text-red-600">
                              (-) Q{financialStatement.creditFiscalIVA.toLocaleString(undefined, {minimumFractionDigits: 2})}
                          </div>
                      </div>

                      {/* RESULTADO */}
                      <div className={`grid grid-cols-2 p-3 font-bold text-sm ${financialStatement.ivaNetResult > 0 ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
                          <div className="self-center uppercase">
                              {financialStatement.ivaNetResult > 0 ? '(=) IMPUESTO A PAGAR' : '(=) CRÉDITO FISCAL A FAVOR (REMANENTE)'}
                          </div>
                          <div className="text-right text-base">
                              Q{Math.abs(financialStatement.ivaNetResult).toLocaleString(undefined, {minimumFractionDigits: 2})}
                          </div>
                      </div>
                  </div>
              </div>

              {/* SIGNATURES */}
              <div className="mt-24 grid grid-cols-2 gap-12">
                  <div className="text-center">
                      <div className="border-t border-slate-800 w-48 mx-auto mb-2"></div>
                      <p className="text-sm font-bold">Representante Legal</p>
                      <p className="text-xs text-slate-500">gtech Soluciones</p>
                  </div>
                  <div className="text-center">
                      <div className="border-t border-slate-800 w-48 mx-auto mb-2"></div>
                      <p className="text-sm font-bold">Contador General</p>
                      <p className="text-xs text-slate-500">No. Registro 12345-6</p>
                  </div>
              </div>
          </div>
      )}

      {/* --- VIEW 2: GRAPHICAL DASHBOARD --- */}
      {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
              {/* Cash Flow Summary Card (NEW) */}
              <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 shadow-xl text-white">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                      <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 opacity-80">
                              <Wallet size={20} className="text-emerald-400"/>
                              <span className="text-xs font-bold uppercase tracking-wider">Flujo de Caja Acumulado (Estimado)</span>
                          </div>
                          <h2 className="text-4xl font-bold font-lato tracking-tight">Q{cashFlowStats.currentBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}</h2>
                          <p className="text-xs text-slate-400 mt-2">Saldo Inicial + Ingresos Totales - Egresos Totales</p>
                      </div>
                      <div className="flex gap-8 text-right">
                          <div>
                              <p className="text-xs text-slate-400 font-bold uppercase">Saldo Inicial Configurado</p>
                              <p className="text-lg font-bold">Q{cashFlowStats.initialBalance.toLocaleString()}</p>
                          </div>
                          <div>
                              <p className="text-xs text-slate-400 font-bold uppercase">Total Ingresos Hist.</p>
                              <p className="text-lg font-bold text-emerald-400">+Q{cashFlowStats.allIncome.toLocaleString()}</p>
                          </div>
                          <div>
                              <p className="text-xs text-slate-400 font-bold uppercase">Total Egresos Hist.</p>
                              <p className="text-lg font-bold text-red-400">-Q{cashFlowStats.allOutflow.toLocaleString()}</p>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Conciliation Check */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <CheckCircle size={18} className="text-brand-600"/> Conciliación de Ingresos (Mes Actual)
                  </h3>
                  <div className="flex items-center justify-between gap-8">
                      <div className="flex-1 text-center p-4 bg-slate-50 rounded-lg border border-slate-100">
                          <p className="text-xs font-bold text-slate-400 uppercase">Ventas CRM (Ganadas)</p>
                          <p className="text-xl font-bold text-slate-800">Q{financialStatement.revenueCRM.toLocaleString()}</p>
                      </div>
                      <div className="text-slate-300">vs</div>
                      <div className="flex-1 text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
                          <p className="text-xs font-bold text-blue-400 uppercase">Facturado (FEL)</p>
                          <p className="text-xl font-bold text-blue-800">Q{financialStatement.revenueInvoiced.toLocaleString()}</p>
                      </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
                      {Math.abs(financialStatement.revenueCRM - financialStatement.revenueInvoiced) < 1 
                        ? <span className="text-green-600 font-bold flex items-center justify-center gap-1"><CheckCircle size={12}/> Los ingresos coinciden exactamente.</span> 
                        : <span className="text-orange-500 font-bold">Diferencia: Q{(financialStatement.revenueCRM - financialStatement.revenueInvoiced).toLocaleString()} (Verificar Pipeline o Carga de Facturas)</span>
                      }
                  </div>
              </div>

              {/* Inventory Valuation Card */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Package size={18}/> Valoración de Activos e Inventario</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                          <p className="text-xs text-blue-500 font-bold uppercase">Productos (Venta)</p>
                          <p className="text-xl font-bold text-blue-800">Q{inventoryValuation.productsVal.toLocaleString()}</p>
                      </div>
                      <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                          <p className="text-xs text-emerald-500 font-bold uppercase">Insumos</p>
                          <p className="text-xl font-bold text-emerald-800">Q{inventoryValuation.insumosVal.toLocaleString()}</p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                          <p className="text-xs text-purple-500 font-bold uppercase">Equipo / Activos</p>
                          <p className="text-xl font-bold text-purple-800">Q{inventoryValuation.assetsVal.toLocaleString()}</p>
                      </div>
                      <div className="p-4 bg-slate-800 rounded-lg text-white">
                          <p className="text-xs text-slate-400 font-bold uppercase">Total Activos</p>
                          <p className="text-xl font-bold">Q{inventoryValuation.total.toLocaleString()}</p>
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Expense Breakdown Pie */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                      <h3 className="font-bold text-slate-800 mb-2">Estructura de Costos del Periodo</h3>
                      <div className="h-72">
                          <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                  <Pie
                                      data={[
                                          { name: 'Costo de Ventas', value: financialStatement.costOfSales },
                                          { name: 'Gastos Operativos', value: financialStatement.operatingExpensesNet },
                                          { name: 'Impuestos (ISR)', value: financialStatement.isrAmount }
                                      ]}
                                      cx="50%"
                                      cy="50%"
                                      innerRadius={60}
                                      outerRadius={90}
                                      paddingAngle={5}
                                      dataKey="value"
                                  >
                                      <Cell fill="#3b82f6" />
                                      <Cell fill="#ef4444" />
                                      <Cell fill="#f59e0b" />
                                  </Pie>
                                  <Tooltip formatter={(value) => `Q${Number(value).toLocaleString()}`} />
                                  <Legend verticalAlign="bottom" height={36}/>
                              </PieChart>
                          </ResponsiveContainer>
                      </div>
                  </div>

                  {/* Profit Waterfall (Simplified Bar) */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                      <h3 className="font-bold text-slate-800 mb-2">Cascada de Rentabilidad</h3>
                      <div className="h-72">
                          <ResponsiveContainer width="100%" height="100%">
                              <BarChart 
                                data={[
                                    { name: 'Ventas Netas', amount: financialStatement.totalRevenueNet, fill: '#3b82f6' },
                                    { name: 'Utilidad Bruta', amount: financialStatement.grossProfit, fill: '#10b981' },
                                    { name: 'EBITDA', amount: financialStatement.operatingIncome, fill: '#8b5cf6' },
                                    { name: 'Utilidad Neta', amount: financialStatement.netIncome, fill: '#059669' },
                                ]}
                                layout="vertical"
                                margin={{ left: 20 }}
                              >
                                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                  <XAxis type="number" />
                                  <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 11}} />
                                  <Tooltip formatter={(value) => `Q${Number(value).toLocaleString()}`} />
                                  <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                                    {
                                        [
                                            { name: 'Ventas Netas', amount: financialStatement.totalRevenueNet, fill: '#3b82f6' },
                                            { name: 'Utilidad Bruta', amount: financialStatement.grossProfit, fill: '#10b981' },
                                            { name: 'EBITDA', amount: financialStatement.operatingIncome, fill: '#8b5cf6' },
                                            { name: 'Utilidad Neta', amount: financialStatement.netIncome, fill: '#059669' },
                                        ].map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))
                                    }
                                  </Bar>
                              </BarChart>
                          </ResponsiveContainer>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};