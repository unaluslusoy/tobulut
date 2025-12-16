
import React, { useEffect, useState } from 'react';
import { Shield, TrendingUp, Users, MessageSquare, Package } from 'lucide-react';
import { api } from '../../services/api';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="text-purple-600" />
            Süper Yönetici Özeti
        </h1>
        <p className="text-slate-500 dark:text-slate-400">Genel sistem durumu ve performans metrikleri.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-start mb-4">
              <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Aylık Ciro</p>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white">
                      ₺{stats?.monthlyRevenue?.toLocaleString() || 0}
                  </h3>
              </div>
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600">
                  <TrendingUp size={24} />
              </div>
          </div>
          <div className="text-xs text-green-600 font-bold flex items-center">
              %12 Artış (Geçen aya göre)
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
           <div className="flex justify-between items-start mb-4">
              <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Aktif Firmalar</p>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white">{stats?.activeTenants || 0} <span className="text-sm text-slate-400 font-normal">/ {stats?.totalTenants || 0}</span></h3>
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600">
                  <Users size={24} />
              </div>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
               <div className="bg-blue-500 h-full" style={{ width: `${(stats?.activeTenants / stats?.totalTenants) * 100 || 0}%` }}></div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
           <div className="flex justify-between items-start mb-4">
              <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Açık Talepler</p>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white">{stats?.openTickets || 0}</h3>
              </div>
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600">
                  <MessageSquare size={24} />
              </div>
          </div>
          <div className="text-xs text-slate-500">
              Ortalama yanıt süresi: 2.4 saat
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
           <div className="flex justify-between items-start mb-4">
              <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Toplam Paket</p>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white">{stats?.totalPackages || 0}</h3>
              </div>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600">
                  <Package size={24} />
              </div>
          </div>
          <button className="text-sm text-purple-600 font-bold hover:underline">Paketleri Yönet &rarr;</button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
