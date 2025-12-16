
import React, { useState, useEffect } from 'react';
import { SaaSSupportTicket } from '../../types';
import { api } from '../../services/api';
import Modal from '../../components/Modal';
import { 
  Building, MessageSquare, Search, Filter, Clock, CheckCircle, 
  AlertCircle, Send, MoreVertical, User, Calendar, Tag,
  ChevronDown, RefreshCw, Archive, Trash2, ExternalLink
} from 'lucide-react';

const Support: React.FC = () => {
  const [tickets, setTickets] = useState<SaaSSupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SaaSSupportTicket | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [ticketReply, setTicketReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    try {
      const tkts = await api.superAdmin.getSupportTickets();
      setTickets(tkts);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenTicket = (ticket: SaaSSupportTicket) => {
    setSelectedTicket(ticket);
    setTicketReply('');
    setIsTicketModalOpen(true);
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !ticketReply.trim()) return;
    
    try {
      const updatedTicket = {
        id: selectedTicket.id,
        status: 'in_progress',
        lastReplyAt: new Date().toISOString()
      };
      await api.superAdmin.updateSupportTicket(updatedTicket);
      await fetchData(); // Refresh from database
      setIsTicketModalOpen(false);
      setTicketReply('');
    } catch (error: any) {
      alert(error.message || 'Yanıt gönderilirken hata oluştu.');
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;
    
    try {
      const updatedTicket = { 
        id: selectedTicket.id, 
        status: 'resolved' 
      };
      await api.superAdmin.updateSupportTicket(updatedTicket);
      await fetchData(); // Refresh from database
      setIsTicketModalOpen(false);
    } catch (error: any) {
      alert(error.message || 'Talep güncellenirken hata oluştu.');
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesFilter = filter === 'all' || ticket.status === filter;
    const matchesSearch = searchQuery === '' || 
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.tenantName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
      case 'in_progress': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400';
      case 'resolved': return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
      default: return 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Açık';
      case 'in_progress': return 'İşlemde';
      case 'resolved': return 'Çözüldü';
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="text-purple-500" />
            Destek Talepleri
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Firmalardan gelen destek bildirimlerini yönetin.</p>
        </div>
        <button 
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-purple-500/20"
        >
          <RefreshCw size={18} />
          Yenile
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div 
          onClick={() => setFilter('all')}
          className={`bg-white dark:bg-slate-800 p-4 rounded-xl border cursor-pointer transition-all ${
            filter === 'all' ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
              <MessageSquare size={20} className="text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
              <p className="text-xs text-slate-500">Toplam</p>
            </div>
          </div>
        </div>

        <div 
          onClick={() => setFilter('open')}
          className={`bg-white dark:bg-slate-800 p-4 rounded-xl border cursor-pointer transition-all ${
            filter === 'open' ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertCircle size={20} className="text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.open}</p>
              <p className="text-xs text-slate-500">Açık</p>
            </div>
          </div>
        </div>

        <div 
          onClick={() => setFilter('in_progress')}
          className={`bg-white dark:bg-slate-800 p-4 rounded-xl border cursor-pointer transition-all ${
            filter === 'in_progress' ? 'border-yellow-500 ring-2 ring-yellow-500/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Clock size={20} className="text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.inProgress}</p>
              <p className="text-xs text-slate-500">İşlemde</p>
            </div>
          </div>
        </div>

        <div 
          onClick={() => setFilter('resolved')}
          className={`bg-white dark:bg-slate-800 p-4 rounded-xl border cursor-pointer transition-all ${
            filter === 'resolved' ? 'border-green-500 ring-2 ring-green-500/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.resolved}</p>
              <p className="text-xs text-slate-500">Çözüldü</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Talep ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
            />
          </div>
          <div className="flex gap-2">
            <select className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all">
              <option value="">Tüm Öncelikler</option>
              <option value="high">Yüksek</option>
              <option value="medium">Orta</option>
              <option value="low">Düşük</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Talep</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Firma</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Durum</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Öncelik</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tarih</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <RefreshCw size={24} className="animate-spin mx-auto text-purple-500 mb-2" />
                    <p className="text-slate-500">Yükleniyor...</p>
                  </td>
                </tr>
              )}
              {!loading && filteredTickets.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Talep bulunamadı.
                  </td>
                </tr>
              )}
              {filteredTickets.map(ticket => (
                <tr 
                  key={ticket.id} 
                  className="hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                  onClick={() => handleOpenTicket(ticket)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${getPriorityColor(ticket.priority)}`}></div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{ticket.subject}</p>
                        <p className="text-sm text-slate-500 line-clamp-1 max-w-xs">{ticket.message}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                        <Building size={16} className="text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{ticket.tenantName}</p>
                        <p className="text-xs text-slate-500">{ticket.userEmail}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                      {getStatusLabel(ticket.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                      ticket.priority === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 
                      ticket.priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' :
                      'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                    }`}>
                      {ticket.priority === 'high' ? 'Yüksek' : ticket.priority === 'medium' ? 'Orta' : 'Düşük'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm text-slate-500">
                      <Calendar size={14} />
                      {new Date(ticket.createdAt).toLocaleDateString('tr-TR')}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleOpenTicket(ticket); }}
                      className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                    >
                      <ExternalLink size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Modal */}
      <Modal isOpen={isTicketModalOpen} onClose={() => setIsTicketModalOpen(false)} title="Destek Talebi Detay" size="lg">
        {selectedTicket && (
          <div className="space-y-6">
            {/* Ticket Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{selectedTicket.subject}</h3>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTicket.status)}`}>
                    {getStatusLabel(selectedTicket.status)}
                  </span>
                  <span className="text-sm text-slate-500">
                    #{selectedTicket.id.slice(0, 8)}
                  </span>
                </div>
              </div>
              <span className={`px-3 py-1 rounded text-xs font-bold uppercase ${
                selectedTicket.priority === 'high' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
              }`}>
                {selectedTicket.priority === 'high' ? 'Yüksek Öncelik' : 'Normal Öncelik'}
              </span>
            </div>

            {/* Ticket Info */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
              <div className="flex items-center gap-3">
                <Building size={18} className="text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Firma</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedTicket.tenantName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User size={18} className="text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Kullanıcı</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedTicket.userEmail}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar size={18} className="text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Oluşturulma</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {new Date(selectedTicket.createdAt).toLocaleString('tr-TR')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock size={18} className="text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Son Güncelleme</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {selectedTicket.lastReplyAt ? new Date(selectedTicket.lastReplyAt).toLocaleString('tr-TR') : '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Message */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Mesaj</h4>
              <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{selectedTicket.message}</p>
              </div>
            </div>

            {/* Reply */}
            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <MessageSquare size={16} />
                Yanıtla
              </label>
              <textarea
                rows={4}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all resize-none"
                placeholder="Müşteriye yanıtınızı yazın..."
                value={ticketReply}
                onChange={(e) => setTicketReply(e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex gap-2">
                <button
                  onClick={handleCloseTicket}
                  className="flex items-center gap-2 px-4 py-2 text-green-600 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg font-medium transition-colors"
                >
                  <CheckCircle size={18} />
                  Çözüldü İşaretle
                </button>
                <button className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg font-medium transition-colors">
                  <Archive size={18} />
                  Arşivle
                </button>
              </div>
              <button
                onClick={handleSendReply}
                disabled={!ticketReply}
                className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-xl font-medium transition-colors shadow-lg shadow-purple-500/20"
              >
                <Send size={18} />
                Yanıtı Gönder
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Support;
