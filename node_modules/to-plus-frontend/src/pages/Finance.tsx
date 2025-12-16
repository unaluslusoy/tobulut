
import React, { useState, useEffect } from 'react';
import { Filter, Download, Plus, Trash2, Loader2, Search, ArrowUpRight, ArrowDownRight, MoreHorizontal } from 'lucide-react';
import { api } from '../services/api';
import { Transaction } from '../types';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

const Finance: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'income' | 'expense'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'expense',
    category: '',
    status: 'completed'
  });

  // Permissions
  const canEdit = ['superuser', 'admin', 'manager', 'accountant'].includes(user?.role || '');

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const data = await api.finance.getTransactions();
      setTransactions(data);
    } catch (error) {
      console.error("Failed to fetch transactions", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newTransaction: Transaction = {
      id: `TRX-${Math.floor(Math.random() * 10000)}`,
      tenantId: user?.tenantId || 'tenant-1',
      date: new Date().toISOString(),
      description: formData.description,
      amount: parseFloat(formData.amount),
      type: formData.type as 'income' | 'expense',
      category: formData.category,
      status: formData.status as 'completed' | 'pending' | 'cancelled'
    };
    
    try {
      await api.finance.createTransaction(newTransaction);
      setTransactions([newTransaction, ...transactions]);
      setIsModalOpen(false);
      setFormData({ description: '', amount: '', type: 'expense', category: '', status: 'completed' });
    } catch (error) {
      alert("İşlem kaydedilirken hata oluştu.");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bu işlemi silmek istediğinize emin misiniz?')) {
      try {
        await api.finance.deleteTransaction(id);
        setTransactions(transactions.filter(t => t.id !== id));
      } catch (error) {
        console.error("Failed to delete transaction", error);
      }
    }
  };

  const handleExport = () => {
    const headers = ['ID,Tarih,Açıklama,Tutar,Tür,Kategori,Durum'];
    const csvData = transactions.map(t => 
      `${t.id},${new Date(t.date).toLocaleDateString()},${t.description},${t.amount},${t.type},${t.category},${t.status}`
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...csvData].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "finans_raporu.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesTab = activeTab === 'all' ? true : t.type === activeTab;
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'completed': return { text: 'Tamamlandı', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' };
      case 'pending': return { text: 'Bekliyor', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' };
      case 'cancelled': return { text: 'İptal', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };
      default: return { text: status, className: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' };
    }
  };

  const tabs = {
    all: 'Tümü',
    income: 'Gelir',
    expense: 'Gider'
  };

  const inputClass = "w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none text-slate-900 dark:text-white transition-all";

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Finans Yönetimi</h1>
          <p className="text-slate-500 dark:text-slate-400">Nakit akışı, faturalar ve giderleri yönetin.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExport}
            className="flex items-center px-4 py-2 bg-white dark:bg-enterprise-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            <Download size={16} className="mr-2" />
            Dışa Aktar
          </button>
          {canEdit && (
            <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-bold hover:bg-brand-700 shadow-lg shadow-brand-600/20 transition-all hover:scale-105"
            >
                <Plus size={16} className="mr-2" />
                Kayıt Ekle
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-enterprise-800 rounded-2xl shadow-card border border-slate-200 dark:border-slate-700/50 overflow-hidden transition-colors">
        {/* Filters */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50 dark:bg-slate-800/50">
          <div className="flex bg-white dark:bg-slate-700 p-1 rounded-lg border border-slate-200 dark:border-slate-600">
            {(['all', 'income', 'expense'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-all ${
                  activeTab === tab ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {tabs[tab]}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Kayıt ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none text-slate-900 dark:text-white placeholder-slate-400 transition-all w-full sm:w-64"
              />
              <Search size={16} className="absolute left-3 top-3 text-slate-400" />
            </div>
            <button className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors">
                <Filter size={16} />
            </button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <Loader2 size={40} className="animate-spin mb-4 text-brand-600" />
            <p>İşlemler yükleniyor...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">İşlem No</th>
                    <th className="px-6 py-4">Açıklama</th>
                    <th className="px-6 py-4">Kategori</th>
                    <th className="px-6 py-4">Tarih</th>
                    <th className="px-6 py-4">Durum</th>
                    <th className="px-6 py-4 text-right">Tutar</th>
                    <th className="px-6 py-4 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {filteredTransactions.map((trx) => {
                    const statusInfo = getStatusBadge(trx.status);
                    return (
                      <tr key={trx.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                        <td className="px-6 py-4 text-sm font-mono font-medium text-brand-600 dark:text-brand-400">{trx.id}</td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{trx.description}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                            {trx.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{new Date(trx.date).toLocaleDateString('tr-TR')}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${statusInfo.className}`}>
                            {statusInfo.text}
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-sm font-bold text-right ${trx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                          {trx.type === 'income' ? <ArrowUpRight size={14} className="inline mr-1"/> : <ArrowDownRight size={14} className="inline mr-1 text-slate-400"/>}
                          ₺{trx.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {canEdit && (
                            <button 
                                onClick={() => handleDelete(trx.id)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 size={18} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 flex items-center justify-between rounded-b-2xl">
              <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">{filteredTransactions.length} sonuç gösteriliyor</span>
            </div>
          </>
        )}
      </div>

      {/* Add Transaction Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Yeni İşlem Ekle">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Açıklama</label>
            <input 
              type="text" 
              name="description" 
              required
              value={formData.description}
              onChange={handleInputChange}
              className={inputClass}
              placeholder="Örn: Ofis Kirası"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Tutar (₺)</label>
              <input 
                type="number" 
                name="amount" 
                required
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={handleInputChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">İşlem Türü</label>
              <select 
                name="type" 
                value={formData.type}
                onChange={handleInputChange}
                className={inputClass}
              >
                <option value="income">Gelir</option>
                <option value="expense">Gider</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Kategori</label>
              <select 
                name="category" 
                required
                value={formData.category}
                onChange={handleInputChange}
                className={inputClass}
              >
                <option value="">Seçiniz...</option>
                <option value="Satış">Satış</option>
                <option value="Hizmet">Hizmet</option>
                <option value="Operasyon">Operasyon</option>
                <option value="Personel">Personel</option>
                <option value="Fatura">Fatura</option>
                <option value="Diğer">Diğer</option>
              </select>
            </div>
             <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Durum</label>
              <select 
                name="status" 
                value={formData.status}
                onChange={handleInputChange}
                className={inputClass}
              >
                <option value="completed">Tamamlandı</option>
                <option value="pending">Bekliyor</option>
                <option value="cancelled">İptal</option>
              </select>
            </div>
          </div>
          <div className="pt-4 flex justify-end space-x-3">
             <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium"
            >
              İptal
            </button>
            <button 
              type="submit" 
              className="px-6 py-2 text-white bg-brand-600 rounded-lg hover:bg-brand-700 shadow-lg shadow-brand-600/30 font-bold transition-colors"
            >
              Kaydet
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Finance;
