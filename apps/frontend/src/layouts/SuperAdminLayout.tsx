
import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Building, Package, LifeBuoy, Settings, 
  LogOut, Menu, X, Shield, Users 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import BrandLogo from '../components/BrandLogo';

const SuperAdminLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
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
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-sm">
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
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 h-16 flex items-center justify-between px-6 lg:px-8">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden text-slate-500">
            <Menu size={24} />
          </button>
          
          <div className="flex items-center gap-4 ml-auto">
            {/* Header Actions can go here (Notifications, etc) */}
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
