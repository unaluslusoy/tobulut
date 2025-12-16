
import React, { useEffect, useState } from 'react';
import { Shield, TrendingUp, Users, MessageSquare, Package, Sparkles } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Günaydın';
    if (hour < 18) return 'İyi günler';
    return 'İyi akşamlar';
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.superAdmin.getStats();
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="p-8 text-center">Yükleniyor...</div>;

  return (
    <div>
      {/* Welcome Section - Text Style */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={18} className="text-purple-500" />
          <span className="text-sm font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Süper Yönetici Paneli</span>
        </div>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2">
          {getGreeting()}, {user?.name?.split(' ')[0] || 'Yönetici'}! 👋
        </h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl">
          ToBulut yönetim panelinize hoş geldiniz. Sistem durumunu izleyin, abonelikleri yönetin ve destek taleplerini takip edin.
        </p>
      </div>

      {/* Stats - Card Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Aylık Ciro</span>
            <div className="p-2.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl text-white shadow-lg shadow-green-500/20">
              <TrendingUp size={20} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
            ₺{stats?.monthlyRevenue?.toLocaleString() || '0'}
          </p>
          <p className="text-sm text-green-500 font-medium">↑ %12 geçen aya göre</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Aktif Firmalar</span>
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white shadow-lg shadow-blue-500/20">
              <Users size={20} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
            {stats?.activeTenants || 0}
            <span className="text-lg text-slate-400 font-normal ml-1">/ {stats?.totalTenants || 0}</span>
          </p>
          <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all" style={{ width: `${(stats?.activeTenants / stats?.totalTenants) * 100 || 0}%` }}></div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Açık Talepler</span>
            <div className="p-2.5 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl text-white shadow-lg shadow-orange-500/20">
              <MessageSquare size={20} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
            {stats?.openTickets || 0}
          </p>
          <p className="text-sm text-slate-400">Ort. yanıt: <span className="text-slate-600 dark:text-slate-300 font-medium">2.4 saat</span></p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Abonelik Paketleri</span>
            <div className="p-2.5 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl text-white shadow-lg shadow-purple-500/20">
              <Package size={20} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
            {stats?.totalPackages || 0}
          </p>
          <button className="text-sm text-purple-500 hover:text-purple-600 font-medium transition-colors">Paketleri yönet →</button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
