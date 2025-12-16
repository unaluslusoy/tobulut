
import React, { useState, useEffect } from 'react';
import { 
  Bell, AlertTriangle, CheckCircle, Info, Clock, 
  Trash2, Check, Filter, Calendar, Loader2
} from 'lucide-react';
import { api } from '../services/api';
import { AppNotification, ModuleType } from '../types';
import { useAuth } from '../context/AuthContext';

const Notifications: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'payment' | 'stock' | 'system'>('all');

  // Fetch Notifications
  useEffect(() => {
    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const data = await api.notifications.getAll();
            setNotifications(data);
        } catch (error) {
            console.error("Failed to load notifications", error);
        } finally {
            setLoading(false);
        }
    };
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
        await api.notifications.markAsRead(id);
        setNotifications(prev => prev.map(n => 
            n.id === id ? { ...n, read: true } : n
        ));
    } catch (error) {
        console.error("Error marking as read", error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
        await api.notifications.markAllAsRead();
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
        console.error("Error marking all as read", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
        await api.notifications.delete(id);
        setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
        console.error("Error deleting notification", error);
    }
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'warning': return <AlertTriangle className="text-orange-500" size={24} />;
      case 'error': return <AlertTriangle className="text-red-500" size={24} />;
      case 'success': return <CheckCircle className="text-green-500" size={24} />;
      default: return <Info className="text-blue-500" size={24} />;
    }
  };

  const getBgColor = (type: string) => {
    switch(type) {
      case 'warning': return 'bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/30';
      case 'error': return 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30';
      case 'success': return 'bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30';
      default: return 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30';
    }
  };

  // Helper: Determine if user should see notification based on category mapping
  const canViewNotification = (category: string) => {
    if (!user?.allowedModules || user.allowedModules.length === 0) return true;
    
    // Map notification categories to modules
    switch(category) {
        case 'payment': return user.allowedModules.includes('finance') || user.allowedModules.includes('sales');
        case 'stock': return user.allowedModules.includes('inventory') || user.allowedModules.includes('sales');
        case 'task': return true; // Tasks are generally available
        case 'system': return user.allowedModules.includes('settings');
        default: return true;
    }
  };

  const filteredNotifications = notifications
    .filter(n => canViewNotification(n.category)) // First filter by permission
    .filter(n => filterType === 'all' ? true : n.category === filterType) // Then filter by UI selection
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen text-slate-500 flex-col">
            <Loader2 size={40} className="animate-spin mb-4 text-brand-600" />
            <p>Bildirimler yükleniyor...</p>
        </div>
      );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="text-brand-600" />
            Bildirim Merkezi
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Sistem uyarıları, hatırlatmalar ve önemli güncellemeler.</p>
        </div>
        <button 
          onClick={handleMarkAllRead}
          className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline flex items-center"
        >
          <Check size={16} className="mr-1" />
          Tümünü Okundu İşaretle
        </button>
      </div>

      <div className="bg-white dark:bg-enterprise-800 rounded-xl shadow-card border border-slate-200 dark:border-slate-700/50 overflow-hidden transition-colors">
        {/* Filters */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700/50 flex gap-2 overflow-x-auto bg-slate-50/50 dark:bg-slate-800/50">
          {[
            { id: 'all', label: 'Tümü' },
            { id: 'payment', label: 'Ödemeler' },
            { id: 'stock', label: 'Stok & Ürün' },
            { id: 'system', label: 'Sistem' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filterType === f.id 
                  ? 'bg-brand-600 text-white shadow-sm' 
                  : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white border border-slate-200 dark:border-slate-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
          {filteredNotifications.length === 0 ? (
            <div className="p-12 text-center text-slate-400 dark:text-slate-500">
              <Bell size={48} className="mx-auto mb-3 opacity-20" />
              <p>Gösterilecek bildirim bulunamadı.</p>
            </div>
          ) : (
            filteredNotifications.map(notification => (
              <div 
                key={notification.id} 
                className={`p-4 flex gap-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/30 ${notification.read ? 'opacity-60' : 'bg-brand-50/10 dark:bg-brand-900/5'}`}
              >
                <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${getBgColor(notification.type)}`}>
                  {getIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={`font-bold ${notification.read ? 'text-slate-700 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                      {notification.title}
                    </h4>
                    <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap ml-2 flex items-center">
                      <Clock size={12} className="mr-1" />
                      {new Date(notification.date).toLocaleDateString('tr-TR')} {new Date(notification.date).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {notification.message}
                  </p>
                </div>

                <div className="flex flex-col gap-2 justify-center ml-2">
                  {!notification.read && (
                    <button 
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="p-2 text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors"
                      title="Okundu İşaretle"
                    >
                      <Check size={18} />
                    </button>
                  )}
                  <button 
                    onClick={() => handleDelete(notification.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Sil"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
