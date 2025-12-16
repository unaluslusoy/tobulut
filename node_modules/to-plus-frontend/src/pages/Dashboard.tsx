
import React, { useEffect, useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';
import { 
  ArrowUpRight, ArrowDownRight, Users, Package, Wrench, Wallet,
  TrendingUp, RefreshCw, Plus, ShoppingCart, UserPlus, FilePlus,
  Zap, Calendar as CalendarIcon, Clock, Loader2, DollarSign,
  ChevronRight, MoreHorizontal, Lock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Transaction, ModuleType } from '../types';
import { useAuth } from '../context/AuthContext';

// --- COMPONENTS ---

const StatCard = ({ title, value, subValue, icon: Icon, trend, trendValue, color, loading }: any) => {
  // Color configuration
  const colors: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600 shadow-blue-500/20 text-blue-600',
    green: 'from-emerald-500 to-emerald-600 shadow-emerald-500/20 text-emerald-600',
    purple: 'from-violet-500 to-violet-600 shadow-violet-500/20 text-violet-600',
    orange: 'from-orange-500 to-orange-600 shadow-orange-500/20 text-orange-600',
  };

  const bgColors: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-500/10',
    green: 'bg-emerald-50 dark:bg-emerald-500/10',
    purple: 'bg-violet-50 dark:bg-violet-500/10',
    orange: 'bg-orange-50 dark:bg-orange-500/10',
  };

  return (
    <div className="bg-white dark:bg-enterprise-800 p-6 rounded-2xl shadow-card border border-slate-100 dark:border-slate-800/60 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
      <div className="flex justify-between items-start z-10 relative">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {loading ? <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 animate-pulse rounded"></div> : value}
          </h3>
          
          <div className="flex items-center mt-2 gap-2">
            {subValue && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center ${trend === 'up' ? 'text-emerald-600 bg-emerald-100 dark:bg-emerald-500/20' : trend === 'down' ? 'text-red-600 bg-red-100 dark:bg-red-500/20' : 'text-slate-500 bg-slate-100 dark:bg-slate-700'}`}>
                {trend === 'up' && <TrendingUp size={12} className="mr-1" />}
                {trend === 'down' && <TrendingUp size={12} className="mr-1 rotate-180" />}
                {trendValue}
              </span>
            )}
            <span className="text-xs text-slate-400">{subValue}</span>
          </div>
        </div>
        
        <div className={`p-3 rounded-xl bg-gradient-to-br ${colors[color].split(' ')[0]} ${colors[color].split(' ')[1]} text-white shadow-lg`}>
          <Icon size={24} />
        </div>
      </div>
      
      {/* Background Decorative Blob */}
      <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-0 group-hover:opacity-10 transition-opacity blur-2xl ${bgColors[color].replace('bg-', 'bg-')}`}></div>
    </div>
  );
};

const QuickActionBtn = ({ icon: Icon, label, path, colorClass, locked }: any) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => !locked && navigate(path)}
      disabled={locked}
      className={`flex flex-col items-center justify-center p-4 bg-white dark:bg-enterprise-800 border border-slate-100 dark:border-slate-800 rounded-xl transition-all group relative ${locked ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:shadow-lg hover:border-brand-500/30 hover:scale-[1.02]'}`}
    >
      {locked && <div className="absolute top-2 right-2 text-slate-400"><Lock size={12} /></div>}
      <div className={`p-3 rounded-full mb-3 transition-colors ${colorClass}`}>
        <Icon size={20} />
      </div>
      <span className="text-xs font-bold text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{label}</span>
    </button>
  );
};

// --- MAIN DASHBOARD ---

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({
    totalReceivables: 0,
    totalCustomers: 0,
    totalProducts: 0,
    openServiceTickets: 0,
    chartData: [],
    recentTransactions: []
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.dashboard.getStats();
      setStats(data);
    } catch (error) {
      console.error("Dashboard data fetch failed", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const currentDate = new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Helper to check module access for UI filtering
  const hasAccess = (module: ModuleType) => {
    if (!user?.allowedModules || user.allowedModules.length === 0) return true;
    return user.allowedModules.includes(module);
  };

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto">
      
      {/* 1. Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">{currentDate}</div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">
            Hoş geldin, <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-blue-400">{user?.name.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 max-w-xl">
            Sisteme başarıyla giriş yaptınız. Yetkileriniz dahilindeki güncel özet bilgileri aşağıda bulabilirsiniz.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchData} 
            className="p-2.5 bg-white dark:bg-enterprise-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            title="Yenile"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* 2. KPI Cards (Filtered by Module) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        
        {/* Finance KPI */}
        {hasAccess('finance') ? (
          <StatCard 
            title="Toplam Alacak" 
            value={`₺${stats.totalReceivables.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}`} 
            subValue="vadesi gelen"
            trend="up"
            trendValue="+12%"
            icon={Wallet} 
            color="green"
            loading={loading}
          />
        ) : (
          <div className="bg-slate-50 dark:bg-enterprise-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 border-dashed flex flex-col items-center justify-center text-slate-400">
             <Lock size={24} className="mb-2 opacity-50" />
             <span className="text-sm font-medium">Finansal Veri Gizli</span>
          </div>
        )}

        {/* Customer/Sales KPI */}
        {(hasAccess('sales') || hasAccess('finance')) ? (
          <StatCard 
            title="Aktif Müşteriler" 
            value={stats.totalCustomers} 
            subValue="bu ay yeni"
            trend="up"
            trendValue="+5"
            icon={Users} 
            color="blue"
            loading={loading}
          />
        ) : (
          <div className="bg-slate-50 dark:bg-enterprise-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 border-dashed flex flex-col items-center justify-center text-slate-400">
             <Lock size={24} className="mb-2 opacity-50" />
             <span className="text-sm font-medium">Müşteri Verisi Gizli</span>
          </div>
        )}

        {/* Inventory KPI */}
        {hasAccess('inventory') ? (
          <StatCard 
            title="Stok Kalemi" 
            value={stats.totalProducts} 
            subValue="kritik seviyede"
            trend="down"
            trendValue="3"
            icon={Package} 
            color="purple"
            loading={loading}
          />
        ) : (
          <div className="bg-slate-50 dark:bg-enterprise-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 border-dashed flex flex-col items-center justify-center text-slate-400">
             <Lock size={24} className="mb-2 opacity-50" />
             <span className="text-sm font-medium">Stok Verisi Gizli</span>
          </div>
        )}

        {/* Service KPI */}
        {hasAccess('service') ? (
          <StatCard 
            title="Açık Servis" 
            value={stats.openServiceTickets} 
            subValue="acil öncelikli"
            trend="up"
            trendValue="2"
            icon={Wrench} 
            color="orange"
            loading={loading}
          />
        ) : (
          <div className="bg-slate-50 dark:bg-enterprise-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 border-dashed flex flex-col items-center justify-center text-slate-400">
             <Lock size={24} className="mb-2 opacity-50" />
             <span className="text-sm font-medium">Servis Verisi Gizli</span>
          </div>
        )}
      </div>

      {/* 3. Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: Charts & Quick Actions */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Quick Actions */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center">
              <Zap size={18} className="mr-2 text-yellow-500 fill-yellow-500" /> Hızlı Erişim
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
              <QuickActionBtn label="Satış Yap" icon={ShoppingCart} path="/pos" colorClass="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" locked={!hasAccess('sales')} />
              <QuickActionBtn label="Fatura Kes" icon={FilePlus} path="/invoices" colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" locked={!hasAccess('finance')} />
              <QuickActionBtn label="Servis Aç" icon={Wrench} path="/services" colorClass="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" locked={!hasAccess('service')} />
              <QuickActionBtn label="Cari Ekle" icon={UserPlus} path="/accounts" colorClass="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" locked={!hasAccess('finance')} />
              <QuickActionBtn label="Ürün Ekle" icon={Package} path="/inventory" colorClass="bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400" locked={!hasAccess('inventory')} />
              <QuickActionBtn label="Raporlar" icon={TrendingUp} path="/reports" colorClass="bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300" locked={!hasAccess('reports')} />
            </div>
          </div>

          {/* Chart Section - Only visible to Finance/Reports */}
          {(hasAccess('finance') || hasAccess('reports')) ? (
            <div className="bg-white dark:bg-enterprise-800 p-6 rounded-2xl shadow-card border border-slate-100 dark:border-slate-800/60">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Finansal Genel Bakış</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Son 6 aylık gelir ve gider analizi.</p>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                  <button className="px-3 py-1.5 text-xs font-bold rounded-md bg-white dark:bg-enterprise-800 shadow-sm text-slate-900 dark:text-white">Grafik</button>
                  <button className="px-3 py-1.5 text-xs font-bold rounded-md text-slate-500 dark:text-slate-400 hover:text-slate-900">Tablo</button>
                </div>
              </div>
              
              <div className="h-80 w-full">
                {loading ? (
                  <div className="h-full w-full flex items-center justify-center">
                    <Loader2 className="animate-spin text-brand-500" size={32} />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.chartData}>
                      <defs>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-700" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 500}} 
                        dy={10} 
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 500}} 
                        tickFormatter={(value) => `₺${value / 1000}k`}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                      <Area type="monotone" dataKey="income" name="Gelir" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                      <Area type="monotone" dataKey="expense" name="Gider" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-100 dark:bg-slate-800/50 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl h-80 flex flex-col items-center justify-center text-slate-400">
               <Lock size={32} className="mb-3" />
               <p className="font-medium">Finansal raporları görüntüleme yetkiniz yok.</p>
            </div>
          )}

        </div>

        {/* Right Column: Transactions & Widget */}
        <div className="space-y-8">
          
          {/* Recent Transactions - Only Finance */}
          {hasAccess('finance') ? (
            <div className="bg-white dark:bg-enterprise-800 p-6 rounded-2xl shadow-card border border-slate-100 dark:border-slate-800/60 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Son İşlemler</h2>
                <button 
                  onClick={() => navigate('/finance')}
                  className="text-brand-600 hover:text-brand-700 text-sm font-bold flex items-center"
                >
                  Tümü <ChevronRight size={16} />
                </button>
              </div>

              <div className="flex-1 space-y-4">
                {loading ? (
                  [1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-4 animate-pulse">
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))
                ) : (
                  stats.recentTransactions.map((trx: Transaction) => (
                    <div key={trx.id} className="flex items-center justify-between p-3 -mx-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors group cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${trx.type === 'income' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20' : 'bg-red-100 text-red-600 dark:bg-red-500/20'}`}>
                          {trx.type === 'income' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors">{trx.description}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {new Date(trx.date).toLocaleDateString('tr-TR')} • {trx.category}
                          </div>
                        </div>
                      </div>
                      <div className={`font-bold text-sm ${trx.type === 'income' ? 'text-emerald-600' : 'text-slate-900 dark:text-white'}`}>
                        {trx.type === 'income' ? '+' : '-'}₺{trx.amount.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
             <div className="bg-slate-100 dark:bg-slate-800/50 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl h-64 flex flex-col items-center justify-center text-slate-400">
               <Lock size={24} className="mb-2 opacity-50" />
               <p className="font-medium text-sm">Finansal hareket yetkisi kısıtlı.</p>
            </div>
          )}

          {/* Mini Calendar Widget / Agenda */}
          <div className="bg-gradient-to-br from-brand-600 to-blue-700 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl -mr-10 -mt-10"></div>
             
             <h3 className="text-lg font-bold mb-4 flex items-center gap-2 relative z-10">
               <CalendarIcon size={18} /> Ajanda & Takvim
             </h3>
             
             <div className="space-y-4 relative z-10">
               <div className="flex gap-3 items-start bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10">
                 <div className="bg-white/20 px-2 py-1 rounded text-center min-w-[50px]">
                   <span className="block text-xs uppercase opacity-75">BUGÜN</span>
                   <span className="block text-xl font-bold">14:00</span>
                 </div>
                 <div>
                   <div className="font-bold text-sm">Haftalık Ekip Toplantısı</div>
                   <div className="text-xs opacity-75">Toplantı Odası 1</div>
                 </div>
               </div>
               
               <div className="flex gap-3 items-start bg-white/5 p-3 rounded-xl border border-white/5">
                 <div className="bg-white/10 px-2 py-1 rounded text-center min-w-[50px]">
                   <span className="block text-xs uppercase opacity-75">YARIN</span>
                   <span className="block text-xl font-bold">09:30</span>
                 </div>
                 <div>
                   <div className="font-bold text-sm">TeknoTedarik Ödemesi</div>
                   <div className="text-xs opacity-75">Finans Departmanı</div>
                 </div>
               </div>
             </div>

             <button onClick={() => navigate('/calendar')} className="w-full mt-6 py-2.5 bg-white text-brand-700 font-bold rounded-lg hover:bg-brand-50 transition-colors text-sm shadow-sm relative z-10">
               Takvimi Görüntüle
             </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
