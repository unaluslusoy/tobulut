
import React, { useState, useEffect } from 'react';
import { 
  Megaphone, Plus, Calendar, Tag, Percent, Gift, 
  Trash2, CheckCircle, Clock, XCircle, Award, Trophy, Crown, Loader2
} from 'lucide-react';
import { api } from '../services/api';
import { Campaign, Account } from '../types';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

const Campaigns: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'campaigns' | 'loyalty'>('campaigns');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Permissions
  const canManage = ['superuser', 'admin', 'manager'].includes(user?.role || '');

  // Loyalty Settings (Mock)
  const [loyaltySettings, setLoyaltySettings] = useState({
    earnRate: 1, // 1 point per 1 TL
    redeemRate: 100, // 100 points = 1 TL discount
    minRedeem: 500,
    status: 'active'
  });

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        try {
            const [fetchedCampaigns, fetchedAccounts] = await Promise.all([
                api.campaigns.getAll(),
                api.accounts.getAll()
            ]);
            setCampaigns(fetchedCampaigns);
            setAccounts(fetchedAccounts);
        } catch (error) {
            console.error("Failed to load campaign data", error);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, []);

  const topCustomers = accounts
    .filter(a => (a.loyaltyPoints || 0) > 0)
    .sort((a, b) => (b.loyaltyPoints || 0) - (a.loyaltyPoints || 0))
    .slice(0, 5);
  
  // Form State
  const [formData, setFormData] = useState<Partial<Campaign>>({
    name: '',
    description: '',
    type: 'percentage',
    value: 0,
    startDate: '',
    endDate: '',
    status: 'scheduled',
    targetProducts: []
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;

    const now = new Date().toISOString().slice(0, 10);
    let status: Campaign['status'] = 'scheduled';
    if (formData.startDate && formData.startDate <= now) {
        status = 'active';
    }
    if (formData.endDate && formData.endDate < now) {
        status = 'ended';
    }

    const newCampaign: Campaign = {
      id: `CMP-${Date.now()}`,
      tenantId: user?.tenantId || 'tenant-1',
      name: formData.name || '',
      description: formData.description || '',
      type: formData.type as any,
      value: Number(formData.value) || 0,
      startDate: formData.startDate || '',
      endDate: formData.endDate || '',
      status: status,
      targetProducts: formData.targetProducts || ['Tüm Ürünler']
    };

    try {
        await api.campaigns.create(newCampaign);
        setCampaigns([newCampaign, ...campaigns]);
        setIsModalOpen(false);
        setFormData({ name: '', description: '', type: 'percentage', value: 0, startDate: '', endDate: '', status: 'scheduled', targetProducts: [] });
    } catch (error) {
        alert("Kampanya oluşturulurken hata oluştu.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!canManage) return;
    if (window.confirm('Kampanyayı silmek istediğinize emin misiniz?')) {
        try {
            await api.campaigns.delete(id);
            setCampaigns(campaigns.filter(c => c.id !== id));
        } catch (error) {
            console.error(error);
        }
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'active': return { color: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800', icon: CheckCircle, label: 'Aktif' };
      case 'scheduled': return { color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800', icon: Clock, label: 'Planlandı' };
      case 'ended': return { color: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600', icon: XCircle, label: 'Sona Erdi' };
      default: return { color: 'bg-slate-100', icon: Clock, label: status };
    }
  };

  const inputClass = "w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-all";

  if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen text-slate-500">
            <div className="flex flex-col items-center">
                <Loader2 size={40} className="animate-spin mb-4 text-brand-600" />
                <p>Kampanyalar yükleniyor...</p>
            </div>
        </div>
      );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Megaphone className="text-brand-600" />
            Kampanya ve Sadakat
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Promosyonlar ve müşteri sadakat programı yönetimi.</p>
        </div>
        <div className="flex gap-2">
           <button 
            onClick={() => setActiveTab('campaigns')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'campaigns' ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20' : 'bg-white dark:bg-enterprise-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          >
            Kampanyalar
          </button>
          <button 
            onClick={() => setActiveTab('loyalty')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'loyalty' ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20' : 'bg-white dark:bg-enterprise-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          >
            Sadakat Programı
          </button>
        </div>
      </div>

      {/* --- CAMPAIGNS TAB --- */}
      {activeTab === 'campaigns' && (
        <>
          <div className="flex justify-end mb-6">
            {canManage && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-bold hover:bg-brand-700 shadow-lg shadow-brand-600/20 transition-all hover:scale-105"
              >
                <Plus size={16} className="mr-2" />
                Yeni Kampanya
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map(camp => {
              const badge = getStatusBadge(camp.status);
              return (
                <div key={camp.id} className="bg-white dark:bg-enterprise-800 rounded-xl shadow-card border border-slate-200 dark:border-slate-700/50 p-6 hover:shadow-lg transition-all relative group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-brand-50 dark:bg-brand-900/30 rounded-lg text-brand-600 dark:text-brand-400">
                      <Megaphone size={24} />
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.color}`}>
                      <badge.icon size={12} className="mr-1" />
                      {badge.label}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{camp.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">{camp.description}</p>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700">
                      <div className="flex items-center text-slate-600 dark:text-slate-400">
                        <Tag size={14} className="mr-2" /> Değer
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {camp.type === 'percentage' ? `%${camp.value}` : `₺${camp.value}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700">
                      <div className="flex items-center text-slate-600 dark:text-slate-400">
                        <Calendar size={14} className="mr-2" /> Bitiş
                      </div>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {new Date(camp.endDate).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                  </div>

                  {canManage && (
                    <button 
                        onClick={() => handleDelete(camp.id)}
                        className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                    >
                        <Trash2 size={18} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* --- LOYALTY TAB --- */}
      {activeTab === 'loyalty' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Settings Card */}
           <div className="lg:col-span-2 bg-white dark:bg-enterprise-800 rounded-xl shadow-card border border-slate-200 dark:border-slate-700/50 p-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center">
                <Award className="mr-2 text-yellow-500" />
                Puan Kazanım Kuralları
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold mb-2">Kazanım Oranı</p>
                    <div className="text-3xl font-black text-brand-600 dark:text-brand-400 mb-1">%{loyaltySettings.earnRate}</div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">Her alışveriş tutarının %{loyaltySettings.earnRate}'i kadar puan kazanılır.</p>
                 </div>
                 <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold mb-2">Puan Değeri</p>
                    <div className="text-3xl font-black text-green-600 dark:text-green-400 mb-1">1 TL</div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">{loyaltySettings.redeemRate} Puan = 1 TL indirim sağlar.</p>
                 </div>
              </div>

              <div className="mt-8">
                 <h4 className="font-bold text-slate-900 dark:text-white mb-4">Program Durumu</h4>
                 <div className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                    <div className="p-2 bg-green-100 dark:bg-green-800 rounded-full text-green-600 dark:text-green-200">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <div className="font-bold text-green-800 dark:text-green-200">Sadakat Programı Aktif</div>
                        <p className="text-sm text-green-700 dark:text-green-300">Müşteriler alışverişlerinden puan kazanıyor.</p>
                    </div>
                    {canManage && (
                        <button className="ml-auto text-sm font-bold text-green-700 dark:text-green-300 underline">Ayarları Değiştir</button>
                    )}
                 </div>
              </div>
           </div>

           {/* Top Customers */}
           <div className="bg-white dark:bg-enterprise-800 rounded-xl shadow-card border border-slate-200 dark:border-slate-700/50 p-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center">
                <Trophy className="mr-2 text-yellow-500" />
                En Sadık Müşteriler
              </h3>
              <div className="space-y-4">
                 {topCustomers.map((cust, idx) => (
                    <div key={cust.id} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 rounded-lg transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                       <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : idx === 1 ? 'bg-gray-100 text-gray-700' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'}`}>
                             {idx + 1}
                          </div>
                          <div>
                             <div className="font-bold text-slate-900 dark:text-white text-sm">{cust.name}</div>
                             <div className="text-xs text-slate-500">{cust.accountCode}</div>
                          </div>
                       </div>
                       <div className="text-right">
                          <div className="font-black text-brand-600 dark:text-brand-400">{cust.loyaltyPoints}</div>
                          <div className="text-[10px] text-slate-400 uppercase font-bold">Puan</div>
                       </div>
                    </div>
                 ))}
                 {topCustomers.length === 0 && (
                    <div className="text-center text-slate-400 py-8">Henüz puan kazanan müşteri yok.</div>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* Modal for New Campaign */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Yeni Kampanya Oluştur" size="lg">
         <form onSubmit={handleSubmit} className="space-y-6">
            <div>
               <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Kampanya Adı</label>
               <input 
                 type="text" 
                 required 
                 value={formData.name} 
                 onChange={e => setFormData({...formData, name: e.target.value})} 
                 className={inputClass} 
                 placeholder="Örn: Yaz Sonu İndirimi"
               />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">İndirim Tipi</label>
                  <select 
                    value={formData.type} 
                    onChange={e => setFormData({...formData, type: e.target.value as any})} 
                    className={inputClass}
                  >
                    <option value="percentage">Yüzde İndirim (%)</option>
                    <option value="fixed_amount">Sabit Tutar (TL)</option>
                    <option value="bogo">Alana Bedava (BOGO)</option>
                  </select>
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Değer</label>
                  <input 
                    type="number" 
                    min="0" 
                    value={formData.value} 
                    onChange={e => setFormData({...formData, value: parseFloat(e.target.value)})} 
                    className={inputClass} 
                  />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Başlangıç Tarihi</label>
                  <input 
                    type="date" 
                    required 
                    value={formData.startDate} 
                    onChange={e => setFormData({...formData, startDate: e.target.value})} 
                    className={inputClass} 
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Bitiş Tarihi</label>
                  <input 
                    type="date" 
                    required 
                    value={formData.endDate} 
                    onChange={e => setFormData({...formData, endDate: e.target.value})} 
                    className={inputClass} 
                  />
               </div>
            </div>

            <div>
               <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Açıklama</label>
               <textarea 
                 rows={3} 
                 value={formData.description} 
                 onChange={e => setFormData({...formData, description: e.target.value})} 
                 className={inputClass} 
                 placeholder="Kampanya detayları..."
               />
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-700">
               <button 
                 type="button" 
                 onClick={() => setIsModalOpen(false)} 
                 className="px-4 py-2 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors mr-3"
               >
                 İptal
               </button>
               <button 
                 type="submit" 
                 className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 shadow-lg shadow-brand-600/30 font-bold transition-all"
               >
                 Kampanyayı Oluştur
               </button>
            </div>
         </form>
      </Modal>
    </div>
  );
};

export default Campaigns;
