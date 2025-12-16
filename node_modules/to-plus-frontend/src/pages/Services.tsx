
import React, { useState, useEffect } from 'react';
import { 
  Wrench, Search, Clock, CheckCircle, Plus, Trash2, 
  LayoutGrid, List, User, Calendar, Printer, AlertTriangle, Eye,
  ChevronLeft, ChevronRight, Loader2
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { ServiceTicket } from '../types';
import ServiceDetail from '../components/ServiceDetail';
import { useAuth } from '../context/AuthContext';

const Services: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Detail Modal State
  const [selectedTicket, setSelectedTicket] = useState<ServiceTicket | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Permissions Check
  const canDelete = ['superuser', 'admin'].includes(user?.role || '');
  const canEdit = ['superuser', 'admin', 'manager', 'technician'].includes(user?.role || '');

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const data = await api.services.getAll();
      setTickets(data);
    } catch (error) {
      console.error("Failed to fetch service tickets", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // Initialize search from URL params if present
  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchTerm(query);
    }
  }, [searchParams]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchTerm]);

  const handleCreateNew = () => {
    if (!canEdit) return;
    const newTicket: ServiceTicket = {
      id: `SRV-${Math.floor(Math.random() * 10000)}`,
      tenantId: user?.tenantId || 'tenant-1',
      customerName: '',
      device: '',
      brand: '',
      category: 'hardware',
      issue: '',
      status: 'pending',
      priority: 'medium',
      technician: '',
      entryDate: new Date().toISOString(),
      estimatedCost: 0,
      parts: [],
      images: [],
      history: [], // Empty history signifies a new record
      tags: [],
      warrantyDuration: 0,
      termsAccepted: false
    };
    setSelectedTicket(newTicket);
    setIsDetailOpen(true);
  };

  const handleSaveTicket = async (updatedTicket: ServiceTicket) => {
    if (!canEdit) return;
    try {
      if (tickets.find(t => t.id === updatedTicket.id)) {
        await api.services.update(updatedTicket);
        setTickets(tickets.map(t => t.id === updatedTicket.id ? updatedTicket : t));
      } else {
        await api.services.create(updatedTicket);
        setTickets([updatedTicket, ...tickets]);
      }
    } catch (error) {
      console.error("Failed to save ticket", error);
      alert("Servis fişi kaydedilirken bir hata oluştu.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!canDelete) {
        alert("Yetkisiz işlem. Kayıt silmek için yönetici onayı gerekir.");
        return;
    }
    if (window.confirm('Bu servis kaydını silmek istediğinize emin misiniz?')) {
      try {
        await api.services.delete(id);
        setTickets(tickets.filter(t => t.id !== id));
        if (selectedTicket?.id === id) {
          setIsDetailOpen(false);
        }
      } catch (error) {
        console.error("Failed to delete ticket", error);
      }
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesStatus = filterStatus === 'all' ? true : ticket.status === filterStatus;
    const term = searchTerm.toLocaleLowerCase('tr-TR');
    const matchesSearch = 
      ticket.customerName.toLocaleLowerCase('tr-TR').includes(term) || 
      ticket.id.toLocaleLowerCase('tr-TR').includes(term) ||
      ticket.device.toLocaleLowerCase('tr-TR').includes(term);
    return matchesStatus && matchesSearch;
  });

  // Pagination Logic
  const totalItems = filteredTickets.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return { text: 'Bekliyor', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' };
      case 'in_progress': return { text: 'İşlemde', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' };
      case 'completed': return { text: 'Tamamlandı', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' };
      case 'delivered': return { text: 'Teslim Edildi', className: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300' };
      case 'cancelled': return { text: 'İptal', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' };
      default: return { text: status, className: 'bg-slate-100 text-slate-800' };
    }
  };

  const kanbanColumns = [
    { id: 'pending', title: 'Bekleyen', color: 'border-yellow-400' },
    { id: 'in_progress', title: 'İşlemde', color: 'border-blue-400' },
    { id: 'completed', title: 'Tamamlandı', color: 'border-green-400' },
    { id: 'delivered', title: 'Teslim Edildi', color: 'border-slate-400' },
  ];

  return (
    <div className="p-6 h-[calc(100vh-64px)] flex flex-col overflow-hidden">
      
      {/* Full Screen Detail Component */}
      {selectedTicket && (
        <ServiceDetail 
          ticket={selectedTicket}
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          onSave={handleSaveTicket}
          onDelete={handleDelete}
        />
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Wrench className="text-brand-600" />
            Teknik Servis Takip
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Servis kayıtlarını ve onarım süreçlerini yönetin.</p>
        </div>
        <div className="flex gap-2">
          <div className="bg-white dark:bg-enterprise-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 flex">
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-slate-100 dark:bg-slate-700 text-brand-600 dark:text-brand-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
              <List size={20} />
            </button>
            <button onClick={() => setViewMode('board')} className={`p-2 rounded-md transition-colors ${viewMode === 'board' ? 'bg-slate-100 dark:bg-slate-700 text-brand-600 dark:text-brand-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
              <LayoutGrid size={20} />
            </button>
          </div>
          {canEdit && (
            <button onClick={handleCreateNew} className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-bold hover:bg-brand-700 shadow-lg shadow-brand-600/20 flex items-center transition-all">
                <Plus size={16} className="mr-2" /> Yeni Kayıt
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-enterprise-800 p-4 rounded-xl shadow-card border border-slate-200 dark:border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0 transition-colors">
        <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg overflow-x-auto">
          {['all', 'pending', 'in_progress', 'completed'].map(status => (
            <button 
              key={status} 
              onClick={() => setFilterStatus(status)} 
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${filterStatus === status ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              {status === 'all' ? 'Tümü' : status === 'pending' ? 'Bekleyen' : status === 'in_progress' ? 'İşlemde' : 'Bitenler'}
            </button>
          ))}
        </div>
        <div className="relative">
          <input type="text" placeholder="Ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-4 pr-10 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white w-full sm:w-64 transition-all" />
          <Search size={16} className="absolute right-3 top-2.5 text-slate-400 dark:text-slate-500" />
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-slate-500 flex-col">
          <Loader2 size={40} className="animate-spin mb-4 text-brand-600" />
          <p>Servis kayıtları yükleniyor...</p>
        </div>
      ) : (
        <>
          {viewMode === 'list' ? (
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="bg-white dark:bg-enterprise-800 rounded-xl shadow-card border border-slate-200 dark:border-slate-700/50 overflow-hidden flex-1 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider z-10">
                    <tr>
                      <th className="px-6 py-4">Fiş No</th>
                      <th className="px-6 py-4">Müşteri</th>
                      <th className="px-6 py-4">Cihaz / Sorun</th>
                      <th className="px-6 py-4">Öncelik</th>
                      <th className="px-6 py-4">Teknisyen</th>
                      <th className="px-6 py-4">Giriş Tarihi</th>
                      <th className="px-6 py-4">Durum</th>
                      <th className="px-6 py-4 text-right">Tutar</th>
                      <th className="px-6 py-4 text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                    {paginatedTickets.map((ticket) => {
                      const statusInfo = getStatusBadge(ticket.status);
                      return (
                        <tr 
                          key={ticket.id} 
                          className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group"
                        >
                          <td className="px-6 py-4 text-sm font-mono font-bold text-brand-600 dark:text-brand-400 cursor-pointer hover:underline" onClick={() => { setSelectedTicket(ticket); setIsDetailOpen(true); }}>{ticket.id}</td>
                          <td className="px-6 py-4 text-sm text-slate-900 dark:text-white font-medium">{ticket.customerName}</td>
                          <td className="px-6 py-4 text-sm">
                            <div className="text-slate-900 dark:text-white font-bold">{ticket.device}</div>
                            <div className="text-slate-500 dark:text-slate-400 text-xs truncate max-w-[150px]">{ticket.issue}</div>
                          </td>
                          <td className="px-6 py-4 text-sm">
                             <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${ticket.priority === 'high' ? 'text-red-600 bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-800' : 'text-slate-600 bg-slate-50 border-slate-100 dark:bg-slate-700'}`}>
                              {ticket.priority === 'high' ? 'Yüksek' : ticket.priority === 'medium' ? 'Orta' : 'Düşük'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{ticket.technician || '-'}</td>
                          <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{new Date(ticket.entryDate).toLocaleDateString('tr-TR')}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${statusInfo.className}`}>
                              {statusInfo.text}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white text-right">
                            ₺{(ticket.finalCost || ticket.estimatedCost).toLocaleString('tr-TR')}
                          </td>
                          <td className="px-6 py-4 text-right">
                             <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button 
                                 onClick={() => { setSelectedTicket(ticket); setIsDetailOpen(true); }} 
                                 className="p-1.5 text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded transition-colors"
                                 title="Görüntüle / Düzenle"
                               >
                                  <Eye size={18} />
                               </button>
                               {canDelete && (
                                   <button 
                                    onClick={(e) => { e.stopPropagation(); handleDelete(ticket.id); }} 
                                    className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                    title="Sil"
                                    >
                                    <Trash2 size={18} />
                                    </button>
                               )}
                             </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination Footer */}
              <div className="bg-white dark:bg-enterprise-800 border-t border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between shrink-0 rounded-b-xl shadow-sm">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Toplam {totalItems} kayıttan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} arası gösteriliyor
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-600 dark:text-slate-300"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <div className="flex items-center px-4 font-medium text-slate-900 dark:text-white">
                    Sayfa {currentPage} / {totalPages || 1}
                  </div>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="p-2 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-600 dark:text-slate-300"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
              <div className="flex gap-6 h-full min-w-[1000px] px-2">
                {kanbanColumns.map(column => {
                  const columnTickets = filteredTickets.filter(t => t.status === column.id);
                  return (
                    <div key={column.id} className="flex-1 flex flex-col bg-slate-100 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700/50 min-w-[280px]">
                      <div className="p-4 border-b border-slate-200 dark:border-slate-700/50 flex justify-between items-center bg-white dark:bg-enterprise-800 rounded-t-xl">
                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${column.color.replace('border', 'bg').replace('-400', '-500')}`}></span>
                          {column.title}
                        </h3>
                        <span className="text-xs font-bold bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-300 shadow-sm">{columnTickets.length}</span>
                      </div>
                      <div className="p-3 flex-1 overflow-y-auto custom-scrollbar space-y-3">
                        {columnTickets.map(ticket => (
                          <div 
                            key={ticket.id} 
                            onClick={() => { setSelectedTicket(ticket); setIsDetailOpen(true); }}
                            className="bg-white dark:bg-enterprise-800 p-4 rounded-xl shadow-card border border-slate-100 dark:border-slate-700/50 hover:shadow-lg hover:border-brand-500/30 transition-all cursor-pointer group"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-xs font-mono font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 px-1.5 py-0.5 rounded">{ticket.id}</span>
                              {ticket.priority === 'high' && <AlertTriangle size={14} className="text-red-500" />}
                            </div>
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1 line-clamp-1">{ticket.device}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">{ticket.issue}</p>
                            <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-700/50">
                              <span className="text-sm font-bold text-slate-900 dark:text-white">₺{(ticket.finalCost || ticket.estimatedCost).toLocaleString()}</span>
                              <span className="text-xs text-slate-400">{new Date(ticket.entryDate).toLocaleDateString('tr-TR')}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Services;
