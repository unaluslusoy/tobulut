
import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Wallet, Package, Users, Settings, PieChart,
  LogOut, Menu, Wrench, Briefcase, FileText, ShoppingCart,
  Landmark, Database, Megaphone, Shield, ChevronLeft, 
  FileBadge, Calendar, ClipboardList, Tags, Tag, ArrowRightLeft, 
  ShoppingBag, ChevronDown, ChevronRight, X, Layout, FolderOpen, Palette
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import BrandLogo from './BrandLogo';
import { ModuleType } from '../types';

interface SidebarProps {
  isOpen: boolean; // Mobile Open State
  toggleSidebar: () => void; // Mobile Toggle
  isCollapsed: boolean; // Desktop Collapsed State
  toggleCollapse: () => void; // Desktop Toggle
  onLogout?: () => void;
}

interface MenuItem {
  label: string;
  path: string;
  icon: React.ElementType;
  roles?: string[];
  module?: ModuleType; // Added: Which module this item belongs to
  key?: string;
  subItems?: MenuItem[];
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar, isCollapsed, toggleCollapse, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // State for Mobile Accordion
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  
  // State for Desktop Slide-out Panel
  const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);

  // Auto-expand menu on route change (Mobile only)
  useEffect(() => {
    menuGroups.forEach(group => {
      group.items.forEach(item => {
        if (item.subItems && item.key) {
          const isChildActive = item.subItems.some(sub => 
            location.pathname + location.search === sub.path || 
            (sub.path === location.pathname && location.search === '')
          );
          
          if (isChildActive) {
            setExpandedMenus(prev => prev.includes(item.key!) ? prev : [...prev, item.key!]);
          }
        }
      });
    });
  }, [location.pathname, location.search]);

  // Close desktop panel when clicking outside or navigating
  useEffect(() => {
    // Optional: Close panel on route change if desired
    // setActiveSubMenu(null); 
  }, [location.pathname]);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('isAuthenticated');
      window.location.href = '/';
    }
  };

  // Mobile Accordion Toggle
  const toggleMobileSubMenu = (key: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (expandedMenus.includes(key)) {
      setExpandedMenus(expandedMenus.filter(k => k !== key));
    } else {
      setExpandedMenus([...expandedMenus, key]);
    }
  };

  // Desktop Item Click Handler
  const handleDesktopItemClick = (item: MenuItem, e: React.MouseEvent) => {
    // If item has sub-items, prevent navigation and toggle panel
    if (item.subItems && item.subItems.length > 0) {
      e.preventDefault();
      if (activeSubMenu === item.key) {
        setActiveSubMenu(null); // Toggle off if already open
      } else {
        setActiveSubMenu(item.key || null);
      }
    } else {
      // Normal navigation, close any open panel
      setActiveSubMenu(null);
      navigate(item.path);
    }
  };

  // Helper to check if user has access to a specific module
  const hasModuleAccess = (module?: ModuleType) => {
    if (!module) return true; // Common items like Dashboard
    if (!user?.allowedModules || user.allowedModules.length === 0) return true; // Super Admin or full access
    return user.allowedModules.includes(module);
  };

  const menuGroups: MenuGroup[] = [
    {
      title: 'Platform',
      items: [
        { label: 'Özet Paneli', path: '/', icon: LayoutDashboard, roles: ['admin', 'manager', 'accountant', 'cashier', 'technician'] },
        { label: 'İş Takibi', path: '/tasks', icon: ClipboardList, roles: ['admin', 'manager', 'accountant', 'technician'] },
        { label: 'Takvim', path: '/calendar', icon: Calendar, roles: ['admin', 'manager', 'technician'] },
      ]
    },
    {
      title: 'Operasyon',
      items: [
        { 
          label: 'Stok & Ürün', 
          path: '/inventory', 
          icon: Package, 
          roles: ['admin', 'manager', 'technician', 'accountant', 'cashier'],
          module: 'inventory',
          key: 'products',
          subItems: [
            { label: 'Tüm Ürünler', path: '/inventory', icon: Tag }, 
            { label: 'Koleksiyonlar', path: '/inventory?tab=collections', icon: Tags },
            { label: 'Sayım & Envanter', path: '/inventory?tab=inventory', icon: Database },
            { label: 'Satın Alma', path: '/inventory?tab=orders', icon: ShoppingBag },
            { label: 'Transferler', path: '/inventory?tab=transfers', icon: ArrowRightLeft },
          ]
        },
        { label: 'Teknik Servis', path: '/services', icon: Wrench, roles: ['admin', 'manager', 'technician'], module: 'service' },
        { label: 'Hızlı Satış (POS)', path: '/pos', icon: ShoppingCart, roles: ['admin', 'manager', 'cashier'], module: 'sales' },
      ]
    },
    {
      title: 'Finans',
      items: [
        { label: 'Cari Hesaplar', path: '/accounts', icon: Users, roles: ['admin', 'manager', 'accountant', 'cashier'], module: 'finance' },
        { label: 'Kasa & Banka', path: '/cash-registers', icon: Landmark, roles: ['admin', 'manager', 'accountant'], module: 'finance' },
        { label: 'Gelir / Gider', path: '/finance', icon: Wallet, roles: ['admin', 'manager', 'accountant'], module: 'finance' },
        { label: 'Faturalar', path: '/invoices', icon: FileText, roles: ['admin', 'manager', 'accountant', 'cashier'], module: 'finance' },
        { label: 'Teklifler', path: '/offers', icon: FileBadge, roles: ['admin', 'manager', 'accountant'], module: 'sales' },
      ]
    },
    {
      title: 'Yönetim',
      items: [
        { label: 'İK & Personel', path: '/hr', icon: Briefcase, roles: ['admin', 'manager'], module: 'hr' },
        { label: 'Kampanyalar', path: '/campaigns', icon: Megaphone, roles: ['admin', 'manager'], module: 'sales' },
        { label: 'Raporlar', path: '/reports', icon: PieChart, roles: ['admin', 'manager', 'accountant'], module: 'reports' },
        { label: 'Dosya Yöneticisi', path: '/file-manager', icon: FolderOpen, roles: ['admin', 'superuser'] }, // Removed module check to ensure access
        { label: 'Kurumsal Kimlik', path: '/corporate-identity', icon: Palette, roles: ['admin', 'manager', 'technician'] }, // Updated icon and broadened roles
        { label: 'Kullanıcılar', path: '/users', icon: Shield, roles: ['admin'], module: 'settings' },
        { label: 'Ayarlar', path: '/settings', icon: Settings, roles: ['admin', 'manager'], module: 'settings' },
      ]
    }
  ];

  const filteredGroups = menuGroups.map(group => ({
    ...group,
    items: group.items.filter(item => {
      // 1. Role Check
      const roleMatch = !item.roles || (user && item.roles.includes(user.role));
      // 2. SaaS Module Check
      const moduleMatch = hasModuleAccess(item.module);
      
      return roleMatch && moduleMatch;
    })
  })).filter(group => group.items.length > 0);

  // Find active submenu content
  const activeSubMenuContent = filteredGroups
    .flatMap(g => g.items)
    .find(item => item.key === activeSubMenu);

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 z-20 bg-slate-900/80 backdrop-blur-[2px] transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={toggleSidebar}
      />

      {/* Main Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-30 bg-[#0B1120] text-slate-300 flex flex-col h-full border-r border-slate-800 shadow-2xl transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
          lg:translate-x-0 lg:static 
          ${isCollapsed ? 'lg:w-[80px]' : 'lg:w-[280px]'}
        `}
      >
        {/* Header / Brand */}
        <div className="flex items-center px-6 border-b border-slate-800/80 shrink-0 h-16 transition-all duration-300">
          <div className={`flex items-center w-full ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
            
            {!isCollapsed ? (
              <div 
                className="flex items-center cursor-pointer group transition-opacity hover:opacity-90" 
                onClick={() => navigate('/')}
                title="Ana Ekrana Dön"
              >
                {/* light={true} forced because sidebar is always dark */}
                <BrandLogo size="md" variant="full" light={true} />
              </div>
            ) : (
              <div 
                onClick={toggleCollapse} 
                className="cursor-pointer hover:scale-105 transition-transform"
                title="Menüyü Genişlet"
              >
                <BrandLogo size="md" variant="icon" light={true} />
              </div>
            )}

            {!isCollapsed && (
              <button 
                onClick={toggleCollapse}
                className="hidden lg:flex p-1.5 text-slate-500 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
            )}
            
            <button onClick={toggleSidebar} className="lg:hidden text-slate-400 hover:text-white">
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar px-3 py-2 space-y-6 mt-4">
          
          {filteredGroups.map((group) => (
            <div key={group.title}>
              {!isCollapsed && (
                <div className="px-3 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center justify-between group cursor-default select-none">
                  {group.title}
                </div>
              )}
              {isCollapsed && (
                <div className="w-8 mx-auto h-px bg-slate-800/50 mb-3"></div>
              )}
              
              <div className="space-y-1">
                {group.items.map((item) => {
                  const hasSubItems = item.subItems && item.subItems.length > 0;
                  // Mobile expanded state
                  const isMobileExpanded = hasSubItems && item.key && expandedMenus.includes(item.key);
                  // Desktop active state
                  const isDesktopActive = activeSubMenu === item.key;
                  
                  const isActiveParent = hasSubItems && item.subItems?.some(sub => 
                    location.pathname + location.search === sub.path ||
                    (sub.path === location.pathname && location.search === '')
                  );

                  const baseItemClasses = `
                    flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative
                    ${isCollapsed ? 'justify-center' : ''}
                  `;

                  return (
                    <div key={item.path} className="relative">
                      {/* Mobile View: Accordion */}
                      <div className="lg:hidden">
                        {hasSubItems ? (
                          <>
                            <div 
                              className={`${baseItemClasses} cursor-pointer select-none
                                ${isMobileExpanded || isActiveParent 
                                  ? 'text-white bg-slate-800' 
                                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}
                              `}
                              onClick={(e) => toggleMobileSubMenu(item.key || '', e)}
                            >
                              <item.icon size={20} className="mr-3 text-slate-500" />
                              <span className="flex-1">{item.label}</span>
                              <ChevronDown size={14} className={`transition-transform ${isMobileExpanded ? 'rotate-180' : ''}`} />
                            </div>
                            {isMobileExpanded && (
                              <div className="ml-4 pl-4 border-l border-slate-800 space-y-1 my-1">
                                {item.subItems?.map(sub => (
                                  <NavLink
                                    key={sub.path}
                                    to={sub.path}
                                    className={({ isActive }) => 
                                      `flex items-center px-3 py-2 rounded-lg text-xs font-medium ${
                                        isActive ? 'text-white bg-brand-600/10' : 'text-slate-500'
                                      }`
                                    }
                                  >
                                    {sub.label}
                                  </NavLink>
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <NavLink
                            to={item.path}
                            className={({ isActive }) =>
                              `${baseItemClasses} ${isActive ? 'bg-brand-600 text-white' : 'text-slate-400'}`
                            }
                          >
                            <item.icon size={20} className="mr-3" />
                            <span>{item.label}</span>
                          </NavLink>
                        )}
                      </div>

                      {/* Desktop View: Click to Open Drawer */}
                      <div className="hidden lg:block">
                        <div 
                          className={`${baseItemClasses} cursor-pointer select-none
                            ${(isActiveParent || isDesktopActive) 
                              ? 'text-white bg-slate-800' 
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}
                            ${!hasSubItems && location.pathname === item.path ? 'bg-brand-600 !text-white shadow-lg shadow-brand-900/20' : ''}
                          `}
                          onClick={(e) => handleDesktopItemClick(item, e)}
                        >
                          <item.icon 
                            size={20} 
                            className={`${isCollapsed ? '' : 'mr-3'} ${(isActiveParent || isDesktopActive) ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'} transition-colors shrink-0`} 
                          />
                          
                          {!isCollapsed && (
                            <>
                              <span className="flex-1 truncate">{item.label}</span>
                              {hasSubItems && (
                                <ChevronRight 
                                  size={14} 
                                  className={`transition-transform duration-200 text-slate-500 ${isDesktopActive ? 'text-brand-400 translate-x-1' : ''}`} 
                                />
                              )}
                            </>
                          )}

                          {/* Tooltip for Collapsed Mode */}
                          {isCollapsed && (
                            <div className="absolute left-full ml-4 px-3 py-2 bg-slate-800 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-2 group-hover:translate-x-0 whitespace-nowrap z-50 shadow-xl border border-slate-700">
                              {item.label}
                              <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45 border-l border-b border-slate-700"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-[#0B1120] shrink-0">
          <button 
            onClick={handleLogout}
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'px-4'} w-full py-3 text-slate-400 hover:text-red-300 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/20 transition-all rounded-xl group`}
            title="Çıkış Yap"
          >
            <LogOut size={20} className={`${isCollapsed ? '' : 'mr-3'} group-hover:text-red-400 transition-colors`} />
            {!isCollapsed && <span className="text-sm font-medium">Oturumu Kapat</span>}
          </button>
        </div>
      </div>

      {/* 
        MEGA MENU PANEL (Desktop Only) 
      */}
      {!isOpen && activeSubMenuContent && (
        <div 
          className="fixed top-2 bottom-2 z-50 w-80 bg-[#0F172A] border-y border-r border-slate-700/50 shadow-2xl flex flex-col animate-fade-in-down rounded-r-3xl overflow-hidden"
          style={{ left: isCollapsed ? '80px' : '280px' }}
        >
          {/* Panel Header */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/80 bg-[#0B1120]">
            <div className="flex items-center gap-3 text-white font-bold text-lg">
              <activeSubMenuContent.icon size={24} className="text-brand-500" />
              {activeSubMenuContent.label}
            </div>
            <button 
              onClick={() => setActiveSubMenu(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-[#0F172A]">
            <div className="space-y-2">
              {activeSubMenuContent.subItems?.map((sub) => {
                 const isSubActive = location.pathname + location.search === sub.path || 
                                    (sub.path === location.pathname && location.search === '' && !sub.path.includes('?'));
                 return (
                  <NavLink
                    key={sub.path}
                    to={sub.path}
                    onClick={() => setActiveSubMenu(null)} // Close menu on click
                    className={`
                      flex items-center p-3 rounded-2xl transition-all group
                      ${isSubActive 
                        ? 'bg-slate-800 text-brand-400 border border-slate-700 shadow-sm' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent'}
                    `}
                  >
                    <div className={`p-2 rounded-xl mr-3 ${isSubActive ? 'bg-brand-500/10' : 'bg-slate-900 group-hover:bg-slate-700'} transition-colors`}>
                      <sub.icon size={18} className={isSubActive ? 'text-brand-400' : 'text-slate-500 group-hover:text-white'} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{sub.label}</span>
                      <span className="text-[10px] text-slate-600 group-hover:text-slate-500 mt-0.5">
                        İşlem yapmak için tıklayın
                      </span>
                    </div>
                    {isSubActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-500"></div>}
                  </NavLink>
                 );
              })}
            </div>
          </div>
          
          {/* Panel Footer Decoration */}
          <div className="p-4 bg-[#0B1120] border-t border-slate-800 text-[10px] text-slate-600 text-center">
            {activeSubMenuContent.label} Modülü
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
