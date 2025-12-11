
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/db';
import { User, Activity, Opportunity, Client, Subscription, Project } from '../types';
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin, Mail, X, Calendar as CalIcon, ExternalLink, Download, Share2, CreditCard, Wrench } from 'lucide-react';

interface CalendarProps {
    user: User;
}

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export const Calendar: React.FC<CalendarProps> = ({ user }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [activities, setActivities] = useState<Activity[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string>(''); // YYYY-MM-DD
    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

    // New Appointment Form
    const [newAppt, setNewAppt] = useState({
        clientId: '',
        opportunityId: '',
        type: 'Reunión' as any,
        time: '09:00',
        description: '',
        notificationEmail: ''
    });

    const refreshData = () => {
        setActivities(db.getAllActivities(user.id, user.role));
        setClients(db.getClients(user.id, user.role));
        setOpportunities(db.getOpportunities(user.id, user.role));
        setSubscriptions(db.getSubscriptions());
        setProjects(db.getProjects());
    };

    useEffect(() => {
        refreshData();
    }, [user]);

    // Calendar Logic
    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year: number, month: number) => {
        return new Date(year, month, 1).getDay();
    };

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    const handleDayClick = (day: number) => {
        const monthStr = (month + 1).toString().padStart(2, '0');
        const dayStr = day.toString().padStart(2, '0');
        setSelectedDate(`${year}-${monthStr}-${dayStr}`);

        // Reset Form
        setNewAppt({
            clientId: '',
            opportunityId: '',
            type: 'Reunión',
            time: '09:00',
            description: '',
            notificationEmail: user.email // Default
        });

        setIsModalOpen(true);
    };

    const handleActivityClick = (e: React.MouseEvent, activity: Activity) => {
        e.stopPropagation(); // Prevent opening the "New Appointment" modal
        setSelectedActivity(activity);
        setIsDetailModalOpen(true);
    };

    const handleClientChange = (clientId: string) => {
        const client = clients.find(c => c.id === clientId);
        setNewAppt({
            ...newAppt,
            clientId,
            opportunityId: '',
            notificationEmail: client?.email || ''
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAppt.clientId || !newAppt.opportunityId) return;

        const dateTime = `${selectedDate}T${newAppt.time}`;

        const activity: Activity = {
            id: `act${Date.now()}`,
            organizationId: user.organizationId || 'org1',
            opportunityId: newAppt.opportunityId,
            clientId: newAppt.clientId,
            type: newAppt.type,
            date: new Date(dateTime).toISOString(),
            description: newAppt.description || 'Cita agendada desde calendario',
            responsibleId: user.id,
            responsibleName: user.name
        };

        db.addActivity(activity);

        // Send Professional Notification
        if (newAppt.notificationEmail) {
            const clientName = clients.find(c => c.id === newAppt.clientId)?.name || 'Cliente';
            const org = db.getOrganization();

            const subject = `Confirmación de ${newAppt.type} - ${org.commercialName}`;
            const body = `
Estimado(a) ${clientName},

Por medio de la presente confirmamos la actividad agendada con nuestro equipo.

--------------------------------------------------
TIPO DE ACTIVIDAD: ${newAppt.type.toUpperCase()}
FECHA: ${new Date(selectedDate).toLocaleDateString('es-GT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
HORA: ${newAppt.time}
RESPONSABLE: ${user.name}
--------------------------------------------------

DETALLES / AGENDA:
${newAppt.description}

Si tiene alguna duda o necesita reprogramar, por favor contáctenos.

Atentamente,

${user.name}
${org.commercialName}
Tel: ${org.phone}
        `;

            db.sendEmailNotification(newAppt.notificationEmail, subject, body);
        }

        refreshData();
        setIsModalOpen(false);

        // Open Detail Modal to offer Sync options immediately
        setSelectedActivity(activity);
        setIsDetailModalOpen(true);
    };

    // --- Calendar Sync Logic ---

    const getCalendarUrls = (activity: Activity) => {
        const startTime = new Date(activity.date);
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // Assume 1 hour duration

        const formatDate = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");

        const title = encodeURIComponent(`${activity.type} - gtech CRM`);
        const details = encodeURIComponent(`${activity.description}\n\nResponsable: ${activity.responsibleName}`);
        const location = encodeURIComponent("Oficinas del Cliente / Virtual");

        const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatDate(startTime)}/${formatDate(endTime)}&details=${details}&location=${location}`;

        const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&body=${details}&startdt=${startTime.toISOString()}&enddt=${endTime.toISOString()}&location=${location}`;

        return { googleUrl, outlookUrl };
    };

    const downloadICS = (activity: Activity) => {
        const startTime = new Date(activity.date);
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
        const formatDate = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");

        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//gtech CRM//Calendar//ES',
            'BEGIN:VEVENT',
            `UID:${activity.id}@gtechcrm.com`,
            `DTSTAMP:${formatDate(new Date())}`,
            `DTSTART:${formatDate(startTime)}`,
            `DTEND:${formatDate(endTime)}`,
            `SUMMARY:${activity.type} - gtech CRM`,
            `DESCRIPTION:${activity.description}`,
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\r\n');

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute('download', `evento_gtech_${activity.id}.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Filter opportunities based on selected client
    const filteredOpps = useMemo(() => {
        return opportunities.filter(o => o.clientId === newAppt.clientId);
    }, [opportunities, newAppt.clientId]);

    // Get events for the grid (Activities + Subscriptions + Projects)
    const getEventsForDay = (day: number) => {
        const targetDate = new Date(year, month, day);
        // Set time to noon to avoid timezone rollover issues with basic date math
        targetDate.setHours(12, 0, 0, 0);
        const dateStr = targetDate.toDateString();

        // Activities
        const dayActivities = activities.filter(a => {
            const d = new Date(a.date);
            return d.toDateString() === dateStr;
        });

        // Subscriptions
        const daySubs = subscriptions.filter(s => {
            if (!s.active) return false;
            const payDate = new Date(s.paymentDate);
            // Simple exact date match for now
            return payDate.getDate() === day && payDate.getMonth() === month && payDate.getFullYear() === year;
        });

        // Projects (Active if day falls within range)
        const dayProjects = projects.filter(p => {
            const start = new Date(p.startDate);
            const end = new Date(p.endDate);

            // Normalize times for accurate day comparison
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            const current = new Date(year, month, day);
            current.setHours(12, 0, 0, 0);

            return current >= start && current <= end;
        });

        return { activities: dayActivities, subscriptions: daySubs, projects: dayProjects };
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Calendario</h1>
                    <p className="text-slate-500 text-sm">Citas, reuniones, pagos y ejecución de proyectos.</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm border border-slate-200 p-1">
                        <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-md text-slate-600"><ChevronLeft size={20} /></button>
                        <span className="font-bold text-slate-800 w-32 text-center">{MONTHS[month]} {year}</span>
                        <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-md text-slate-600"><ChevronRight size={20} /></button>
                    </div>
                    <button onClick={() => handleDayClick(new Date().getDate())} className="flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm font-medium">
                        <Plus className="w-4 h-4 mr-2" />
                        Agendar
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                {/* Days Header */}
                <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                    {DAYS.map(day => (
                        <div key={day} className="py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 flex-1 auto-rows-fr">
                    {/* Empty slots for start of month */}
                    {Array.from({ length: firstDay }).map((_, i) => (
                        <div key={`empty-${i}`} className="bg-slate-50/30 border-b border-r border-slate-100 min-h-[100px]"></div>
                    ))}

                    {/* Actual Days */}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const { activities: dayActs, subscriptions: daySubs, projects: dayProjs } = getEventsForDay(day);
                        const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;

                        return (
                            <div
                                key={day}
                                onClick={() => handleDayClick(day)}
                                className={`border-b border-r border-slate-100 p-2 min-h-[100px] cursor-pointer hover:bg-slate-50 transition-colors relative group ${isToday ? 'bg-blue-50/30' : ''}`}
                            >
                                <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-brand-600 text-white' : 'text-slate-700'}`}>
                                    {day}
                                </span>

                                <div className="mt-2 space-y-1 overflow-y-auto max-h-[120px] custom-scrollbar">

                                    {/* Projects (Shown as Bars) */}
                                    {dayProjs.map(proj => (
                                        <div
                                            key={proj.id}
                                            className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 border border-orange-200 text-orange-800 font-bold truncate flex items-center gap-1"
                                            title={`Proyecto Activo: ${proj.name}`}
                                        >
                                            <Wrench size={8} />
                                            {proj.name}
                                        </div>
                                    ))}

                                    {/* Activities */}
                                    {dayActs.map(act => (
                                        <div
                                            key={act.id}
                                            onClick={(e) => handleActivityClick(e, act)}
                                            className={`text-xs p-1.5 rounded border truncate flex items-center gap-1 cursor-pointer transition-shadow hover:shadow-md ${act.type === 'Visita Técnica' || act.type === 'Visita en Frío'
                                                ? 'bg-purple-50 border-purple-100 text-purple-700'
                                                : act.type === 'Reunión'
                                                    ? 'bg-blue-50 border-blue-100 text-brand-700'
                                                    : 'bg-gray-50 border-gray-100 text-gray-600'
                                                }`}>
                                            {act.type === 'Visita Técnica' || act.type === 'Visita en Frío' ? <MapPin size={10} /> : <Clock size={10} />}
                                            <span className="font-medium">
                                                {new Date(act.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    ))}

                                    {/* Subscriptions */}
                                    {daySubs.map(sub => (
                                        <div
                                            key={sub.id}
                                            className="text-xs p-1.5 rounded border truncate flex items-center gap-1 bg-green-50 border-green-100 text-green-700"
                                            title={`Pago de suscripción: ${sub.name}`}
                                        >
                                            <CreditCard size={10} />
                                            <span className="font-medium">Pago: {sub.name}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Hover Add Button */}
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Plus className="w-4 h-4 text-brand-400" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Appointment Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Agendar Cita</h2>
                                <p className="text-sm text-slate-500">{new Date(selectedDate).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Cliente</label>
                                <select
                                    required
                                    className="w-full border rounded-lg p-2 bg-white"
                                    value={newAppt.clientId}
                                    onChange={(e) => handleClientChange(e.target.value)}
                                >
                                    <option value="">Seleccionar Cliente...</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.name} - {c.company}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Oportunidad Relacionada</label>
                                <select
                                    required
                                    className="w-full border rounded-lg p-2 bg-white disabled:bg-slate-100 disabled:text-slate-400"
                                    value={newAppt.opportunityId}
                                    onChange={(e) => setNewAppt({ ...newAppt, opportunityId: e.target.value })}
                                    disabled={!newAppt.clientId}
                                >
                                    <option value="">Seleccionar Oportunidad...</option>
                                    {filteredOpps.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                                </select>
                                {newAppt.clientId && filteredOpps.length === 0 && (
                                    <p className="text-xs text-red-500 mt-1">Este cliente no tiene oportunidades abiertas.</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                                    <select
                                        className="w-full border rounded-lg p-2 bg-white"
                                        value={newAppt.type}
                                        onChange={(e) => setNewAppt({ ...newAppt, type: e.target.value as any })}
                                    >
                                        <option value="Reunión">Reunión</option>
                                        <option value="Visita Técnica">Visita Técnica</option>
                                        <option value="Visita en Frío">Visita en Frío</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Hora</label>
                                    <input
                                        type="time"
                                        className="w-full border rounded-lg p-2"
                                        value={newAppt.time}
                                        onChange={(e) => setNewAppt({ ...newAppt, time: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Notificar a (Correo Cliente)</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <input
                                        type="email"
                                        className="w-full pl-9 border rounded-lg p-2"
                                        placeholder="correo@cliente.com"
                                        value={newAppt.notificationEmail}
                                        onChange={(e) => setNewAppt({ ...newAppt, notificationEmail: e.target.value })}
                                    />
                                </div>
                                <p className="text-xs text-slate-400 mt-1">Se enviará una notificación profesional a este correo.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Detalles / Notas</label>
                                <textarea
                                    className="w-full border rounded-lg p-2 h-20 resize-none"
                                    placeholder="Agenda de la reunión..."
                                    value={newAppt.description}
                                    onChange={(e) => setNewAppt({ ...newAppt, description: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={!newAppt.clientId || !newAppt.opportunityId}
                                className="w-full bg-brand-600 text-white py-2 rounded-lg hover:bg-brand-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Agendar y Notificar
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Activity Detail / Sync Modal */}
            {isDetailModalOpen && selectedActivity && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50 rounded-t-xl">
                            <div>
                                <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${selectedActivity.type === 'Visita Técnica' || selectedActivity.type === 'Visita en Frío'
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-blue-100 text-brand-700'
                                    }`}>
                                    {selectedActivity.type}
                                </span>
                                <h2 className="text-xl font-bold text-slate-800 mt-2">{selectedActivity.responsibleName}</h2>
                                <p className="text-sm text-slate-500">
                                    {new Date(selectedActivity.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                                    {' a las '}
                                    {new Date(selectedActivity.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                            <button onClick={() => setIsDetailModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Detalles</h3>
                                <p className="text-slate-700 bg-slate-50 p-3 rounded-lg text-sm border border-slate-100">
                                    {selectedActivity.description}
                                </p>
                            </div>

                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                                    <Share2 size={12} /> Sincronizar Calendario
                                </h3>

                                <div className="grid grid-cols-1 gap-3">
                                    {/* Google Calendar */}
                                    <a
                                        href={getCalendarUrls(selectedActivity).googleUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 text-xl">
                                                G
                                            </div>
                                            <span className="font-medium text-slate-700 group-hover:text-blue-700">Google Calendar</span>
                                        </div>
                                        <ExternalLink size={16} className="text-slate-400 group-hover:text-blue-500" />
                                    </a>

                                    {/* Outlook Web */}
                                    <a
                                        href={getCalendarUrls(selectedActivity).outlookUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-sm text-white font-bold text-xs">
                                                O
                                            </div>
                                            <span className="font-medium text-slate-700 group-hover:text-blue-700">Outlook Web</span>
                                        </div>
                                        <ExternalLink size={16} className="text-slate-400 group-hover:text-blue-500" />
                                    </a>

                                    {/* Apple / ICS File */}
                                    <button
                                        onClick={() => downloadICS(selectedActivity)}
                                        className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all group w-full"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center shadow-sm text-white font-bold">
                                                <CalIcon size={14} />
                                            </div>
                                            <div className="text-left">
                                                <span className="font-medium text-slate-700 block group-hover:text-slate-900">Apple Calendar / Outlook App</span>
                                                <span className="text-[10px] text-slate-400">Descargar archivo .ics</span>
                                            </div>
                                        </div>
                                        <Download size={16} className="text-slate-400 group-hover:text-slate-600" />
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-b-xl border-t border-slate-100 text-center">
                            <button onClick={() => setIsDetailModalOpen(false)} className="text-sm font-medium text-slate-600 hover:text-slate-900">
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
