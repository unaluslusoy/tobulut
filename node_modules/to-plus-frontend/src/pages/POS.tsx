
import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, ShoppingCart, Plus, Minus, Trash2, CreditCard, Banknote, 
  RotateCcw, Package, Grid, List, CheckCircle, Tag, User, PauseCircle, 
  PlayCircle, Landmark, Bitcoin, X, ChevronDown, Maximize2, Minimize2,
  ArrowLeft, LayoutDashboard, Percent, AlertTriangle, FileText, QrCode,
  Printer, ArrowRightLeft, ScanBarcode, LogOut, Lock, History, Coins, Users, Star,
  TrendingDown, Store, Clock, Key, ArrowRight, Loader2, Save, Ticket, AlignJustify
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Product, Account, Employee, POSSession, Transaction, Branch, CashRegister } from '../types';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import BrandLogo from '../components/BrandLogo';

interface CartItem extends Product {
  cartQty: number;
  type: 'sale' | 'return';
}

interface HeldOrder {
  id: string;
  items: CartItem[];
  customer: Account | null;
  date: Date;
  total: number;
}

// LocalStorage Key
const POS_STORAGE_KEY = 'toplus_pos_state_v1';

// MOCK EXCHANGE RATES (Normally from API)
const EXCHANGE_RATES = {
    USD: 34.50,
    EUR: 36.20,
    TRY: 1
};

const POS: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // --- Load State from LocalStorage ---
  const getSavedState = () => {
    try {
      const saved = localStorage.getItem(POS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error("POS State yüklenirken hata:", e);
      return {};
    }
  };

  const savedState = getSavedState();

  // Data loaded from API
  const [loadingData, setLoadingData] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [customers, setCustomers] = useState<Account[]>([]);
  const [cashRegisters, setCashRegisters] = useState<CashRegister[]>([]);
  
  // Initialize States with Saved Data if available
  const [cart, setCart] = useState<CartItem[]>(savedState.cart || []);
  
  // Date & Time State
  const [dateTime, setDateTime] = useState(new Date());

  // POS Session & Register State
  const [currentSession, setCurrentSession] = useState<POSSession | null>(savedState.currentSession || null);
  const [sessionTransactions, setSessionTransactions] = useState<Transaction[]>(savedState.sessionTransactions || []);
  const [activeCashier, setActiveCashier] = useState<Employee | null>(savedState.activeCashier || null);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(savedState.selectedBranch || null);
  
  // Entry Flow State
  const [entryStep, setEntryStep] = useState<'branch' | 'auth' | 'session' | 'active'>(
    savedState.currentSession ? 'active' : 'branch'
  );
  
  // Auth Form State
  const [authForm, setAuthForm] = useState({
    userId: '',
    password: ''
  });
  const [authError, setAuthError] = useState<string | null>(null);

  const [isCloseSessionModalOpen, setIsCloseSessionModalOpen] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    openingBalance: '0',
    closingBalance: '', // For closing
    note: ''
  });

  // Sales & Customer State
  const [selectedCustomer, setSelectedCustomer] = useState<Account | null>(savedState.selectedCustomer || null);
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>(savedState.heldOrders || []);
  const [discountType, setDiscountType] = useState<'amount' | 'percent'>('amount');
  const [discountValue, setDiscountValue] = useState<number | ''>(''); // Changed to support empty state
  const [searchTerm, setSearchTerm] = useState('');
  const [campaignCode, setCampaignCode] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showHeldOrdersModal, setShowHeldOrdersModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Return Mode State
  const [isReturnMode, setIsReturnMode] = useState(false);

  // Payment & Receipt State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit' | 'bank' | 'crypto'>('credit');
  const [targetRegisterId, setTargetRegisterId] = useState<string>(''); // Which register gets the money
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [selectedSalesperson, setSelectedSalesperson] = useState<string>(''); // Prim personeli
  const [salespersonCodeInput, setSalespersonCodeInput] = useState(''); // Quick selection by code
  
  const [completedTransaction, setCompletedTransaction] = useState<{
    id: string;
    total: number;
    subTotal: number;
    taxBreakdown: Record<number, number>;
    taxTotal: number;
    discountTotal: number;
    items: CartItem[];
    customer: Account | null;
    method: string;
    date: Date;
    isInvoice: boolean;
    salespersonName: string;
  } | null>(null);

  // Expense (Masraf) Modal State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    category: 'Genel Gider'
  });

  // Validation Highlight State
  const [highlightSalesperson, setHighlightSalesperson] = useState(false);

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];
  const customerDropdownRef = useRef<HTMLDivElement>(null);

  // --- INITIAL DATA FETCH ---
  useEffect(() => {
    const fetchAllData = async () => {
        setLoadingData(true);
        try {
            const [
                fetchedProducts, 
                fetchedEmployees, 
                fetchedBranches, 
                fetchedAccounts,
                fetchedRegisters
            ] = await Promise.all([
                api.products.getAll(),
                api.hr.getEmployees(),
                api.sales.getBranches(),
                api.accounts.getAll(),
                api.finance.getCashRegisters()
            ]);
            
            setProducts(fetchedProducts);
            setEmployees(fetchedEmployees);
            setBranches(fetchedBranches);
            
            const customerList = fetchedAccounts.filter(a => a.type === 'customer');
            setCustomers(customerList);
            setCashRegisters(fetchedRegisters);

            // FIX: Auto-select "Nihai Müşteri" if exists
            if (!selectedCustomer && !savedState.selectedCustomer) {
                const nihaiCustomer = customerList.find(c => c.name === 'Nihai Müşteri');
                
                if (nihaiCustomer) {
                    setSelectedCustomer(nihaiCustomer);
                } else {
                    // Create a virtual Nihai Customer for selection context if missing
                    const virtualNihai: Account = {
                        id: 'GUEST',
                        tenantId: user?.tenantId || 'tenant-1',
                        accountCode: 'GUEST',
                        type: 'customer',
                        category: 'individual',
                        name: 'Nihai Müşteri',
                        authorizedPerson: 'Misafir',
                        balance: 0,
                        status: 'active'
                    };
                    setSelectedCustomer(virtualNihai);
                }
            }

        } catch (error) {
            console.error("POS Data Fetch Failed", error);
            alert("Veriler yüklenirken hata oluştu. Lütfen sayfayı yenileyiniz.");
        } finally {
            setLoadingData(false);
        }
    };
    fetchAllData();
  }, []);

  // --- PERSISTENCE EFFECT ---
  useEffect(() => {
    if (currentSession) {
      const stateToSave = {
        currentSession,
        activeCashier,
        selectedBranch,
        cart,
        selectedCustomer,
        heldOrders,
        sessionTransactions
      };
      localStorage.setItem(POS_STORAGE_KEY, JSON.stringify(stateToSave));
    }
  }, [currentSession, activeCashier, selectedBranch, cart, selectedCustomer, heldOrders, sessionTransactions]);

  useEffect(() => {
    // Initial check: if no session in state (and none loaded), go to branch select
    if (!currentSession && entryStep === 'active') {
      setEntryStep('branch');
    }
  }, []);

  // Clock Timer
  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target as Node)) {
        setIsCustomerSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // FIX: Robust Fullscreen Toggle
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
          setIsFullscreen(false);
        }
      }
    } catch (err) {
      console.error("Fullscreen toggle failed:", err);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const filteredProducts = products.filter(p => {
    const term = searchTerm.toLocaleLowerCase('tr-TR');
    const matchesSearch = p.name.toLocaleLowerCase('tr-TR').includes(term) || 
                          p.code.toLocaleLowerCase('tr-TR').includes(term) ||
                          p.barcode?.includes(term);
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const playSound = (type: 'beep' | 'error' | 'success') => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        if (type === 'beep') {
          osc.frequency.value = 1000;
          gain.gain.value = 0.1;
          osc.start();
          setTimeout(() => osc.stop(), 100);
        } else if (type === 'error') {
          osc.type = 'sawtooth';
          osc.frequency.value = 150;
          gain.gain.value = 0.2;
          osc.start();
          setTimeout(() => osc.stop(), 300);
        } else if (type === 'success') {
          osc.frequency.value = 600;
          gain.gain.value = 0.1;
          osc.start();
          osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
          setTimeout(() => osc.stop(), 200);
        }
      }
    } catch (e) { console.error(e); }
  };

  // --- ENTRY FLOW HANDLERS ---

  const handleBranchSelect = (branchId: string) => {
    const branch = branches.find(b => b.id === branchId);
    if (branch) {
      setSelectedBranch(branch);
      // Auto select first non-virtual employee or reset
      setAuthForm(prev => ({ ...prev, userId: '' }));
      setEntryStep('auth');
    }
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!authForm.userId) {
      setAuthError("Lütfen bir personel seçiniz.");
      playSound('error');
      return;
    }
    
    if (!authForm.password) {
      setAuthError("Lütfen şifre giriniz.");
      playSound('error');
      return;
    }
    
    // PASSWORD CHECK: For demo purposes, we accept '1234' as the password
    if (authForm.password !== '1234') {
        setAuthError("Hatalı şifre! (Demo Şifresi: 1234)");
        setAuthForm(prev => ({ ...prev, password: '' })); // Clear password
        playSound('error');
        return;
    }

    const employee = employees.find(e => e.id === authForm.userId);
    if (employee) {
      setActiveCashier(employee);
      // Set default salesperson
      if (employee.id !== 'EMP-VIRTUAL') {
        setSelectedSalesperson(employee.id);
      } else {
        setSelectedSalesperson('EMP-VIRTUAL');
      }
      playSound('success');
      setEntryStep('session');
    } else {
      setAuthError("Personel bulunamadı.");
    }
  };

  const handleOpenSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCashier) return;

    const newSession: POSSession = {
      id: `SESS-${Date.now()}`,
      tenantId: user?.tenantId || 'tenant-1',
      registerId: 'REG-001', // Default main register for this terminal
      cashierId: activeCashier.id,
      openedAt: new Date().toISOString(),
      openingBalance: parseFloat(sessionForm.openingBalance) || 0,
      status: 'active'
    };

    setCurrentSession(newSession);
    setSessionTransactions([]); // Reset session transactions
    setEntryStep('active');
  };

  const handleCloseSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSession) return;

    // Clear State
    setCurrentSession(null);
    setActiveCashier(null);
    setSelectedBranch(null);
    setCart([]);
    setSessionTransactions([]);
    setSelectedCustomer(null);
    setHeldOrders([]);
    setIsCloseSessionModalOpen(false);
    
    // Clear Storage
    localStorage.removeItem(POS_STORAGE_KEY);
    
    // Reset to beginning
    setAuthForm({ userId: '', password: '' });
    setAuthError(null);
    setSessionForm({ openingBalance: '0', closingBalance: '', note: '' });
    setEntryStep('branch');
    
    alert("Gün sonu alındı, kasa kapatıldı. Oturum sonlandırıldı.");
  };

  // --- Expense Logic ---
  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSession) {
      alert("Önce kasa oturumu açmalısınız.");
      return;
    }
    const amount = parseFloat(expenseForm.amount);
    if (!amount || amount <= 0) return;

    // Find default cash register
    const defaultCash = cashRegisters.find(r => r.type === 'cash' && r.currency === 'TRY')?.id || 'REG-001';

    const expenseTx: Transaction = {
      id: `EXP-${Date.now()}`,
      tenantId: user?.tenantId || 'tenant-1',
      date: new Date().toISOString(),
      description: expenseForm.description,
      amount: amount, // Logic below handles sign in API
      type: 'expense',
      category: expenseForm.category,
      status: 'completed',
      registerId: defaultCash, // Default cash register
      sessionId: currentSession.id
    };

    // Call API to update real balance
    await api.finance.createTransaction(expenseTx);

    setSessionTransactions(prev => [...prev, { ...expenseTx, amount: -amount, category: 'Nakit' }]); // Treat immediate expense as cash logic for Z-Report
    setIsExpenseModalOpen(false);
    setExpenseForm({ description: '', amount: '', category: 'Genel Gider' });
    playSound('beep');
    alert(`Masraf kaydedildi: -${amount} TL`);
  };

  // --- Customer Creation Logic ---
  const handleCreateQuickCustomer = async () => {
    if (!customerSearchTerm.trim()) {
        alert("Lütfen müşteri adı giriniz.");
        return;
    }

    const newCustomer: Account = {
        id: `ACC-${Date.now()}`,
        tenantId: user?.tenantId || 'tenant-1',
        accountCode: `M-${Date.now().toString().slice(-6)}`,
        type: 'customer',
        category: 'individual',
        name: customerSearchTerm,
        authorizedPerson: customerSearchTerm,
        balance: 0,
        status: 'active'
    };

    try {
        await api.accounts.create(newCustomer);
        setCustomers(prev => [...prev, newCustomer]);
        setSelectedCustomer(newCustomer);
        setCustomerSearchTerm('');
        setIsCustomerSearchOpen(false);
        alert('Müşteri oluşturuldu ve seçildi.');
    } catch (error) {
        console.error(error);
        alert('Müşteri oluşturulurken hata oluştu.');
    }
  };

  // --- Cart Actions ---

  const addToCart = (product: Product) => {
    // FIX: Stronger session check
    if (!currentSession) {
      alert("Lütfen önce kasayı açınız.");
      setEntryStep('branch'); // Redirect to flow if somehow active
      return;
    }

    if (isReturnMode) {
      playSound('error');
    } else {
      playSound('beep');
    }

    // FIX: Safer Currency Conversion Logic
    let finalPrice = product.price || 0;
    if (product.currency === 'USD') {
        finalPrice = product.price * EXCHANGE_RATES.USD;
    } else if (product.currency === 'EUR') {
        finalPrice = product.price * EXCHANGE_RATES.EUR;
    }
    // Round to 2 decimals
    finalPrice = Math.round(finalPrice * 100) / 100;

    setCart(prev => {
      const targetType = isReturnMode ? 'return' : 'sale';
      const existing = prev.find(item => item.id === product.id && item.type === targetType);
      
      if (existing) {
        return prev.map(item => 
          (item.id === product.id && item.type === targetType) 
            ? { ...item, cartQty: item.cartQty + 1 } 
            : item
        );
      }
      return [...prev, { ...product, price: finalPrice, cartQty: 1, type: targetType }]; // Use converted price
    });
  };

  // NEW: Search Bar Key Down Handler for Barcode Scanning
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm.trim() !== '') {
        e.preventDefault();
        const term = searchTerm.trim().toLowerCase();
        // Exact match for barcode or code
        const product = products.find(p => 
            (p.barcode && p.barcode.toLowerCase() === term) || 
            p.code.toLowerCase() === term
        );

        if (product) {
            addToCart(product);
            setSearchTerm(''); // Clear input for next scan
        } else {
            playSound('error');
            // Optional: Keep term if partial match found in grid
        }
    }
  };

  // NEW: Salesperson Quick Code Handler
  const handleSalespersonCode = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
          e.preventDefault();
          const code = salespersonCodeInput.trim().toUpperCase();
          // Assuming employees have a code or ID we can match partially or fully
          // Here matching ID for demo simplicity
          const emp = employees.find(e => e.id.includes(code) || e.name.toUpperCase().includes(code));
          if (emp) {
              setSelectedSalesperson(emp.id);
              setSalespersonCodeInput('');
              setHighlightSalesperson(false); // Remove warning style
              playSound('beep');
          } else {
              playSound('error');
              alert('Personel bulunamadı.');
          }
      }
  };

  const updateQty = (id: string, type: 'sale' | 'return', delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id && item.type === type) {
        const newQty = Math.max(1, item.cartQty + delta);
        return { ...item, cartQty: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string, type: 'sale' | 'return') => {
    setCart(prev => prev.filter(item => !(item.id === id && item.type === type)));
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm('Sepeti temizlemek istediğinize emin misiniz?')) {
      setCart([]);
      setDiscountValue('');
      setDiscountType('amount');
      // Reset to default customer
      const nihai = customers.find(c => c.name === 'Nihai Müşteri') || customers.find(c => c.category === 'individual');
      if (nihai) setSelectedCustomer(nihai);
      else setSelectedCustomer(null);
      
      setPaymentMethod('credit');
      setIsReturnMode(false);
      setHighlightSalesperson(false);
    }
  };

  // --- Totals Calculation (UPDATED: Dynamic Tax) ---

  const subTotal = cart.reduce((acc, item) => {
    const itemTotal = item.price * item.cartQty;
    return item.type === 'sale' ? acc + itemTotal : acc - itemTotal;
  }, 0);

  // Dynamic Tax Calculation Breakdown
  const taxBreakdown = cart.reduce((acc, item) => {
      const rate = item.taxRate ?? 20; // Default to 20% if undefined
      const itemTotal = item.price * item.cartQty;
      // Tax calculation logic assuming price is tax-exclusive for base calculation
      const itemTax = itemTotal * (rate / 100);
      acc[rate] = (acc[rate] || 0) + itemTax;
      return acc;
  }, {} as Record<number, number>);

  const totalTax = Object.values(taxBreakdown).reduce((sum: number, val: number) => sum + val, 0);
  const totalBeforeDiscount = subTotal + totalTax;
  
  let discountAmount = 0;
  const numDiscountValue = typeof discountValue === 'number' ? discountValue : 0;

  if (discountType === 'amount') {
    discountAmount = numDiscountValue;
  } else {
    discountAmount = totalBeforeDiscount * (numDiscountValue / 100);
  }

  // Ensure discount doesn't exceed total
  if (discountAmount > totalBeforeDiscount) {
    discountAmount = totalBeforeDiscount;
  }

  const total = totalBeforeDiscount - discountAmount;

  // Check for premium items
  const hasPremiumItems = cart.some(item => item.isPremium);

  // --- Logic ---

  const handleHoldOrder = () => {
    if (cart.length === 0) return;
    const newHoldOrder: HeldOrder = {
      id: `HOLD-${Date.now()}`,
      items: [...cart],
      customer: selectedCustomer,
      date: new Date(),
      total: total
    };
    setHeldOrders([newHoldOrder, ...heldOrders]);
    setCart([]);
    setDiscountValue('');
    // Reset to default customer
    const nihai = customers.find(c => c.name === 'Nihai Müşteri') || customers.find(c => c.category === 'individual');
    setSelectedCustomer(nihai || null);
    alert('Sipariş beklemeye alındı.');
  };

  const handleRecallOrder = (orderId: string) => {
    if (cart.length > 0) {
      alert("Mevcutta işlem var. Lütfen önce işlemi tamamlayın veya temizleyin.");
      return; 
    }
    const orderToRecall = heldOrders.find(o => o.id === orderId);
    if (orderToRecall) {
      setCart(orderToRecall.items);
      setSelectedCustomer(orderToRecall.customer);
      setHeldOrders(heldOrders.filter(o => o.id !== orderId));
      setShowHeldOrdersModal(false);
    }
  };

  const deleteHeldOrder = (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(window.confirm('Bekleyen siparişi silmek istiyor musunuz?')) {
      setHeldOrders(heldOrders.filter(o => o.id !== orderId));
    }
  };

  // --- Payment & Receipt Logic ---

  const handleOpenPaymentModal = () => {
      // VALIDATION: Premium Items check BEFORE opening modal
      if (hasPremiumItems && selectedSalesperson === 'EMP-VIRTUAL') {
          playSound('error');
          setHighlightSalesperson(true); // Trigger UI indicator
          alert("Sepette primli ürün bulunmaktadır. Lütfen ödeme öncesi satış personelini seçiniz.");
          return;
      }
      setHighlightSalesperson(false);

      // Logic to auto-select a register based on method defaults
      // Default to first 'cash' register if any
      const defaultCash = cashRegisters.find(r => r.type === 'cash' && r.currency === 'TRY')?.id || '';
      setTargetRegisterId(defaultCash);
      setAmountReceived(total > 0 ? total.toString() : '0'); // Pre-fill
      setPaymentMethod('cash');
      setIsPaymentModalOpen(true);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSession) {
      alert("Kasa oturumu kapalı!");
      return;
    }

    if (!targetRegisterId) {
        alert("Lütfen ödemenin işleneceği kasayı seçiniz.");
        return;
    }

    playSound('success');

    const methodNames = {
      cash: 'Nakit',
      credit: 'Kredi Kartı',
      bank: 'Banka Havalesi',
      crypto: 'Bitcoin / Kripto'
    };

    const salesperson = employees.find(emp => emp.id === selectedSalesperson);
    const isOfficial = paymentMethod === 'credit' || paymentMethod === 'bank';

    // Track Transaction for Session Summary & Real Accounting
    const newTransaction: Transaction = {
      id: `TRX-${Date.now().toString().slice(-6)}`,
      tenantId: user?.tenantId || 'tenant-1',
      date: new Date().toISOString(),
      description: `POS Satış (${selectedCustomer?.name || 'Misafir'})`,
      amount: total, // Positive for income, logic in API handles type
      type: total >= 0 ? 'income' : 'expense',
      status: 'completed',
      category: 'Satış',
      registerId: targetRegisterId, // Linked to specific register
      salespersonId: selectedSalesperson,
      sessionId: currentSession.id,
      accountId: selectedCustomer?.id // Link to customer
    };
    
    // Call API to persist transaction and update register balance
    await api.finance.createTransaction(newTransaction);

    // Note: We use category here to store payment method for the session summary calculation in Z-report
    setSessionTransactions(prev => [...prev, { ...newTransaction, category: methodNames[paymentMethod] }]);

    setCompletedTransaction({
      id: newTransaction.id,
      total: total,
      subTotal: subTotal,
      taxBreakdown: taxBreakdown, // Pass breakdown for receipt
      taxTotal: totalTax,
      discountTotal: discountAmount,
      items: [...cart],
      customer: selectedCustomer,
      method: methodNames[paymentMethod],
      date: new Date(),
      isInvoice: isOfficial,
      salespersonName: salesperson ? salesperson.name : (activeCashier?.name || 'Kasiyer')
    });

    setIsPaymentModalOpen(false);
    setShowReceiptModal(true); // Open Receipt Modal
  };

  const handlePrintReceipt = () => {
      window.print(); 
      // Do NOT clear cart here immediately, wait for user to close modal or click new sale
  };

  const finalizeTransaction = () => {
    setCart([]);
    setDiscountValue('');
    // Reset to default customer
    const nihai = customers.find(c => c.name === 'Nihai Müşteri') || customers.find(c => c.category === 'individual');
    setSelectedCustomer(nihai || null);
    
    setAmountReceived('');
    setShowReceiptModal(false);
    setCompletedTransaction(null);
    setIsReturnMode(false);
    setHighlightSalesperson(false);
    
    // Reset Salesperson
    if (activeCashier && activeCashier.id !== 'EMP-VIRTUAL') {
      setSelectedSalesperson(activeCashier.id);
    } else {
      setSelectedSalesperson('EMP-VIRTUAL');
    }
  };

  // --- Z-Report Calculations ---
  const calculateSessionTotals = () => {
    if (!currentSession) return { cashSales: 0, cashReturns: 0, totalCash: 0, creditSales: 0, totalSales: 0 };
    
    // Sums based on the tracking category (payment method)
    const cashTx = sessionTransactions.filter(t => t.category === 'Nakit');
    const cashSales = cashTx.filter(t => t.amount > 0).reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0);
    const cashReturns = cashTx.filter(t => t.amount < 0).reduce((sum: number, t: Transaction) => sum + Math.abs(Number(t.amount)), 0); // Expenses/Returns
    
    const creditTx = sessionTransactions.filter(t => t.category === 'Kredi Kartı');
    const creditSales = creditTx.filter(t => t.amount > 0).reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0);

    return {
        cashSales,
        cashReturns,
        creditSales,
        totalCash: (Number(currentSession.openingBalance) || 0) + cashSales - cashReturns,
        totalSales: cashSales + creditSales
    };
  };

  // ... (rest of the component render including modals, layout etc.) ...
  if (entryStep !== 'active') {
      // Improved Setup Screens UI
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-500 to-blue-500"></div>
                
                <div className="mb-8 flex justify-center">
                    <BrandLogo size="lg" forceDarkText={true} />
                </div>

                {entryStep === 'branch' && (
                    <div className="animate-fade-in-down">
                        <h2 className="text-xl font-bold mb-6 text-center text-slate-800">Çalışma Konumu Seçiniz</h2>
                        <div className="space-y-3">
                            {branches.map(b => (
                                <button 
                                    key={b.id} 
                                    onClick={() => handleBranchSelect(b.id)} 
                                    className="w-full p-4 flex items-center gap-4 text-left border rounded-xl hover:bg-brand-50 hover:border-brand-500 transition-all group"
                                >
                                    <div className="bg-slate-100 group-hover:bg-white p-3 rounded-lg text-slate-500 group-hover:text-brand-600 transition-colors">
                                        <Store size={24} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-800">{b.name}</div>
                                        <div className="text-xs text-slate-500 mt-0.5">{b.city}</div>
                                    </div>
                                    <ArrowRight size={18} className="ml-auto text-slate-300 group-hover:text-brand-500" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                {entryStep === 'auth' && (
                    <form onSubmit={handleAuthSubmit} className="animate-fade-in-down">
                        <button type="button" onClick={() => setEntryStep('branch')} className="mb-6 text-sm text-slate-500 flex items-center hover:text-brand-600 font-bold transition-colors">
                            <ArrowLeft size={18} className="mr-1"/> Geri Dön
                        </button>
                        <h2 className="text-xl font-bold mb-6 text-center text-slate-800">Personel Girişi</h2>
                        
                        {authError && (
                            <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg text-sm flex items-center">
                                <AlertTriangle size={16} className="mr-2" />
                                {authError}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Kasiyer Seçimi</label>
                                <select 
                                    value={authForm.userId} 
                                    onChange={e => setAuthForm({...authForm, userId: e.target.value})} 
                                    className="w-full p-3 border-2 border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-brand-500 focus:ring-0 outline-none transition-all text-slate-900 font-medium"
                                >
                                    <option value="">Personel Seçiniz...</option>
                                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Şifre</label>
                                <input 
                                    type="password" 
                                    value={authForm.password} 
                                    onChange={e => setAuthForm({...authForm, password: e.target.value})} 
                                    className="w-full p-3 border-2 border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-brand-500 focus:ring-0 outline-none transition-all text-slate-900 font-medium tracking-widest" 
                                    placeholder="****" 
                                />
                            </div>
                            <button type="submit" className="w-full bg-brand-600 text-white py-3.5 rounded-xl font-bold hover:bg-brand-700 shadow-lg shadow-brand-600/30 transition-all mt-2 active:scale-95">
                                Giriş Yap
                            </button>
                        </div>
                    </form>
                )}
                {entryStep === 'session' && (
                    <form onSubmit={handleOpenSession} className="animate-fade-in-down">
                        <button type="button" onClick={() => setEntryStep('auth')} className="mb-6 text-sm text-slate-500 flex items-center hover:text-brand-600"><ArrowLeft size={16} className="mr-1"/> Personel Değiştir</button>
                        <h2 className="text-xl font-bold mb-6 text-center text-slate-800">Kasa Açılışı</h2>
                        <div className="bg-brand-50 p-4 rounded-xl mb-6 flex items-center gap-4 border border-brand-100">
                            <img src={activeCashier?.avatar} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
                            <div>
                                <div className="font-bold text-brand-900">{activeCashier?.name}</div>
                                <div className="text-xs text-brand-600">{selectedBranch?.name}</div>
                            </div>
                        </div>
                        <div className="mb-6">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Açılış Bakiyesi (Nakit)</label>
                            <input type="number" value={sessionForm.openingBalance} onChange={e => setSessionForm({...sessionForm, openingBalance: e.target.value})} className="w-full p-4 border-2 border-brand-200 rounded-xl text-3xl font-bold text-center text-brand-700 focus:border-brand-500 focus:ring-0 outline-none bg-slate-50" />
                        </div>
                        <button type="submit" className="w-full bg-green-600 text-white py-3.5 rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-600/30 transition-all">Kasayı Aç ve Başla</button>
                    </form>
                )}
            </div>
        </div>
      );
  }

  // --- SCREEN 4: ACTIVE POS ---
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      
      {/* 1. LEFT SIDE - PRODUCT CATALOG */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-slate-200 dark:border-slate-800 print:hidden">
        
        {/* Header Bar */}
        <div className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 justify-between shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-colors">
              <LayoutDashboard size={20} />
            </button>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Ürün Ara (Barkod / İsim)..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-900 border-none rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                autoFocus
              />
            </div>
            {/* View Mode Toggle */}
            <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-600 shadow-sm text-brand-600 dark:text-brand-400' : 'text-slate-400'}`}
                    title="Izgara Görünüm"
                >
                    <Grid size={18} />
                </button>
                <button 
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-600 shadow-sm text-brand-600 dark:text-brand-400' : 'text-slate-400'}`}
                    title="Liste Görünüm"
                >
                    <AlignJustify size={18} />
                </button>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
               <button onClick={() => setIsExpenseModalOpen(true)} className="px-3 py-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-lg text-xs font-bold hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center gap-2">
                 <Minus size={14} /> Masraf
               </button>
               <button onClick={() => setShowHeldOrdersModal(true)} className="px-3 py-2 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 rounded-lg text-xs font-bold hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors flex items-center gap-2 relative">
                 <PauseCircle size={14} /> Bekleyen
                 {heldOrders.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] flex items-center justify-center rounded-full">{heldOrders.length}</span>}
               </button>
            </div>
          </div>
          
          <div className="flex items-center gap-3 ml-4">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-900 dark:text-white">{activeCashier?.name}</div>
              <div className="text-[10px] text-slate-500">{selectedBranch?.name}</div>
            </div>
            <img src={activeCashier?.avatar} className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-700" />
            <button onClick={toggleFullscreen} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500">
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="h-12 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 flex items-center px-2 gap-2 overflow-x-auto custom-scrollbar shrink-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                selectedCategory === cat 
                  ? 'bg-brand-600 text-white shadow-md' 
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {cat === 'all' ? 'Tümü' : cat}
            </button>
          ))}
        </div>

        {/* Product Grid / List */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50 dark:bg-slate-900">
          <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6' : 'grid-cols-1'}`}>
            {filteredProducts.map(product => (
              <div 
                key={product.id}
                onClick={() => addToCart(product)}
                className={`bg-white dark:bg-slate-800 rounded-xl p-3 shadow-sm border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-brand-500 dark:hover:border-brand-500 hover:shadow-md transition-all group active:scale-95 relative overflow-hidden ${viewMode === 'grid' ? 'flex flex-col h-40' : 'flex flex-row items-center h-20'}`}
              >
                {/* Premium Badge */}
                {product.isPremium && (
                  <div className="absolute top-0 right-0 z-10">
                    <div className="bg-yellow-400 text-yellow-900 p-1.5 rounded-bl-xl shadow-sm">
                      <Star size={12} fill="currentColor" />
                    </div>
                  </div>
                )}

                <div className={`${viewMode === 'grid' ? 'flex-1 flex items-center justify-center mb-2' : 'w-16 h-16 mr-4'} overflow-hidden rounded-lg bg-slate-50 dark:bg-slate-900 shrink-0`}>
                  {product.image ? (
                    <img src={product.image} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <Package size={viewMode === 'grid' ? 32 : 24} className="text-slate-300" />
                  )}
                </div>
                
                <div className={`${viewMode === 'list' ? 'flex-1 flex justify-between items-center' : ''}`}>
                    <div>
                        <div className={`font-bold text-slate-800 dark:text-white leading-tight ${viewMode === 'grid' ? 'text-xs line-clamp-2 min-h-[2.5em]' : 'text-sm'}`}>
                            {product.name}
                        </div>
                        {viewMode === 'list' && <div className="text-xs text-slate-500 font-mono mt-0.5">{product.code}</div>}
                    </div>
                    
                    <div className={`${viewMode === 'grid' ? 'flex justify-between items-center mt-1' : 'text-right'}`}>
                        {viewMode === 'grid' && <span className="text-[10px] text-slate-500 font-mono">{product.stock} Adet</span>}
                        <div className="text-right">
                            <span className="font-bold text-brand-600 dark:text-brand-400 text-sm">
                                {product.currency === 'USD' ? '$' : product.currency === 'EUR' ? '€' : '₺'}{product.price.toLocaleString('tr-TR')}
                            </span>
                        </div>
                    </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. RIGHT SIDE - CART & ACTIONS */}
      <div className="w-96 bg-white dark:bg-slate-800 flex flex-col shrink-0 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-10 print:hidden">
        
        {/* Customer Header */}
        <div className="h-16 p-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex-1 relative" ref={customerDropdownRef}>
            {selectedCustomer ? (
              <div className="flex items-center justify-between bg-white dark:bg-slate-700 border border-brand-200 dark:border-slate-600 rounded-lg p-2 shadow-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-xs shrink-0">
                    {selectedCustomer.name.slice(0,2).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <div className="font-bold text-xs truncate">{selectedCustomer.name}</div>
                    <div className="text-[10px] text-slate-500 truncate">{selectedCustomer.phone || selectedCustomer.accountCode}</div>
                  </div>
                </div>
                <button onClick={() => setSelectedCustomer(null)} className="text-slate-400 hover:text-red-500 p-1"><X size={16}/></button>
              </div>
            ) : (
              <div className="relative">
                <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Müşteri Seç / Ara..." 
                  className="w-full pl-9 pr-2 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-brand-500 outline-none"
                  onFocus={() => setIsCustomerSearchOpen(true)}
                  onChange={(e) => { setCustomerSearchTerm(e.target.value); setIsCustomerSearchOpen(true); }}
                  value={customerSearchTerm}
                />
                {isCustomerSearchOpen && customerSearchTerm && (
                  <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                    {customers.filter(c => c.name.toLocaleLowerCase('tr-TR').includes(customerSearchTerm.toLocaleLowerCase('tr-TR'))).map(c => (
                      <div key={c.id} onClick={() => { setSelectedCustomer(c); setCustomerSearchTerm(''); setIsCustomerSearchOpen(false); }} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-100 dark:border-slate-700 last:border-0">
                        <div className="font-bold text-sm">{c.name}</div>
                        <div className="text-xs text-slate-500">{c.phone}</div>
                      </div>
                    ))}
                    <div className="p-2 border-t border-slate-100 dark:border-slate-700">
                        <button 
                            onClick={handleCreateQuickCustomer}
                            className="w-full py-2 bg-brand-50 dark:bg-brand-900/20 text-brand-600 text-xs font-bold rounded hover:bg-brand-100 transition-colors"
                        >
                            + "{customerSearchTerm}" Müşterisini Oluştur
                        </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <button 
            onClick={() => setIsReturnMode(!isReturnMode)}
            className={`p-2 rounded-lg transition-colors ${isReturnMode ? 'bg-red-600 text-white shadow-lg shadow-red-500/40 animate-pulse' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}
            title="İade Modu"
          >
            <RotateCcw size={20} />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 opacity-50">
              <ShoppingCart size={48} className="mb-2" />
              <p className="text-sm font-medium">Sepet Boş</p>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div key={`${item.id}-${idx}`} className={`flex items-center gap-2 p-2 rounded-lg border shadow-sm ${item.type === 'return' ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30' : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600'}`}>
                {/* Qty Control */}
                <div className="flex flex-col items-center gap-1">
                  <button onClick={() => updateQty(item.id, item.type, 1)} className="p-0.5 bg-slate-100 dark:bg-slate-600 rounded hover:bg-brand-100 dark:hover:bg-brand-900/50 text-slate-600 dark:text-slate-300"><Plus size={12}/></button>
                  <span className="font-bold text-sm w-6 text-center">{item.cartQty}</span>
                  <button onClick={() => updateQty(item.id, item.type, -1)} className="p-0.5 bg-slate-100 dark:bg-slate-600 rounded hover:bg-red-100 dark:hover:bg-red-900/50 text-slate-600 dark:text-slate-300"><Minus size={12}/></button>
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div className="font-bold text-sm text-slate-800 dark:text-white truncate pr-2 flex items-center">
                        {item.type === 'return' && <span className="text-red-500 mr-1">[İADE]</span>}
                        {item.isPremium && <Star size={10} className="text-yellow-500 fill-yellow-500 mr-1 shrink-0" />}
                        {item.name}
                    </div>
                    <div className="font-mono text-xs text-slate-500">{item.code}</div>
                  </div>
                  <div className="flex justify-between items-end mt-1">
                    <div className="text-xs text-slate-500">
                        {item.cartQty} x ₺{item.price.toLocaleString('tr-TR', {minimumFractionDigits: 2})}
                    </div>
                    <div className={`font-bold ${item.type === 'return' ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}>
                       {item.type === 'return' ? '-' : ''}₺{(item.price * item.cartQty).toLocaleString('tr-TR', {minimumFractionDigits: 2})}
                    </div>
                  </div>
                </div>

                {/* Remove */}
                <button onClick={() => removeFromCart(item.id, item.type)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions & Totals */}
        <div className="bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 p-4 shrink-0">
          
          {/* Controls: Layout updated */}
          <div className="mb-3 space-y-2">
             {/* Row 1: Salesperson Selector (Full Width) */}
             <div className={`relative group flex gap-1 rounded-lg transition-all ${highlightSalesperson ? 'ring-1 ring-red-500 bg-red-50 dark:bg-red-900/20' : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600'}`}>
                <div className="flex items-center px-2 py-2 cursor-pointer flex-1 w-full overflow-hidden">
                   <User size={16} className={`mr-2 shrink-0 ${highlightSalesperson ? 'text-red-500' : 'text-slate-400'}`} />
                   <select 
                     value={selectedSalesperson}
                     onChange={(e) => {
                       setSelectedSalesperson(e.target.value);
                       setHighlightSalesperson(false);
                     }}
                     className="w-full bg-transparent text-xs font-bold outline-none text-slate-700 dark:text-slate-200 appearance-none cursor-pointer truncate"
                   >
                     <option value="EMP-VIRTUAL">Kasiyer (Personel Seçiniz)</option>
                     {employees.filter(e => e.id !== 'EMP-VIRTUAL').map(e => (
                       <option key={e.id} value={e.id}>{e.name}</option>
                     ))}
                   </select>
                </div>
             </div>

             {/* Row 2: Campaign & Discount (50% - 50%) */}
             <div className="grid grid-cols-2 gap-2">
                 {/* Campaign Code */}
                 <div className="flex items-center bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-2 overflow-hidden">
                    <Ticket size={14} className="mr-1 text-slate-400 shrink-0" />
                    <input 
                      type="text" 
                      value={campaignCode} 
                      onChange={(e) => setCampaignCode(e.target.value)}
                      className="w-full bg-transparent text-[10px] font-bold outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400"
                      placeholder="Kampanya"
                    />
                 </div>
                 
                 {/* Discount Input */}
                 <div className="flex items-center bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-2 overflow-hidden">
                    <span className="text-[10px] font-bold text-slate-500 mr-1 shrink-0">İnd.</span>
                    <input 
                      type="number" 
                      value={discountValue} 
                      onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setDiscountValue(isNaN(val) ? '' : val);
                      }}
                      className="w-full bg-transparent text-[10px] font-bold outline-none text-slate-700 dark:text-slate-200 min-w-0"
                      placeholder="0"
                    />
                    <button onClick={() => setDiscountType(discountType === 'amount' ? 'percent' : 'amount')} className="text-[9px] font-bold bg-slate-200 dark:bg-slate-600 px-1 rounded text-slate-600 dark:text-slate-300 ml-1 shrink-0">
                        {discountType === 'amount' ? 'TL' : '%'}
                    </button>
                 </div>
             </div>
          </div>

          {/* Totals */}
          <div className="space-y-1 mb-4 text-xs">
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Ara Toplam</span>
              <span>₺{subTotal.toLocaleString('tr-TR', {minimumFractionDigits: 2})}</span>
            </div>
            
            {/* Dynamic Tax Breakdown */}
            {(() => {
                const taxBreakdown = cart.reduce((acc, item) => {
                    const rate = item.taxRate ?? 20; // Default to 20% if undefined
                    const itemTotal = item.price * item.cartQty;
                    // Tax calculation logic assuming price is tax-exclusive for base calculation
                    const itemTax = itemTotal * (rate / 100);
                    acc[rate] = (acc[rate] || 0) + itemTax;
                    return acc;
                }, {} as Record<number, number>);

                const taxRates = Object.keys(taxBreakdown).map(Number).sort((a,b) => a - b);
                
                if (taxRates.length === 0) {
                    return (
                        <div className="flex justify-between text-slate-500 dark:text-slate-400">
                            <span>Toplam KDV</span>
                            <span>₺0,00</span>
                        </div>
                    );
                }

                return taxRates.map(rate => (
                    <div key={rate} className="flex justify-between text-slate-500 dark:text-slate-400">
                        <span>KDV (%{rate})</span>
                        <span>₺{taxBreakdown[rate].toLocaleString('tr-TR', {minimumFractionDigits: 2})}</span>
                    </div>
                ));
            })()}

            {discountAmount > 0 && (
                <div className="flex justify-between text-red-500 font-medium">
                    <span>İskonto</span>
                    <span>-₺{discountAmount.toLocaleString('tr-TR', {minimumFractionDigits: 2})}</span>
                </div>
            )}
            <div className="flex justify-between items-end border-t border-slate-200 dark:border-slate-600 pt-2 mt-2">
              <span className="font-bold text-slate-900 dark:text-white text-lg">TOPLAM</span>
              <span className={`text-3xl font-black ${total < 0 ? 'text-red-600' : 'text-brand-600 dark:text-brand-400'}`}>
                ₺{total.toLocaleString('tr-TR', {minimumFractionDigits: 2})}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-4 gap-2">
            <button onClick={clearCart} className="col-span-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs py-3 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 transition-colors flex flex-col items-center justify-center gap-1">
              <Trash2 size={18} /> İptal
            </button>
            <button onClick={handleHoldOrder} className="col-span-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-xl font-bold text-xs py-3 hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors flex flex-col items-center justify-center gap-1">
              <PauseCircle size={18} /> Beklet
            </button>
            <button 
                onClick={handleOpenPaymentModal} 
                className="col-span-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm py-3 shadow-lg shadow-green-600/30 transition-all active:scale-95 flex flex-col items-center justify-center gap-1"
                disabled={cart.length === 0}
            >
              <CheckCircle size={20} />
              ÖDEME AL
            </button>
          </div>
          
          <div className="mt-3 flex justify-between items-center text-[10px] text-slate-400">
             <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${navigator.onLine ? 'bg-green-500' : 'bg-red-500'}`}></div>
                {navigator.onLine ? 'Çevrimiçi' : 'Çevrimdışı'}
             </div>
             <button onClick={() => setIsCloseSessionModalOpen(true)} className="hover:text-red-500 transition-colors flex items-center gap-1">
                <LogOut size={12} /> Gün Sonu
             </button>
          </div>

        </div>
      </div>

      {/* ... (Existing Modals remain here) ... */}
      
      {/* Expense Modal */}
      <Modal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} title="Hızlı Masraf Girişi" size="sm">
         <form onSubmit={handleExpenseSubmit} className="space-y-4">
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tutar (₺)</label>
                <input 
                    type="number" 
                    min="0"
                    step="0.01"
                    value={expenseForm.amount}
                    onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})}
                    className="w-full p-3 text-lg font-bold border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-brand-500 outline-none text-slate-900 dark:text-white"
                    placeholder="0.00"
                    required
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Açıklama</label>
                <input 
                    type="text" 
                    value={expenseForm.description}
                    onChange={e => setExpenseForm({...expenseForm, description: e.target.value})}
                    className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-brand-500 outline-none text-slate-900 dark:text-white"
                    placeholder="Örn: Yemek ücreti, Taksi..."
                    required
                />
            </div>
            <button type="submit" className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-600/30 transition-all mt-2">
                Masrafı Kaydet
            </button>
         </form>
      </Modal>

      {/* Held Orders Modal */}
      <Modal isOpen={showHeldOrdersModal} onClose={() => setShowHeldOrdersModal(false)} title="Bekleyen Siparişler">
         <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
            {heldOrders.length === 0 ? (
                <div className="text-center py-8 text-slate-400">Bekleyen sipariş yok.</div>
            ) : (
                heldOrders.map(order => (
                    <div key={order.id} className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex justify-between items-center hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleRecallOrder(order.id)}>
                        <div>
                            <div className="font-bold text-slate-900 dark:text-white">{order.customer?.name || 'Misafir Müşteri'}</div>
                            <div className="text-xs text-slate-500">{new Date(order.date).toLocaleTimeString()} • {order.items.length} Ürün</div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="font-bold text-brand-600 dark:text-brand-400">₺{order.total.toLocaleString()}</span>
                            <button onClick={(e) => deleteHeldOrder(order.id, e)} className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"><Trash2 size={14}/></button>
                        </div>
                    </div>
                ))
            )}
         </div>
      </Modal>

      {/* Payment Modal - Fixed Layout (No Scroll on container, flex layout) */}
      <Modal 
        isOpen={isPaymentModalOpen} 
        onClose={() => setIsPaymentModalOpen(false)} 
        title="Ödeme İşlemi"
        size="lg"
      >
        <div className="flex flex-col h-[500px] overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                
                {/* Left Side: Method Selection */}
                <div className="grid grid-cols-2 gap-3 content-start">
                    {[
                        { id: 'cash', label: 'Nakit', icon: Banknote },
                        { id: 'credit', label: 'Kredi Kartı', icon: CreditCard },
                        { id: 'bank', label: 'Havale / EFT', icon: Landmark },
                        { id: 'crypto', label: 'Kripto', icon: Bitcoin }
                    ].map(m => (
                        <button 
                            key={m.id}
                            onClick={() => setPaymentMethod(m.id as any)}
                            className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all h-24 ${paymentMethod === m.id ? `border-brand-500 ring-2 ring-brand-500/20 shadow-lg scale-105 z-10` : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            <m.icon size={32} className={paymentMethod === m.id ? 'text-brand-600' : 'text-slate-400'} />
                            <span className="font-bold text-slate-700 dark:text-slate-300">{m.label}</span>
                        </button>
                    ))}
                </div>

                {/* Right Side: Keypad & Input (Fixed Layout) */}
                <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                    <div className="mb-4">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ödenecek Tutar</label>
                        <div className="text-3xl font-black text-slate-900 dark:text-white mb-2">₺{total.toLocaleString('tr-TR', {minimumFractionDigits: 2})}</div>
                        
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Alınan Tutar</label>
                        <input 
                            type="text" 
                            value={amountReceived}
                            readOnly 
                            className="w-full p-2 text-xl font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-right outline-none"
                            placeholder="0.00"
                        />
                        {amountReceived && parseFloat(amountReceived) >= total && (
                            <div className="mt-2 text-right text-green-600 font-bold">
                                Para Üstü: ₺{(parseFloat(amountReceived) - total).toLocaleString('tr-TR', {minimumFractionDigits: 2})}
                            </div>
                        )}
                    </div>

                    <div className="flex-1 grid grid-cols-3 gap-2 min-h-0">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, 'C'].map(k => (
                            <button
                                key={k}
                                onClick={() => {
                                    if (k === 'C') setAmountReceived('');
                                    else setAmountReceived(prev => prev + k.toString());
                                }}
                                className="bg-white dark:bg-slate-700 rounded-lg font-bold text-xl shadow-sm hover:bg-slate-100 dark:hover:bg-slate-600 active:scale-95 transition-all text-slate-700 dark:text-white h-full"
                            >
                                {k}
                            </button>
                        ))}
                    </div>
                    
                    <button 
                        onClick={handlePayment} 
                        className="w-full mt-4 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 transition-transform active:scale-95 shrink-0"
                    >
                        <CheckCircle size={20} />
                        Onayla
                    </button>
                </div>
            </div>
        </div>
      </Modal>

      {/* Receipt Modal */}
      <Modal isOpen={showReceiptModal} onClose={() => {}} title="İşlem Tamamlandı" size="sm">
         <div className="text-center py-6">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <CheckCircle size={40} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Ödeme Alındı!</h2>
            <p className="text-slate-500 mb-6">Fiş yazdırmak istiyor musunuz?</p>
            
            <div className="grid grid-cols-2 gap-3 mt-4">
                <button 
                    onClick={finalizeTransaction} 
                    className="py-3 px-4 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white rounded-xl font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-xs sm:text-sm"
                >
                    Hayır (Yeni Satış)
                </button>
                <button 
                    onClick={handlePrintReceipt} 
                    className="py-3 px-4 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 shadow-lg shadow-brand-600/30 transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm"
                >
                    <Printer size={18} /> Evet (Yazdır)
                </button>
            </div>
         </div>
      </Modal>

      {/* Hidden Print Receipt Template */}
      <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-4 text-black font-mono text-xs">
          {completedTransaction && (
              <div className="w-[80mm] mx-auto">
                  <div className="text-center mb-4 border-b border-black pb-2 border-dashed">
                      <h1 className="text-lg font-bold">TODESTEK POS</h1>
                      <p>Perakende Satış Fişi</p>
                      <p>{new Date().toLocaleString('tr-TR')}</p>
                  </div>
                  
                  <div className="mb-4">
                      {completedTransaction.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between mb-1">
                              <div>
                                  <div>{item.name}</div>
                                  <div className="text-[10px]">
                                      {item.cartQty} x {item.price.toLocaleString('tr-TR', {minimumFractionDigits:2})}
                                      {item.taxRate && ` (KDV %${item.taxRate})`}
                                  </div>
                              </div>
                              <div className="font-bold">{(item.price * item.cartQty).toLocaleString('tr-TR', {minimumFractionDigits:2})}</div>
                          </div>
                      ))}
                  </div>

                  <div className="border-t border-black border-dashed pt-2 space-y-1">
                      <div className="flex justify-between">
                          <span>Ara Toplam:</span>
                          <span>{completedTransaction.subTotal.toLocaleString('tr-TR', {minimumFractionDigits:2})}</span>
                      </div>
                      <div className="flex justify-between">
                          <span>Toplam KDV:</span>
                          <span>{completedTransaction.taxTotal.toLocaleString('tr-TR', {minimumFractionDigits:2})}</span>
                      </div>
                      {completedTransaction.discountTotal > 0 && (
                          <div className="flex justify-between">
                              <span>İskonto:</span>
                              <span>-{completedTransaction.discountTotal.toLocaleString('tr-TR', {minimumFractionDigits:2})}</span>
                          </div>
                      )}
                      <div className="flex justify-between text-base font-bold border-t border-black border-dashed pt-2 mt-2">
                          <span>GENEL TOPLAM:</span>
                          <span>{completedTransaction.total.toLocaleString('tr-TR', {minimumFractionDigits:2})}</span>
                      </div>
                  </div>

                  <div className="mt-4 text-center text-[10px]">
                      <p>Kasiyer: {completedTransaction.salespersonName}</p>
                      <p>Müşteri: {completedTransaction.customer?.name || 'Misafir'}</p>
                      <p className="mt-2">Bizi tercih ettiğiniz için teşekkürler!</p>
                  </div>
              </div>
          )}
      </div>

      {/* Close Session Modal */}
      <Modal isOpen={isCloseSessionModalOpen} onClose={() => setIsCloseSessionModalOpen(false)} title="Gün Sonu & Kasa Kapat" size="md">
         <div className="space-y-6">
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-slate-900 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">Kasa Özeti</h4>
                {(() => {
                    const totals = calculateSessionTotals();
                    return (
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span>Açılış:</span> <span className="font-mono">₺{currentSession?.openingBalance.toLocaleString()}</span></div>
                            <div className="flex justify-between"><span className="text-green-600">Nakit Satış:</span> <span className="font-mono font-bold">+₺{totals.cashSales.toLocaleString()}</span></div>
                            <div className="flex justify-between"><span className="text-red-500">Gider/İade:</span> <span className="font-mono font-bold">-₺{totals.cashReturns.toLocaleString()}</span></div>
                            <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg"><span>Kasa Mevcudu:</span> <span className="text-brand-600">₺{totals.totalCash.toLocaleString()}</span></div>
                        </div>
                    );
                })()}
            </div>
            <div>
               <label className="block text-sm font-bold mb-2">Sayım Bakiyesi</label>
               <input type="number" value={sessionForm.closingBalance} onChange={e => setSessionForm({...sessionForm, closingBalance: e.target.value})} className="w-full p-3 border-2 border-slate-200 rounded-lg text-lg font-bold" placeholder="0.00" />
            </div>
            <button onClick={handleCloseSession} className="w-full py-3 bg-red-600 text-white rounded-lg font-bold">Oturumu Kapat</button>
         </div>
      </Modal>

    </div>
  );
};

export default POS;
