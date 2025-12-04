
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/db';
import { User } from '../types';
import { Search, Building, Phone, Mail, User as UserIcon, Download } from 'lucide-react';

interface GuatecomprasClientsProps {
  user: User;
}

// Helper interface for our mapped view
interface GCClient {
    id: string; // We'll use email or name as unique ID for display
    name: string;
    entity: string;
    email: string;
    phone: string;
}

export const GuatecomprasClients: React.FC<GuatecomprasClientsProps> = ({ user }) => {
  const [clients, setClients] = useState<GCClient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const events = db.getGuatecomprasEvents();
    
    // Extract unique clients based on Email (primary) or Name
    const uniqueClientsMap = new Map<string, GCClient>();

    events.forEach(event => {
        // Skip if no contact info
        if (!event.contactName && !event.contactEmail) return;

        // Create a key for uniqueness
        const key = event.contactEmail || event.contactName;
        
        if (!uniqueClientsMap.has(key)) {
            uniqueClientsMap.set(key, {
                id: key,
                name: event.contactName || 'Sin Nombre',
                entity: event.purchasingEntity,
                email: event.contactEmail || 'No registrado',
                phone: event.contactPhone || 'No registrado'
            });
        } else {
            // Optional: Update if we find better info in a later event, or concatenate entities
            // For now, we keep the first occurrence as the primary record
            const existing = uniqueClientsMap.get(key);
            if(existing && existing.entity !== event.purchasingEntity) {
                 // If same person works with multiple entities, maybe append? 
                 // For simplicity in this view, we keep original or overwrite.
                 // Let's just keep original for now.
            }
        }
    });

    setClients(Array.from(uniqueClientsMap.values()));
  }, []);

  const filteredClients = useMemo(() => {
      return clients.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [clients, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Clientes Guatecompras</h1>
          <p className="text-slate-500 text-sm">Directorio de contactos extraídos automáticamente de eventos adjudicados.</p>
        </div>
        
        <div className="relative">
             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
             <input 
               className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500 w-full sm:w-64"
               placeholder="Buscar contacto o entidad..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Nombre Contacto</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Entidad Compradora</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Teléfono</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Correo Electrónico</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {filteredClients.map((client, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-2 font-medium text-slate-800">
                                <UserIcon size={16} className="text-slate-400" />
                                {client.name}
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Building size={16} className="text-slate-400" />
                                {client.entity}
                            </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                             <div className="flex items-center gap-2">
                                <Phone size={14} className="text-slate-400" />
                                {client.phone}
                             </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                             <div className="flex items-center gap-2">
                                <Mail size={14} className="text-slate-400" />
                                {client.email}
                             </div>
                        </td>
                    </tr>
                ))}
                {filteredClients.length === 0 && (
                    <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                            No se encontraron contactos registrados en eventos.
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
      </div>
    </div>
  );
};
