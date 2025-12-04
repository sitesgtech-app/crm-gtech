import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/db';
import { Employee, User, UserRole, Expense } from '../types';
import { Plus, Search, Edit, Save, X, User as UserIcon, ShieldCheck, DollarSign, FileText, HeartHandshake, Trash2 } from 'lucide-react';

export const Payroll: React.FC<{ user: User }> = ({ user }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  
  // Form State for Employee
  const [currentEmp, setCurrentEmp] = useState<Partial<Employee>>({
      name: '', position: '', contractType: 'Planilla', baseSalary: 0, paysIGSS: true, otherInsurance: 0, active: true, startDate: new Date().toISOString().split('T')[0]
  });

  // Payment Generation State
  const [paymentMonth, setPaymentMonth] = useState(new Date().getMonth());
  const [paymentYear, setPaymentYear] = useState(new Date().getFullYear());

  useEffect(() => {
      refreshData();
  }, []);

  const refreshData = () => {
      setEmployees(db.getEmployees());
  };

  const filteredEmployees = employees.filter(e => 
      e.active && (
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.position.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleEdit = (emp: Employee) => {
      setCurrentEmp(emp);
      setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(!currentEmp.name || !currentEmp.baseSalary) return;

      const emp: Employee = {
          id: currentEmp.id || `emp${Date.now()}`,
          name: currentEmp.name!,
          position: currentEmp.position || 'Colaborador',
          contractType: currentEmp.contractType as any,
          baseSalary: Number(currentEmp.baseSalary),
          paysIGSS: currentEmp.contractType === 'Planilla' ? (currentEmp.paysIGSS ?? true) : false,
          otherInsurance: Number(currentEmp.otherInsurance) || 0,
          active: currentEmp.active ?? true,
          startDate: currentEmp.startDate || new Date().toISOString()
      };

      db.saveEmployee(emp);
      refreshData();
      setIsModalOpen(false);
      resetForm();
  };

  const resetForm = () => {
      setCurrentEmp({ name: '', position: '', contractType: 'Planilla', baseSalary: 0, paysIGSS: true, otherInsurance: 0, active: true, startDate: new Date().toISOString().split('T')[0] });
  };

  const handleDelete = (id: string) => {
      if(window.confirm('¿Dar de baja a este empleado?')) {
          db.deleteEmployee(id);
          refreshData();
      }
  };

  // --- PAYROLL CALCULATION LOGIC ---
  const calculateCost = (emp: Employee) => {
      let totalCost = 0;
      const details: string[] = [];

      if (emp.contractType === 'Planilla') {
          // Base Salary
          totalCost += emp.baseSalary;
          
          // Bonificación Incentivo (Ley Q250)
          const bonificacion = 250; 
          totalCost += bonificacion;
          
          // Employer IGSS (Cuota Patronal 12.67%)
          // IRTRA + INTECAP + IGSS
          let employerIGSS = 0;
          if (emp.paysIGSS) {
              employerIGSS = emp.baseSalary * 0.1267; 
              totalCost += employerIGSS;
              details.push(`Salario Base: Q${emp.baseSalary}`);
              details.push(`Bonif. Ley: Q${bonificacion}`);
              details.push(`Cuota Patronal (12.67%): Q${employerIGSS.toFixed(2)}`);
          } else {
              details.push(`Salario Base: Q${emp.baseSalary}`);
              details.push(`Bonif. Ley: Q${bonificacion}`);
          }

      } else {
          // Servicios Profesionales (Factura)
          totalCost += emp.baseSalary;
          details.push(`Honorarios: Q${emp.baseSalary}`);
      }

      if (emp.otherInsurance > 0) {
          totalCost += emp.otherInsurance;
          details.push(`Otros Seguros: Q${emp.otherInsurance}`);
      }

      return { totalCost, details };
  };

  const projectedTotal = filteredEmployees.reduce((sum, emp) => sum + calculateCost(emp).totalCost, 0);

  const handleGeneratePayroll = () => {
      const monthName = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][paymentMonth];
      
      if(!window.confirm(`¿Generar gastos de planilla para ${monthName} ${paymentYear} por un total de Q${projectedTotal.toLocaleString()}?`)) return;

      filteredEmployees.forEach(emp => {
          const calc = calculateCost(emp);
          
          const expense: Expense = {
              id: `pay-${emp.id}-${paymentMonth}-${paymentYear}`,
              date: new Date(paymentYear, paymentMonth, 28).toISOString(), // Approx payment date
              category: 'Salarios y Planilla', // Special category for Financial Report
              description: `Pago ${monthName} - ${emp.name} (${emp.contractType})`,
              amount: calc.totalCost,
              registeredBy: user.id,
              supplier: emp.name // Used as supplier for consistency
          };
          
          db.addExpense(expense);
      });

      alert('Planilla generada y gastos registrados exitosamente.');
      setIsPaymentModalOpen(false);
  };

  return (
      <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                  <h1 className="text-2xl font-bold text-slate-800">Recursos Humanos y Planilla</h1>
                  <p className="text-slate-500 text-sm">Gestión de colaboradores, contratos y cálculo de costos patronales.</p>
              </div>
              <div className="flex gap-3">
                  <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input 
                          className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                          placeholder="Buscar colaborador..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                      />
                  </div>
                  <button 
                      onClick={() => setIsPaymentModalOpen(true)}
                      className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium shadow-sm"
                  >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Generar Pago Mes
                  </button>
                  <button 
                      onClick={() => { resetForm(); setIsModalOpen(true); }}
                      className="flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium shadow-sm"
                  >
                      <Plus className="w-4 h-4 mr-2" />
                      Nuevo Colaborador
                  </button>
              </div>
          </div>

          {/* Employees Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEmployees.map(emp => {
                  const cost = calculateCost(emp);
                  return (
                      <div key={emp.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 relative group hover:shadow-md transition-all">
                          <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-3">
                                  <div className={`p-3 rounded-full ${emp.contractType === 'Planilla' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                                      <UserIcon size={20} />
                                  </div>
                                  <div>
                                      <h3 className="font-bold text-slate-800">{emp.name}</h3>
                                      <p className="text-xs text-slate-500">{emp.position}</p>
                                  </div>
                              </div>
                              <div className="flex gap-1">
                                  <button onClick={() => handleEdit(emp)} className="p-1.5 text-slate-300 hover:text-brand-600 transition-colors"><Edit size={16}/></button>
                                  <button onClick={() => handleDelete(emp.id)} className="p-1.5 text-slate-300 hover:text-red-600 transition-colors"><Trash2 size={16}/></button>
                              </div>
                          </div>

                          <div className="space-y-3 border-t border-slate-100 pt-4">
                              <div className="flex justify-between text-sm">
                                  <span className="text-slate-500">Contrato:</span>
                                  <span className={`font-bold text-xs px-2 py-0.5 rounded ${emp.contractType === 'Planilla' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                                      {emp.contractType}
                                  </span>
                              </div>
                              
                              {emp.contractType === 'Planilla' && (
                                  <div className="flex justify-between text-sm">
                                      <span className="text-slate-500 flex items-center gap-1"><ShieldCheck size={14}/> IGSS Patronal:</span>
                                      <span className={`font-bold ${emp.paysIGSS ? 'text-green-600' : 'text-slate-400'}`}>
                                          {emp.paysIGSS ? 'Sí (12.67%)' : 'No'}
                                      </span>
                                  </div>
                              )}

                              {emp.otherInsurance > 0 && (
                                  <div className="flex justify-between text-sm">
                                      <span className="text-slate-500 flex items-center gap-1"><HeartHandshake size={14}/> Otros Seguros:</span>
                                      <span className="font-medium">Q{emp.otherInsurance.toLocaleString()}</span>
                                  </div>
                              )}

                              <div className="bg-slate-50 p-3 rounded-lg mt-2">
                                  <p className="text-xs text-slate-400 uppercase font-bold mb-1">Costo Mensual Empresa</p>
                                  <div className="flex justify-between items-end">
                                      <p className="text-xl font-bold text-slate-800">Q{cost.totalCost.toLocaleString(undefined, {maximumFractionDigits: 2})}</p>
                                      <div className="group/tooltip relative">
                                          <FileText size={16} className="text-slate-400 cursor-help hover:text-brand-600"/>
                                          <div className="absolute bottom-full right-0 mb-2 w-48 bg-slate-800 text-white text-xs rounded p-2 hidden group-hover/tooltip:block z-10">
                                              {cost.details.map((d, i) => <div key={i}>{d}</div>)}
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>
                  );
              })}
          </div>

          {/* EDIT/CREATE MODAL */}
          {isModalOpen && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
                      <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                          <h2 className="text-xl font-bold text-slate-800">{currentEmp.id ? 'Editar Colaborador' : 'Nuevo Colaborador'}</h2>
                          <button onClick={() => setIsModalOpen(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
                      </div>
                      <form onSubmit={handleSubmit} className="p-6 space-y-4">
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                              <input required type="text" className="w-full border border-slate-300 rounded-lg p-2 bg-white" value={currentEmp.name} onChange={e => setCurrentEmp({...currentEmp, name: e.target.value})} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-1">Puesto / Cargo</label>
                                  <input required type="text" className="w-full border border-slate-300 rounded-lg p-2 bg-white" value={currentEmp.position} onChange={e => setCurrentEmp({...currentEmp, position: e.target.value})} />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Inicio</label>
                                  <input type="date" className="w-full border border-slate-300 rounded-lg p-2 bg-white" value={currentEmp.startDate} onChange={e => setCurrentEmp({...currentEmp, startDate: e.target.value})} />
                              </div>
                          </div>

                          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
                              <div>
                                  <label className="block text-sm font-bold text-slate-700 mb-2">Tipo de Contrato</label>
                                  <div className="flex gap-4">
                                      <label className="flex items-center gap-2 cursor-pointer">
                                          <input type="radio" name="contract" className="text-brand-600" checked={currentEmp.contractType === 'Planilla'} onChange={() => setCurrentEmp({...currentEmp, contractType: 'Planilla', paysIGSS: true})} />
                                          <span className="text-sm">Planilla (Dependencia)</span>
                                      </label>
                                      <label className="flex items-center gap-2 cursor-pointer">
                                          <input type="radio" name="contract" className="text-brand-600" checked={currentEmp.contractType === 'Servicios Profesionales'} onChange={() => setCurrentEmp({...currentEmp, contractType: 'Servicios Profesionales', paysIGSS: false})} />
                                          <span className="text-sm">Servicios Prof. (Factura)</span>
                                      </label>
                                  </div>
                              </div>

                              <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-1">
                                      {currentEmp.contractType === 'Planilla' ? 'Salario Base Mensual (Q)' : 'Honorarios Mensuales (Q)'}
                                  </label>
                                  <input required type="number" step="0.01" className="w-full border border-slate-300 rounded-lg p-2 bg-white font-bold" value={currentEmp.baseSalary} onChange={e => setCurrentEmp({...currentEmp, baseSalary: Number(e.target.value)})} />
                              </div>

                              {currentEmp.contractType === 'Planilla' && (
                                  <div className="flex items-center gap-2 bg-white p-2 rounded border border-slate-200">
                                      <input type="checkbox" className="w-4 h-4 text-brand-600 rounded" checked={currentEmp.paysIGSS} onChange={e => setCurrentEmp({...currentEmp, paysIGSS: e.target.checked})} />
                                      <label className="text-sm text-slate-700">Pagar Cuota Patronal IGSS/Intecap/Irtra (12.67%)</label>
                                  </div>
                              )}
                          </div>

                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Otros Seguros / Beneficios (Q)</label>
                              <input type="number" step="0.01" className="w-full border border-slate-300 rounded-lg p-2 bg-white" placeholder="Ej. Seguro Médico Privado" value={currentEmp.otherInsurance} onChange={e => setCurrentEmp({...currentEmp, otherInsurance: Number(e.target.value)})} />
                          </div>

                          <div className="flex justify-end gap-3 pt-2">
                              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">Cancelar</button>
                              <button type="submit" className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium">Guardar Colaborador</button>
                          </div>
                      </form>
                  </div>
              </div>
          )}

          {/* PAYMENT CONFIRMATION MODAL */}
          {isPaymentModalOpen && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                  <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                      <div className="p-6 border-b border-slate-100 text-center">
                          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                              <DollarSign size={24} />
                          </div>
                          <h2 className="text-xl font-bold text-slate-800">Procesar Planilla Mensual</h2>
                          <p className="text-sm text-slate-500 mt-1">Esto generará registros de gasto automáticamente.</p>
                      </div>
                      
                      <div className="p-6 space-y-4">
                          <div className="flex gap-4 justify-center">
                              <select value={paymentMonth} onChange={(e) => setPaymentMonth(Number(e.target.value))} className="border border-slate-300 rounded p-2 bg-white text-sm">
                                  {['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'].map((m, i) => (
                                      <option key={i} value={i}>{m}</option>
                                  ))}
                              </select>
                              <select value={paymentYear} onChange={(e) => setPaymentYear(Number(e.target.value))} className="border border-slate-300 rounded p-2 bg-white text-sm">
                                  <option value={2023}>2023</option>
                                  <option value={2024}>2024</option>
                                  <option value={2025}>2025</option>
                              </select>
                          </div>

                          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-center">
                              <p className="text-xs text-slate-500 uppercase font-bold">Total a Reportar (Costo Empresa)</p>
                              <p className="text-3xl font-bold text-slate-800 mt-1">Q{projectedTotal.toLocaleString(undefined, {maximumFractionDigits: 2})}</p>
                              <p className="text-xs text-slate-400 mt-2">{filteredEmployees.length} colaboradores activos</p>
                          </div>

                          <button onClick={handleGeneratePayroll} className="w-full py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-500/30 transition-all">
                              Confirmar y Generar Gastos
                          </button>
                          <button onClick={() => setIsPaymentModalOpen(false)} className="w-full py-2 text-slate-500 text-sm hover:text-slate-700">
                              Cancelar
                          </button>
                      </div>
                  </div>
              </div>
          )}
      </div>
  );
};