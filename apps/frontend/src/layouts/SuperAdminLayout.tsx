
import React, { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Building, Package, LifeBuoy, Settings, 
  LogOut, Menu, X, Shield, Users, Search, Bell, Moon, Sun,
  ChevronRight, ChevronDown, User, HelpCircle, Home, Settings2,
  FileText, MessageCircle, UserPlus, Check, Archive
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import UserAvatar from '../components/UserAvatar';

const SuperAdminLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notificationTab, setNotificationTab] = useState<'all' | 'inbox' | 'team'>('all');
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const { logout, user } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Sample notifications
  const notifications = [
    {
      id: 1,
      type: 'mention',
      user: 'Ahmet Yılmaz',
      avatar: 'AY',
      action: 'sizi',
      highlight: 'Yeni Özellik Talebi',
      suffix: 'konusunda bahsetti',
      time: '18 dk önce',
      category: 'Destek',
      unread: true,
      message: '@Ünal Lütfen bu konuya bakabilir misiniz?'
    },
    {
      id: 2,
      type: 'tag',
      user: 'Mehmet Kaya',
      avatar: 'MK',
      action: 'yeni etiketler ekledi:',
      highlight: 'ABC Teknoloji',
      time: '1 saat önce',
      category: 'Firma',
      tags: ['Premium', 'Aktif'],
      unread: true
    },
    {
      id: 3,
      type: 'request',
      user: 'Fatma Demir',
      avatar: 'FD',
      action: 'erişim talep etti:',
      highlight: 'Finans Modülü',
      time: '3 saat önce',
      category: 'Yetki',
      unread: false
    },
    {
      id: 4,
      type: 'file',
      user: 'Ali Özkan',
      avatar: 'AÖ',
      action: 'dosya paylaştı',
      time: '5 saat önce',
      file: { name: 'Rapor_2024.pdf', size: '2.4 MB' },
      unread: false
    }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else setTheme('light');
  };

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get breadcrumb items
  const getBreadcrumbs = () => {
    const pathMap: Record<string, string> = {
      '/super-admin': 'Panel Özeti',
      '/super-admin/users': 'Yöneticiler',
      '/super-admin/roles': 'Yetki Grupları',
      '/super-admin/tenants': 'Aboneler & Firmalar',
      '/super-admin/tickets': 'Destek Talepleri',
      '/super-admin/packages': 'Paket Yönetimi',
      '/super-admin/settings': 'Sistem Ayarları',
      '/super-admin/profile': 'Profil',
    };
    return pathMap[location.pathname] || 'Sayfa';
  };

  // Navigation Groups
  const navGroups = [
    {
      title: 'Genel Bakış',
      items: [
        { icon: <LayoutDashboard size={20} />, label: 'Panel Özeti', path: '/super-admin' },
      ]
    },
    {
      title: 'Yönetim',
      items: [
        { icon: <Users size={20} />, label: 'Yöneticiler', path: '/super-admin/users' },
        { icon: <Shield size={20} />, label: 'Yetki Grupları', path: '/super-admin/roles' },
      ]
    },
    {
      title: 'Müşteri İlişkileri',
      items: [
        { icon: <Building size={20} />, label: 'Aboneler & Firmalar', path: '/super-admin/tenants' },
        { icon: <LifeBuoy size={20} />, label: 'Destek Talepleri', path: '/super-admin/tickets' },
      ]
    },
    {
      title: 'Ürün & Hizmetler',
      items: [
        { icon: <Package size={20} />, label: 'Paket Yönetimi', path: '/super-admin/packages' },
      ]
    },
    {
      title: 'Konfigürasyon',
      items: [
        { icon: <Settings size={20} />, label: 'Sistem Ayarları', path: '/super-admin/settings' },
      ]
    }
  ];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transition-transform duration-300 transform 
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 flex flex-col border-r border-slate-800 shadow-2xl`}
      >
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-purple-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <Shield className="text-white w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight leading-none text-white">ToBulut</span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mt-0.5">Süper Yönetici</span>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-6">
          {navGroups.map((group, idx) => (
            <div key={idx}>
              <h3 className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/super-admin'}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group
                      ${isActive 
                        ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/50' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'}
                    `}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs border border-purple-500/30">
              SA
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">{user?.name || 'Admin'}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 h-16 flex items-center justify-between px-4 lg:px-6 shrink-0">
          {/* Left: Mobile menu + Breadcrumb */}
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white">
              <Menu size={22} />
            </button>
            
            {/* Breadcrumb */}
            <nav className="hidden sm:flex items-center gap-2 text-sm">
              <button 
                onClick={() => navigate('/super-admin')}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <Home size={16} />
              </button>
              <ChevronRight size={14} className="text-slate-300 dark:text-slate-600" />
              <span className="text-slate-400">Süper Admin</span>
              <ChevronRight size={14} className="text-slate-300 dark:text-slate-600" />
              <span className="text-slate-700 dark:text-white font-medium">{getBreadcrumbs()}</span>
            </nav>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
              <Search size={20} />
            </button>

            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="relative p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-800"></span>
              </button>

              {isNotificationOpen && (
                <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden animate-fade-in-down">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                    <h3 className="font-semibold text-slate-900 dark:text-white">Bildirimler</h3>
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        <Settings2 size={16} />
                      </button>
                      <button 
                        onClick={() => setIsNotificationOpen(false)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-1 px-3 py-2 border-b border-slate-100 dark:border-slate-700">
                    {[
                      { id: 'all', label: 'Tümü' },
                      { id: 'inbox', label: 'Gelen Kutusu', badge: 2 },
                      { id: 'team', label: 'Takım' },
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setNotificationTab(tab.id as any)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                          notificationTab === tab.id
                            ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                      >
                        {tab.label}
                        {tab.badge && (
                          <span className="w-5 h-5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-bold rounded-full flex items-center justify-center">
                            {tab.badge}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Notification List */}
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map(notif => (
                      <div 
                        key={notif.id}
                        className={`px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors border-b border-slate-50 dark:border-slate-700/50 ${
                          notif.unread ? 'bg-purple-50/30 dark:bg-purple-900/10' : ''
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className="shrink-0">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                              notif.unread 
                                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' 
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                            }`}>
                              {notif.avatar}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                              <span className="font-semibold text-slate-900 dark:text-white">{notif.user}</span>
                              {' '}{notif.action}{' '}
                              {notif.highlight && (
                                <span className="text-purple-600 dark:text-purple-400 font-medium">{notif.highlight}</span>
                              )}
                              {notif.suffix && ` ${notif.suffix}`}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-slate-400">{notif.time}</span>
                              {notif.category && (
                                <>
                                  <span className="text-slate-300 dark:text-slate-600">•</span>
                                  <span className="text-xs text-slate-500">{notif.category}</span>
                                </>
                              )}
                            </div>
                            
                            {/* Message preview */}
                            {notif.message && (
                              <div className="mt-2 p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-400">
                                {notif.message}
                              </div>
                            )}

                            {/* Tags */}
                            {notif.tags && (
                              <div className="flex gap-1.5 mt-2">
                                {notif.tags.map((tag, i) => (
                                  <span key={i} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-full">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* File preview */}
                            {notif.file && (
                              <div className="mt-2 flex items-center gap-2 p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                                <FileText size={16} className="text-red-500" />
                                <span className="text-sm text-slate-700 dark:text-slate-300">{notif.file.name}</span>
                                <span className="text-xs text-slate-400">{notif.file.size}</span>
                              </div>
                            )}

                            {/* Action buttons for requests */}
                            {notif.type === 'request' && (
                              <div className="flex gap-2 mt-2">
                                <button className="px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                                  Reddet
                                </button>
                                <button className="px-3 py-1 text-xs font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors">
                                  Onayla
                                </button>
                              </div>
                            )}
                          </div>
                          {notif.unread && (
                            <span className="w-2 h-2 bg-purple-500 rounded-full shrink-0 mt-2"></span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex border-t border-slate-100 dark:border-slate-700">
                    <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <Archive size={16} />
                      Tümünü Arşivle
                    </button>
                    <div className="w-px bg-slate-100 dark:bg-slate-700"></div>
                    <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <Check size={16} />
                      Tümünü Okundu İşaretle
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              {resolvedTheme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

            {/* User Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <UserAvatar name={user?.name || 'Admin'} size="sm" className="ring-2 ring-slate-100 dark:ring-slate-700" />
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-slate-700 dark:text-white leading-none">{user?.name || 'Admin'}</p>
                  <p className="text-[11px] text-slate-400">Süper Yönetici</p>
                </div>
                <ChevronDown size={16} className="text-slate-400 hidden md:block" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-50 animate-fade-in-down">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{user?.name}</p>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                  </div>
                  <div className="p-1">
                    <button onClick={() => { navigate('/super-admin/profile'); setIsUserMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg flex items-center gap-2">
                      <User size={16} /> Profilim
                    </button>
                    <button onClick={() => { navigate('/super-admin/settings'); setIsUserMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg flex items-center gap-2">
                      <Settings size={16} /> Ayarlar
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg flex items-center gap-2">
                      <HelpCircle size={16} /> Yardım
                    </button>
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-700 p-1">
                    <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-2">
                      <LogOut size={16} /> Çıkış Yap
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
