
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { User, UserRole } from '../types';
import { Plus, Search, Edit, User as UserIcon, Save, X, Phone, Mail, Shield, Upload, Lock, Ban, KeyRound, LayoutDashboard, Trello, Users, CalendarDays, Activity, Truck } from 'lucide-react';

export const SalesTeam: React.FC<{ user: User }> = ({ user }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [currentUser, setCurrentUser] = useState<Partial<User>>({
    name: '', email: '', phone: '', role: UserRole.VENDEDOR, avatar: '', password: '', active: true, permissions: []
  });

  useEffect(() => {
    setUsers(db.getUsers());
  }, []);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (userData: User) => {
      // Load user but keep password empty unless they want to change it
      setCurrentUser({ ...userData, password: '' });
      setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser.name || !currentUser.email) return;
    
    // New User validation
    if (!currentUser.id && !currentUser.password) {
        alert("La contraseña es obligatoria para nuevos usuarios.");
        return;
    }

    // Default permissions if none selected for non-admin
    let finalPermissions = currentUser.permissions || [];
    if (currentUser.role === UserRole.VENDEDOR && finalPermissions.length === 0) {
        finalPermissions = ['/', '/pipeline', '/clients']; 
    }

    const userData: User = {
      id: currentUser.id || `u${Date.now()}`,
      name: currentUser.name,
      email: currentUser.email,
      phone: currentUser.phone || '',
      role: currentUser.role || UserRole.VENDEDOR,
      avatar: currentUser.avatar || `https://ui-avatars.com/api/?name=${currentUser.name}`,
      password: currentUser.password, // If empty string, db service will handle keeping old one
      active: currentUser.active !== undefined ? currentUser.active : true,
      permissions: finalPermissions,
      theme: currentUser.theme,
      // If new user, force password change
      mustChangePassword: !currentUser.id ? true : currentUser.mustChangePassword 
    };

    db.saveUser(userData);
    setUsers(db.getUsers());
    setIsModalOpen(false);
    setCurrentUser({ name: '', email: '', phone: '', role: UserRole.VENDEDOR, avatar: '', password: '', active: true, permissions: [] });
  };

  const handleResetPassword = () => {
      if (!currentUser.id) return;
      if (window.confirm('¿Generar una contraseña temporal para este usuario? Se le obligará a cambiarla en su próximo inicio de sesión.')) {
          const tempPass = db.adminResetPassword(currentUser.id);
          alert(`✅ Contraseña restablecida.\n\nNueva Contraseña Temporal: ${tempPass}\n\nPor favor, entrégala al usuario.`);
          setIsModalOpen(false);
      }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentUser({ ...currentUser, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePermissionChange = (path: string) => {
      const current = currentUser.permissions || [];
      if (current.includes(path)) {
          setCurrentUser({ ...currentUser, permissions: current.filter(p => p !== path) });
      } else {
          setCurrentUser({ ...currentUser, permissions: [...current, path] });
      }
  };

  // List of available modules for permission assignment
  const availableModules = [
      { path: '/', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/pipeline', label: 'Oportunidades', icon: Trello },
      { path: '/clients', label: 'Clientes', icon: Users },
      { path: '/calendar', label: 'Calendario', icon: CalendarDays },
      { path: '/activities', label: 'Actividades', icon: Activity },
      { path: '/suppliers', label: 'Proveedores', icon: Truck },
      { path: '/products', label: 'Productos', icon: null },
      { path: '/services', label: 'Servicios', icon: null },
      { path: '/sales-report', label: 'Reporte Ventas', icon: null },
      { path: '/reports', label: 'Reportes Globales', icon: null },
      { path: '/purchases', label: 'Compras', icon: null },
      { path: '/expenses', label: 'Gastos', icon: null },
      { path: '/financial', label: 'Reporte Financiero', icon: null },
      { path: '/guatecompras', label: 'Guatecompras', icon: null },
      { path: '/gc-clients', label: 'Clientes Gob.', icon: null },
      { path: '/gov-report', label: 'Reporte Gob.', icon: null },
      { path: '/subscriptions', label: 'Suscripciones', icon: null },
      { path: '/tasks', label: 'Tareas', icon: null },
  ];

  if (user.role !== UserRole.ADMIN) {
      return <div className="p-10 text-center text-slate-500 bg-slate-50 rounded-lg border border-slate-200 m-4">
          <Shield className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h3 className="text-lg font-medium text-slate-700">Acceso Restringido</h3>
          <p>Solo los administradores pueden gestionar el equipo de ventas.</p>
      </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-800">Gestión de Usuarios</h1>
            <p className="text-slate-500 text-sm">Administra accesos, contraseñas y permisos del sistema.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
             <input 
               className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500 bg-white"
               placeholder="Buscar usuario..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
          <button 
            onClick={() => { setCurrentUser({ name: '', email: '', phone: '', role: UserRole.VENDEDOR, avatar: '', password: '', active: true, permissions: [] }); setIsModalOpen(true); }}
            className="flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Usuario
          </button>
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((userData) => (
            <div key={userData.id} className={`bg-white rounded-xl shadow-sm border ${!userData.active ? 'border-red-200 bg-red-50' : 'border-slate-200'} p-6 flex items-start gap-4 relative group hover:shadow-md transition-all`}>
                 <div className="relative">
                    <img 
                        src={userData.avatar || `https://ui-avatars.com/api/?name=${userData.name}`} 
                        alt={userData.name} 
                        className={`w-16 h-16 rounded-full object-cover border ${!userData.active ? 'border-red-300 grayscale opacity-70' : 'border-slate-200'}`}
                    />
                    {!userData.active && (
                        <div className="absolute bottom-0 right-0 bg-red-500 text-white p-1 rounded-full border border-white">
                            <Ban size={10} />
                        </div>
                    )}
                 </div>
                 
                 <div className="flex-1">
                     <div className="flex justify-between items-start">
                        <h3 className={`font-bold ${!userData.active ? 'text-red-700 line-through' : 'text-slate-800'}`}>{userData.name}</h3>
                        <button onClick={() => handleEdit(userData)} className="text-slate-300 hover:text-brand-600" title="Editar Usuario">
                            <Edit size={16} />
                        </button>
                     </div>
                     <span className={`text-xs px-2 py-0.5 rounded-full ${userData.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-brand-700'}`}>
                         {userData.role}
                     </span>
                     
                     <div className="mt-3 space-y-1">
                         <div className="flex items-center text-xs text-slate-600 gap-2">
                             <Mail size={12} /> {userData.email}
                         </div>
                         <div className="flex items-center text-xs text-slate-600 gap-2">
                             <Phone size={12} /> {userData.phone || 'Sin teléfono'}
                         </div>
                     </div>
                 </div>
            </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between">
              <h2 className="text-xl font-bold text-slate-800">{currentUser.id ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
              <button onClick={() => setIsModalOpen(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {/* Avatar & Status */}
              <div className="flex justify-between items-start mb-4">
                  <div className="relative w-20 h-20">
                      <img 
                        src={currentUser.avatar || `https://ui-avatars.com/api/?name=${currentUser.name || 'Nuevo'}`} 
                        alt="Preview" 
                        className="w-full h-full rounded-full object-cover border-2 border-slate-200"
                      />
                      <label className="absolute bottom-0 right-0 bg-brand-600 text-white p-1.5 rounded-full cursor-pointer hover:bg-brand-700 shadow-sm">
                          <Upload size={12} />
                          <input type="file" accept="image/jpeg, image/png, image/jpg" className="hidden" onChange={handleImageUpload} />
                      </label>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                      <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-100">
                          <input 
                            type="checkbox" 
                            checked={currentUser.active} 
                            onChange={(e) => setCurrentUser({...currentUser, active: e.target.checked})} 
                            className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
                          />
                          <span className={`text-sm font-bold ${currentUser.active ? 'text-green-600' : 'text-red-600'}`}>
                              {currentUser.active ? 'Usuario Activo' : 'Usuario Dado de Baja'}
                          </span>
                      </label>
                  </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                    <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input required type="text" className="w-full pl-9 border border-slate-300 rounded-lg p-2 bg-white" value={currentUser.name} onChange={e => setCurrentUser({...currentUser, name: e.target.value})} />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Correo (Login)</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input required type="email" className="w-full pl-9 border border-slate-300 rounded-lg p-2 bg-white" value={currentUser.email} onChange={e => setCurrentUser({...currentUser, email: e.target.value})} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input 
                            type="text" 
                            className="w-full pl-9 border border-slate-300 rounded-lg p-2 bg-white" 
                            value={currentUser.password} 
                            onChange={e => setCurrentUser({...currentUser, password: e.target.value})} 
                            placeholder={currentUser.id ? "Cambiar contraseña..." : "Contraseña obligatoria"}
                        />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input type="text" className="w-full pl-9 border border-slate-300 rounded-lg p-2 bg-white" value={currentUser.phone} onChange={e => setCurrentUser({...currentUser, phone: e.target.value})} />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Rol del Usuario</label>
                    <div className="relative">
                        <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <select className="w-full pl-9 border border-slate-300 rounded-lg p-2 bg-white" value={currentUser.role} onChange={e => setCurrentUser({...currentUser, role: e.target.value as UserRole})}>
                            <option value={UserRole.VENDEDOR}>Vendedor (Acceso Limitado)</option>
                            <option value={UserRole.ADMIN}>Administrador (Acceso Total)</option>
                        </select>
                    </div>
                  </div>
              </div>

              {/* Reset Password Button (Existing Users Only) */}
              {currentUser.id && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center justify-between">
                      <div>
                          <h4 className="text-sm font-bold text-orange-800">Seguridad de Cuenta</h4>
                          <p className="text-xs text-orange-700 mt-1">Generar contraseña temporal para el usuario.</p>
                      </div>
                      <button 
                        type="button" 
                        onClick={handleResetPassword}
                        className="px-3 py-2 bg-white border border-orange-300 text-orange-700 rounded-lg text-xs font-bold hover:bg-orange-100 transition-colors flex items-center gap-2"
                      >
                          <KeyRound size={14}/> Restablecer Contraseña
                      </button>
                  </div>
              )}

              {/* Permissions Section (Only visible for Non-Admins) */}
              {currentUser.role !== UserRole.ADMIN && (
                  <div className="border-t border-slate-100 pt-4 mt-2">
                      <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                          <Shield size={16} className="text-brand-600"/> Permisos de Acceso (Menú)
                      </h3>
                      <p className="text-xs text-slate-500 mb-3">Seleccione los módulos que este usuario puede ver en el menú.</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {availableModules.map(module => (
                              <label key={module.path} className={`flex items-center gap-2 p-2 rounded border text-xs cursor-pointer transition-colors ${
                                  currentUser.permissions?.includes(module.path) 
                                    ? 'bg-blue-50 border-brand-200 text-brand-700' 
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}>
                                  <input 
                                    type="checkbox" 
                                    checked={currentUser.permissions?.includes(module.path)} 
                                    onChange={() => handlePermissionChange(module.path)}
                                    className="rounded text-brand-600 focus:ring-brand-500"
                                  />
                                  <span>{module.label}</span>
                              </label>
                          ))}
                      </div>
                  </div>
              )}
              
              <div className="flex justify-end gap-3 mt-6 border-t pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 flex items-center gap-2 font-medium">
                    <Save size={16} /> {currentUser.id ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
