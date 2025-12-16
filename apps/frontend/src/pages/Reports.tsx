
import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, ComposedChart
} from 'recharts';
import { 
  FileText, Download, Calendar, Award, Star, TrendingUp, Users, 
  Target, AlertTriangle, ArrowUp, ArrowDown, PieChart as PieIcon,
  Package, ArrowRightLeft, Filter, Search, Loader2, Lock
} from 'lucide-react';
import { api } from '../services/api';
import { StockMovement, Employee, Product, ModuleType } from '../types';
import { useAuth } from '../context/AuthContext';

// --- MOCK DATA FOR ANALYTICS (Kept static for demo visualization) ---
const monthlyPerformanceData = [
  { name: 'Oca', sales: 42000, target: 40000, cost: 28000, profit: 14000 },
  { name: 'Şub', sales: 38000, target: 42000, cost: 26000, profit: 12000 },
  { name: 'Mar', sales: 55000, target: 45000, cost: 35000, profit: 20000 },
  { name: 'Nis', sales: 48000, target: 48000, cost: 32000, profit: 16000 },
  { name: 'May', sales: 62000, target: 50000, cost: 38000, profit: 24000 },
  { name: 'Haz', sales: 75000, target: 55000, cost: 45000, profit: 30000 },
];

const customerSegmentsData = [
  { name: 'Sadık Müşteriler', value: 45, color: '#10b981' },
  { name: 'Yeni Müşteriler', value: 25, color: '#3b82f6' },
  { name: 'Riskli (Churn)', value: 15, color: '#f59e0b' },
  { name: 'Kaybedilen', value: 15, color: '#ef4444' },
];

const topProductsData = [
  { name: 'Laptop Pro X1', profit: 125000, margin: 25 },
  { name: 'iPhone 15', profit: 98000, margin: 18 },
  { name: 'Servis Hizmetleri', profit: 45000, margin: 85 },
  { name: 'Aksesuar Paketi', profit: 32000, margin: 40 },
  { name: 'Yazılım Lisans', profit: 28000, margin: 90 },
];

const Reports: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'customers' | 'profitability' | 'staff' | 'stock'>('overview');
  
  // Data States
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Stock Report State
  const [stockFilters, setStockFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    type: 'all',
    search: ''
  });

  // Helper to check module access
  const hasAccess = (module: ModuleType) => {
    if (!user?.allowedModules || user.allowedModules.length === 0) return true;
    return user.allowedModules.includes(module);
  };

  // Fetch Data based on permissions
  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        try {
            const promises = [];
            
            // Conditional Fetching
            if (hasAccess('inventory')) {
                promises.push(api.products.getStockMovements().then(data => setStockMovements(data)));
                promises.push(api.products.getAll().then(data => setProducts(data)));
            }
            
            if (hasAccess('hr')) {
                promises.push(api.hr.getEmployees().then(data => setEmployees(data)));
            }

            await Promise.all(promises);
        } catch (error) {
            console.error("Failed to load report data", error);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, [user]);

  // --- STAFF COMMISSION LOGIC ---
  const staffCommissionData = useMemo(() => {
    if (!hasAccess('hr')) return [];
    return employees
    .filter(e => e.id !== 'EMP-VIRTUAL')
    .map(emp => {
      // Simulation of sales aggregation
      const premiumSales = Math.floor(Math.random() * 50000) + 10000;
      const normalSales = Math.floor(Math.random() * 100000) + 20000;
      return {
        name: emp.name,
        premiumSales: premiumSales,
        normalSales: normalSales,
        commission: (premiumSales * 0.05)
      };
    }).sort((a, b) => b.commission - a.commission);
  }, [employees, user]);

  // --- STOCK REPORT LOGIC ---
  const filteredStockMovements = useMemo(() => {
    if (!hasAccess('inventory')) return [];
    return stockMovements.filter(m => {
      const date = m.date.slice(0, 10);
      const product = products.find(p => p.id === m.productId);
      
      const inDateRange = date >= stockFilters.startDate && date <= stockFilters.endDate;
      const matchesType = stockFilters.type === 'all' || m.type === stockFilters.type;
      const matchesSearch = stockFilters.search === '' || 
                            product?.name.toLowerCase().includes(stockFilters.search.toLowerCase()) || 
                            product?.code.toLowerCase().includes(stockFilters.search.toLowerCase()) ||
                            m.documentNo?.toLowerCase().includes(stockFilters.search.toLowerCase());

      return inDateRange && matchesType && matchesSearch;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [stockFilters, stockMovements, products, user]);

  const stockStats = useMemo(() => {
    const inboundTypes = ['purchase', 'return_in', 'adjustment_inc'];
    const outboundTypes = ['sale', 'return_out', 'adjustment_dec'];
    
    let totalIn = 0;
    let totalOut = 0;

    filteredStockMovements.forEach(m => {
      if (inboundTypes.includes(m.type)) totalIn += m.quantity;
      if (outboundTypes.includes(m.type)) totalOut += m.quantity;
    });

    return { totalMovements: filteredStockMovements.length, totalIn, totalOut };
  }, [filteredStockMovements]);

  const getMovementLabel = (type: string) => {
    switch(type) {
      case 'purchase': return { label: 'Satın Alma', color: 'text-green-600 bg-green-50 dark:bg-green-900/20' };
      case 'sale': return { label: 'Satış', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' };
      case 'return_in': return { label: 'Satış İade', color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20' };
      case 'return_out': return { label: 'Alış İade', color: 'text-red-600 bg-red-50 dark:bg-red-900/20' };
      case 'adjustment_inc': return { label: 'Sayım Fazlası', color: 'text-green-600 bg-green-50 dark:bg-green-900/20' };
      case 'adjustment_dec': return { label: 'Zayi / Fire', color: 'text-red-600 bg-red-50 dark:bg-red-900/20' };
      case 'transfer': return { label: 'Transfer', color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' };
      default: return { label: type, color: 'text-slate-600 bg-slate-50' };
    }
  };

  const StatCard = ({ title, value, subValue, trend, icon: Icon, color }: any) => (
    <div className="bg-white dark:bg-enterprise-800 p-6 rounded-2xl shadow-card border border-slate-100 dark:border-slate-800/60 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl bg-${color}-50 dark:bg-${color}-900/20 text-${color}-600 dark:text-${color}-400`}>
          <Icon size={24} />
        </div>
        {trend && (
          <div className={`flex items-center text-sm font-bold ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? <ArrowUp size={16} className="mr-1" /> : <ArrowDown size={16} className="mr-1" />}
            %{Math.abs(trend)}
          </div>
        )}
      </div>
      <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">{value}</h3>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
      {subValue && <p className="text-xs text-slate-400 mt-2">{subValue}</p>}
    </div>
  );

  // Define available tabs based on permissions
  const reportTabs = [
    { id: 'overview', label: 'Genel Özet', icon: TrendingUp, allowed: true },
    { id: 'stock', label: 'Stok Hareketleri', icon: Package, allowed: hasAccess('inventory') },
    { id: 'customers', label: 'Müşteri Analizi', icon: Users, allowed: hasAccess('sales') || hasAccess('finance') },
    { id: 'profitability', label: 'Karlılık Raporu', icon: PieIcon, allowed: hasAccess('finance') },
    { id: 'staff', label: 'Personel Performans', icon: Award, allowed: hasAccess('hr') },
  ].filter(tab => tab.allowed);

  // If active tab becomes invalid due to permissions change or direct link, reset to overview
  useEffect(() => {
      if (!reportTabs.find(t => t.id === activeTab)) {
          setActiveTab('overview');
      }
  }, [user, activeTab]);

  if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen text-slate-500 flex-col">
            <Loader2 size={40} className="animate-spin mb-4 text-brand-600" />
            <p>Raporlar hazırlanıyor...</p>
        </div>
      );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">İş Zekası ve Raporlar</h1>
          <p className="text-slate-500 dark:text-slate-400">Veri odaklı karar destek sistemi ve performans analizleri.</p>
        </div>
        <div className="flex gap-2">
           <button className="flex items-center px-4 py-2 bg-white dark:bg-enterprise-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <Calendar size={16} className="mr-2" />
            Bu Yıl
          </button>
          <button className="flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 shadow-lg shadow-brand-600/30 transition-colors">
            <Download size={16} className="mr-2" />
            PDF Rapor
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-700">
        {reportTabs.map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center px-6 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id 
                ? 'border-brand-600 text-brand-600 dark:text-brand-400' 
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <tab.icon size={18} className="mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* --- TAB CONTENT --- */}

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Toplam Satış" value="₺320.000" subValue="Geçen yıla göre +%12" trend={12} icon={TrendingUp} color="blue" />
            <StatCard title="Net Kar" value="₺112.000" subValue="Marj: %35" trend={8} icon={PieIcon} color="green" />
            <StatCard title="Aktif Müşteri" value="1,240" subValue="+45 Yeni Müşteri" trend={3.5} icon={Users} color="purple" />
            <StatCard title="Hedef Tamamlama" value="%85" subValue="Yıl sonu hedefi: %100" trend={-2} icon={Target} color="orange" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sales vs Target Chart */}
            <div className="lg:col-span-2 bg-white dark:bg-enterprise-800 p-6 rounded-2xl shadow-card border border-slate-100 dark:border-slate-800/60">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Satış Performansı ve Hedefler</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={monthlyPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="dark:stroke-slate-700" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 500}} axisLine={false} tickLine={false} dy={10} />
                    <YAxis tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 500}} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                    <Bar dataKey="sales" name="Gerçekleşen Satış" fill="#3b82f6" barSize={30} radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="target" name="Hedef" stroke="#f59e0b" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Alerts List */}
            <div className="bg-white dark:bg-enterprise-800 rounded-2xl shadow-card border border-slate-100 dark:border-slate-800/60 overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-700/50">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Kritik Uyarılar</h3>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {[
                  { text: 'Stok seviyesi kritik: iPhone 15', type: 'stok', time: '2 saat önce' },
                  { text: 'Hedefin %10 altında satış (Şubat)', type: 'finans', time: '5 saat önce' },
                  { text: 'Gecikmiş tahsilat: ABC Mimarlık', type: 'cari', time: '1 gün önce' },
                  { text: 'Sunucu yedekleme başarısız', type: 'sistem', time: '2 gün önce' },
                ].map((alert, i) => (
                  <div key={i} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors flex items-start">
                    <AlertTriangle size={18} className="text-yellow-500 mt-0.5 mr-3 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{alert.text}</p>
                      <span className="text-xs text-slate-400 dark:text-slate-500 capitalize font-medium">{alert.type} • {alert.time}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 text-center">
                <button className="text-sm text-brand-600 dark:text-brand-400 font-bold hover:underline">Tüm Uyarıları Gör</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 2. STOCK REPORT TAB */}
      {activeTab === 'stock' && (
        <div className="space-y-6">
          {/* Filters & Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
             <div className="lg:col-span-3 bg-white dark:bg-enterprise-800 p-6 rounded-2xl shadow-card border border-slate-100 dark:border-slate-800/60">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                   <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
                     <Filter size={18} className="mr-2 text-slate-500" />
                     Hareket Filtreleri
                   </h3>
                   <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                        <input 
                          type="text" 
                          placeholder="Ürün adı, kod veya belge no..." 
                          value={stockFilters.search}
                          onChange={(e) => setStockFilters({...stockFilters, search: e.target.value})}
                          className="pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white w-64 focus:ring-2 focus:ring-brand-500 outline-none"
                        />
                      </div>
                   </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                   <div>
                     <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Başlangıç Tarihi</label>
                     <input 
                        type="date" 
                        value={stockFilters.startDate}
                        onChange={(e) => setStockFilters({...stockFilters, startDate: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
                     />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Bitiş Tarihi</label>
                     <input 
                        type="date" 
                        value={stockFilters.endDate}
                        onChange={(e) => setStockFilters({...stockFilters, endDate: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
                     />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">İşlem Türü</label>
                     <select 
                        value={stockFilters.type}
                        onChange={(e) => setStockFilters({...stockFilters, type: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
                     >
                       <option value="all">Tüm Hareketler</option>
                       <option value="purchase">Satın Alma (Giriş)</option>
                       <option value="sale">Satış (Çıkış)</option>
                       <option value="return_in">Satış İade (Giriş)</option>
                       <option value="return_out">Alış İade (Çıkış)</option>
                       <option value="adjustment_inc">Sayım Fazlası (Giriş)</option>
                       <option value="adjustment_dec">Zayi / Fire (Çıkış)</option>
                       <option value="transfer">Transfer</option>
                     </select>
                   </div>
                </div>
             </div>

             <div className="lg:col-span-1 space-y-4">
               <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                 <p className="text-xs text-blue-600 dark:text-blue-300 font-bold uppercase mb-1">Toplam İşlem</p>
                 <h3 className="text-2xl font-black text-blue-900 dark:text-blue-100">{stockStats.totalMovements}</h3>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-800">
                   <p className="text-xs text-green-600 dark:text-green-300 font-bold uppercase mb-1">Giren Stok</p>
                   <h3 className="text-xl font-black text-green-900 dark:text-green-100">+{stockStats.totalIn}</h3>
                 </div>
                 <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-800">
                   <p className="text-xs text-red-600 dark:text-red-300 font-bold uppercase mb-1">Çıkan Stok</p>
                   <h3 className="text-xl font-black text-red-900 dark:text-red-100">-{stockStats.totalOut}</h3>
                 </div>
               </div>
             </div>
          </div>

          {/* Movements Table */}
          <div className="bg-white dark:bg-enterprise-800 rounded-2xl shadow-card border border-slate-100 dark:border-slate-800/60 overflow-hidden">
             <table className="w-full text-left border-collapse">
               <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider">
                 <tr>
                   <th className="px-6 py-4">Tarih</th>
                   <th className="px-6 py-4">Ürün</th>
                   <th className="px-6 py-4">İşlem Türü</th>
                   <th className="px-6 py-4">Belge No / Açıklama</th>
                   <th className="px-6 py-4">Personel</th>
                   <th className="px-6 py-4 text-right">Miktar</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                 {filteredStockMovements.map(move => {
                   const product = products.find(p => p.id === move.productId);
                   const badge = getMovementLabel(move.type);
                   const isPositive = ['purchase', 'return_in', 'adjustment_inc'].includes(move.type);

                   return (
                     <tr key={move.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                       <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                         <div className="font-bold text-slate-900 dark:text-white">{new Date(move.date).toLocaleDateString('tr-TR')}</div>
                         <div className="text-xs text-slate-500">{new Date(move.date).toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'})}</div>
                       </td>
                       <td className="px-6 py-4">
                         <div className="font-bold text-slate-900 dark:text-white text-sm">{product?.name || 'Bilinmeyen Ürün'}</div>
                         <div className="text-xs text-slate-500 font-mono">{product?.code}</div>
                       </td>
                       <td className="px-6 py-4">
                         <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${badge.color}`}>
                           {badge.label}
                         </span>
                       </td>
                       <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                         <div className="font-medium">{move.documentNo || '-'}</div>
                         <div className="text-xs text-slate-500 truncate max-w-[200px]">{move.description}</div>
                       </td>
                       <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 font-medium">
                         {move.performedBy}
                       </td>
                       <td className={`px-6 py-4 text-right font-bold text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                         {isPositive ? '+' : '-'}{move.quantity}
                       </td>
                     </tr>
                   );
                 })}
                 {filteredStockMovements.length === 0 && (
                   <tr>
                     <td colSpan={6} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                       <Package size={48} className="mx-auto mb-3 opacity-20" />
                       <p>Bu filtrelerle eşleşen stok hareketi bulunamadı.</p>
                     </td>
                   </tr>
                 )}
               </tbody>
             </table>
          </div>
        </div>
      )}

      {/* 3. CUSTOMERS TAB */}
      {activeTab === 'customers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="bg-white dark:bg-enterprise-800 p-6 rounded-2xl shadow-card border border-slate-100 dark:border-slate-800/60">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Müşteri Segmentasyonu</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={customerSegmentsData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {customerSegmentsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Müşterilerinizin <strong className="text-green-600">%45'i</strong> sadık müşteri grubunda.
                </p>
              </div>
           </div>

           <div className="lg:col-span-2 bg-white dark:bg-enterprise-800 rounded-2xl shadow-card border border-slate-100 dark:border-slate-800/60 overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Riskli Müşteriler (Churn Olasılığı)</h3>
                <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded">Aksiyon Gerekli</span>
              </div>
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Müşteri</th>
                    <th className="px-6 py-3">Son İşlem</th>
                    <th className="px-6 py-3">Ort. Sepet</th>
                    <th className="px-6 py-3">Risk Skoru</th>
                    <th className="px-6 py-3 text-right">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {[
                    { name: 'TeknoTedarik A.Ş.', last: '45 gün önce', avg: '₺12,500', risk: 85 },
                    { name: 'Ofis Mobilyaları Ltd.', last: '62 gün önce', avg: '₺4,200', risk: 92 },
                    { name: 'Ali Veli', last: '30 gün önce', avg: '₺150', risk: 65 },
                  ].map((cust, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white text-sm">{cust.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{cust.last}</td>
                      <td className="px-6 py-4 text-sm text-slate-900 dark:text-white font-medium">{cust.avg}</td>
                      <td className="px-6 py-4">
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 max-w-[100px]">
                          <div className={`h-2 rounded-full ${cust.risk > 80 ? 'bg-red-500' : 'bg-orange-500'}`} style={{width: `${cust.risk}%`}}></div>
                        </div>
                        <span className="text-xs text-slate-500 mt-1 block font-bold">%{cust.risk}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-brand-600 hover:text-brand-700 text-sm font-bold">İletişime Geç</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
        </div>
      )}

      {/* 4. PROFITABILITY TAB */}
      {activeTab === 'profitability' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <div className="bg-white dark:bg-enterprise-800 p-6 rounded-2xl shadow-card border border-slate-100 dark:border-slate-800/60">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Gelir, Maliyet ve Kar Analizi</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyPerformanceData}>
                    <defs>
                      <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="dark:stroke-slate-700" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 500}} axisLine={false} tickLine={false} dy={10} />
                    <YAxis tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 500}} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                    <Area type="monotone" dataKey="sales" name="Gelir" stroke="#3b82f6" fill="none" strokeWidth={3} />
                    <Area type="monotone" dataKey="cost" name="Maliyet" stroke="#ef4444" fill="none" strokeWidth={3} />
                    <Area type="monotone" dataKey="profit" name="Net Kar" stroke="#10b981" fill="url(#colorProfit)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
           </div>

           <div className="bg-white dark:bg-enterprise-800 p-6 rounded-2xl shadow-card border border-slate-100 dark:border-slate-800/60">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">En Karlı Ürünler / Kategoriler</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProductsData} layout="vertical" margin={{left: 40}}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} className="dark:stroke-slate-700" stroke="#e2e8f0" />
                    <XAxis type="number" tick={{fill: '#94a3b8'}} hide />
                    <YAxis dataKey="name" type="category" tick={{fill: '#64748b', fontSize: 12, fontWeight: 600}} width={120} />
                    <Tooltip 
                      cursor={{fill: 'transparent'}}
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                    />
                    <Bar dataKey="profit" name="Toplam Kar (TL)" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-5 gap-2 text-center text-xs text-slate-500">
                 {topProductsData.map((p, i) => (
                   <div key={i} className="bg-slate-50 dark:bg-slate-700/50 p-2 rounded">
                     <div className="font-bold text-slate-900 dark:text-white">% {p.margin}</div>
                     <div className="truncate">{p.name}</div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {/* 5. STAFF TAB */}
      {activeTab === 'staff' && (
        <div className="space-y-6">
           <div className="bg-white dark:bg-enterprise-800 p-6 rounded-2xl shadow-card border border-slate-100 dark:border-slate-800/60 transition-colors">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Award className="text-yellow-500" />
                    Personel Prim Performansı
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Primli ürün satışlarına göre hesaplanan tahmini hak edişler.</p>
                </div>
              </div>
              
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={staffCommissionData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} className="dark:stroke-slate-700" stroke="#e2e8f0" />
                    <XAxis type="number" tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 500}} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" width={120} tick={{fill: '#94a3b8', fontWeight: 'bold', fontSize: 13}} axisLine={false} tickLine={false} />
                    <Tooltip 
                      cursor={{fill: 'transparent'}} 
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                    <Bar dataKey="premiumSales" name="Primli Satış Tutarı (₺)" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20} />
                    <Bar dataKey="commission" name="Tahmini Prim (₺)" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
           </div>

           <div className="bg-white dark:bg-enterprise-800 rounded-2xl shadow-card border border-slate-100 dark:border-slate-800/60 overflow-hidden transition-colors">
             <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Personel</th>
                    <th className="px-6 py-4 text-right">Normal Satış</th>
                    <th className="px-6 py-4 text-right text-yellow-600 dark:text-yellow-400">Primli Satış</th>
                    <th className="px-6 py-4 text-right text-green-600 dark:text-green-400">Prim Hakediş (%5)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {staffCommissionData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white text-sm">{row.name}</td>
                      <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-300 font-medium">₺{row.normalSales.toLocaleString('tr-TR')}</td>
                      <td className="px-6 py-4 text-right font-bold text-yellow-600 dark:text-yellow-400 flex items-center justify-end gap-1">
                        {row.premiumSales > 0 && <Star size={14} className="fill-yellow-500 text-yellow-500" />}
                        ₺{row.premiumSales.toLocaleString('tr-TR')}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-green-600 dark:text-green-400">
                        ₺{row.commission.toLocaleString('tr-TR', {minimumFractionDigits: 2})}
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
           </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
