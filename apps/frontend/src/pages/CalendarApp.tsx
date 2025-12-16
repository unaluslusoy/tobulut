
import React, { useState, useMemo, useEffect } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Filter, 
  Plus, Clock, MapPin, User, AlertCircle, CheckCircle, 
  Briefcase, Wrench, Wallet, Plane, Loader2
} from 'lucide-react';
import { api } from '../services/api';
import { Invoice, ServiceTicket, LeaveRequest, TodoItem, ModuleType } from '../types';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

// Types
type ViewType = 'month' | 'week' | 'list';
type EventType = 'invoice' | 'service' | 'leave' | 'todo' | 'custom';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  endDate?: Date;
  type: EventType;
  description?: string;
  status?: string;
  amount?: number;
  person?: string;
}

const CalendarApp: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>('month');
  const [filters, setFilters] = useState({
    invoice: true,
    service: true,
    leave: true,
    todo: true,
    custom: true,
  });
  
  // Data States
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>([]);

  // Event Detail Modal
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  // Helper to check module access
  const hasAccess = (module: ModuleType) => {
    if (!user?.allowedModules || user.allowedModules.length === 0) return true;
    return user.allowedModules.includes(module);
  };

  // Fetch Data based on permissions
  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        try {
            const promises = [];
            
            if (hasAccess('finance')) {
                promises.push(api.finance.getInvoices().then(data => setInvoices(data)));
            } else {
                setInvoices([]);
            }

            if (hasAccess('service')) {
                promises.push(api.services.getAll().then(data => setTickets(data)));
            } else {
                setTickets([]);
            }

            if (hasAccess('hr')) {
                promises.push(api.hr.getLeaves().then(data => setLeaves(data)));
            } else {
                setLeaves([]);
            }

            // Tasks are generally available or could be linked to 'sales'/'manager'
            // For now, let's assume tasks are open if you have calendar access
            promises.push(api.tasks.getTodos().then(data => setTodos(data)));

            await Promise.all(promises);
        } catch (error) {
            console.error("Failed to load calendar data", error);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, [user]);

  // --- DATA AGGREGATION ---
  const events: CalendarEvent[] = useMemo(() => {
    const allEvents: CalendarEvent[] = [];

    // 1. Invoices (Due Dates)
    if (hasAccess('finance')) {
        invoices.forEach(inv => {
        if (inv.status !== 'paid' && inv.status !== 'cancelled') {
            allEvents.push({
            id: inv.id,
            title: `${inv.type === 'sales' ? 'Tahsilat' : 'Ödeme'}: ${inv.accountName}`,
            date: new Date(inv.dueDate),
            type: 'invoice',
            description: `Fatura No: ${inv.invoiceNumber}`,
            amount: inv.total,
            status: inv.status
            });
        }
        });
    }

    // 2. Service Tickets
    if (hasAccess('service')) {
        tickets.forEach(ticket => {
        if (ticket.status !== 'delivered') {
            allEvents.push({
            id: ticket.id,
            title: `Servis: ${ticket.device} (${ticket.customerName})`,
            date: new Date(ticket.entryDate), // Assuming this is appointment date for simplicity
            type: 'service',
            description: ticket.issue,
            person: ticket.technician,
            status: ticket.status
            });
        }
        });
    }

    // 3. Leaves
    if (hasAccess('hr')) {
        leaves.forEach(leave => {
        if (leave.status === 'approved') {
            allEvents.push({
            id: leave.id,
            title: `İzin: ${leave.employeeName}`,
            date: new Date(leave.startDate),
            endDate: new Date(leave.endDate),
            type: 'leave',
            description: leave.reason,
            status: leave.type
            });
        }
        });
    }

    // 4. Todos
    todos.forEach(todo => {
      if (todo.status !== 'done' && todo.dueDate) {
        allEvents.push({
          id: todo.id,
          title: `Görev: ${todo.title}`,
          date: new Date(todo.dueDate),
          type: 'todo',
          status: todo.priority
        });
      }
    });

    // Sort by date
    return allEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [invoices, tickets, leaves, todos, user]);

  const filteredEvents = events.filter(e => filters[e.type]);

  // --- CALENDAR LOGIC ---
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday
    
    // Adjust for Monday start (Turkey)
    // Sunday (0) becomes 6, Monday (1) becomes 0
    const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    const days = [];
    // Previous month padding
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = adjustedFirstDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, type: 'prev', date: new Date(year, month - 1, prevMonthDays - i) });
    }
    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, type: 'current', date: new Date(year, month, i) });
    }
    // Next month padding
    const remainingCells = 42 - days.length; // 6 rows * 7 cols
    for (let i = 1; i <= remainingCells; i++) {
      days.push({ day: i, type: 'next', date: new Date(year, month + 1, i) });
    }
    return days;
  };

  const calendarDays = getDaysInMonth(currentDate);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const today = () => {
    setCurrentDate(new Date());
  };

  // --- RENDER HELPERS ---
  const getEventColor = (type: EventType) => {
    switch (type) {
      case 'invoice': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
      case 'service': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
      case 'leave': return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800';
      case 'todo': return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getEventIcon = (type: EventType) => {
    switch (type) {
      case 'invoice': return <Wallet size={12} />;
      case 'service': return <Wrench size={12} />;
      case 'leave': return <Plane size={12} />;
      case 'todo': return <CheckCircle size={12} />;
      default: return <Clock size={12} />;
    }
  };

  // Month Names
  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen text-slate-500 flex-col">
            <Loader2 size={40} className="animate-spin mb-4 text-brand-600" />
            <p>Takvim verileri yükleniyor...</p>
        </div>
      );
  }

  return (
    <div className="p-6 h-[calc(100vh-64px)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="text-brand-600" />
            Ajanda
          </h1>
          <div className="flex items-center bg-white dark:bg-enterprise-800 rounded-lg border border-slate-200 dark:border-slate-700 p-1 shadow-sm">
            <button onClick={prevMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors">
              <ChevronLeft size={20} className="text-slate-600 dark:text-slate-400" />
            </button>
            <span className="px-4 font-semibold text-slate-800 dark:text-white w-32 text-center select-none">
              {months[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <button onClick={nextMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors">
              <ChevronRight size={20} className="text-slate-600 dark:text-slate-400" />
            </button>
          </div>
          <button onClick={today} className="text-sm font-medium text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 px-3 py-1.5 rounded-lg transition-colors">
            Bugün
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
            <button 
              onClick={() => setView('month')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'month' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
            >
              Ay
            </button>
            <button 
              onClick={() => setView('week')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'week' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
            >
              Hafta
            </button>
            <button 
              onClick={() => setView('list')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'list' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
            >
              Liste
            </button>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 shadow-sm transition-colors">
            <Plus size={16} />
            Etkinlik Ekle
          </button>
        </div>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Sidebar Filters */}
        <div className="w-64 shrink-0 bg-white dark:bg-enterprise-800 rounded-xl shadow-card border border-slate-200 dark:border-slate-700/50 p-4 flex flex-col h-full overflow-y-auto transition-colors">
           <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center">
             <Filter size={16} className="mr-2" /> Filtreler
           </h3>
           
           <div className="space-y-3">
             {hasAccess('finance') && (
               <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors">
                 <input type="checkbox" checked={filters.invoice} onChange={() => setFilters(f => ({...f, invoice: !f.invoice}))} className="rounded text-brand-600 focus:ring-brand-500" />
                 <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0"><Wallet size={16} /></div>
                 <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Finans</span>
               </label>
             )}
             
             {hasAccess('service') && (
               <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors">
                 <input type="checkbox" checked={filters.service} onChange={() => setFilters(f => ({...f, service: !f.service}))} className="rounded text-brand-600 focus:ring-brand-500" />
                 <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0"><Wrench size={16} /></div>
                 <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Servis</span>
               </label>
             )}

             {hasAccess('hr') && (
               <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors">
                 <input type="checkbox" checked={filters.leave} onChange={() => setFilters(f => ({...f, leave: !f.leave}))} className="rounded text-brand-600 focus:ring-brand-500" />
                 <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0"><Plane size={16} /></div>
                 <span className="text-sm font-medium text-slate-700 dark:text-slate-300">İzinler</span>
               </label>
             )}

             <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors">
               <input type="checkbox" checked={filters.todo} onChange={() => setFilters(f => ({...f, todo: !f.todo}))} className="rounded text-brand-600 focus:ring-brand-500" />
               <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0"><CheckCircle size={16} /></div>
               <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Görevler</span>
             </label>
           </div>

           <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
             <h3 className="font-bold text-slate-900 dark:text-white mb-4 text-sm">Yaklaşanlar</h3>
             <div className="space-y-4">
               {filteredEvents.filter(e => e.date >= new Date()).slice(0, 5).map(event => (
                 <div key={`up-${event.id}`} className="flex gap-3">
                   <div className="flex flex-col items-center text-xs text-slate-500 font-medium w-8 shrink-0">
                     <span>{event.date.getDate()}</span>
                     <span>{months[event.date.getMonth()].slice(0, 3)}</span>
                   </div>
                   <div className="flex-1 min-w-0">
                     <div className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{event.title}</div>
                     <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{event.description}</div>
                   </div>
                 </div>
               ))}
             </div>
           </div>
        </div>

        {/* Main Calendar Grid */}
        <div className="flex-1 bg-white dark:bg-enterprise-800 rounded-xl shadow-card border border-slate-200 dark:border-slate-700/50 flex flex-col overflow-hidden transition-colors">
          
          {view === 'month' && (
            <>
              {/* Days Header */}
              <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                {['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'].map((day, i) => (
                  <div key={day} className={`py-3 text-center text-sm font-semibold ${i >= 5 ? 'text-red-500' : 'text-slate-600 dark:text-slate-300'}`}>
                    <span className="hidden sm:inline">{day}</span>
                    <span className="sm:hidden">{day.slice(0, 3)}</span>
                  </div>
                ))}
              </div>

              {/* Grid Body */}
              <div className="flex-1 grid grid-cols-7 grid-rows-6">
                {calendarDays.map((dateObj, idx) => {
                  const dayEvents = filteredEvents.filter(e => {
                    const d = e.date;
                    return d.getDate() === dateObj.date.getDate() && 
                           d.getMonth() === dateObj.date.getMonth() && 
                           d.getFullYear() === dateObj.date.getFullYear();
                  });

                  const isToday = dateObj.date.toDateString() === new Date().toDateString();

                  return (
                    <div 
                      key={idx} 
                      className={`
                        border-b border-r border-slate-200 dark:border-slate-700/50 p-2 min-h-[100px] flex flex-col relative group transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/30
                        ${dateObj.type !== 'current' ? 'bg-slate-50/50 dark:bg-slate-900/50 text-slate-400' : 'text-slate-900 dark:text-white'}
                        ${isToday ? 'bg-brand-50/30 dark:bg-brand-900/10' : ''}
                      `}
                    >
                      <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mb-1 ${isToday ? 'bg-brand-600 text-white shadow-sm' : ''}`}>
                        {dateObj.day}
                      </span>
                      
                      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
                        {dayEvents.map(event => (
                          <button
                            key={event.id}
                            onClick={() => { setSelectedEvent(event); setIsEventModalOpen(true); }}
                            className={`w-full text-left text-[10px] px-1.5 py-1 rounded border truncate flex items-center gap-1.5 ${getEventColor(event.type)}`}
                          >
                            {getEventIcon(event.type)}
                            <span className="truncate">{event.title}</span>
                          </button>
                        ))}
                      </div>

                      {/* Quick Add Button on Hover */}
                      <button className="absolute bottom-2 right-2 p-1 bg-slate-100 dark:bg-slate-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-brand-600">
                        <Plus size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {view === 'list' && (
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {filteredEvents.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <CalendarIcon size={48} className="mx-auto mb-3 opacity-20" />
                  <p>Bu filtrelerde gösterilecek etkinlik yok.</p>
                </div>
              ) : (
                <div className="space-y-4 max-w-3xl mx-auto">
                  {filteredEvents.map(event => (
                    <div 
                      key={event.id} 
                      onClick={() => { setSelectedEvent(event); setIsEventModalOpen(true); }}
                      className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all cursor-pointer group"
                    >
                      {/* Date Badge */}
                      <div className="flex flex-col items-center justify-center bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600 w-16 h-16 shrink-0">
                        <span className="text-xs font-bold text-red-500 uppercase">
                          {months[event.date.getMonth()].slice(0, 3)}
                        </span>
                        <span className="text-2xl font-bold text-slate-900 dark:text-white">
                          {event.date.getDate()}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors">{event.title}</h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getEventColor(event.type)}`}>
                            {event.type.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                          {event.description || 'Açıklama yok'}
                        </p>
                        
                        <div className="flex gap-4 mt-3 text-xs text-slate-500 dark:text-slate-500">
                          {event.amount && (
                            <span className="flex items-center gap-1 font-medium text-slate-900 dark:text-white">
                              <Wallet size={12} />
                              ₺{event.amount.toLocaleString()}
                            </span>
                          )}
                          {event.person && (
                            <span className="flex items-center gap-1">
                              <User size={12} />
                              {event.person}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {event.date.toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'})}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {view === 'week' && (
            <div className="flex items-center justify-center h-full text-slate-400">
              <div className="text-center">
                <CalendarIcon size={48} className="mx-auto mb-4 opacity-20" />
                <p>Haftalık görünüm yakında eklenecek.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <Modal 
          isOpen={isEventModalOpen} 
          onClose={() => setIsEventModalOpen(false)} 
          title="Etkinlik Detayı"
          size="sm"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-3 rounded-lg ${getEventColor(selectedEvent.type)} bg-opacity-20`}>
                {getEventIcon(selectedEvent.type)}
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">{selectedEvent.title}</h3>
                <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">{selectedEvent.type}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-100 dark:border-slate-700">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Tarih</span>
                <span className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-1">
                  <CalendarIcon size={14} />
                  {selectedEvent.date.toLocaleDateString('tr-TR')}
                </span>
              </div>
              {selectedEvent.endDate && (
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Bitiş</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-1">
                    <CalendarIcon size={14} />
                    {selectedEvent.endDate.toLocaleDateString('tr-TR')}
                  </span>
                </div>
              )}
              {selectedEvent.amount && (
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Tutar</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    ₺{selectedEvent.amount.toLocaleString()}
                  </span>
                </div>
              )}
              {selectedEvent.status && (
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Durum</span>
                  <span className="inline-block px-2 py-0.5 rounded text-xs bg-slate-100 dark:bg-slate-700 font-medium">
                    {selectedEvent.status}
                  </span>
                </div>
              )}
            </div>

            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 block mb-2">Açıklama</span>
              <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                {selectedEvent.description || 'Açıklama bulunmuyor.'}
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button 
                onClick={() => setIsEventModalOpen(false)}
                className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
              >
                Tamam
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CalendarApp;
