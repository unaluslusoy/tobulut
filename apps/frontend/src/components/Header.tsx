
import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, Search, Menu, User, Moon, Sun, Monitor, Package, Users, 
  FileText, Wrench, X, Loader2, ChevronRight, Command, Settings, 
  LogOut, HelpCircle, ChevronDown, Crown, Plus, Maximize, Minimize,
  Receipt, UserPlus, ShoppingCart, ClipboardList
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api'; 
import { useAuth } from '../context/AuthContext';
import { ModuleType } from '../types';
import UserAvatar from './UserAvatar';

interface HeaderProps {
  toggleSidebar: () => void;
  user: {
    name: string;
    title: string;
    avatar: string;
    role?: string;
  };
}

interface SearchResult {
  type: 'account' | 'product' | 'invoice' | 'service';
  id: string;
  title: string;
  subtitle: string;
  url: string;
}

interface QuickAction {
  label: string;
  icon: React.ElementType;
  path: string;
  color: string;
  module?: ModuleType;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { logout, user: authUser } = useAuth();
  
  // Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // User Dropdown State
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Quick Actions Dropdown State
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const quickActionsRef = useRef<HTMLDivElement>(null);

  // Fullscreen State
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Quick Actions List
  const quickActions: QuickAction[] = [
    { label: 'Yeni Müşteri', icon: UserPlus, path: '/accounts?new=customer', color: 'text-blue-500', module: 'finance' },
    { label: 'Yeni Ürün', icon: Package, path: '/inventory?new=product', color: 'text-purple-500', module: 'inventory' },
    { label: 'Yeni Fatura', icon: Receipt, path: '/invoices?new=invoice', color: 'text-green-500', module: 'finance' },
    { label: 'Yeni Teklif', icon: ClipboardList, path: '/offers?new=offer', color: 'text-orange-500', module: 'sales' },
    { label: 'Yeni Servis', icon: Wrench, path: '/services?new=service', color: 'text-red-500', module: 'service' },
  ];

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else setTheme('light');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (quickActionsRef.current && !quickActionsRef.current.contains(event.target as Node)) {
        setIsQuickActionsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Helper to check module access
  const hasAccess = (module: ModuleType) => {
    if (!authUser?.allowedModules || authUser.allowedModules.length === 0) return true;
    return authUser.allowedModules.includes(module);
  };

  // Debounced Search Effect
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchTerm.trim().length >= 2) {
        setIsSearching(true);
        setShowResults(true);
        try {
          const promises = [];
          
          // Conditionally fetch based on module access
          const fetchAccounts = (hasAccess('finance') || hasAccess('sales')) ? api.accounts.getAll() : Promise.resolve([]);
          const fetchProducts = (hasAccess('inventory')) ? api.products.getAll() : Promise.resolve([]);
          const fetchInvoices = (hasAccess('finance')) ? api.finance.getInvoices() : Promise.resolve([]);
          const fetchServices = (hasAccess('service')) ? api.services.getAll() : Promise.resolve([]);

          const [accounts, products, invoices, services] = await Promise.all([
            fetchAccounts,
            fetchProducts,
            fetchInvoices,
            fetchServices
          ]);

          const lowerTerm = searchTerm.toLocaleLowerCase('tr-TR');
          const newResults: SearchResult[] = [];

          // Filter Accounts
          if (accounts.length > 0) {
            accounts.filter(a => a.name.toLocaleLowerCase('tr-TR').includes(lowerTerm) || a.accountCode.toLocaleLowerCase('tr-TR').includes(lowerTerm))
              .slice(0, 3)
              .forEach(a => newResults.push({
                type: 'account', id: a.id, title: a.name, subtitle: a.type === 'customer' ? 'Müşteri' : 'Tedarikçi', url: `/accounts?q=${encodeURIComponent(a.name)}`
              }));
          }

          // Filter Products
          if (products.length > 0) {
            products.filter(p => p.name.toLocaleLowerCase('tr-TR').includes(lowerTerm) || p.code.toLocaleLowerCase('tr-TR').includes(lowerTerm))
              .slice(0, 3)
              .forEach(p => newResults.push({
                type: 'product', id: p.id, title: p.name, subtitle: `Stok: ${p.stock}`, url: `/inventory?q=${encodeURIComponent(p.name)}`
              }));
          }

          // Filter Invoices
          if (invoices.length > 0) {
            invoices.filter(i => i.invoiceNumber.toLocaleLowerCase('tr-TR').includes(lowerTerm) || i.accountName.toLocaleLowerCase('tr-TR').includes(lowerTerm))
              .slice(0, 3)
              .forEach(i => newResults.push({
                type: 'invoice', id: i.id, title: i.invoiceNumber, subtitle: `${i.accountName} - ${i.total} TL`, url: `/invoices?q=${encodeURIComponent(i.invoiceNumber)}`
              }));
          }

          // Filter Services
          if (services.length > 0) {
            services.filter(s => s.id.toLocaleLowerCase('tr-TR').includes(lowerTerm) || s.customerName.toLocaleLowerCase('tr-TR').includes(lowerTerm) || s.device.toLocaleLowerCase('tr-TR').includes(lowerTerm))
              .slice(0, 3)
              .forEach(s => newResults.push({
                type: 'service', id: s.id, title: `${s.device} (${s.customerName})`, subtitle: s.status, url: `/services?q=${encodeURIComponent(s.id)}`
              }));
          }

          setResults(newResults);
        } catch (error) {
          console.error("Search failed", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchTerm, authUser]);

  const handleResultClick = (url: string) => {
    navigate(url);
    setShowResults(false);
    setSearchTerm('');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleQuickAction = (path: string) => {
    navigate(path);
    setIsQuickActionsOpen(false);
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'account': return <Users size={16} className="text-blue-500" />;
      case 'product': return <Package size={16} className="text-purple-500" />;
      case 'invoice': return <FileText size={16} className="text-green-500" />;
      case 'service': return <Wrench size={16} className="text-orange-500" />;
      default: return <Search size={16} />;
    }
  };

  // Get page title for breadcrumb
  const getPageTitle = () => {
    const pathMap: Record<string, string> = {
      '/': 'Dashboard',
      '/dashboard': 'Dashboard',
      '/accounts': 'Cariler',
      '/inventory': 'Stok',
      '/invoices': 'Faturalar',
      '/offers': 'Teklifler',
      '/services': 'Servis',
      '/finance': 'Finans',
      '/reports': 'Raporlar',
      '/settings': 'Ayarlar',
      '/notifications': 'Bildirimler',
      '/hr': 'İnsan Kaynakları',
      '/pos': 'POS',
      '/projects': 'Projeler',
      '/todo': 'Görevler',
    };
    return pathMap[location.pathname] || 'Sayfa';
  };

  return (
    <header className="h-16 bg-white dark:bg-[#0B1120] border-b border-gray-200 dark:border-slate-800 shadow-sm flex items-center justify-between px-4 lg:px-6 sticky top-0 z-40 transition-colors duration-200 relative">
      
      {/* Left: Mobile Toggle + Quick Actions */}
      <div className="flex items-center gap-2">
        <button 
          onClick={toggleSidebar}
          className="p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-800 lg:hidden"
        >
          <Menu size={20} />
        </button>

        {/* Quick Actions Button */}
        <div className="relative" ref={quickActionsRef}>
          <button 
            onClick={() => setIsQuickActionsOpen(!isQuickActionsOpen)}
            className="flex items-center gap-1.5 px-3 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium shadow-sm hover:shadow transition-all"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Yeni</span>
          </button>

          {isQuickActionsOpen && (
            <div className="absolute left-0 top-full mt-2 w-52 bg-white dark:bg-enterprise-800 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 py-2 z-50 animate-fade-in-down origin-top-left">
              <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Hızlı İşlemler</div>
              {quickActions.filter(a => !a.module || hasAccess(a.module)).map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickAction(action.path)}
                  className="w-full text-left px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors"
                >
                  <action.icon size={18} className={action.color} />
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Breadcrumb - Hidden on Mobile */}
        <div className="hidden lg:flex items-center gap-2 ml-4 text-sm">
          <span className="text-gray-400 dark:text-slate-500">Ana Sayfa</span>
          <ChevronRight size={14} className="text-gray-300 dark:text-slate-600" />
          <span className="text-gray-700 dark:text-slate-200 font-medium">{getPageTitle()}</span>
        </div>
      </div>
      
      {/* Center: Global Search Bar - Absolutely Positioned for true center */}
      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-lg hidden md:block px-4" ref={searchRef}>
        <div className="relative w-full">
          <div className="flex items-center bg-gray-100 dark:bg-[#161e2e] border border-transparent dark:border-slate-700 rounded-xl px-4 py-2 transition-all focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-500 focus-within:bg-white dark:focus-within:bg-[#0f172a] shadow-sm">
            <Search size={18} className="text-gray-400 mr-3 shrink-0" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => { if(searchTerm.length >= 2) setShowResults(true); }}
              placeholder="Ara (Müşteri, Ürün, Fatura...)" 
              className="bg-transparent border-none outline-none text-sm w-full text-gray-700 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-500"
            />
            {searchTerm ? (
              <button onClick={() => { setSearchTerm(''); setShowResults(false); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 ml-2">
                <X size={16} />
              </button>
            ) : (
              <div className="hidden md:flex border border-gray-300 dark:border-slate-600 rounded px-1.5 py-0.5 text-[10px] text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-slate-800 ml-2">Cmd+K</div>
            )}
          </div>

          {/* Search Results Dropdown */}
          {showResults && (
            <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-[#161e2e] rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden max-h-[400px] overflow-y-auto z-50 animate-fade-in-down">
              {isSearching ? (
                <div className="p-6 text-center text-gray-500 dark:text-slate-400 flex items-center justify-center">
                  <Loader2 size={18} className="animate-spin mr-2 text-brand-600" /> Aranıyor...
                </div>
              ) : results.length > 0 ? (
                <div className="py-2">
                  <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sonuçlar</div>
                  {results.map((result, idx) => (
                    <div 
                      key={`${result.type}-${result.id}-${idx}`}
                      onClick={() => handleResultClick(result.url)}
                      className="px-4 py-3 hover:bg-brand-50 dark:hover:bg-brand-900/10 cursor-pointer flex items-center gap-3 border-b border-gray-50 dark:border-slate-700/50 last:border-0 group"
                    >
                      <div className="p-2 bg-gray-100 dark:bg-slate-800 rounded-lg group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors">
                        {getIcon(result.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors truncate">{result.title}</div>
                        <div className="text-xs text-gray-500 dark:text-slate-400 truncate">{result.subtitle}</div>
                      </div>
                      <ChevronRight size={14} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="inline-flex p-3 rounded-full bg-slate-100 dark:bg-slate-800 mb-3">
                    <Search size={24} className="text-slate-400" />
                  </div>
                  <p className="text-gray-500 dark:text-slate-400 text-sm">Sonuç bulunamadı.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Actions & Profile */}
      <div className="flex items-center gap-2 sm:gap-3 ml-auto">
        
        {authUser?.role === 'superuser' && (
          <button 
            onClick={() => navigate('/super-admin')}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full text-xs font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            <Crown size={14} className="fill-white" />
            Süper Admin
          </button>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {/* Fullscreen Toggle */}
          <button 
            onClick={toggleFullscreen}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-800/80 rounded-lg transition-colors hidden sm:block"
            title={isFullscreen ? 'Tam Ekrandan Çık' : 'Tam Ekran'}
          >
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>

          <button 
            onClick={toggleTheme}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-800/80 rounded-lg transition-colors"
            title="Tema Değiştir"
          >
            {theme === 'system' ? <Monitor size={20} /> : resolvedTheme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          <button 
            onClick={() => navigate('/notifications')}
            className="relative p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-800/80 rounded-lg transition-colors"
            title="Bildirimler"
          >
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#0B1120]"></span>
          </button>
        </div>
        
       <div className="h-6 w-px bg-gray-200 dark:bg-slate-700 mx-1"></div>

        {/* User Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button 
            className="flex items-center space-x-3 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-600 group"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          >
              <UserAvatar 
                name={user.name} 
                src={user.avatar} 
                size="sm" 
                className="ring-2 ring-slate-100 dark:ring-slate-700" 
              />
              <div className="hidden lg:block text-right">
                <div className="text-xs font-bold text-slate-900 dark:text-white leading-none mb-1">{user.name}</div>
                <div className="text-[10px] text-slate-500 font-medium uppercase">{user.role === 'admin' ? 'Yönetici' : user.title}</div>
              </div>
              <ChevronDown size={14} className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-enterprise-800 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 py-1 z-50 animate-fade-in-down origin-top-right">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700/50 sm:hidden">
                <p className="text-sm font-bold text-gray-900 dark:text-white">{user.name}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">{user.title}</p>
              </div>
              
              <div className="p-1">
                <button onClick={() => { navigate(`/${user.userNo || authUser?.userNo || authUser?.id}/profile`); setIsUserMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg flex items-center gap-2 transition-colors">
                  <User size={16} /> Profilim
                </button>
                <button onClick={() => { navigate('/settings'); setIsUserMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg flex items-center gap-2 transition-colors">
                  <Settings size={16} /> Ayarlar
                </button>
                <button onClick={() => { navigate('/style-guide'); setIsUserMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg flex items-center gap-2 transition-colors">
                  <HelpCircle size={16} /> Yardım & Destek
                </button>
              </div>
              
              <div className="border-t border-gray-100 dark:border-slate-700/50 p-1 mt-1">
                <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-2 transition-colors">
                  <LogOut size={16} /> Çıkış Yap
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
