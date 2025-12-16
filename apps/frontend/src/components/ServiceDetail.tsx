
import React, { useState, useEffect, useRef } from 'react';
import { ServiceTicket, Product, ServicePart, ServiceHistory, Account, CashRegister, Transaction, Employee } from '../types';
import { 
  Save, X, Printer, Trash2, Plus, Clock, Wrench, Smartphone, 
  FileText, Image as ImageIcon, History, CheckCircle, AlertTriangle,
  User, Calendar, DollarSign, Package, Lock, Key, Tag, ShieldCheck,
  Cpu, Activity, PenTool, Hash, Search, CreditCard, Banknote, Landmark, Bitcoin,
  ChevronDown, UserPlus, FileCheck, Loader2, ArrowRight
} from 'lucide-react';
import PatternLock from './PatternLock';
import ServiceReceipt from './ServiceReceipt';
import { api } from '../services/api';
import Modal from './Modal';

// Common Tech Brands for Autocomplete
const COMMON_BRANDS = [
  'Apple', 'Samsung', 'Xiaomi', 'Huawei', 'Oppo', 'Vivo', 
  'Lenovo', 'HP', 'Dell', 'Asus', 'Acer', 'MSI', 'Monster', 
  'Casper', 'Excalibur', 'Sony', 'LG', 'General Mobile', 'Reeder'
];

interface ServiceDetailProps {
  ticket: ServiceTicket;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedTicket: ServiceTicket) => void;
  onDelete: (id: string) => void;
}

const ServiceDetail: React.FC<ServiceDetailProps> = ({ ticket, isOpen, onClose, onSave, onDelete }) => {
  // Local state for the ticket being edited
  const [formData, setFormData] = useState<ServiceTicket>(ticket);
  const [activeTab, setActiveTab] = useState<'general' | 'parts' | 'media' | 'history'>('general');
  const [showReceipt, setShowReceipt] = useState(false);
  
  // Determine if this is a new record creation based on history length
  const isNewRecord = (formData.history || []).length === 0;

  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cashRegisters, setCashRegisters] = useState<CashRegister[]>([]);
  const [loadingDependencies, setLoadingDependencies] = useState(false);

  // Parts Management State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  
  // Tag Input State
  const [tagInput, setTagInput] = useState('');

  // Brand Management State
  const [brandList, setBrandList] = useState<string[]>(COMMON_BRANDS);
  const [isBrandOpen, setIsBrandOpen] = useState(false);
  const [brandSearch, setBrandSearch] = useState('');
  const brandDropdownRef = useRef<HTMLDivElement>(null);

  // Customer Search State
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const customerDropdownRef = useRef<HTMLDivElement>(null);

  // Device History State
  const [deviceHistory, setDeviceHistory] = useState<ServiceTicket[]>([]);

  // Payment & Closing State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    method: 'cash' as 'cash' | 'credit' | 'bank' | 'crypto',
    registerId: '',
    createInvoice: false
  });
  
  // Billing Info Form (if creating invoice for a user without details)
  const [billingForm, setBillingForm] = useState({
    taxNumber: '',
    taxOffice: '',
    address: ''
  });

  // Technicians (Filter from employees)
  const technicians = employees.filter(e => e.department === 'Teknik Servis' || e.department === 'Bilgi İşlem');

  // Filter products for parts modal
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
    p.code.toLowerCase().includes(productSearch.toLowerCase())
  );

  // Filter customers for dropdown
  const filteredCustomers = accounts.filter(a => 
    a.type === 'customer' && 
    (a.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) || 
     a.phone?.includes(customerSearchTerm))
  );

  // Filter brands
  const filteredBrands = brandList.filter(b => 
    b.toLowerCase().includes(brandSearch.toLowerCase())
  );

  // Sync state when ticket prop changes
  useEffect(() => {
    setFormData(ticket);
    setCustomerSearchTerm(ticket.customerName);
    setBrandSearch(ticket.brand || '');
    // Reset tab to general when opening a new ticket
    setActiveTab('general');
    if (ticket.serialNumber) {
        checkDeviceHistory(ticket.serialNumber);
    }
  }, [ticket, isOpen]);

  // Load Dependencies
  useEffect(() => {
      if (isOpen) {
          const loadData = async () => {
              setLoadingDependencies(true);
              try {
                  const [fetchedProducts, fetchedEmployees, fetchedAccounts, fetchedRegisters] = await Promise.all([
                      api.products.getAll(),
                      api.hr.getEmployees(),
                      api.accounts.getAll(),
                      api.finance.getCashRegisters()
                  ]);
                  setProducts(fetchedProducts);
                  setEmployees(fetchedEmployees);
                  setAccounts(fetchedAccounts);
                  setCashRegisters(fetchedRegisters);
              } catch (error) {
                  console.error("Failed to load service detail dependencies", error);
              } finally {
                  setLoadingDependencies(false);
              }
          };
          loadData();
      }
  }, [isOpen]);

  // Handle outside clicks
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target as Node)) {
        setIsCustomerDropdownOpen(false);
      }
      if (brandDropdownRef.current && !brandDropdownRef.current.contains(event.target as Node)) {
        setIsBrandOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Calculate totals dynamically
  const partsTotal = formData.parts?.reduce((sum, part) => sum + part.total, 0) || 0;
  const laborCost = formData.laborCost || 0;
  const finalTotal = partsTotal + laborCost;

  // --- Handlers ---

  const handleChange = (field: keyof ServiceTicket, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Brand Handlers
  const handleBrandSelect = (brand: string) => {
    setFormData(prev => ({ ...prev, brand: brand }));
    setBrandSearch(brand);
    setIsBrandOpen(false);
  };

  const handleBrandAdd = () => {
    if (brandSearch && !brandList.includes(brandSearch)) {
      setBrandList(prev => [...prev, brandSearch]);
      handleBrandSelect(brandSearch);
    }
  };

  // Device History Lookup
  const checkDeviceHistory = async (serial: string) => {
    if (!serial || serial.length < 3) {
      setDeviceHistory([]);
      return;
    }
    try {
        const allTickets = await api.services.getAll();
        const history = allTickets.filter(t => 
            t.serialNumber === serial && t.id !== formData.id
        );
        setDeviceHistory(history);
    } catch (error) {
        console.error("Failed to fetch device history", error);
    }
  };

  const handleSerialBlur = () => {
    if (formData.serialNumber) {
      checkDeviceHistory(formData.serialNumber);
    }
  };

  // Customer Selection
  const handleCustomerSelect = (customer: Account) => {
    setFormData(prev => ({
      ...prev,
      customerId: customer.id,
      customerName: customer.name,
      phone: customer.phone || customer.mobile || ''
    }));
    setCustomerSearchTerm(customer.name);
    setIsCustomerDropdownOpen(false);
  };

  const handleCreateNewCustomer = async () => {
    const newCustomer: Account = {
      id: `ACC-NEW-${Date.now()}`,
      tenantId: formData.tenantId,
      accountCode: `M-${Date.now().toString().slice(-4)}`,
      type: 'customer',
      category: 'individual',
      name: customerSearchTerm,
      authorizedPerson: customerSearchTerm,
      balance: 0,
      status: 'active'
    };
    try {
        const created = await api.accounts.create(newCustomer);
        setAccounts(prev => [...prev, created]);
        handleCustomerSelect(created);
    } catch(e) {
        alert("Müşteri oluşturulamadı.");
    }
  };

  const handleStatusChange = (newStatus: ServiceTicket['status']) => {
    const historyItem: ServiceHistory = {
      date: new Date().toISOString(),
      action: `Durum değişti: ${getStatusLabel(formData.status)} -> ${getStatusLabel(newStatus)}`,
      user: 'Sistem'
    };
    
    setFormData(prev => ({ 
      ...prev, 
      status: newStatus,
      history: [historyItem, ...(prev.history || [])]
    }));
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'pending': return 'Bekliyor';
      case 'in_progress': return 'İşlemde';
      case 'completed': return 'Tamamlandı';
      case 'delivered': return 'Teslim Edildi';
      case 'cancelled': return 'İptal';
      default: return status;
    }
  };

  // Part Handlers
  const handleAddPart = (product: Product) => {
    const newPart: ServicePart = {
      id: `PART-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unitPrice: product.price,
      total: product.price,
      isStockDeducted: true,
      serialNumber: ''
    };

    setFormData(prev => ({
      ...prev,
      parts: [...(prev.parts || []), newPart],
      finalCost: (prev.finalCost || 0) + newPart.total
    }));
    
    const historyItem: ServiceHistory = {
      date: new Date().toISOString(),
      action: `Parça eklendi: ${product.name}`,
      user: 'Sistem'
    };
    setFormData(prev => ({ ...prev, history: [historyItem, ...(prev.history || [])] }));

    setIsProductModalOpen(false);
  };

  const handleRemovePart = (partId: string) => {
    setFormData(prev => {
      const part = prev.parts?.find(p => p.id === partId);
      const deduct = part ? part.total : 0;
      return {
        ...prev,
        parts: prev.parts?.filter(p => p.id !== partId),
        finalCost: (prev.finalCost || 0) - deduct
      };
    });
  };

  const handlePartSerialChange = (partId: string, serial: string) => {
    setFormData(prev => ({
      ...prev,
      parts: prev.parts?.map(p => p.id === partId ? { ...p, serialNumber: serial } : p)
    }));
  };

  const handlePatternSave = (pattern: string) => {
    setFormData(prev => ({ ...prev, patternLock: pattern }));
  };

  const handleSave = () => {
    // If new record, add creation history
    if (isNewRecord) {
        const creationHistory: ServiceHistory = {
            date: new Date().toISOString(),
            action: 'Servis kaydı oluşturuldu.',
            user: 'Kullanıcı' // Ideally fetched from Auth context
        };
        const ticketToSave = {
            ...formData,
            history: [creationHistory],
            finalCost: finalTotal
        };
        onSave(ticketToSave);
    } else {
        onSave({ ...formData, finalCost: finalTotal });
    }
    onClose();
  };

  // --- Payment & Closing Logic ---

  const handleOpenPaymentModal = () => {
    // Default register based on currency if possible
    const defaultRegister = cashRegisters.find(r => r.currency === 'TRY')?.id || '';
    
    setPaymentForm({
      amount: finalTotal,
      method: 'cash',
      registerId: defaultRegister,
      createInvoice: false
    });
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSubmit = () => {
    if (!paymentForm.registerId) {
      alert("Lütfen bir kasa/hesap seçiniz.");
      return;
    }

    if (paymentForm.createInvoice) {
      // Check if customer has billing info
      const customer = accounts.find(a => a.id === formData.customerId);
      if (!customer || (!customer.taxNumber && !customer.address)) {
        // Missing info, open billing modal
        setBillingForm({
          taxNumber: customer?.taxNumber || '',
          taxOffice: customer?.taxOffice || '',
          address: customer?.address || ''
        });
        setIsBillingModalOpen(true);
        return; // Pause here
      }
    }

    finalizeServiceAndPayment();
  };

  const handleBillingSubmit = async () => {
    // Update customer via API
    const customer = accounts.find(a => a.id === formData.customerId);
    if (customer) {
      const updatedCustomer = {
          ...customer,
          taxNumber: billingForm.taxNumber,
          taxOffice: billingForm.taxOffice,
          address: billingForm.address
      };
      await api.accounts.update(updatedCustomer);
      setAccounts(prev => prev.map(a => a.id === customer.id ? updatedCustomer : a));
    }
    
    setIsBillingModalOpen(false);
    finalizeServiceAndPayment();
  };

  const finalizeServiceAndPayment = async () => {
    // 1. Create Transaction via API
    const newTx: Transaction = {
      id: `TRX-SRV-${Date.now()}`,
      tenantId: formData.tenantId,
      date: new Date().toISOString(),
      description: `Servis Tahsilatı: ${formData.id}`,
      amount: paymentForm.amount,
      type: 'income',
      status: 'completed',
      category: 'Servis',
      registerId: paymentForm.registerId,
      accountId: formData.customerId
    };
    
    await api.finance.createTransaction(newTx);

    // 2. Update Ticket Status
    const updatedTicket = { 
      ...formData, 
      finalCost: finalTotal,
      status: 'completed' as 'completed', // Explicit cast
      history: [
        { date: new Date().toISOString(), action: 'Ödeme alındı ve servis kapatıldı.', user: 'Kasiyer' },
        ...(formData.history || [])
      ]
    };

    onSave(updatedTicket);
    setIsPaymentModalOpen(false);
    
    // 3. Print / Invoice
    if (paymentForm.createInvoice) {
      alert("Fatura oluşturuldu ve yazıcıya gönderiliyor...");
      // Simulate invoice creation logic here via api.finance.createInvoice if needed
    }
    
    setShowReceipt(true); // Always show receipt at end
  };

  if (showReceipt) {
    return <ServiceReceipt ticket={formData} onClose={() => { setShowReceipt(false); onClose(); }} />;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isNewRecord ? "Yeni Servis Talebi Oluştur" : `Servis Fişi: ${formData.id}`} size="full">
      <div className="flex flex-col h-full bg-enterprise-50 dark:bg-enterprise-900 transition-colors">
        
        {/* Header Toolbar */}
        <div className="bg-white dark:bg-enterprise-800 border-b border-slate-200 dark:border-slate-700/50 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 shadow-sm z-20">
          <div className="flex items-center gap-4">
             <div className={`p-3 rounded-xl shadow-sm ${formData.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                <Wrench size={24} />
             </div>
             <div>
               <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                 {isNewRecord ? 'Servis Kabul Formu' : formData.device}
                 {formData.brand && (
                   <span className="text-sm font-normal text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                     {formData.brand}
                   </span>
                 )}
               </h1>
               <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mt-1">
                 <User size={14} /> {formData.customerName || 'Müşteri Seçilmedi'}
                 <span className="text-slate-300 dark:text-slate-600">|</span>
                 <Smartphone size={14} /> {formData.phone || '-'}
               </div>
             </div>
          </div>

          <div className="flex gap-2">
             {!isNewRecord && (
               <button onClick={() => setShowReceipt(true)} className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg flex items-center gap-2 transition-colors">
                 <Printer size={18} />
                 <span className="hidden sm:inline">Fiş Yazdır</span>
               </button>
             )}
             
             {!isNewRecord && (
                 <button 
                   onClick={() => onDelete(formData.id)} 
                   className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-2 transition-colors"
                 >
                   <Trash2 size={18} />
                   <span className="hidden sm:inline">Sil</span>
                 </button>
             )}
             
             <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>
             
             {/* Payment Button - Only for existing tickets */}
             {!isNewRecord && (
                 <button 
                   onClick={handleOpenPaymentModal}
                   className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-green-600/30 transition-all hover:scale-105"
                 >
                   <CheckCircle size={18} />
                   Tahsilat & Kapat
                 </button>
             )}

             <button 
               onClick={handleSave} 
               className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-brand-600/30 transition-all hover:scale-105"
             >
               <Save size={18} />
               {isNewRecord ? 'Kaydı Oluştur' : 'Kaydet'}
             </button>
          </div>
        </div>

        {/* Status Bar */}
        <div className="bg-white dark:bg-enterprise-800 border-b border-slate-200 dark:border-slate-700/50 px-6 py-3 flex items-center gap-2 overflow-x-auto shadow-sm">
           {['pending', 'in_progress', 'completed', 'delivered', 'cancelled'].map((step) => {
             const labels: Record<string, string> = {
               pending: 'Bekliyor', in_progress: 'İşlemde', completed: 'Tamamlandı', delivered: 'Teslim Edildi', cancelled: 'İptal'
             };
             const active = formData.status === step;
             return (
               <button
                 key={step}
                 onClick={() => handleStatusChange(step as any)}
                 disabled={isNewRecord && step !== 'pending'} // Lock status when creating new
                 className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2 ${
                   active
                     ? 'bg-brand-600 text-white shadow-md ring-2 ring-brand-200 dark:ring-brand-800' 
                     : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                 } ${isNewRecord && step !== 'pending' ? 'opacity-50 cursor-not-allowed' : ''}`}
               >
                 {active && <CheckCircle size={14} />}
                 {labels[step]}
               </button>
             );
           })}
        </div>

        {/* Main Content Layout */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
           
           {loadingDependencies && (
               <div className="absolute inset-0 z-50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm flex items-center justify-center">
                   <Loader2 size={40} className="animate-spin text-brand-600" />
               </div>
           )}

           {/* Sidebar Tabs */}
           <div className="w-full lg:w-64 bg-white dark:bg-enterprise-800 border-r border-slate-200 dark:border-slate-700/50 flex lg:flex-col overflow-x-auto lg:overflow-visible shrink-0 z-10">
              <button onClick={() => setActiveTab('general')} className={`flex items-center gap-3 p-4 text-sm font-medium border-b lg:border-b-0 lg:border-l-4 transition-all whitespace-nowrap ${activeTab === 'general' ? 'bg-brand-50 dark:bg-brand-900/10 text-brand-700 dark:text-brand-400 border-brand-600' : 'text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                <FileText size={18} /> Genel Bilgiler
              </button>
              
              {!isNewRecord && (
                <>
                  <button onClick={() => setActiveTab('parts')} className={`flex items-center gap-3 p-4 text-sm font-medium border-b lg:border-b-0 lg:border-l-4 transition-all whitespace-nowrap ${activeTab === 'parts' ? 'bg-brand-50 dark:bg-brand-900/10 text-brand-700 dark:text-brand-400 border-brand-600' : 'text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                    <Package size={18} /> Parçalar & İşçilik
                  </button>
                  <button onClick={() => setActiveTab('media')} className={`flex items-center gap-3 p-4 text-sm font-medium border-b lg:border-b-0 lg:border-l-4 transition-all whitespace-nowrap ${activeTab === 'media' ? 'bg-brand-50 dark:bg-brand-900/10 text-brand-700 dark:text-brand-400 border-brand-600' : 'text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                    <ImageIcon size={18} /> Fotoğraf & Desen
                  </button>
                  <button onClick={() => setActiveTab('history')} className={`flex items-center gap-3 p-4 text-sm font-medium border-b lg:border-b-0 lg:border-l-4 transition-all whitespace-nowrap ${activeTab === 'history' ? 'bg-brand-50 dark:bg-brand-900/10 text-brand-700 dark:text-brand-400 border-brand-600' : 'text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                    <History size={18} /> İşlem Geçmişi
                  </button>
                </>
              )}
           </div>

           {/* Tab Content */}
           <div className="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar">
              
              {/* --- GENERAL TAB --- */}
              {activeTab === 'general' && (
                <div className="grid grid-cols-1 gap-8 max-w-5xl">
                   
                   {/* Top Row: Customer & Device Identity (Crucial Info) */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Customer Info */}
                      <div className="bg-white dark:bg-enterprise-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm relative">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider flex items-center">
                          <User size={16} className="mr-2 text-brand-600" /> Müşteri Bilgileri
                        </h3>
                        <div className="space-y-4" ref={customerDropdownRef}>
                          <div className="relative">
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Müşteri Arama / Seçim</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input 
                                        type="text" 
                                        value={customerSearchTerm} 
                                        onChange={(e) => {
                                            setCustomerSearchTerm(e.target.value);
                                            setIsCustomerDropdownOpen(true);
                                        }}
                                        onFocus={() => setIsCustomerDropdownOpen(true)}
                                        className="w-full pl-9 p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all" 
                                        placeholder="İsim veya telefon ile ara..." 
                                    />
                                    <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                                </div>
                                <button 
                                    onClick={handleCreateNewCustomer}
                                    className="bg-brand-100 hover:bg-brand-200 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 p-2.5 rounded-lg transition-colors"
                                    title="Yeni Hızlı Cari"
                                >
                                    <UserPlus size={20} />
                                </button>
                            </div>

                            {/* Dropdown */}
                            {isCustomerDropdownOpen && customerSearchTerm && (
                                <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                                    {filteredCustomers.length > 0 ? (
                                        filteredCustomers.map(acc => (
                                            <div 
                                                key={acc.id}
                                                onClick={() => handleCustomerSelect(acc)}
                                                className="px-4 py-3 hover:bg-brand-50 dark:hover:bg-brand-900/20 cursor-pointer border-b border-slate-100 dark:border-slate-700 last:border-0"
                                            >
                                                <div className="font-bold text-sm text-slate-800 dark:text-white">{acc.name}</div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400 flex justify-between">
                                                    <span>{acc.phone || acc.mobile || 'Tel Yok'}</span>
                                                    <span>{acc.accountCode}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-3 text-sm text-slate-500 text-center">Sonuç bulunamadı</div>
                                    )}
                                </div>
                            )}
                          </div>
                          
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">İletişim Telefonu</label>
                            <input 
                                type="text" 
                                value={formData.phone} 
                                onChange={e => handleChange('phone', e.target.value)} 
                                className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all" 
                            />
                          </div>
                        </div>
                      </div>

                      {/* Device Identification */}
                      <div className="bg-white dark:bg-enterprise-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider flex items-center">
                          <Smartphone size={16} className="mr-2 text-brand-600" /> Cihaz Kimliği
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2">
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Seri No / IMEI <span className="text-red-500">*</span></label>
                            <div className="relative">
                              <Hash size={16} className="absolute left-3 top-3 text-slate-400" />
                              <input 
                                type="text" 
                                value={formData.serialNumber} 
                                onChange={e => handleChange('serialNumber', e.target.value)} 
                                onBlur={handleSerialBlur}
                                className="w-full pl-10 p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-brand-500 outline-none transition-all" 
                                placeholder="SN12345678" 
                              />
                            </div>
                            {deviceHistory.length > 0 && (
                                <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs text-yellow-800 dark:text-yellow-200 flex items-center">
                                    <History size={14} className="mr-2" />
                                    <span>Bu cihaz daha önce {deviceHistory.length} kez servise gelmiş.</span>
                                </div>
                            )}
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Marka</label>
                            <div className="relative" ref={brandDropdownRef}>
                              <input 
                                type="text" 
                                value={brandSearch} 
                                onChange={(e) => {
                                  setBrandSearch(e.target.value);
                                  setIsBrandOpen(true);
                                  handleChange('brand', e.target.value);
                                }}
                                onFocus={() => setIsBrandOpen(true)}
                                className="w-full p-2.5 pr-8 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all" 
                                placeholder="Seçiniz..."
                              />
                              <ChevronDown size={14} className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" />
                              
                              {isBrandOpen && (
                                <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 max-h-40 overflow-y-auto">
                                  {filteredBrands.length > 0 ? (
                                    filteredBrands.map(brand => (
                                      <div 
                                        key={brand}
                                        onClick={() => handleBrandSelect(brand)}
                                        className="px-3 py-2 hover:bg-brand-50 dark:hover:bg-brand-900/20 cursor-pointer text-sm text-slate-700 dark:text-slate-200"
                                      >
                                        {brand}
                                      </div>
                                    ))
                                  ) : (
                                    <div 
                                      onClick={handleBrandAdd}
                                      className="px-3 py-2 hover:bg-brand-50 dark:hover:bg-brand-900/20 cursor-pointer text-sm text-brand-600 dark:text-brand-400 font-medium flex items-center"
                                    >
                                      <Plus size={14} className="mr-1" />
                                      "{brandSearch}" Ekle
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Model</label>
                            <input type="text" value={formData.device} onChange={e => handleChange('device', e.target.value)} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all" placeholder="Örn: iPhone 13" />
                          </div>
                        </div>
                      </div>
                   </div>

                   {/* Middle Row: Issue & Details */}
                   <div className="bg-white dark:bg-enterprise-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider flex items-center">
                          <Activity size={16} className="mr-2 text-brand-600" /> Arıza & Teslimat Durumu
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Müşteri Şikayeti / Arıza Tanımı</label>
                            <textarea 
                                rows={3} 
                                value={formData.issue} 
                                onChange={e => handleChange('issue', e.target.value)} 
                                className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none resize-none transition-all" 
                                placeholder="Cihazın sorunu nedir?"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Beraberinde Alınan Aksesuarlar</label>
                            <textarea 
                                rows={2} 
                                value={formData.accessories} 
                                onChange={e => handleChange('accessories', e.target.value)} 
                                className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none resize-none transition-all" 
                                placeholder="Örn: Şarj aleti, Kılıf, Sim kart tepsisi..." 
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <div>
                               <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Öncelik</label>
                               <select value={formData.priority} onChange={e => handleChange('priority', e.target.value)} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all">
                                 <option value="low">Düşük</option>
                                 <option value="medium">Orta</option>
                                 <option value="high">Yüksek</option>
                               </select>
                             </div>
                             <div>
                               <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Teknik Personel</label>
                               <select 
                                 value={formData.technician} 
                                 onChange={e => handleChange('technician', e.target.value)} 
                                 className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                               >
                                 <option value="">Seçiniz...</option>
                                 {technicians.map(t => (
                                   <option key={t.id} value={t.name}>{t.name}</option>
                                 ))}
                                 <option value="Diğer">Diğer</option>
                               </select>
                             </div>
                             <div>
                               <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Verilen Garanti (Ay)</label>
                               <input type="number" min="0" value={formData.warrantyDuration || 0} onChange={e => handleChange('warrantyDuration', parseInt(e.target.value))} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all" />
                             </div>
                          </div>
                        </div>
                   </div>
                </div>
              )}

              {/* --- PARTS TAB --- */}
              {activeTab === 'parts' && (
                <div className="space-y-6 max-w-6xl">
                   <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
                     <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Kullanılan Yedek Parçalar</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Servis sürecinde kullanılan parçalar stoktan düşülür.</p>
                     </div>
                     <button onClick={() => setIsProductModalOpen(true)} className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-transform hover:scale-105">
                       <Plus size={16} /> Parça Ekle
                     </button>
                   </div>

                   <div className="bg-white dark:bg-enterprise-800 rounded-lg border border-slate-200 dark:border-slate-700/50 overflow-hidden shadow-sm">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold tracking-wider">
                          <tr>
                            <th className="px-6 py-4">Parça Adı</th>
                            <th className="px-6 py-4">Seri / Lot No</th>
                            <th className="px-6 py-4">Miktar</th>
                            <th className="px-6 py-4 text-right">Birim Fiyat</th>
                            <th className="px-6 py-4 text-right">Toplam</th>
                            <th className="px-6 py-4 w-10"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                          {formData.parts?.map(part => (
                            <tr key={part.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                              <td className="px-6 py-4">
                                <div className="text-sm font-medium text-slate-900 dark:text-white">{part.productName}</div>
                                <div className="text-xs text-slate-500">{part.productId}</div>
                              </td>
                              <td className="px-6 py-4">
                                <input 
                                  type="text" 
                                  value={part.serialNumber || ''} 
                                  onChange={(e) => handlePartSerialChange(part.id, e.target.value)}
                                  placeholder="Seri No Giriniz" 
                                  className="text-xs border border-slate-300 dark:border-slate-600 rounded px-2 py-1 w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-1 focus:ring-brand-500 outline-none font-mono"
                                />
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 font-bold">{part.quantity}</td>
                              <td className="px-6 py-4 text-sm text-right text-slate-600 dark:text-slate-300">₺{part.unitPrice.toLocaleString()}</td>
                              <td className="px-6 py-4 text-sm text-right font-bold text-slate-900 dark:text-white">₺{part.total.toLocaleString()}</td>
                              <td className="px-6 py-4 text-center">
                                <button onClick={() => handleRemovePart(part.id)} className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 size={16} /></button>
                              </td>
                            </tr>
                          ))}
                          {(!formData.parts || formData.parts.length === 0) && (
                            <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center"><Cpu size={32} className="mb-2 opacity-50"/>Henüz parça eklenmedi.</td></tr>
                          )}
                        </tbody>
                      </table>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 pt-6 border-t border-slate-200 dark:border-slate-700/50">
                      <div className="bg-white dark:bg-enterprise-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700/50">
                        <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center">
                          <PenTool size={16} className="mr-2 text-brand-600" /> İşçilik Ücreti (₺)
                        </label>
                        <input 
                          type="number" 
                          min="0"
                          value={formData.laborCost} 
                          onChange={e => handleChange('laborCost', parseFloat(e.target.value) || 0)} 
                          className="w-full p-3 text-lg font-bold border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-brand-500 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none"
                        />
                        <p className="text-xs text-slate-500 mt-2">Yapılan teknik servis hizmet bedeli.</p>
                      </div>
                      
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
                         <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 border-b pb-2 dark:border-slate-700">Maliyet Özeti</h4>
                         <div className="flex justify-between mb-2 text-sm text-slate-600 dark:text-slate-300">
                           <span>Parça Toplamı</span>
                           <span>₺{partsTotal.toLocaleString()}</span>
                         </div>
                         <div className="flex justify-between mb-3 text-sm text-slate-600 dark:text-slate-300">
                           <span>İşçilik</span>
                           <span>₺{laborCost.toLocaleString()}</span>
                         </div>
                         <div className="flex justify-between pt-3 border-t border-slate-200 dark:border-slate-600 text-2xl font-bold text-brand-600 dark:text-brand-400">
                           <span>TOPLAM</span>
                           <span>₺{finalTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                         </div>
                      </div>
                   </div>
                </div>
              )}

              {/* --- MEDIA & SECURITY TAB --- */}
              {activeTab === 'media' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl">
                   {/* Pattern Lock Section */}
                   <div className="bg-white dark:bg-enterprise-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                        <Lock size={18} className="mr-2 text-brand-600" /> Ekran Kilidi / Desen
                      </h3>
                      <div className="flex flex-col md:flex-row gap-8 items-center">
                         <div className="bg-slate-100 dark:bg-slate-900 p-6 rounded-2xl shadow-inner">
                           <PatternLock 
                             initialPattern={formData.patternLock} 
                             onPatternComplete={handlePatternSave} 
                           />
                         </div>
                         <div className="flex-1 space-y-6 w-full">
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">PIN / Şifre (Alternatif)</label>
                              <div className="relative">
                                <Key size={18} className="absolute left-3 top-3 text-slate-400" />
                                <input 
                                  type="text" 
                                  value={formData.devicePassword} 
                                  onChange={e => handleChange('devicePassword', e.target.value)} 
                                  className="w-full pl-10 p-3 border rounded-lg bg-slate-50 dark:bg-slate-900 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xl tracking-widest focus:ring-2 focus:ring-brand-500 outline-none" 
                                  placeholder="123456"
                                />
                              </div>
                            </div>
                            <div className="text-xs text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-100 dark:border-orange-800 flex gap-2">
                              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                              <p>Desen kilidini soldaki alana çizerek kaydedebilirsiniz. Teknisyenler bu deseni referans alacaktır.</p>
                            </div>
                         </div>
                      </div>
                   </div>

                   {/* Gallery Section */}
                   <div className="bg-white dark:bg-enterprise-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                        <ImageIcon size={18} className="mr-2 text-brand-600" /> Cihaz Fotoğrafları
                      </h3>
                      <div className="grid grid-cols-3 gap-4">
                         {/* Existing Images Mock */}
                         {[1,2].map(i => (
                           <div key={i} className="aspect-square bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center relative group overflow-hidden border border-slate-200 dark:border-slate-600">
                             <ImageIcon size={32} className="text-slate-300 dark:text-slate-500" />
                             <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm">
                               <span className="text-white text-xs font-bold border border-white px-3 py-1 rounded-full">Görüntüle</span>
                             </div>
                           </div>
                         ))}
                         {/* Upload Button */}
                         <div className="aspect-square border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:text-brand-600 hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/10 cursor-pointer transition-all">
                           <Plus size={32} className="mb-2" />
                           <span className="text-xs font-medium">Yükle</span>
                         </div>
                      </div>
                      <p className="text-xs text-slate-400 mt-4 text-center">Cihazın teslim alındığı andaki fiziksel durumunu belgelemek için fotoğraf ekleyiniz.</p>
                   </div>
                </div>
              )}

              {/* --- HISTORY TAB --- */}
              {activeTab === 'history' && (
                <div className="max-w-3xl mx-auto">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-8 flex items-center">
                    <History className="mr-2 text-brand-600" />
                    İşlem Tarihçesi ve Loglar
                  </h3>
                  
                  <div className="relative pl-4 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
                    {[
                      ...(formData.history || []),
                      { date: formData.entryDate, action: 'Servis kaydı oluşturuldu', user: 'Kasiyer' }
                    ].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((log, idx) => (
                      <div key={idx} className="relative pl-8 group">
                        <div className="absolute -left-[5px] top-1.5 w-3 h-3 bg-white dark:bg-slate-900 border-2 border-brand-500 rounded-full group-hover:scale-125 transition-transform z-10"></div>
                        <div className="bg-white dark:bg-enterprise-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">{log.action}</span>
                            <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center bg-slate-50 dark:bg-slate-700 px-2 py-1 rounded-full">
                              <Clock size={10} className="mr-1" />
                              {new Date(log.date).toLocaleString('tr-TR')}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                            <User size={12} />
                            İşlemi Yapan: <span className="font-medium text-slate-700 dark:text-slate-300">{log.user}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

           </div>
        </div>
      </div>

      {/* Internal Modal for Product Selection */}
      <Modal 
        isOpen={isProductModalOpen} 
        onClose={() => setIsProductModalOpen(false)} 
        title="Parça Ekle" 
        size="lg"
        level={2}
      >
        <div className="p-2">
          <div className="relative mb-4">
            <input 
              type="text" 
              placeholder="Parça adı veya kodu ara..." 
              className="w-full pl-10 p-3 border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all"
              value={productSearch}
              onChange={e => setProductSearch(e.target.value)}
              autoFocus
            />
            <Search size={18} className="absolute left-3 top-3.5 text-slate-400" />
          </div>
          
          <div className="max-h-80 overflow-y-auto space-y-2 custom-scrollbar">
            {filteredProducts.map(product => (
              <div 
                key={product.id} 
                onClick={() => handleAddPart(product)}
                className="flex justify-between items-center p-3 border border-slate-100 dark:border-slate-700 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/20 cursor-pointer transition-colors group"
              >
                <div>
                  <div className="font-bold text-slate-900 dark:text-white group-hover:text-brand-600">{product.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex gap-2 mt-0.5">
                    <span className="bg-slate-100 dark:bg-slate-700 px-1.5 rounded font-mono">{product.code}</span>
                    <span>Stok: {product.stock}</span>
                  </div>
                </div>
                <div className="font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 px-3 py-1 rounded-lg">
                  ₺{product.price.toLocaleString()}
                </div>
              </div>
            ))}
            {filteredProducts.length === 0 && (
              <div className="text-center py-8 text-slate-400">Sonuç bulunamadı.</div>
            )}
          </div>
        </div>
      </Modal>

      {/* Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Ödeme ve Kapanış"
        size="lg"
        level={2}
      >
        <div className="space-y-6">
            <div className="text-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-500 dark:text-slate-400">Toplam Tahsilat Tutarı</p>
                <div className="text-3xl font-bold text-brand-600 dark:text-brand-400">₺{finalTotal.toLocaleString('tr-TR', {minimumFractionDigits: 2})}</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {[
                    { id: 'cash', label: 'Nakit', icon: Banknote },
                    { id: 'credit', label: 'Kredi Kartı', icon: CreditCard },
                    { id: 'bank', label: 'Havale / EFT', icon: Landmark },
                    { id: 'crypto', label: 'Coin / Kripto', icon: Bitcoin }
                ].map(method => (
                    <button
                        key={method.id}
                        onClick={() => setPaymentForm({...paymentForm, method: method.id as any})}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                            paymentForm.method === method.id 
                            ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300' 
                            : 'border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-slate-600'
                        }`}
                    >
                        <method.icon size={24} className="mb-2" />
                        <span className="font-bold">{method.label}</span>
                    </button>
                ))}
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Ödemenin İşleneceği Kasa / Hesap</label>
                <select 
                    value={paymentForm.registerId}
                    onChange={e => setPaymentForm({...paymentForm, registerId: e.target.value})}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                >
                    <option value="">Seçiniz...</option>
                    {cashRegisters.map(reg => (
                        <option key={reg.id} value={reg.id}>{reg.name} ({reg.currency})</option>
                    ))}
                </select>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <input 
                    type="checkbox" 
                    id="createInvoice"
                    checked={paymentForm.createInvoice}
                    onChange={e => setPaymentForm({...paymentForm, createInvoice: e.target.checked})}
                    className="w-5 h-5 text-brand-600 focus:ring-brand-500 border-slate-300 rounded"
                />
                <label htmlFor="createInvoice" className="flex-1 cursor-pointer">
                    <span className="block font-bold text-slate-900 dark:text-white">Fatura Oluştur</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">İşlem tamamlandığında resmi fatura kaydı oluşturulur.</span>
                </label>
                <FileCheck size={20} className={paymentForm.createInvoice ? 'text-brand-600' : 'text-slate-400'} />
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-700">
                <button 
                    onClick={() => setIsPaymentModalOpen(false)}
                    className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                    İptal
                </button>
                <button 
                    onClick={handlePaymentSubmit}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold shadow-lg transition-colors"
                >
                    Ödemeyi Onayla & Kapat
                </button>
            </div>
        </div>
      </Modal>

      {/* Billing Info Modal (Level 3) */}
      <Modal
        isOpen={isBillingModalOpen}
        onClose={() => setIsBillingModalOpen(false)}
        title="Fatura Bilgileri Eksik"
        size="md"
        level={3}
      >
        <div className="space-y-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 p-3 rounded-lg text-sm flex items-center border border-yellow-200 dark:border-yellow-800">
                <AlertTriangle size={16} className="mr-2" />
                Fatura kesebilmek için müşteri vergi bilgilerini giriniz.
            </div>
            
            <div>
                <label className="block text-xs font-semibold uppercase mb-1">Vergi Dairesi</label>
                <input 
                    type="text" 
                    value={billingForm.taxOffice} 
                    onChange={e => setBillingForm({...billingForm, taxOffice: e.target.value})} 
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
            </div>
            <div>
                <label className="block text-xs font-semibold uppercase mb-1">VKN / TCKN</label>
                <input 
                    type="text" 
                    value={billingForm.taxNumber} 
                    onChange={e => setBillingForm({...billingForm, taxNumber: e.target.value})} 
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
            </div>
            <div>
                <label className="block text-xs font-semibold uppercase mb-1">Fatura Adresi</label>
                <textarea 
                    rows={3}
                    value={billingForm.address} 
                    onChange={e => setBillingForm({...billingForm, address: e.target.value})} 
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white resize-none"
                />
            </div>

            <div className="pt-2 flex justify-end">
                <button 
                    onClick={handleBillingSubmit}
                    className="bg-brand-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-brand-700 transition-colors"
                >
                    Bilgileri Kaydet ve Devam Et
                </button>
            </div>
        </div>
      </Modal>

    </Modal>
  );
};

export default ServiceDetail;
