
import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, Search, Plus, Filter, Download, ArrowUpRight, 
  Printer, Check, Clock, AlertCircle, Trash2, Calendar, 
  AlignLeft, ChevronDown, CheckCircle, XCircle, FileInput, 
  Briefcase, Loader2
} from 'lucide-react';
import { api } from '../services/api';
import { Offer, InvoiceItem, Product, Account } from '../types';
import Modal from '../components/Modal';
import OfferPaper from '../components/OfferPaper';
import { useNavigate } from 'react-router-dom';

// Helper to get local date-time string
const getLocalISODate = (dateOffsetDays = 0) => {
  const now = new Date();
  if (dateOffsetDays !== 0) {
    now.setDate(now.getDate() + dateOffsetDays);
  }
  return now.toISOString().slice(0, 10);
};

const Offers: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'accepted'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [printingOffer, setPrintingOffer] = useState<Offer | null>(null);

  // Search/Dropdown State for Products
  const [activeSearchId, setActiveSearchId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveSearchId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const loadData = async () => {
      setLoading(true);
      try {
          const [fetchedOffers, fetchedProducts, fetchedAccounts] = await Promise.all([
              api.offers.getAll(),
              api.products.getAll(),
              api.accounts.getAll()
          ]);
          setOffers(fetchedOffers);
          setProducts(fetchedProducts);
          setAccounts(fetchedAccounts);
      } catch (error) {
          console.error("Failed to load offers data", error);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
      loadData();
  }, []);

  // Form State
  const initialFormState: Partial<Offer> = {
    offerNumber: '',
    date: getLocalISODate(),
    validUntil: getLocalISODate(7), // +7 days validity
    accountId: '',
    status: 'draft',
    currency: 'TRY',
    items: [],
    grossTotal: 0,
    lineDiscountTotal: 0,
    subtotal: 0,
    taxTotal: 0,
    discountType: 'percentage',
    discountValue: 0,
    discountTotal: 0,
    total: 0,
    notes: ''
  };

  const [formData, setFormData] = useState<Partial<Offer>>(initialFormState);

  // Auto Generate Offer Number
  useEffect(() => {
    if (!editingId && isModalOpen && !formData.offerNumber) {
       const randomNum = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
       setFormData(prev => ({ ...prev, offerNumber: `TKL${new Date().getFullYear()}${randomNum}` }));
    }
  }, [isModalOpen, editingId]);

  // Calculations Logic (Same as Invoices)
  useEffect(() => {
    if (formData.items) {
      let calculatedGrossTotal = 0;
      let calculatedLineDiscountTotal = 0;
      let calculatedRawTax = 0;

      const itemsWithTotals = formData.items.map(item => {
         const lineGross = item.quantity * item.unitPrice;
         const lineDiscountAmount = lineGross * (item.discountRate / 100);
         const lineNet = lineGross - lineDiscountAmount;
         const lineTax = lineNet * (item.taxRate / 100);
         
         calculatedGrossTotal += lineGross;
         calculatedLineDiscountTotal += lineDiscountAmount;
         calculatedRawTax += lineTax;

         return item;
      });

      const calculatedSubtotal = calculatedGrossTotal - calculatedLineDiscountTotal;

      let globalDiscountAmount = 0;
      if (formData.discountValue && formData.discountValue > 0) {
        if (formData.discountType === 'percentage') {
          globalDiscountAmount = calculatedSubtotal * (formData.discountValue / 100);
        } else {
          globalDiscountAmount = formData.discountValue;
        }
      }

      const taxBase = calculatedSubtotal - globalDiscountAmount;
      const taxScalingFactor = calculatedSubtotal > 0 ? taxBase / calculatedSubtotal : 0;
      const finalTaxTotal = calculatedRawTax * taxScalingFactor;
      const finalTotal = taxBase + finalTaxTotal;

      setFormData(prev => ({
        ...prev,
        grossTotal: calculatedGrossTotal,
        lineDiscountTotal: calculatedLineDiscountTotal,
        subtotal: calculatedSubtotal,
        taxTotal: finalTaxTotal,
        discountTotal: globalDiscountAmount,
        total: finalTotal
      }));
    }
  }, [formData.items, formData.discountType, formData.discountValue]);

  // Handlers
  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: `ITEM-${Date.now()}`,
      productId: '',
      productName: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: 20,
      discountRate: 0,
      total: 0
    };
    setFormData(prev => ({ ...prev, items: [...(prev.items || []), newItem] }));
  };

  const handleRemoveItem = (id: string) => {
    setFormData(prev => ({ ...prev, items: prev.items?.filter(i => i.id !== id) }));
  };

  const handleProductSelect = (itemId: string, product: Product) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items?.map(item => {
        if (item.id === itemId) {
          const qty = item.quantity;
          const tax = item.taxRate;
          const total = qty * product.price * (1 + tax / 100);
          return {
            ...item,
            productId: product.id,
            productName: product.name,
            unitPrice: product.price,
            total: total
          };
        }
        return item;
      })
    }));
    setActiveSearchId(null);
  };

  const handleItemChange = (id: string, field: keyof InvoiceItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items?.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          const qty = field === 'quantity' ? Number(value) : item.quantity;
          const price = field === 'unitPrice' ? Number(value) : item.unitPrice;
          const tax = field === 'taxRate' ? Number(value) : item.taxRate;
          const disc = field === 'discountRate' ? Number(value) : item.discountRate;

          const base = qty * price;
          const net = base - (base * (disc / 100));
          updatedItem.total = net * (1 + tax / 100);
          
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const account = accounts.find(a => a.id === formData.accountId);
    
    const offerToSave: Offer = {
      id: editingId || `OFF-${Math.floor(Math.random() * 10000)}`,
      ...formData as Offer,
      accountName: account?.name || 'Bilinmeyen Cari',
    };

    try {
        if (editingId) {
            await api.offers.update(offerToSave);
            setOffers(offers.map(off => off.id === editingId ? offerToSave : off));
        } else {
            await api.offers.create(offerToSave);
            setOffers([offerToSave, ...offers]);
        }
        setIsModalOpen(false);
        setEditingId(null);
    } catch (error) {
        alert("Teklif kaydedilirken hata oluştu.");
    }
  };

  const handleEdit = (offer: Offer) => {
    setEditingId(offer.id);
    setFormData({ ...offer });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bu teklifi silmek istediğinize emin misiniz?')) {
        try {
            await api.offers.delete(id);
            setOffers(offers.filter(o => o.id !== id));
        } catch (error) {
            console.error(error);
        }
    }
  };

  const handleConvertToInvoice = async (offer: Offer) => {
    if (window.confirm(`${offer.offerNumber} numaralı teklifi faturaya dönüştürmek istiyor musunuz?`)) {
      try {
          // Update offer status
          const updatedOffer = { ...offer, status: 'invoiced' as const };
          await api.offers.update(updatedOffer);
          setOffers(offers.map(o => o.id === offer.id ? updatedOffer : o));
          
          // Note: Actual invoice creation would happen via API too, but simulated here.
          alert("Teklif başarıyla faturaya dönüştürüldü! Fatura taslak olarak oluşturuldu.");
          
          // Navigate to invoices (Mock navigation)
          navigate('/invoices');
      } catch (error) {
          alert("Dönüştürme işlemi başarısız.");
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted': return { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle, label: 'Onaylandı' };
      case 'sent': return { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: ArrowUpRight, label: 'Gönderildi' };
      case 'draft': return { color: 'bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-gray-300', icon: FileText, label: 'Taslak' };
      case 'rejected': return { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: XCircle, label: 'Reddedildi' };
      case 'invoiced': return { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400', icon: FileInput, label: 'Faturalandı' };
      default: return { color: 'bg-gray-100 text-gray-800', icon: FileText, label: status };
    }
  };

  const filteredOffers = offers.filter(off => {
    const matchesTab = activeTab === 'all' 
        ? true 
        : activeTab === 'pending' 
            ? ['draft', 'sent'].includes(off.status) 
            : ['accepted', 'invoiced'].includes(off.status);
    
    const matchesSearch = off.offerNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          off.accountName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const inputClass = "w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-shadow text-gray-900 dark:text-gray-100";
  const tableInputClass = "w-full p-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded text-sm outline-none focus:ring-2 focus:ring-brand-500 text-gray-900 dark:text-gray-100";

  return (
    <div className="p-6">
      {/* Offer Preview/Print Modal */}
      {printingOffer && (
        <OfferPaper 
          offer={printingOffer}
          account={accounts.find(a => a.id === printingOffer.accountId)}
          onClose={() => setPrintingOffer(null)}
        />
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Briefcase className="text-brand-600" />
            Teklif Yönetimi
          </h1>
          <p className="text-gray-500 dark:text-slate-400">Müşteri tekliflerini hazırlayın ve takip edin.</p>
        </div>
        <button 
          onClick={() => {
            setEditingId(null);
            setFormData(initialFormState);
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 shadow-lg shadow-brand-900/20 flex items-center transition-all hover:scale-105"
        >
          <Plus size={16} className="mr-2" />
          Yeni Teklif
        </button>
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-enterprise-800 rounded-2xl shadow-card border border-slate-200 dark:border-slate-700/50 transition-colors overflow-hidden">
         
         {/* Filters */}
         <div className="p-4 border-b border-slate-200 dark:border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50 dark:bg-slate-800/50">
            <div className="flex bg-white dark:bg-slate-700 p-1 rounded-lg border border-slate-200 dark:border-slate-600">
              <button 
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'all' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              >
                Tümü
              </button>
              <button 
                onClick={() => setActiveTab('pending')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'pending' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              >
                Bekleyenler
              </button>
              <button 
                onClick={() => setActiveTab('accepted')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'accepted' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              >
                Onaylananlar
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Teklif no veya müşteri..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-slate-900 dark:text-white w-full sm:w-64"
              />
              <Search size={18} className="absolute left-3 top-3 text-slate-400" />
            </div>
         </div>

         {loading ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                <Loader2 size={40} className="animate-spin mb-4 text-brand-600" />
                <p>Teklifler yükleniyor...</p>
            </div>
         ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider">
                    <th className="px-6 py-4">Teklif No</th>
                    <th className="px-6 py-4">Müşteri</th>
                    <th className="px-6 py-4">Tarih</th>
                    <th className="px-6 py-4">Geçerlilik</th>
                    <th className="px-6 py-4">Durum</th>
                    <th className="px-6 py-4 text-right">Tutar</th>
                    <th className="px-6 py-4 text-right w-32">İşlemler</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {filteredOffers.map(off => {
                    const badge = getStatusBadge(off.status);
                    const currencySymbol = off.currency === 'USD' ? '$' : off.currency === 'EUR' ? '€' : '₺';
                    const isExpired = new Date(off.validUntil) < new Date() && off.status !== 'invoiced' && off.status !== 'accepted';

                    return (
                        <tr key={off.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                        <td className="px-6 py-4 text-sm font-mono font-medium text-slate-600 dark:text-slate-300">{off.offerNumber}</td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">{off.accountName}</td>
                        <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{new Date(off.date).toLocaleDateString('tr-TR')}</td>
                        <td className="px-6 py-4 text-sm">
                            <span className={isExpired ? 'text-red-600 font-bold' : 'text-slate-500 dark:text-slate-400'}>
                            {new Date(off.validUntil).toLocaleDateString('tr-TR')}
                            </span>
                        </td>
                        <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${badge.color}`}>
                            <badge.icon size={12} className="mr-1" />
                            {badge.label}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white text-right">
                            {currencySymbol}{off.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={() => handleConvertToInvoice(off)}
                                className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                                title="Faturaya Dönüştür"
                                disabled={off.status === 'invoiced'}
                            >
                                <FileInput size={18} />
                            </button>
                            <button 
                                onClick={() => setPrintingOffer(off)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                title="Yazdır"
                            >
                                <Printer size={18} />
                            </button>
                            <button 
                                onClick={() => handleDelete(off.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                title="Sil"
                            >
                                <Trash2 size={18} />
                            </button>
                            </div>
                        </td>
                        </tr>
                    )
                    })}
                    {filteredOffers.length === 0 && (
                    <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                        Kayıt bulunamadı.
                        </td>
                    </tr>
                    )}
                </tbody>
                </table>
            </div>
         )}
      </div>

      {/* Offer Form Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingId ? "Teklifi Düzenle" : "Yeni Teklif Oluştur"}
        position="bottom"
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-full max-w-7xl mx-auto">
          
          {/* Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 mb-6">
            <div className="md:col-span-1">
               <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase">Müşteri</label>
               <select 
                value={formData.accountId}
                onChange={e => setFormData({...formData, accountId: e.target.value})}
                required
                className={inputClass}
               >
                 <option value="">Seçiniz...</option>
                 {accounts
                   .filter(acc => acc.type === 'customer')
                   .map(acc => (
                     <option key={acc.id} value={acc.id}>{acc.name}</option>
                   ))}
               </select>
            </div>
            <div>
               <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase">Teklif No</label>
               <input 
                 type="text" 
                 value={formData.offerNumber}
                 onChange={e => setFormData({...formData, offerNumber: e.target.value})}
                 className={`${inputClass} font-mono`}
               />
            </div>
            <div>
               <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase">Tarih</label>
               <input 
                 type="date" 
                 value={formData.date}
                 onChange={e => setFormData({...formData, date: e.target.value})}
                 className={inputClass}
               />
            </div>
            <div>
               <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase">Geçerlilik</label>
               <input 
                 type="date" 
                 value={formData.validUntil}
                 onChange={e => setFormData({...formData, validUntil: e.target.value})}
                 className={inputClass}
               />
            </div>
            <div>
               <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase">Durum</label>
               <select 
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value as any})}
                className={inputClass}
               >
                 <option value="draft">Taslak</option>
                 <option value="sent">Gönderildi</option>
                 <option value="accepted">Onaylandı</option>
                 <option value="rejected">Reddedildi</option>
               </select>
            </div>
          </div>

          {/* Items Table */}
          <div className="flex-1 overflow-auto bg-white dark:bg-enterprise-800 border border-slate-200 dark:border-slate-700 rounded-xl mb-6 shadow-sm" style={{minHeight: '250px'}}>
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-4 py-3">Ürün / Hizmet</th>
                  <th className="px-4 py-3 w-28">Miktar</th>
                  <th className="px-4 py-3 w-32">Birim Fiyat</th>
                  <th className="px-4 py-3 w-20">İsk. %</th>
                  <th className="px-4 py-3 w-20">KDV %</th>
                  <th className="px-4 py-3 w-36 text-right">Toplam</th>
                  <th className="px-4 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {formData.items?.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 align-top group">
                    <td className="px-4 py-3 relative">
                         {/* Simple Searchable Combobox */}
                         <div className="relative w-full" ref={dropdownRef}>
                           <div className="relative flex items-center">
                             <input 
                               type="text"
                               value={item.productName}
                               onChange={(e) => {
                                 handleItemChange(item.id, 'productName', e.target.value);
                                 setActiveSearchId(item.id);
                               }}
                               onFocus={() => setActiveSearchId(item.id)}
                               placeholder="Ürün seçin..."
                               className="w-full p-2 pr-8 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-sm outline-none focus:ring-2 focus:ring-brand-500 placeholder-slate-400 text-slate-900 dark:text-white"
                             />
                             <ChevronDown size={14} className="absolute right-2 text-slate-400 pointer-events-none" />
                           </div>

                           {activeSearchId === item.id && (
                             <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                               {products
                                 .filter(p => p.name.toLowerCase().includes((item.productName || '').toLowerCase()))
                                 .map(product => (
                                   <div 
                                     key={product.id}
                                     onClick={() => handleProductSelect(item.id, product)}
                                     className="px-3 py-2 hover:bg-brand-50 dark:hover:bg-brand-900/20 cursor-pointer border-b border-slate-100 dark:border-slate-700 last:border-0"
                                   >
                                     <div className="font-medium text-sm text-slate-900 dark:text-white flex justify-between">
                                       {product.name}
                                       <span className="text-slate-500 dark:text-slate-400 font-mono text-xs">
                                         {product.currency === 'USD' ? '$' : product.currency === 'EUR' ? '€' : '₺'}
                                         {product.price}
                                       </span>
                                     </div>
                                   </div>
                                 ))
                               }
                             </div>
                           )}
                         </div>
                    </td>
                    <td className="px-4 py-3">
                      <input type="number" min="1" value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', e.target.value)} className={tableInputClass + " text-right font-bold"} />
                    </td>
                    <td className="px-4 py-3">
                       <input type="number" min="0" step="0.01" value={item.unitPrice} onChange={e => handleItemChange(item.id, 'unitPrice', e.target.value)} className={tableInputClass + " text-right"} />
                    </td>
                    <td className="px-4 py-3">
                       <input type="number" min="0" max="100" value={item.discountRate} onChange={e => handleItemChange(item.id, 'discountRate', e.target.value)} className={tableInputClass + " text-right"} />
                    </td>
                    <td className="px-4 py-3">
                       <select value={item.taxRate} onChange={e => handleItemChange(item.id, 'taxRate', e.target.value)} className={tableInputClass + " text-right"}>
                         <option value="0">%0</option>
                         <option value="1">%1</option>
                         <option value="10">%10</option>
                         <option value="20">%20</option>
                       </select>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-sm text-slate-900 dark:text-white pt-3">
                      {formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : '₺'}
                      {item.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <button type="button" onClick={handleAddItem} className="self-start mb-6 text-brand-600 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-300 text-sm font-medium flex items-center">
            <Plus size={16} className="mr-1" /> Satır Ekle
          </button>

          {/* Footer Totals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-200 dark:border-slate-700 pt-6">
             <div>
               <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Notlar</label>
               <textarea rows={3} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className={inputClass} placeholder="Teklif notları..."></textarea>
             </div>
             <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6 space-y-3">
                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                  <span>Ara Toplam</span>
                  <span>{formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : '₺'}{(formData.subtotal || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                  <span>KDV Toplam</span>
                  <span>{formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : '₺'}{(formData.taxTotal || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-lg font-black text-slate-900 dark:text-white pt-3 border-t border-slate-200 dark:border-slate-600">
                  <span>Genel Toplam</span>
                  <span>{formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : '₺'}{(formData.total || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                </div>
             </div>
          </div>

          <div className="mt-8 flex justify-end gap-3 pb-6">
             <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 font-bold transition-colors">İptal</button>
            <button type="submit" className="px-6 py-2 text-white bg-brand-600 rounded-lg hover:bg-brand-700 shadow-lg shadow-brand-600/30 font-bold transition-colors hover:scale-105">Kaydet</button>
          </div>

        </form>
      </Modal>
    </div>
  );
};

export default Offers;
