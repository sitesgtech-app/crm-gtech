
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/db';
import api from '../services/api';
import { Task, TaskStatus, User, TaskPriority } from '../types';
import { Plus, Search, X, CheckCircle, Clock, ListTodo, UserCircle, Flag, Briefcase, Activity, AlertCircle, Edit, Save, Filter, Inbox, AlertTriangle } from 'lucide-react';

interface TasksProps {
    user: User;
}

const DEPARTMENTS = [
    'General', 'Ventas', 'Administración', 'IT / Soporte', 'RRHH', 'Gerencia', 'Compras', 'Marketing', 'Contabilidad', 'Cumplimiento'
];

export const Tasks: React.FC<TasksProps> = ({ user }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [departmentFilter, setDepartmentFilter] = useState('Todos');

    const [currentTask, setCurrentTask] = useState<Partial<Task>>({
        title: '', description: '', assignedTo: '', requesterId: '', priority: TaskPriority.MEDIA, department: 'General'
    });

    const [viewMode, setViewMode] = useState<'active' | 'trash'>('active');

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
    const [deleteReason, setDeleteReason] = useState('');

    useEffect(() => { refreshData(); }, [user, viewMode]);

    const refreshData = async () => {
        try {
            // Fetch Users
            try {
                const usersResponse = await api.get('/users');
                setUsers(usersResponse.data);
            } catch (error) {
                console.error('Error fetching users:', error);
                // setUsers(db.getUsers()); // Fallback REMOVED to prevent FK errors
                alert("No se pudieron cargar los usuarios. Por favor recargue la página o contacte soporte.");
            }

            // Fetch Tasks based on View Mode
            let tasksResponse;
            if (viewMode === 'active') {
                tasksResponse = await api.get('/tickets');
            } else {
                tasksResponse = await api.get('/tickets/trash');
            }

            // Map backend Ticket to frontend Task
            const mappedTasks: Task[] = tasksResponse.data.map((t: any) => ({
                id: t.id,
                title: t.title,
                description: t.description,
                assignedTo: t.assignedToId || '',
                requesterId: t.requesterId || '',
                department: t.department || 'General',
                priority: t.priority, // Ensure Enum matches or map it
                status: t.status, // Ensure Enum matches
                createdAt: t.createdAt,
                deletedAt: t.deletedAt,
                deletionReason: t.deletionReason
            }));

            setTasks(mappedTasks);
        } catch (error) {
            console.error('Error fetching tasks:', error);
            // Fallback? Maybe not for production request
            // setTasks(db.getTasks(user.id, user.role));
        }
    };

    const handleUpdateTicket = async () => {
        if (!currentTask || !currentTask.id) return;

        // Validation
        if (!currentTask.title || !currentTask.description) {
            alert("Título y Descripción requeridos");
            return;
        }

        try {
            await api.put(`/tickets/${currentTask.id}`, {
                title: currentTask.title,
                description: currentTask.description,
                priority: currentTask.priority,
                department: currentTask.department,
                assignedToId: currentTask.assignedTo,
                requesterId: currentTask.requesterId
            });

            refreshData();
            setIsModalOpen(false);
            resetForm();
            alert("Ticket actualizado correctamente");
        } catch (error) {
            console.error("Failed to update ticket", error);
            alert("Error al actualizar ticket");
        }
    };

    const handleSaveTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentTask.description || !currentTask.assignedTo || !currentTask.title) return;

        try {
            const taskData = {
                title: currentTask.title,
                description: currentTask.description,
                assignedToId: currentTask.assignedTo,
                requesterId: currentTask.requesterId || user.id,
                priority: currentTask.priority || TaskPriority.MEDIA,
                department: currentTask.department || 'General',
                // clientId removed as it's optional now
            };

            if (currentTask.id) {
                await handleUpdateTicket();
            } else {
                await api.post('/tickets', taskData);
                refreshData();
                setIsModalOpen(false);
                resetForm();
            }
        } catch (error) {
            console.error("Error saving ticket", error);
            const errorMsg = (error as any).response?.data?.error || (error as any).message || "Error desconocido";
            alert(`Error al guardar el ticket: ${errorMsg}`);
        }
    };

    const handleDeleteClick = (taskId: string) => {
        setTaskToDelete(taskId);
        setDeleteReason('');
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async (e: React.FormEvent) => {
        e.preventDefault();
        if (taskToDelete && deleteReason) {
            try {
                await api.delete(`/tickets/${taskToDelete}`, {
                    data: { reason: deleteReason }
                });
                setIsDeleteModalOpen(false);
                setTaskToDelete(null);
                refreshData();
            } catch (error) {
                console.error("Error deleting ticket", error);
                alert("Error al eliminar ticket");
            }
        }
    };

    const resetForm = () => {
        setCurrentTask({ title: '', description: '', assignedTo: '', requesterId: user.id, priority: TaskPriority.MEDIA, department: 'General' });
    };

    const openNewModal = () => { resetForm(); setIsModalOpen(true); };
    const openEditModal = (task: Task) => { setCurrentTask(task); setIsModalOpen(true); };

    const updateTaskStatus = async (task: Task, newStatus: TaskStatus) => {
        try {
            await api.patch(`/tickets/${task.id}/status`, { status: newStatus });
            refreshData();
        } catch (error) {
            console.error("Error updating status", error);
        }
    };

    const getUserName = (id: string) => users.find(u => u.id === id)?.name || 'Desconocido';
    const getAvatar = (id: string) => users.find(u => u.id === id)?.avatar;

    const filteredTasks = tasks.filter(t => {
        // Filter by View Mode
        if (viewMode === 'active' && t.status === TaskStatus.ELIMINADA) return false;
        if (viewMode === 'trash' && t.status !== TaskStatus.ELIMINADA) return false;

        const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || t.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDept = departmentFilter === 'Todos' || t.department === departmentFilter;
        return matchesSearch && matchesDept;
    });

    const handleRestoreTask = async (task: Task) => {
        try {
            await api.post(`/tickets/${task.id}/restore`);
            refreshData();
        } catch (error) {
            console.error("Error restoring ticket", error);
            alert("Error al restaurar ticket");
        }
    };

    const stats = useMemo(() => ({
        total: tasks.length,
        urgent: tasks.filter(t => t.priority === TaskPriority.URGENTE && t.status !== TaskStatus.FINALIZADA).length,
        open: tasks.filter(t => t.status !== TaskStatus.FINALIZADA).length
    }), [tasks]);

    const formatDuration = (ms: number) => {
        if (ms < 0) return '0m';
        const minutes = Math.floor((ms / (1000 * 60)) % 60);
        const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
        const days = Math.floor(ms / (1000 * 60 * 60 * 24));
        if (days > 0) return `${days}d`;
        if (hours > 0) return `${hours}h`;
        return `${minutes}m`;
    };

    const getTimeInfo = (task: Task) => {
        const created = new Date(task.createdAt).getTime();
        const now = new Date().getTime();
        const started = task.startedAt ? new Date(task.startedAt).getTime() : null;
        const finished = task.finishedAt ? new Date(task.finishedAt).getTime() : null;

        if (task.status === TaskStatus.FINALIZADA && finished) {
            const duration = finished - (started || created);
            return { label: 'Resuelto en', value: formatDuration(duration), color: 'text-emerald-600 bg-emerald-50' };
        } else if (task.status === TaskStatus.EN_PROCESO && started) {
            const duration = now - started;
            return { label: 'En Proceso', value: formatDuration(duration), color: 'text-blue-600 bg-blue-50' };
        } else {
            const duration = now - created;
            return { label: 'Espera', value: formatDuration(duration), color: 'text-orange-600 bg-orange-50' };
        }
    };

    const getPriorityStyles = (p: TaskPriority) => {
        switch (p) {
            case TaskPriority.URGENTE: return 'bg-red-500 text-white shadow-red-200 shadow-md border-transparent';
            case TaskPriority.ALTA: return 'bg-orange-50 text-orange-700 border-orange-200';
            case TaskPriority.MEDIA: return 'bg-blue-50 text-blue-700 border-blue-200';
            case TaskPriority.BAJA: return 'bg-slate-50 text-slate-600 border-slate-200';
            default: return 'bg-slate-50 text-slate-600 border-slate-200';
        }
    };

    const KanbanColumn = ({ status, title, icon: Icon, headerColor }: any) => {
        const colTasks = filteredTasks.filter(t => t.status === status);

        return (
            <div className="flex flex-col h-full min-w-[320px] w-full bg-slate-50/50 rounded-2xl border border-slate-200/60 backdrop-blur-sm">
                <div className={`p-4 border-b border-slate-100 flex justify-between items-center rounded-t-2xl ${headerColor}`}>
                    <div className="flex items-center gap-2 font-bold text-slate-700">
                        <Icon size={18} /> {title}
                    </div>
                    <span className="bg-white px-2.5 py-0.5 rounded-full text-xs font-bold text-slate-700 shadow-sm">{colTasks.length}</span>
                </div>

                <div className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                    {colTasks.map(task => {
                        const timeInfo = getTimeInfo(task);
                        return (
                            <div key={task.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group relative">
                                {/* Header Badges */}
                                <div className="flex justify-between items-start mb-3">
                                    <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full border ${getPriorityStyles(task.priority)}`}>
                                        {task.priority}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                                        {task.department}
                                    </span>
                                </div>

                                <h4 className="font-bold text-slate-800 text-sm mb-2 leading-tight pr-6 font-lato">{task.title}</h4>
                                <p className="text-xs text-slate-500 mb-4 line-clamp-2 leading-relaxed">{task.description}</p>

                                {/* Footer: User & Time */}
                                <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                    <div className="flex items-center gap-2">
                                        <img src={getAvatar(task.assignedTo) || `https://ui-avatars.com/api/?name=${getUserName(task.assignedTo)}`} className="w-6 h-6 rounded-full border border-slate-200" alt="User" />
                                        <span className="text-xs font-medium text-slate-600 truncate max-w-[80px]">{getUserName(task.assignedTo)}</span>
                                    </div>
                                    <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-md ${timeInfo.color}`}>
                                        <Clock size={10} /> {timeInfo.value}
                                    </div>
                                </div>

                                <div className="absolute top-3 right-3 flex gap-1 opacity-100">
                                    {viewMode === 'active' && (
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => openEditModal(task)}
                                                className="text-slate-300 hover:text-brand-600 p-1"
                                                title="Editar"
                                            >
                                                <Edit size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(task.id)}
                                                className="text-slate-300 hover:text-red-600 p-1"
                                                title="Eliminar"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    )}
                                    {viewMode === 'trash' && (
                                        <button
                                            onClick={() => handleRestoreTask(task)}
                                            className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold hover:bg-emerald-200"
                                            title="Restaurar Ticket"
                                        >
                                            Restaurar
                                        </button>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    {viewMode === 'active' && (
                                        <>
                                            {status === TaskStatus.RECIBIDA && (
                                                <button onClick={() => updateTaskStatus(task, TaskStatus.EN_PROCESO)} className="bg-blue-600 text-white px-3 py-1 rounded-lg text-[10px] font-bold shadow-md hover:bg-blue-700">Iniciar</button>
                                            )}
                                            {status === TaskStatus.EN_PROCESO && (
                                                <button onClick={() => updateTaskStatus(task, TaskStatus.FINALIZADA)} className="bg-emerald-600 text-white px-3 py-1 rounded-lg text-[10px] font-bold shadow-md hover:bg-emerald-700">Terminar</button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {colTasks.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-10 text-slate-300">
                            <Inbox size={32} className="mb-2 opacity-50" />
                            <p className="text-xs font-medium">Bandeja vacía</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col space-y-6">
            {/* Header & Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
                <div className="md:col-span-1">
                    <h1 className="text-2xl font-bold text-slate-800 font-lato">Mesa de Ayuda</h1>
                    <p className="text-slate-500 text-sm">Gestión de tickets y soporte interno.</p>
                </div>
                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <div className="p-2 bg-blue-50 text-brand-600 rounded-lg"><Inbox size={20} /></div>
                    <div>
                        <p className="text-xs text-slate-400 font-bold uppercase">Tickets Activos</p>
                        <p className="text-xl font-bold text-slate-800">{stats.open}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <div className="p-2 bg-red-50 text-red-500 rounded-lg"><AlertTriangle size={20} /></div>
                    <div>
                        <p className="text-xs text-slate-400 font-bold uppercase">Urgentes</p>
                        <p className="text-xl font-bold text-slate-800">{stats.urgent}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 w-full">
                    <button
                        onClick={openNewModal}
                        className="w-full h-full flex flex-col items-center justify-center bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20 group"
                    >
                        <Plus className="w-6 h-6 mb-1 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold">Nuevo Ticket</span>
                    </button>
                </div>
            </div>

            {/* Trash Bin Toggle */}
            <div className="flex justify-between items-center bg-slate-100 p-2 rounded-xl mb-2">
                <div className="flex gap-2">
                    <button
                        onClick={() => setViewMode('active')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'active' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Tickets Activos
                    </button>
                    <button
                        onClick={() => setViewMode('trash')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'trash' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-red-600'}`}
                    >
                        🗑️ Papelera ({tasks.filter(t => t.status === TaskStatus.ELIMINADA).length})
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex justify-between items-center gap-4">
                <div className="flex items-center gap-3 bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-fit">
                    <div className="px-3 flex items-center gap-2 border-r border-slate-100">
                        <Filter size={14} className="text-slate-400" />
                        <select
                            className="bg-transparent text-sm font-medium text-slate-600 outline-none cursor-pointer hover:text-slate-800"
                            value={departmentFilter}
                            onChange={(e) => setDepartmentFilter(e.target.value)}
                        >
                            <option value="Todos">Todos los Deptos.</option>
                            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <div className="px-2 relative">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                        <input
                            className="pl-7 pr-2 py-1 text-sm outline-none w-48 bg-transparent placeholder-slate-400"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="flex-1 overflow-x-auto pb-4">
                <div className="flex gap-6 h-full min-w-[1000px]">
                    <KanbanColumn status={TaskStatus.RECIBIDA} title="Pendientes" icon={ListTodo} headerColor="bg-slate-100" />
                    <KanbanColumn status={TaskStatus.EN_PROCESO} title="En Proceso" icon={Activity} headerColor="bg-blue-50 text-blue-700" />
                    <KanbanColumn status={TaskStatus.FINALIZADA} title="Resueltos" icon={CheckCircle} headerColor="bg-emerald-50 text-emerald-700" />
                </div>
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto transform scale-100 transition-all">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                                    <Flag className="text-brand-600 w-5 h-5" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-800 font-lato">
                                    {currentTask.id ? 'Editar Ticket' : 'Crear Ticket'}
                                </h2>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X className="text-slate-400 hover:text-slate-600" /></button>
                        </div>
                        <form onSubmit={handleSaveTask} className="p-8 space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Título</label>
                                <input
                                    required
                                    className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all font-medium text-slate-800"
                                    placeholder="Ej. Error en impresora de ventas"
                                    value={currentTask.title}
                                    onChange={(e) => setCurrentTask({ ...currentTask, title: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Prioridad</label>
                                    <select
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white outline-none focus:ring-2 focus:ring-brand-500/20"
                                        value={currentTask.priority}
                                        onChange={(e) => setCurrentTask({ ...currentTask, priority: e.target.value as TaskPriority })}
                                    >
                                        {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Departamento</label>
                                    <select
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white outline-none focus:ring-2 focus:ring-brand-500/20"
                                        value={currentTask.department}
                                        onChange={(e) => setCurrentTask({ ...currentTask, department: e.target.value })}
                                    >
                                        {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Solicitado por</label>
                                    <select
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white outline-none"
                                        value={currentTask.requesterId}
                                        onChange={(e) => setCurrentTask({ ...currentTask, requesterId: e.target.value })}
                                    >
                                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Asignar a</label>
                                    <select
                                        required
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white outline-none focus:ring-2 focus:ring-brand-500/20"
                                        value={currentTask.assignedTo}
                                        onChange={(e) => setCurrentTask({ ...currentTask, assignedTo: e.target.value })}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Descripción</label>
                                <textarea
                                    required
                                    className="w-full border border-slate-200 rounded-xl px-4 py-3 h-32 resize-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none bg-slate-50 focus:bg-white transition-colors"
                                    placeholder="Detalles completos del requerimiento..."
                                    value={currentTask.description}
                                    onChange={(e) => setCurrentTask({ ...currentTask, description: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl font-bold transition-colors">Cancelar</button>
                                <button type="submit" className="px-6 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 font-bold shadow-lg shadow-brand-500/30 flex items-center gap-2 transform hover:scale-105 transition-all">
                                    <Save size={18} /> Guardar Ticket
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform scale-100 transition-all">
                        <div className="p-6 border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-800">Eliminar Ticket</h2>
                            <p className="text-sm text-slate-500">Esta acción no se puede deshacer.</p>
                        </div>
                        <form onSubmit={confirmDelete} className="p-6 space-y-4">
                            <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm mb-4">
                                <p className="font-bold mb-1">¿Estás seguro?</p>
                                <p>El ticket será eliminado permanentemente del tablero activo.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Motivo de la eliminación <span className="text-red-500">*</span></label>
                                <textarea
                                    required
                                    className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                                    rows={3}
                                    placeholder="Explique por qué se elimina este ticket..."
                                    value={deleteReason}
                                    onChange={(e) => setDeleteReason(e.target.value)}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold shadow-lg shadow-red-500/30">
                                    Confirmar Eliminación
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
