


import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/db';
import { User, Opportunity, OpportunityStage, UserRole } from '../types';
import { Search, FileCheck, Download, Eye, Building, Calendar, DollarSign } from 'lucide-react';

interface PurchaseOrdersProps {
  user: User;
}

export const PurchaseOrders: React.FC<PurchaseOrdersProps> = ({ user }) => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Get all won opportunities. Admin sees all, sellers see theirs.
    const allOpps = db.getOpportunities(user.role === UserRole.ADMIN ? undefined : user.id, user.role);
    
    // Filter only those that are WON and HAVE a file
    const wonWithFiles = allOpps.filter(o => 
        o.stage === OpportunityStage.GANADA && o.purchaseOrderFile
    );
    setOpportunities(wonWithFiles);
  }, [user]);

  const filteredOpps = useMemo(() => {
      return opportunities.filter(o => 
          o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          o.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (o.purchaseOrderFileName || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [opportunities, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Repositorio de Órdenes de Compra</h1>
          <p className="text-slate-500 text-sm">Consulta y descarga de documentos (OC) de ventas cerradas.</p>
        </div>
        
        <div className="relative">
             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
             <input 
               className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500 bg-white w-full md:w-80"
               placeholder="Buscar por cliente, proyecto o archivo..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOpps.map(opp => (
              <div key={opp.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden group hover:shadow-md transition-all">
                  <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-start">
                      <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-green-100 text-green-600 rounded-lg">
                              <FileCheck size={20} />
                          </div>
                          <div>
                              <p className="text-xs text-slate-500 font-bold uppercase truncate max-w-[150px]">{opp.clientName}</p>
                              <p className="font-bold text-slate-800 text-sm truncate max-w-[180px]" title={opp.name}>{opp.name}</p>
                          </div>
                      </div>
                  </div>
                  
                  <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500 flex items-center gap-2"><Calendar size={14}/> Fecha Cierre:</span>
                          <span className="font-medium text-slate-700">{new Date(opp.lastUpdated).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500 flex items-center gap-2"><DollarSign size={14}/> Monto Venta:</span>
                          <span className="font-bold text-slate-800">Q{opp.amount.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500 flex items-center gap-2"><Building size={14}/> Sector:</span>
                          <span className="font-medium text-slate-700">{opp.sector || 'Privado'}</span>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mt-3">
                          <p className="text-xs text-slate-400 mb-1">Archivo Adjunto:</p>
                          <p className="text-xs font-medium text-slate-700 truncate mb-3" title={opp.purchaseOrderFileName}>
                              {opp.purchaseOrderFileName || 'Documento_Sin_Nombre.pdf'}
                          </p>
                          <a 
                             href={opp.purchaseOrderFile} 
                             download={opp.purchaseOrderFileName || `OC_${opp.clientName}.pdf`}
                             className="flex items-center justify-center w-full py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold transition-colors gap-2"
                          >
                              <Download size={14} /> Descargar Orden
                          </a>
                      </div>
                  </div>
              </div>
          ))}
      </div>

      {filteredOpps.length === 0 && (
          <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
                  <FileCheck size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-600">No se encontraron Órdenes de Compra</h3>
              <p className="text-slate-400 text-sm max-w-md mx-auto mt-2">
                  Asegúrese de adjuntar los archivos PDF o imágenes en la etapa "Ganada" del Pipeline para que aparezcan aquí.
              </p>
          </div>
      )}
    </div>
  );
};