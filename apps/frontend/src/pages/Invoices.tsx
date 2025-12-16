
import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, Search, Plus, Filter, Download, ArrowUpRight, ArrowDownRight, 
  Printer, Check, Clock, AlertCircle, Trash2, Calendar, Percent, AlignLeft, 
  ChevronDown, Coins, Package, Wrench, Save, ShoppingCart, Truck, RefreshCw, RotateCcw, Loader2, Edit
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { Invoice, InvoiceItem, Account, Product } from '../types';
import Modal from '../components/Modal';
import InvoicePaper from '../components/InvoicePaper';
import { useAuth } from '../context/AuthContext';

// Mock Exchange Rates (In a real app, fetch from API)
const EXCHANGE_RATES = {
  USD: 34.50,
  EUR: 36.20,
  TRY: 1
};

// Helper to get local date-time string for datetime-local input
const getLocalISODateTime = (dateOffsetDays = 0) => {
  const now = new Date();
  if (dateOffsetDays !== 0) {
    now.setDate(now.getDate() + dateOffsetDays);
  }
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
};

// Extended interface for local state to handle UI toggles
interface FormInvoiceItem extends InvoiceItem {
  showDescription?: boolean;
}

// Define the form state type explicitly to override the items array type
type InvoiceFormState = Omit<Partial<Invoice>, 'items'> & { items?: FormInvoiceItem[] };

const Invoices: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  
  const [activeTab, setActiveTab] = useState<'sales' | 'purchase'>('sales');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Invoice Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTypeSelectionOpen, setIsTypeSelectionOpen] = useState(false); // New state for type selection
  const [editingId, setEditingId] = useState<string | null>(null);

  // Print Preview State
  const [printingInvoice, setPrintingInvoice] = useState<Invoice | null>(null);

  // Quick Product Add Modal State
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddLineId, setQuickAddLineId] = useState<string | null>(null);
  const [quickProductForm, setQuickProductForm] = useState({
    name: '',
    code: '',
    type: 'product' as 'product' | 'service',
    price: '',
    taxRate: '20'
  });

  // Search/Dropdown State for Products
  const [activeSearchId, setActiveSearchId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Permissions
  const canEdit = ['superuser', 'admin', 'manager', 'accountant'].includes(user?.role || '');
  const canDelete = ['superuser', 'admin', 'manager'].includes(user?.role || '');

  // Load Data on Mount
  useEffect(() => {
    const loadData = async () => {
        setLoading(true);
        try {
            const [fetchedInvoices, fetchedProducts, fetchedAccounts] = await Promise.all([
                api.finance.getInvoices(),
                api.products.getAll(),
                api.accounts.getAll()
            ]);
            setInvoices(fetchedInvoices);
            setProducts(fetchedProducts);
            setAccounts(fetchedAccounts);
        } catch (error) {
            console.error("Failed to load invoice data", error);
        } finally {
            setLoading(false);
        }
    };
    loadData();
  }, []);

  // Initialize search from URL params if present
  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchTerm(query);
    }
  }, [searchParams]);

  // Close dropdown when clicking outside
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

  // Form State
  const initialFormState: InvoiceFormState = {
    invoiceNumber: '',
    date: getLocalISODateTime(), // Initialize with datetime-local format
    dueDate: getLocalISODateTime(15), // +15 days default
    accountId: '',
    type: 'sales',
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

  const [formData, setFormData] = useState<InvoiceFormState>(initialFormState);
  const selectedAccount = accounts.find(a => a.id === formData.accountId);

  // Initialize Invoice Number (Only when opening fresh)
  useEffect(() => {
    if (!editingId && isModalOpen && !formData.invoiceNumber) {
       const prefix = formData.type === 'sales' ? 'SAT' : 'ALS';
       const randomNum = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
       setFormData(prev => ({ 
         ...prev, 
         invoiceNumber: `${prefix}${new Date().getFullYear()}${randomNum}` 
       }));
    }
  }, [isModalOpen, editingId]);

  // Calculations Logic (Global Totals)
  useEffect(() => {
    if (formData.items) {
      // 1. Calculate Line Items
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

      // 2. Calculate Global Discount
      let globalDiscountAmount = 0;
      if (formData.discountValue && formData.discountValue > 0) {
        if (formData.discountType === 'percentage') {
          globalDiscountAmount = calculatedSubtotal * (formData.discountValue / 100);
        } else {
          globalDiscountAmount = formData.discountValue;
        }
      }

      if (globalDiscountAmount > calculatedSubtotal) {
        globalDiscountAmount = calculatedSubtotal;
      }

      // 3. Tax Base
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

  // Handle New Invoice Button Click
  const handleNewInvoiceClick = () => {
    if (!canEdit) return;
    setIsTypeSelectionOpen(true);
  };

  const handleSelectInvoiceType = (type: 'sales' | 'purchase') => {
    setFormData({
        ...initialFormState,
        type: type
    });
    setIsTypeSelectionOpen(false);
    setIsModalOpen(true);
    setEditingId(null);
  };

  const handleEdit = (invoice: Invoice) => {
    if (!canEdit) return;
    setEditingId(invoice.id);
    // Map invoice to form state
    setFormData({
        ...invoice,
        date: new Date(invoice.date).toISOString().slice(0, 16), // Adjust for datetime-local
        dueDate: new Date(invoice.dueDate).toISOString().slice(0, 16)
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!canDelete) return;
    if (window.confirm('Bu faturayı silmek istediğinize emin misiniz?')) {
        try {
            await api.finance.deleteInvoice(id);
            setInvoices(invoices.filter(i => i.id !== id));
        } catch (error) {
            console.error("Failed to delete invoice", error);
        }
    }
  };

  const handleAddItem = () => {
    const newItem: FormInvoiceItem = {
      id: `ITEM-${Date.now()}`,
      productId: '',
      productName: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: 20,
      discountRate: 0,
      total: 0,
      showDescription: false
    };
    setFormData(prev => ({ ...prev, items: [...(prev.items || []), newItem] }));
  };

  const handleRemoveItem = (id: string) => {
    setFormData(prev => ({ ...prev, items: prev.items?.filter(i => i.id !== id) }));
  };

  const toggleDescription = (id: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items?.map(item => 
        item.id === id ? { ...item, showDescription: !item.showDescription } : item
      )
    }));
  };

  // --- SMART PRICE CONVERSION LOGIC ---
  const handleProductSelect = (itemId: string, product: Product) => {
    const invoiceCurrency = formData.currency || 'TRY';
    const productCurrency = product.currency || 'TRY';
    
    let finalPrice = product.price;

    if (invoiceCurrency !== productCurrency) {
      if (invoiceCurrency === 'TRY') {
        const rate = productCurrency === 'USD' ? EXCHANGE_RATES.USD : EXCHANGE_RATES.EUR;
        finalPrice = product.price * rate;
      } else if (productCurrency === 'TRY') {
        const rate = invoiceCurrency === 'USD' ? EXCHANGE_RATES.USD : EXCHANGE_RATES.EUR;
        finalPrice = product.price / rate;
      } else {
        const toTryRate = productCurrency === 'USD' ? EXCHANGE_RATES.USD : EXCHANGE_RATES.EUR;
        const fromTryRate = invoiceCurrency === 'USD' ? EXCHANGE_RATES.USD : EXCHANGE_RATES.EUR;
        const priceInTry = product.price * toTryRate;
        finalPrice = priceInTry / fromTryRate;
      }
      
      // FORCE 2 DECIMAL ROUNDING on conversion
      finalPrice = Math.round(finalPrice * 100) / 100;
    }

    setFormData(prev => ({
      ...prev,
      items: prev.items?.map(item => {
        if (item.id === itemId) {
          // Calculate initial total
          const qty = item.quantity;
          const tax = item.taxRate;
          const disc = item.discountRate;

          const base = qty * finalPrice;
          const net = base - (base * (disc / 100));
          const total = net * (1 + tax / 100);

          return {
            ...item,
            productId: product.id,
            productName: product.name,
            unitPrice: finalPrice, // Already rounded above
            total: total
          };
        }
        return item;
      })
    }));
    setActiveSearchId(null);
  };

  // Main Item Change Handler with Reverse Calculation Logic
  const handleItemChange = (id: string, field: keyof FormInvoiceItem | 'total', value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items?.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item };
          
          if (field === 'productName') {
            updatedItem.productId = '';
            updatedItem.productName = value;
          } else if (field === 'total') {
            // REVERSE CALCULATION: Total Changed -> Calculate Unit Price
            const newTotal = parseFloat(value) || 0;
            const qty = item.quantity || 1; // Avoid division by zero
            const taxMultiplier = 1 + (item.taxRate / 100);
            const discountMultiplier = 1 - (item.discountRate / 100);

            // Step 1: Remove Tax
            const netAmount = newTotal / taxMultiplier;
            
            // Step 2: Remove Discount
            const grossAmount = discountMultiplier !== 0 ? netAmount / discountMultiplier : netAmount;

            // Step 3: Divide by Qty
            let newUnitPrice = grossAmount / qty;
            
            updatedItem.total = newTotal;
            updatedItem.unitPrice = newUnitPrice;

          } else {
             // FORWARD CALCULATION
             (updatedItem as any)[field] = value;
             
             const qty = field === 'quantity' ? Number(value) : item.quantity;
             const price = field === 'unitPrice' ? Number(value) : item.unitPrice;
             const tax = field === 'taxRate' ? Number(value) : item.taxRate;
             const disc = field === 'discountRate' ? Number(value) : item.discountRate;

             const base = qty * price;
             const net = base - (base * (disc / 100));
             updatedItem.total = net * (1 + tax / 100);
          }
          
          return updatedItem;
        }
        return item;
      })
    }));
  };

  // Blur Handler for formatting decimals (Masking Effect)
  const handleBlur = (id: string, field: 'unitPrice' | 'total') => {
    setFormData(prev => ({
      ...prev,
      items: prev.items?.map(item => {
        if (item.id === id) {
          const val = item[field];
          // Force rounding to 2 decimals on blur to clean up the input
          const cleanVal = Math.round(val * 100) / 100;
          return {
            ...item,
            [field]: cleanVal
          };
        }
        return item;
      })
    }));
  };

  // --- Quick Add Logic ---
  const initiateQuickAdd = (lineId: string, currentName: string) => {
    setQuickAddLineId(lineId);
    setQuickProductForm({
      name: currentName,
      code: `HIZLI-${Math.floor(Math.random() * 10000)}`,
      type: 'product',
      price: '',
      taxRate: '20'
    });
    setIsQuickAddOpen(true);
    setActiveSearchId(null);
  };

  const handleQuickAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newProduct: Product = {
      id: `PRD-Q-${Date.now()}`,
      tenantId: user?.tenantId || 'tenant-1',
      name: quickProductForm.name,
      code: quickProductForm.code,
      category: quickProductForm.type === 'service' ? 'Hizmet' : 'Genel',
      price: parseFloat(quickProductForm.price) || 0,
      currency: 'TRY',
      stock: quickProductForm.type === 'service' ? 9999 : 0,
      minStock: 0,
      status: 'active'
    };

    try {
        await api.products.create(newProduct);
        setProducts(prev => [...prev, newProduct]);

        if (quickAddLineId) {
            handleProductSelect(quickAddLineId, newProduct);
        }

        setIsQuickAddOpen(false);
        setQuickAddLineId(null);
    } catch (error) {
        alert("Hızlı ürün eklenirken hata oluştu.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const account = accounts.find(a => a.id === formData.accountId);
    
    const cleanItems = formData.items?.map(({ showDescription, ...item }) => item) || [];

    const invoiceToSave: Invoice = {
      id: editingId || `INV-${Math.floor(Math.random() * 10000)}`,
      ...formData as Invoice,
      items: cleanItems,
      accountName: account?.name || 'Bilinmeyen Cari',
    };

    try {
        if (editingId) {
            await api.finance.updateInvoice(invoiceToSave);
            setInvoices(invoices.map(inv => inv.id === editingId ? invoiceToSave : inv));
        } else {
            await api.finance.createInvoice(invoiceToSave);
            setInvoices([invoiceToSave, ...invoices]);
        }
        setIsModalOpen(false);
        setEditingId(null);
    } catch (error) {
        alert("Fatura kaydedilirken hata oluştu.");
    }
  };

  const handlePrint = (invoice: Invoice) => {
    setPrintingInvoice(invoice);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: Check, label: 'Ödendi' };
      case 'sent': return { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: ArrowUpRight, label: 'Gönderildi' };
      case 'draft': return { color: 'bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-gray-300', icon: FileText, label: 'Taslak' };
      case 'overdue': return { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: AlertCircle, label: 'Gecikmiş' };
      default: return { color: 'bg-gray-100 text-gray-800', icon: FileText, label: status };
    }
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.type === activeTab && 
    (inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
     inv.accountName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const inputClass = "w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-shadow text-gray-900 dark:text-gray-100";
  const tableInputClass = "w-full p-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded text-sm outline-none focus:ring-2 focus:ring-brand-500 text-gray-900 dark:text-gray-100";

  return (
    <div className="p-6 space-y-8">
      {/* Invoice Viewer / Printer Component */}
      {printingInvoice && (
        <InvoicePaper 
          invoice={printingInvoice} 
          account={accounts.find(a => a.id === printingInvoice.accountId)}
          onClose={() => setPrintingInvoice(null)} 
        />
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Fatura Yönetimi</h1>
          <p className="text-gray-500 dark:text-slate-400">Alış ve satış faturalarınızı yönetin.</p>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <button 
                onClick={() => navigate('/invoices/returns')}
                className="flex items-center px-4 py-2 bg-white dark:bg-enterprise-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
                <RotateCcw size={16} className="mr-2" />
                İptal / İade
            </button>
          )}
          {canEdit && (
            <button 
                onClick={handleNewInvoiceClick}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 shadow-lg shadow-brand-900/20 flex items-center transition-all hover:scale-105"
            >
                <Plus size={16} className="mr-2" />
                Yeni Fatura
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-enterprise-800 p-6 rounded-2xl shadow-card border border-slate-100 dark:border-slate-800/60 transition-colors group hover:-translate-y-1 duration-300">
           <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Bu Ay Toplam Satış</p>
           <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">₺142.500,00</h3>
        </div>
        <div className="bg-white dark:bg-enterprise-800 p-6 rounded-2xl shadow-card border border-slate-100 dark:border-slate-800/60 transition-colors group hover:-translate-y-1 duration-300">
           <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Bekleyen Ödemeler</p>
           <h3 className="text-2xl font-black text-orange-600 dark:text-orange-400 tracking-tight">₺24.000,00</h3>
        </div>
        <div className="bg-white dark:bg-enterprise-800 p-6 rounded-2xl shadow-card border border-slate-100 dark:border-slate-800/60 transition-colors group hover:-translate-y-1 duration-300">
           <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Gecikmiş Tahsilatlar</p>
           <h3 className="text-2xl font-black text-red-600 dark:text-red-400 tracking-tight">₺5.200,00</h3>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white dark:bg-enterprise-800 rounded-2xl shadow-card border border-slate-200 dark:border-slate-700/50 flex flex-col transition-colors overflow-hidden">
         <div className="p-4 border-b border-slate-200 dark:border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50 dark:bg-slate-800/50">
            <div className="flex bg-white dark:bg-slate-700 p-1 rounded-lg border border-slate-200 dark:border-slate-600">
              <button 
                onClick={() => setActiveTab('sales')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center ${activeTab === 'sales' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              >
                <ArrowUpRight size={16} className={`mr-2 ${activeTab === 'sales' ? 'text-white' : 'text-green-500'}`} />
                Satış Faturaları
              </button>
              <button 
                onClick={() => setActiveTab('purchase')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center ${activeTab === 'purchase' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              >
                <ArrowDownRight size={16} className={`mr-2 ${activeTab === 'purchase' ? 'text-white' : 'text-red-500'}`} />
                Alış Faturaları
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Fatura no veya cari adı..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-slate-900 dark:text-white placeholder-slate-400 w-full sm:w-64"
              />
              <Search size={18} className="absolute left-3 top-3 text-slate-400" />
            </div>
         </div>

         {loading ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                <Loader2 size={40} className="animate-spin mb-4 text-brand-600" />
                <p>Faturalar yükleniyor...</p>
            </div>
         ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider">
                    <th className="px-6 py-4">Fatura No</th>
                    <th className="px-6 py-4">Cari Hesap</th>
                    <th className="px-6 py-4">Tarih</th>
                    <th className="px-6 py-4">Vade</th>
                    <th className="px-6 py-4">Durum</th>
                    <th className="px-6 py-4 text-right">Tutar</th>
                    <th className="px-6 py-4 text-right">İşlem</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {filteredInvoices.map(inv => {
                    const badge = getStatusBadge(inv.status);
                    const currencySymbol = inv.currency === 'USD' ? '$' : inv.currency === 'EUR' ? '€' : '₺';
                    return (
                        <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                        <td className="px-6 py-4 text-sm font-mono font-medium text-slate-600 dark:text-slate-300">{inv.invoiceNumber}</td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">{inv.accountName}</td>
                        <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{new Date(inv.date).toLocaleDateString('tr-TR')}</td>
                        <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{new Date(inv.dueDate).toLocaleDateString('tr-TR')}</td>
                        <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${badge.color}`}>
                            <badge.icon size={12} className="mr-1" />
                            {badge.label}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white text-right">
                            {currencySymbol}{inv.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                onClick={() => handlePrint(inv)}
                                className="text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors p-2 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg"
                                title="Faturayı Görüntüle ve Yazdır"
                                >
                                <Printer size={18} />
                                </button>
                                {canEdit && (
                                    <button 
                                    onClick={() => handleEdit(inv)}
                                    className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors p-2 rounded-lg"
                                    title="Düzenle"
                                    >
                                    <Edit size={18} />
                                    </button>
                                )}
                                {canDelete && (
                                    <button 
                                    onClick={() => handleDelete(inv.id)}
                                    className="text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors p-2 rounded-lg"
                                    title="Sil"
                                    >
                                    <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        </td>
                        </tr>
                    )
                    })}
                </tbody>
                </table>
            </div>
         )}
      </div>

      {/* INVOICE TYPE SELECTION MODAL */}
      <Modal
        isOpen={isTypeSelectionOpen}
        onClose={() => setIsTypeSelectionOpen(false)}
        title="Fatura Tipi Seçiniz"
        size="sm"
      >
        <div className="grid grid-cols-2 gap-4 p-2">
           <button
             onClick={() => handleSelectInvoiceType('sales')}
             className="flex flex-col items-center justify-center p-6 border dark:border-slate-700 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:border-brand-500 dark:hover:border-brand-400 transition-all group h-40"
           >
             <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-3 group-hover:bg-green-600 group-hover:text-white transition-colors">
                <ArrowUpRight size={28} />
             </div>
             <span className="font-bold text-gray-800 dark:text-gray-200">Satış Faturası</span>
             <span className="text-xs text-gray-500 dark:text-slate-400 mt-1">Müşteriye kesilen</span>
           </button>

           <button
             onClick={() => handleSelectInvoiceType('purchase')}
             className="flex flex-col items-center justify-center p-6 border dark:border-slate-700 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-500 dark:hover:border-red-400 transition-all group h-40"
           >
             <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-3 group-hover:bg-red-600 group-hover:text-white transition-colors">
                <ShoppingCart size={28} />
             </div>
             <span className="font-bold text-gray-800 dark:text-gray-200">Alış Faturası</span>
             <span className="text-xs text-gray-500 dark:text-slate-400 mt-1">Tedarikçiden alınan</span>
           </button>
        </div>
      </Modal>

      {/* NEW INVOICE MODAL - BOTTOM SHEET */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={formData.type === 'sales' ? "Yeni Satış Faturası" : "Yeni Alış Faturası"}
        position="bottom"
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-full max-w-7xl mx-auto">
          
          {/* Header Info */}
          <div className={`grid grid-cols-1 md:grid-cols-5 gap-6 p-4 rounded-xl border mb-6 ${
             formData.type === 'sales' 
             ? 'bg-brand-50 dark:bg-brand-900/10 border-brand-100 dark:border-brand-900/30' 
             : 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30'
          }`}>
            <div className="md:col-span-1">
               <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase">Cari Hesap</label>
               <select 
                value={formData.accountId}
                onChange={e => setFormData({...formData, accountId: e.target.value})}
                required
                className={inputClass}
               >
                 <option value="">Cari Seçiniz...</option>
                 {accounts
                   .filter(acc => formData.type === 'sales' ? acc.type === 'customer' : acc.type === 'supplier')
                   .map(acc => (
                     <option key={acc.id} value={acc.id}>{acc.name} ({acc.accountCode})</option>
                   ))}
               </select>
            </div>
            <div>
               <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase">Fatura No</label>
               <input 
                 type="text" 
                 value={formData.invoiceNumber}
                 onChange={e => setFormData({...formData, invoiceNumber: e.target.value})}
                 className={`${inputClass} font-mono`}
               />
            </div>
            <div>
               <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase">Fatura Tarihi</label>
               <input 
                 type="datetime-local" 
                 value={formData.date}
                 onChange={e => setFormData({...formData, date: e.target.value})}
                 className={inputClass}
               />
            </div>
            <div>
               <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase">Vade Tarihi</label>
               <input 
                 type="datetime-local" 
                 value={formData.dueDate}
                 onChange={e => setFormData({...formData, dueDate: e.target.value})}
                 className={inputClass}
               />
            </div>
            <div>
               <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase">Para Birimi</label>
               <select 
                value={formData.currency}
                onChange={e => setFormData({...formData, currency: e.target.value as any})}
                className={inputClass}
               >
                 <option value="TRY">Türk Lirası (₺)</option>
                 <option value="USD">Amerikan Doları ($)</option>
                 <option value="EUR">Euro (€)</option>
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
                {formData.items?.map((item, index) => (
                  <React.Fragment key={item.id}>
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/50 align-top group">
                      <td className="px-4 py-3 relative">
                         {/* Searchable Combobox */}
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
                               placeholder="Ürün ara veya yaz..."
                               className="w-full p-2 pr-8 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-sm outline-none focus:ring-2 focus:ring-brand-500 placeholder-slate-400 text-slate-900 dark:text-white"
                             />
                             <ChevronDown size={14} className="absolute right-2 text-slate-400 pointer-events-none" />
                           </div>

                           {/* Dropdown Menu */}
                           {activeSearchId === item.id && (
                             <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                               {products
                                 .filter(p => 
                                   p.name.toLowerCase().includes((item.productName || '').toLowerCase()) || 
                                   p.code.toLowerCase().includes((item.productName || '').toLowerCase())
                                 )
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
                                     <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        <span>Kod: {product.code}</span>
                                        <span className={product.stock > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>Stok: {product.stock}</span>
                                     </div>
                                   </div>
                                 ))
                               }
                               {products.filter(p => 
                                   p.name.toLowerCase().includes((item.productName || '').toLowerCase()) || 
                                   p.code.toLowerCase().includes((item.productName || '').toLowerCase())
                                 ).length === 0 && item.productName.trim() !== '' && (
                                   <div 
                                     className="px-3 py-3 text-sm text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 cursor-pointer font-medium border-t border-slate-100 dark:border-slate-700 flex items-center"
                                     onClick={() => initiateQuickAdd(item.id, item.productName)}
                                   >
                                     <Plus size={16} className="mr-2" />
                                     "{item.productName}" Olarak Yeni Ekle
                                   </div>
                               )}
                               {products.filter(p => 
                                   p.name.toLowerCase().includes((item.productName || '').toLowerCase()) || 
                                   p.code.toLowerCase().includes((item.productName || '').toLowerCase())
                                 ).length === 0 && item.productName.trim() === '' && (
                                   <div className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400 text-center">Sonuç bulunamadı</div>
                               )}
                             </div>
                           )}
                           
                           {/* Description Toggle Button */}
                           <div className="mt-1">
                             <button 
                               type="button"
                               onClick={() => toggleDescription(item.id)}
                               className="flex items-center text-xs text-brand-600 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-300 font-medium transition-colors focus:outline-none"
                             >
                               <AlignLeft size={12} className="mr-1" />
                               {item.showDescription ? 'Açıklamayı Gizle' : 'Açıklama Ekle'}
                             </button>
                           </div>
                         </div>
                      </td>
                      <td className="px-4 py-3">
                        <input 
                          type="number" 
                          min="1"
                          value={item.quantity}
                          onChange={e => handleItemChange(item.id, 'quantity', e.target.value)}
                          className={tableInputClass + " text-right font-bold"}
                        />
                      </td>
                      <td className="px-4 py-3">
                         <input 
                          type="number" 
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={e => handleItemChange(item.id, 'unitPrice', e.target.value)}
                          onBlur={() => handleBlur(item.id, 'unitPrice')}
                          className={tableInputClass + " text-right"}
                        />
                      </td>
                      <td className="px-4 py-3">
                         <input 
                          type="number" 
                          min="0"
                          max="100"
                          value={item.discountRate}
                          onChange={e => handleItemChange(item.id, 'discountRate', e.target.value)}
                          className={tableInputClass + " text-right"}
                          placeholder="0"
                        />
                      </td>
                      <td className="px-4 py-3">
                         <select 
                          value={item.taxRate}
                          onChange={e => handleItemChange(item.id, 'taxRate', e.target.value)}
                          className={tableInputClass + " text-right"}
                         >
                           <option value="0">%0</option>
                           <option value="1">%1</option>
                           <option value="10">%10</option>
                           <option value="20">%20</option>
                         </select>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-white text-sm">
                        <div className="relative">
                          {/* Toplam Tutar artık düzenlenebilir input */}
                          <input 
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.total}
                            onChange={e => handleItemChange(item.id, 'total', e.target.value)}
                            onBlur={() => handleBlur(item.id, 'total')}
                            className="w-full text-right p-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-900 outline-none"
                          />
                          <span className="absolute left-2 top-2 text-slate-400 text-xs pointer-events-none">
                             {formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : '₺'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button 
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                    
                    {/* Expandable Description Area */}
                    {item.showDescription && (
                      <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                        <td colSpan={7} className="px-4 py-2 pl-6">
                           <div className="relative">
                             <div className="absolute top-3 left-0 w-0.5 h-full bg-brand-200 dark:bg-brand-800"></div>
                             <textarea
                               value={item.description || ''}
                               onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                               className="w-full p-2 ml-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-sm focus:ring-2 focus:ring-brand-500 outline-none text-slate-700 dark:text-slate-300"
                               rows={2}
                               placeholder="Bu satır için özel açıklama veya detay giriniz..."
                             />
                           </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                
                {(!formData.items || formData.items.length === 0) && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                      Henüz ürün eklenmedi. "Satır Ekle" butonunu kullanın.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <button 
            type="button"
            onClick={handleAddItem}
            className="self-start mb-6 text-brand-600 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-300 text-sm font-medium flex items-center"
          >
            <Plus size={16} className="mr-1" /> Satır Ekle
          </button>

          {/* Footer Totals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-200 dark:border-slate-700 pt-6">
             <div>
               <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Notlar</label>
               <textarea 
                 rows={3}
                 value={formData.notes}
                 onChange={e => setFormData({...formData, notes: e.target.value})}
                 className={inputClass}
                 placeholder="Fatura genel notu..."
               ></textarea>

                {/* Account Summary Card */}
                {selectedAccount && (
                  <div className="mt-4 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg p-4">
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center">
                      <Coins size={16} className="mr-2 text-brand-600 dark:text-brand-400" />
                      Cari Bakiye Özeti
                    </h4>
                    
                    {/* Only show relevant currency balances */}
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      
                      {/* 1. Show Foreign Balance IF invoice is in Foreign Currency */}
                      {(formData.currency === 'USD' || formData.currency === 'EUR') && (
                        <>
                          <div className="text-slate-600 dark:text-slate-400 font-medium">
                            {formData.currency} Bakiyesi:
                          </div>
                          <div className="text-right font-bold text-slate-900 dark:text-white">
                             {formData.currency === 'USD' ? '$' : '€'}
                             {(formData.currency === 'USD' 
                               ? (selectedAccount.balanceUSD || 0) 
                               : (selectedAccount.balanceEUR || 0)
                             ).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                             <span className="text-xs text-slate-500 dark:text-slate-500 ml-1">
                               { (formData.currency === 'USD' ? selectedAccount.balanceUSD || 0 : selectedAccount.balanceEUR || 0) >= 0 ? '(A)' : '(B)' }
                             </span>
                          </div>
                          <div className="col-span-2 h-px bg-slate-200 dark:bg-slate-600 my-1"></div>
                        </>
                      )}

                      {/* 2. Show TL Balance IF invoice is in TRY */}
                      {formData.currency === 'TRY' && (
                        <>
                          <div className="text-slate-600 dark:text-slate-400 font-medium">TL Bakiyesi:</div>
                          <div className="text-right font-bold text-slate-900 dark:text-white">
                             ₺{selectedAccount.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} 
                             <span className="text-xs text-slate-500 dark:text-slate-500 ml-1">{selectedAccount.balance >= 0 ? '(A)' : '(B)'}</span>
                          </div>
                          <div className="col-span-2 h-px bg-slate-200 dark:bg-slate-600 my-1"></div>
                        </>
                      )}
                      
                      {/* Summary Net Balance in Invoice Currency */}
                      <div className="text-slate-900 dark:text-white font-bold">Net Bakiye:</div>
                      <div className={`text-right font-bold`}>
                        {(() => {
                            let bal = 0;
                            if(formData.currency === 'TRY') bal = selectedAccount.balance;
                            else if(formData.currency === 'USD') bal = selectedAccount.balanceUSD || 0;
                            else if(formData.currency === 'EUR') bal = selectedAccount.balanceEUR || 0;
                            
                            const color = bal >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
                            const symbol = formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : '₺';
                            
                            return (
                              <span className={color}>
                                {bal >= 0 ? '+' : ''}{symbol}{Math.abs(bal).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                              </span>
                            );
                        })()}
                      </div>
                    </div>
                  </div>
                )}
             </div>
             <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6 space-y-3">
                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                  <span>Brüt Toplam</span>
                  <span>{formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : '₺'}{(formData.grossTotal || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                </div>
                 <div className="flex justify-between text-sm text-red-500 dark:text-red-400">
                  <span>Satır İskonto Toplamı</span>
                  <span>-{formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : '₺'}{(formData.lineDiscountTotal || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm font-medium text-slate-800 dark:text-slate-200 border-t border-slate-200 dark:border-slate-600 pt-2">
                  <span>Ara Toplam (Net)</span>
                  <span>{formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : '₺'}{(formData.subtotal || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                </div>
                
                {/* Global Discount Input */}
                <div className="flex justify-between items-center text-sm text-slate-600 dark:text-slate-300 py-1">
                  <span className="flex items-center">
                    Genel İskonto
                    <div className="ml-2 flex bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded overflow-hidden">
                      <button
                        type="button" 
                        onClick={() => setFormData({...formData, discountType: 'percentage'})}
                        className={`px-2 py-0.5 text-xs ${formData.discountType === 'percentage' ? 'bg-brand-500 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                      >
                        %
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, discountType: 'amount'})} 
                        className={`px-2 py-0.5 text-xs ${formData.discountType === 'amount' ? 'bg-brand-500 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                      >
                        {formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : '₺'}
                      </button>
                    </div>
                  </span>
                  <div className="flex items-center w-32">
                     <input 
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.discountValue}
                      onChange={e => setFormData({...formData, discountValue: parseFloat(e.target.value) || 0})}
                      className="w-full text-right p-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-sm focus:ring-1 focus:ring-brand-500 outline-none mr-2 text-slate-900 dark:text-white"
                     />
                     <span className="text-slate-500 dark:text-slate-500 w-20 text-right text-xs">
                       -{((formData.discountTotal || 0)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                     </span>
                  </div>
                </div>

                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                  <span>Toplam KDV</span>
                  <span>{formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : '₺'}{(formData.taxTotal || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-lg font-black text-slate-900 dark:text-white pt-3 border-t border-slate-200 dark:border-slate-600">
                  <span>Genel Toplam</span>
                  <span>{formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : '₺'}{(formData.total || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                </div>
             </div>
          </div>

          <div className="mt-8 flex justify-end gap-3 pb-6">
             <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="px-6 py-2 text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 font-bold transition-colors"
            >
              İptal
            </button>
            <button 
              type="submit" 
              className={`px-6 py-2 text-white rounded-lg shadow-lg font-bold transition-all hover:scale-105 ${formData.type === 'sales' ? 'bg-brand-600 hover:bg-brand-700 shadow-brand-600/30' : 'bg-red-600 hover:bg-red-700 shadow-red-600/30'}`}
            >
              Faturayı Kaydet
            </button>
          </div>

        </form>
      </Modal>

      {/* QUICK PRODUCT ADD MODAL - SMALL CENTERED */}
      <Modal 
        isOpen={isQuickAddOpen} 
        onClose={() => setIsQuickAddOpen(false)} 
        title="Hızlı Ürün/Hizmet Ekle"
        size="sm"
      >
        <form onSubmit={handleQuickAddSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ürün / Hizmet Adı</label>
            <input 
              type="text" 
              required
              value={quickProductForm.name}
              onChange={e => setQuickProductForm({...quickProductForm, name: e.target.value})}
              className={inputClass}
            />
          </div>
          
          <div>
             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tür Seçimi</label>
             <div className="flex gap-3">
               <div 
                 onClick={() => setQuickProductForm({...quickProductForm, type: 'product'})}
                 className={`flex-1 p-3 border rounded-lg cursor-pointer flex flex-col items-center justify-center transition-colors ${quickProductForm.type === 'product' ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-500 text-brand-700 dark:text-brand-300' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
               >
                 <Package size={20} className="mb-1" />
                 <span className="text-xs font-medium">Stoklu Ürün</span>
               </div>
               <div 
                 onClick={() => setQuickProductForm({...quickProductForm, type: 'service'})}
                 className={`flex-1 p-3 border rounded-lg cursor-pointer flex flex-col items-center justify-center transition-colors ${quickProductForm.type === 'service' ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-500 text-brand-700 dark:text-brand-300' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
               >
                 <Wrench size={20} className="mb-1" />
                 <span className="text-xs font-medium">Hizmet</span>
               </div>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
             <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Stok/Hizmet Kodu</label>
                <input 
                  type="text" 
                  value={quickProductForm.code}
                  onChange={e => setQuickProductForm({...quickProductForm, code: e.target.value})}
                  className={`${inputClass} font-mono text-xs`}
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Birim Fiyat</label>
                <input 
                  type="number" 
                  min="0"
                  step="0.01"
                  required
                  value={quickProductForm.price}
                  onChange={e => setQuickProductForm({...quickProductForm, price: e.target.value})}
                  className={inputClass}
                  placeholder="0.00"
                />
             </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">KDV Oranı (%)</label>
             <select 
               value={quickProductForm.taxRate}
               onChange={e => setQuickProductForm({...quickProductForm, taxRate: e.target.value})}
               className={inputClass}
             >
               <option value="0">%0</option>
               <option value="1">%1</option>
               <option value="10">%10</option>
               <option value="20">%20</option>
             </select>
          </div>

          <div className="pt-4 flex justify-end gap-2">
             <button 
              type="button" 
              onClick={() => setIsQuickAddOpen(false)}
              className="px-4 py-2 text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 text-sm font-medium transition-colors"
            >
              Vazgeç
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 text-white bg-brand-600 rounded-lg hover:bg-brand-700 shadow-sm text-sm font-bold flex items-center transition-colors"
            >
              <Save size={16} className="mr-1.5" />
              Kaydet ve Seç
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Invoices;
