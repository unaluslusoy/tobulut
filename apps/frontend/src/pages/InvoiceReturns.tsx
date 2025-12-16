
import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, Search, Plus, Filter, AlertTriangle, CheckCircle, 
  XCircle, FileText, Calendar, RotateCcw, Landmark, QrCode, ChevronDown,
  Edit, Trash2, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { InvoiceReturn, Invoice, CashRegister } from '../types';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

const InvoiceReturns: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [returns, setReturns] = useState<InvoiceReturn[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [registers, setRegisters] = useState<CashRegister[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved'>('all');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null); // Track editing item
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  
  // Invoice Search State
  const [invoiceSearchTerm, setInvoiceSearchTerm] = useState('');
  const [isInvoiceDropdownOpen, setIsInvoiceDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    invoiceId: '',
    registerId: '',
    date: new Date().toISOString().slice(0, 10),
    type: 'return',
    reason: '',
    amount: '',
    status: 'pending'
  });

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        try {
            const [fetchedReturns, fetchedInvoices, fetchedRegisters] = await Promise.all([
                api.sales.getReturns(),
                api.finance.getInvoices(),
                api.finance.getCashRegisters()
            ]);
            setReturns(fetchedReturns);
            setInvoices(fetchedInvoices);
            setRegisters(fetchedRegisters);
        } catch (error) {
            console.error("Failed to load invoice return data", error);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsInvoiceDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInvoiceSelect = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setInvoiceSearchTerm(`${invoice.invoiceNumber} - ${invoice.accountName}`);
    setIsInvoiceDropdownOpen(false);
    
    // Auto-select a register with matching currency if available
    const matchingRegister = registers.find(r => r.currency === invoice.currency);
    
    setFormData(prev => ({
      ...prev,
      invoiceId: invoice.id,
      amount: invoice.total.toString(), // Default to full amount
      registerId: matchingRegister ? matchingRegister.id : prev.registerId
    }));
  };

  const handleQRScan = () => {
    // Mock QR Scan logic - In a real app, this would open a camera
    const mockQRCode = "GIB2024000001"; // Simulating scanning Invoice #1
    alert(`QR Kod Okundu: ${mockQRCode}`);
    
    const foundInvoice = invoices.find(inv => inv.invoiceNumber === mockQRCode);
    if (foundInvoice) {
      handleInvoiceSelect(foundInvoice);
    } else {
      alert("Fatura bulunamadı!");
    }
  };

  const handleEdit = (ret: InvoiceReturn) => {
    setEditingId(ret.id);
    
    // Find and set related invoice for validation context
    const relatedInvoice = invoices.find(inv => inv.id === ret.invoiceId);
    if (relatedInvoice) {
      setSelectedInvoice(relatedInvoice);
      setInvoiceSearchTerm(`${relatedInvoice.invoiceNumber} - ${relatedInvoice.accountName}`);
    }

    setFormData({
      invoiceId: ret.invoiceId,
      registerId: ret.registerId || '',
      date: ret.date,
      type: ret.type,
      reason: ret.reason,
      amount: ret.amount.toString(),
      status: ret.status
    });
    
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    // Admin confirm check
    if (window.confirm('Bu işlemi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
        try {
            await api.sales.deleteReturn(id);
            setReturns(returns.filter(r => r.id !== id));
        } catch (error) {
            console.error(error);
        }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    try {
        if (editingId) {
            // Update existing
            const updatedReturn: InvoiceReturn = {
                id: editingId,
                tenantId: selectedInvoice.tenantId,
                invoiceId: selectedInvoice.id,
                invoiceNumber: selectedInvoice.invoiceNumber,
                accountId: selectedInvoice.accountId,
                accountName: selectedInvoice.accountName,
                registerId: formData.registerId,
                date: formData.date,
                type: formData.type as 'return' | 'cancellation',
                reason: formData.reason,
                amount: parseFloat(formData.amount),
                currency: selectedInvoice.currency,
                status: formData.status as 'pending' | 'approved' | 'rejected'
            };
            await api.sales.updateReturn(updatedReturn);
            setReturns(returns.map(ret => ret.id === editingId ? updatedReturn : ret));
        } else {
            // Create new
            const newReturn: InvoiceReturn = {
                id: `RET-${Math.floor(Math.random() * 10000)}`,
                tenantId: selectedInvoice.tenantId,
                invoiceId: selectedInvoice.id,
                invoiceNumber: selectedInvoice.invoiceNumber,
                accountId: selectedInvoice.accountId,
                accountName: selectedInvoice.accountName,
                registerId: formData.registerId,
                date: formData.date,
                type: formData.type as 'return' | 'cancellation',
                reason: formData.reason,
                amount: parseFloat(formData.amount),
                currency: selectedInvoice.currency,
                status: formData.status as 'pending' | 'approved' | 'rejected'
            };
            await api.sales.createReturn(newReturn);
            setReturns([newReturn, ...returns]);
        }
        resetForm();
    } catch (error) {
        alert("İşlem sırasında hata oluştu.");
    }
  };

  const resetForm = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      invoiceId: '',
      registerId: '',
      date: new Date().toISOString().slice(0, 10),
      type: 'return',
      reason: '',
      amount: '',
      status: 'pending'
    });
    setInvoiceSearchTerm('');
    setSelectedInvoice(null);
  };

  const filteredReturns = returns.filter(ret => {
    const matchesTab = activeTab === 'all' ? true : ret.status === activeTab;
    const matchesSearch = 
      ret.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
      ret.accountName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Filter invoices for the dropdown
  const filteredInvoiceOptions = invoices.filter(inv => 
    inv.invoiceNumber.toLowerCase().includes(invoiceSearchTerm.toLowerCase()) ||
    inv.accountName.toLowerCase().includes(invoiceSearchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'approved': return { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle, label: 'Onaylandı' };
      case 'rejected': return { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: XCircle, label: 'Reddedildi' };
      default: return { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: AlertTriangle, label: 'Bekliyor' };
    }
  };

  const inputClass = "w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white";

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/invoices')}
            className="p-2 bg-white dark:bg-enterprise-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">İptal ve İade İşlemleri</h1>
            <p className="text-slate-500 dark:text-slate-400">Satış ve alış faturaları için iptal/iade taleplerini yönetin.</p>
          </div>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 shadow-sm transition-colors"
        >
          <RotateCcw size={16} className="mr-2" />
          Yeni İade / İptal
        </button>
      </div>

      {/* Stats / Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-enterprise-800 p-6 rounded-xl shadow-card border border-slate-200 dark:border-slate-700/50">
           <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Toplam İade Tutarı (Bu Ay)</p>
           <h3 className="text-2xl font-bold text-red-600 dark:text-red-400">
             {loading ? '...' : `₺${returns.filter(r => r.status === 'approved' && r.currency === 'TRY').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`}
           </h3>
        </div>
        <div className="bg-white dark:bg-enterprise-800 p-6 rounded-xl shadow-card border border-slate-200 dark:border-slate-700/50">
           <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Bekleyen Talepler</p>
           <h3 className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
             {loading ? '...' : returns.filter(r => r.status === 'pending').length}
           </h3>
        </div>
        <div className="bg-white dark:bg-enterprise-800 p-6 rounded-xl shadow-card border border-slate-200 dark:border-slate-700/50">
           <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Onaylanan İşlemler</p>
           <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">
             {loading ? '...' : returns.filter(r => r.status === 'approved').length}
           </h3>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-enterprise-800 rounded-xl shadow-card border border-slate-200 dark:border-slate-700/50 transition-colors">
        
        {/* Filters */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex bg-white dark:bg-slate-700 p-1 rounded-lg border border-slate-200 dark:border-slate-600">
            {(['all', 'pending', 'approved'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-all ${
                  activeTab === tab ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {tab === 'all' ? 'Tümü' : tab === 'pending' ? 'Bekleyen' : 'Onaylanan'}
              </button>
            ))}
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Fatura no, cari..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-4 pr-10 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white dark:bg-slate-900 text-slate-900 dark:text-white w-full sm:w-64"
            />
            <Search size={16} className="absolute right-3 top-2.5 text-slate-400 dark:text-slate-500" />
          </div>
        </div>

        {/* Table */}
        {loading ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                <Loader2 size={40} className="animate-spin mb-4 text-brand-600" />
                <p>Kayıtlar yükleniyor...</p>
            </div>
        ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-semibold">İşlem ID</th>
                    <th className="px-6 py-4 font-semibold">Fatura No</th>
                    <th className="px-6 py-4 font-semibold">Cari Hesap</th>
                    <th className="px-6 py-4 font-semibold">Kasa / Banka</th>
                    <th className="px-6 py-4 font-semibold">Tarih</th>
                    <th className="px-6 py-4 font-semibold">Tür</th>
                    <th className="px-6 py-4 font-semibold">Sebep</th>
                    <th className="px-6 py-4 font-semibold">Durum</th>
                    <th className="px-6 py-4 font-semibold text-right">Tutar</th>
                    <th className="px-6 py-4 font-semibold text-right w-24">İşlemler</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                {filteredReturns.map(ret => {
                    const badge = getStatusBadge(ret.status);
                    const currencySymbol = ret.currency === 'USD' ? '$' : ret.currency === 'EUR' ? '€' : '₺';
                    const register = registers.find(r => r.id === ret.registerId);
                    
                    return (
                    <tr key={ret.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                        <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{ret.id}</td>
                        <td className="px-6 py-4 text-sm font-mono text-slate-600 dark:text-slate-300">
                        {ret.invoiceNumber}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900 dark:text-white">{ret.accountName}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                        {register ? register.name : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{new Date(ret.date).toLocaleDateString('tr-TR')}</td>
                        <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ret.type === 'cancellation' ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300' : 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300'}`}>
                            {ret.type === 'cancellation' ? 'İptal' : 'İade'}
                        </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 max-w-xs truncate" title={ret.reason}>{ret.reason}</td>
                        <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
                            <badge.icon size={12} className="mr-1" />
                            {badge.label}
                        </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white text-right">
                        {currencySymbol}{ret.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                            <button 
                            onClick={() => handleEdit(ret)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                            title="Düzenle"
                            >
                            <Edit size={16} />
                            </button>
                            <button 
                            onClick={() => handleDelete(ret.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                            title="Sil (Yönetici)"
                            >
                            <Trash2 size={16} />
                            </button>
                        </div>
                        </td>
                    </tr>
                    )
                })}
                {filteredReturns.length === 0 && (
                    <tr>
                    <td colSpan={10} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                        Kayıt bulunamadı.
                    </td>
                    </tr>
                )}
                </tbody>
            </table>
            </div>
        )}
      </div>

      {/* New Return Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={resetForm} 
        title={editingId ? "İşlemi Düzenle" : "Yeni İptal / İade Oluştur"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Invoice Selection with Search & QR */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fatura Seçimi</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Fatura no veya cari adı ile arayın..."
                  value={invoiceSearchTerm}
                  onChange={(e) => {
                    setInvoiceSearchTerm(e.target.value);
                    setIsInvoiceDropdownOpen(true);
                  }}
                  onFocus={() => setIsInvoiceDropdownOpen(true)}
                  className={`${inputClass} pl-10`}
                  autoComplete="off"
                />
                {selectedInvoice && (
                  <CheckCircle size={18} className="absolute right-3 top-2.5 text-green-500" />
                )}
              </div>
              <button 
                type="button"
                onClick={handleQRScan}
                className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600 rounded-lg px-3 text-slate-600 dark:text-slate-300 transition-colors"
                title="QR Kod ile Ara"
              >
                <QrCode size={20} />
              </button>
            </div>

            {/* Custom Search Dropdown */}
            {isInvoiceDropdownOpen && (
              <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto">
                {filteredInvoiceOptions.length > 0 ? (
                  filteredInvoiceOptions.map(inv => (
                    <div 
                      key={inv.id}
                      onClick={() => handleInvoiceSelect(inv)}
                      className="px-4 py-3 hover:bg-brand-50 dark:hover:bg-brand-900/20 cursor-pointer border-b border-slate-100 dark:border-slate-700 last:border-0"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-slate-800 dark:text-white text-sm">{inv.invoiceNumber}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">{inv.currency}</span>
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-300">{inv.accountName}</div>
                      <div className="text-xs text-slate-400 dark:text-slate-500 mt-1 flex justify-between">
                        <span>{new Date(inv.date).toLocaleDateString('tr-TR')}</span>
                        <span className="font-medium text-slate-900 dark:text-white">
                          {inv.currency === 'USD' ? '$' : inv.currency === 'EUR' ? '€' : '₺'}{inv.total.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-slate-500 dark:text-slate-400 text-sm">
                    Fatura bulunamadı.
                  </div>
                )}
              </div>
            )}
          </div>

          {selectedInvoice && (
            <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 text-sm mb-2">
              <div className="flex justify-between mb-1">
                <span className="text-slate-500 dark:text-slate-400">Fatura Tarihi:</span>
                <span className="font-medium text-slate-900 dark:text-white">{new Date(selectedInvoice.date).toLocaleDateString('tr-TR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Toplam Tutar:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedInvoice.currency === 'USD' ? '$' : selectedInvoice.currency === 'EUR' ? '€' : '₺'}
                  {selectedInvoice.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">İşlem Tarihi</label>
              <input 
                type="date" 
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">İşlem Türü</label>
              <select 
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
                className={inputClass}
              >
                <option value="return">İade (Kısmi/Tam)</option>
                <option value="cancellation">İptal (Tamamı)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">İade Yapılacak Kasa / Hesap</label>
            <div className="relative">
              <select 
                value={formData.registerId}
                onChange={e => setFormData({...formData, registerId: e.target.value})}
                className={inputClass}
                required
              >
                <option value="">Hesap Seçiniz...</option>
                {registers.map(reg => (
                  <option key={reg.id} value={reg.id}>
                    {reg.name} ({reg.currency})
                  </option>
                ))}
              </select>
              <Landmark size={16} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">İade/İptal bedelinin işleneceği kasa veya banka hesabı.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">İade/İptal Tutarı</label>
            <div className="relative">
               <input 
                type="number" 
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={e => setFormData({...formData, amount: e.target.value})}
                className={inputClass}
                required
              />
              <span className="absolute right-3 top-2 text-slate-400 text-sm font-bold">
                {selectedInvoice ? (selectedInvoice.currency === 'USD' ? '$' : selectedInvoice.currency === 'EUR' ? '€' : '₺') : ''}
              </span>
            </div>
            {selectedInvoice && parseFloat(formData.amount) > selectedInvoice.total && (
              <p className="text-xs text-red-500 mt-1">Tutar fatura toplamından büyük olamaz.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Sebep / Açıklama</label>
            <textarea 
              rows={3}
              value={formData.reason}
              onChange={e => setFormData({...formData, reason: e.target.value})}
              className={inputClass}
              placeholder="İade veya iptal sebebi..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Durum</label>
            <select 
              value={formData.status}
              onChange={e => setFormData({...formData, status: e.target.value})}
              className={inputClass}
            >
              <option value="pending">Beklemede</option>
              <option value="approved">Onaylandı</option>
              <option value="rejected">Reddedildi</option>
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button 
              type="button" 
              onClick={resetForm}
              className="px-4 py-2 text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              İptal
            </button>
            <button 
              type="submit" 
              disabled={!selectedInvoice || !formData.registerId || (selectedInvoice && parseFloat(formData.amount) > selectedInvoice.total)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editingId ? 'Güncelle' : 'Kaydet'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default InvoiceReturns;
