
import React, { useState, useEffect } from 'react';
import { 
  Package, Users, CreditCard, Shield, Activity, 
  Search, Plus, MoreVertical, CheckCircle, XCircle, LayoutGrid, Key, Building,
  MessageSquare, DollarSign, Wallet, ExternalLink, HelpCircle
} from 'lucide-react';
import { SubscriptionPackage, ModuleType, Tenant, SystemUser, SaaSSupportTicket, SaaSPayment } from '../types';
import Modal from '../components/Modal';
import { api } from '../services/api';

const SuperAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tenants' | 'packages' | 'revenue' | 'support'>('tenants');
  const [loading, setLoading] = useState(false);
  
  // Data
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tickets, setTickets] = useState<SaaSSupportTicket[]>([]);
  const [payments, setPayments] = useState<SaaSPayment[]>([]);

  // Modals
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SaaSSupportTicket | null>(null);
  const [ticketReply, setTicketReply] = useState('');

  // Forms
  const [packageForm, setPackageForm] = useState<Partial<SubscriptionPackage>>({
    name: '', priceMonthly: 0, priceYearly: 0, maxUsers: 5, storageLimit: '10GB', features: [], modules: [], isPopular: false
  });

  const [tenantForm, setTenantForm] = useState({
    companyName: '',
    email: '',
    password: '',
    packageId: ''
  });

  useEffect(() => {
      fetchData();
  }, [activeTab]);

  const fetchData = async () => {
      setLoading(true);
      try {
          const [pkgs, tnts, tkts, pays] = await Promise.all([
              api.superAdmin.getPackages(),
              api.superAdmin.getTenants(),
              api.superAdmin.getSupportTickets(),
              api.superAdmin.getPayments()
          ]);
          setPackages(pkgs);
          setTenants(tnts);
          setTickets(tkts);
          setPayments(pays);
      } catch (error) {
          console.error(error);
      } finally {
          setLoading(false);
      }
  };

  const availableModules: {id: ModuleType, label: string}[] = [
    { id: 'finance', label: 'Finans & Muhasebe' },
    { id: 'inventory', label: 'Stok Yönetimi' },
    { id: 'sales', label: 'Satış & Teklif' },
    { id: 'hr', label: 'İnsan Kaynakları' },
    { id: 'reports', label: 'Raporlama' },
    { id: 'service', label: 'Teknik Servis' },
    { id: 'settings', label: 'Gelişmiş Ayarlar' },
  ];

  // --- Package Handlers ---
  const handleOpenPackageModal = (pkg?: SubscriptionPackage) => {
    if (pkg) {
      setPackageForm(pkg);
    } else {
      setPackageForm({ name: '', priceMonthly: 0, priceYearly: 0, maxUsers: 5, storageLimit: '10GB', features: [], modules: [], isPopular: false });
    }
    setIsPackageModalOpen(true);
  };

  const toggleModule = (moduleId: ModuleType) => {
    const currentModules = packageForm.modules || [];
    if (currentModules.includes(moduleId)) {
      setPackageForm({ ...packageForm, modules: currentModules.filter(m => m !== moduleId) });
    } else {
      setPackageForm({ ...packageForm, modules: [...currentModules, moduleId] });
    }
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!packageForm.name) return;
    
    const pkg = { 
        ...packageForm, 
        id: packageForm.id || `PKG-${Date.now()}` 
    } as SubscriptionPackage;

    await api.superAdmin.savePackage(pkg);
    fetchData();
    setIsPackageModalOpen(false);
  };

  // --- Tenant Handlers ---
  const handleSaveTenant = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!tenantForm.companyName || !tenantForm.email || !tenantForm.password) return;

      const tenantId = `TENANT-${Date.now()}`;
      
      const newTenant: Tenant = {
          id: tenantId,
          name: tenantForm.companyName,
          contactEmail: tenantForm.email,
          subscriptionPlanId: tenantForm.packageId || packages[0]?.id,
          subscriptionStatus: 'active',
          subscriptionEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
          createdAt: new Date().toISOString(),
          adminUserId: `ADM-${Date.now()}`
      };

      const newAdmin: SystemUser = {
          id: newTenant.adminUserId,
          tenantId: tenantId,
          name: `${tenantForm.companyName} Admin`,
          email: tenantForm.email,
          role: 'admin',
          status: 'active',
          lastLogin: '',
          avatar: `https://ui-avatars.com/api/?name=${tenantForm.companyName}`,
          allowedModules: [] // Full Access for Tenant Admin
      };

      await api.superAdmin.createTenant(newTenant, newAdmin);
      fetchData();
      setIsTenantModalOpen(false);
      setTenantForm({ companyName: '', email: '', password: '', packageId: '' });
  };

  // --- Ticket Handlers ---
  const handleOpenTicket = (ticket: SaaSSupportTicket) => {
      setSelectedTicket(ticket);
      setTicketReply('');
      setIsTicketModalOpen(true);
  };

  const handleSendReply = async () => {
      if(!selectedTicket) return;
      const updatedTicket = {
          ...selectedTicket,
          status: 'in_progress' as const, // or closed depending on logic, here assume WIP
          lastReplyAt: new Date().toISOString()
          // In real app, we would append the message to a sub-collection
      };
      await api.superAdmin.updateSupportTicket(updatedTicket);
      
      // Update local state
      setTickets(tickets.map(t => t.id === updatedTicket.id ? updatedTicket : t));
      setIsTicketModalOpen(false);
      alert("Yanıt gönderildi.");
  };

  const handleCloseTicket = async () => {
      if(!selectedTicket) return;
      const updatedTicket = { ...selectedTicket, status: 'resolved' as const };
      await api.superAdmin.updateSupportTicket(updatedTicket);
      setTickets(tickets.map(t => t.id === updatedTicket.id ? updatedTicket : t));
      setIsTicketModalOpen(false);
  };

  const inputClass = "w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none";

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="text-purple-600" />
            Süper Yönetici Paneli
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Platform geneli paket, müşteri ve gelir yönetimi.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-enterprise-800 p-6 rounded-xl shadow-card border border-slate-200 dark:border-slate-700/50">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Toplam Ciro (Bu Ay)</p>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white">
              ₺{payments.reduce((acc, p) => acc + p.amount, 0).toLocaleString()}
          </h3>
        </div>
        <div className="bg-white dark:bg-enterprise-800 p-6 rounded-xl shadow-card border border-slate-200 dark:border-slate-700/50">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Aktif Abonelik</p>
          <h3 className="text-3xl font-black text-green-600">{tenants.filter(t => t.subscriptionStatus === 'active').length}</h3>
        </div>
        <div className="bg-white dark:bg-enterprise-800 p-6 rounded-xl shadow-card border border-slate-200 dark:border-slate-700/50">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Açık Destek Talebi</p>
          <h3 className="text-3xl font-black text-blue-600">{tickets.filter(t => t.status === 'open').length}</h3>
        </div>
        <div className="bg-white dark:bg-enterprise-800 p-6 rounded-xl shadow-card border border-slate-200 dark:border-slate-700/50">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Paket Sayısı</p>
          <h3 className="text-3xl font-black text-orange-500">{packages.length}</h3>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-enterprise-800 rounded-2xl shadow-card border border-slate-200 dark:border-slate-700/50 overflow-hidden min-h-[600px]">
        <div className="flex border-b border-slate-200 dark:border-slate-700/50 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('tenants')}
            className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'tenants' ? 'border-brand-600 text-brand-600 dark:text-brand-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
          >
            Aboneler (Firmalar)
          </button>
          <button 
            onClick={() => setActiveTab('packages')}
            className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'packages' ? 'border-brand-600 text-brand-600 dark:text-brand-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
          >
            Paket Yönetimi
          </button>
          <button 
            onClick={() => setActiveTab('revenue')}
            className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'revenue' ? 'border-brand-600 text-brand-600 dark:text-brand-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
          >
            Finans & Ödemeler
          </button>
          <button 
            onClick={() => setActiveTab('support')}
            className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'support' ? 'border-brand-600 text-brand-600 dark:text-brand-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
          >
            Destek Merkezi
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'tenants' && (
            <div>
              <div className="flex justify-between mb-4">
                <div className="relative">
                  <input type="text" placeholder="Firma ara..." className="pl-10 pr-4 py-2 border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white" />
                  <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                </div>
                <button onClick={() => setIsTenantModalOpen(true)} className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-brand-700 transition-colors">
                  Firma Ekle & Ata
                </button>
              </div>
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-xs uppercase text-slate-500 font-bold">
                  <tr>
                    <th className="px-6 py-3">Firma Adı</th>
                    <th className="px-6 py-3">Admin Email</th>
                    <th className="px-6 py-3">Paket</th>
                    <th className="px-6 py-3">Durum</th>
                    <th className="px-6 py-3">Bitiş Tarihi</th>
                    <th className="px-6 py-3 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {tenants.map(tenant => {
                    const pkgName = packages.find(p => p.id === tenant.subscriptionPlanId)?.name || 'Bilinmiyor';
                    return (
                        <tr key={tenant.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{tenant.name}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{tenant.contactEmail}</td>
                        <td className="px-6 py-4 text-sm"><span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded-full text-xs font-bold">{pkgName}</span></td>
                        <td className="px-6 py-4">
                            {tenant.subscriptionStatus === 'active' 
                            ? <span className="flex items-center text-green-600 text-xs font-bold"><CheckCircle size={14} className="mr-1"/> Aktif</span>
                            : <span className="flex items-center text-red-600 text-xs font-bold"><XCircle size={14} className="mr-1"/> Pasif</span>
                            }
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{new Date(tenant.subscriptionEndDate).toLocaleDateString('tr-TR')}</td>
                        <td className="px-6 py-4 text-right">
                            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-white"><MoreVertical size={18} /></button>
                        </td>
                        </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'packages' && (
            <div>
              <div className="flex justify-end mb-6">
                <button 
                  onClick={() => handleOpenPackageModal()}
                  className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-brand-700 transition-colors flex items-center"
                >
                  <Plus size={16} className="mr-2" /> Yeni Paket
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {packages.map(pkg => (
                  <div key={pkg.id} className={`border rounded-xl p-6 relative ${pkg.isPopular ? 'border-brand-500 shadow-lg bg-brand-50 dark:bg-brand-900/10' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}>
                    {pkg.isPopular && <span className="absolute top-0 right-0 bg-brand-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">POPÜLER</span>}
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{pkg.name}</h3>
                    <div className="text-3xl font-black text-slate-900 dark:text-white mb-4">
                      ₺{pkg.priceMonthly}<span className="text-sm font-medium text-slate-500">/ay</span>
                    </div>
                    <ul className="space-y-3 mb-6">
                      <li className="flex items-center text-sm text-slate-700 dark:text-slate-300">
                        <Users size={16} className="mr-2 text-slate-400" />
                        {pkg.maxUsers === 9999 ? 'Sınırsız' : pkg.maxUsers} Kullanıcı
                      </li>
                      <li className="flex items-center text-sm text-slate-700 dark:text-slate-300">
                        <Activity size={16} className="mr-2 text-slate-400" />
                        {pkg.storageLimit} Depolama
                      </li>
                      <li className="flex items-start text-sm text-slate-700 dark:text-slate-300 pt-2 border-t border-slate-200 dark:border-slate-700 mt-2">
                        <LayoutGrid size={16} className="mr-2 text-slate-400 mt-0.5" />
                        <div className="flex flex-wrap gap-1">
                          {pkg.modules.map(m => (
                            <span key={m} className="text-xs bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded capitalize">{m}</span>
                          ))}
                        </div>
                      </li>
                    </ul>
                    <button 
                      onClick={() => handleOpenPackageModal(pkg)}
                      className="w-full py-2 border border-slate-300 dark:border-slate-600 rounded-lg font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      Düzenle
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'revenue' && (
            <div>
                <div className="mb-6 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Son Ödemeler</h3>
                    <div className="text-sm text-slate-500">Son 30 günün kayıtları</div>
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800 text-xs uppercase text-slate-500 font-bold">
                            <tr>
                                <th className="px-6 py-3">Tarih</th>
                                <th className="px-6 py-3">Firma</th>
                                <th className="px-6 py-3">Paket</th>
                                <th className="px-6 py-3">Dönem</th>
                                <th className="px-6 py-3">Tutar</th>
                                <th className="px-6 py-3 text-right">Durum</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {payments.map(pay => (
                                <tr key={pay.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{new Date(pay.date).toLocaleDateString('tr-TR')}</td>
                                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{pay.tenantName}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{pay.planName}</td>
                                    <td className="px-6 py-4 text-sm capitalize text-slate-600 dark:text-slate-300">{pay.period}</td>
                                    <td className="px-6 py-4 font-mono font-bold text-green-600">₺{pay.amount.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded text-xs font-bold">
                                            Ödendi
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
          )}

          {activeTab === 'support' && (
              <div>
                  <div className="grid grid-cols-1 gap-4">
                      {tickets.map(ticket => (
                          <div 
                            key={ticket.id} 
                            className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => handleOpenTicket(ticket)}
                          >
                              <div className="flex justify-between items-start mb-2">
                                  <div>
                                      <div className="flex items-center gap-2">
                                          <span className={`w-2 h-2 rounded-full ${ticket.status === 'open' ? 'bg-red-500' : ticket.status === 'resolved' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                                          <h4 className="font-bold text-slate-900 dark:text-white">{ticket.subject}</h4>
                                      </div>
                                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{ticket.message}</p>
                                  </div>
                                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${ticket.priority === 'high' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                      {ticket.priority}
                                  </span>
                              </div>
                              <div className="flex justify-between items-center text-xs text-slate-400 border-t border-slate-100 dark:border-slate-700 pt-2 mt-2">
                                  <span className="flex items-center gap-1"><Building size={12}/> {ticket.tenantName}</span>
                                  <span>{new Date(ticket.createdAt).toLocaleString('tr-TR')}</span>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}
        </div>
      </div>

      {/* Package Edit Modal */}
      <Modal isOpen={isPackageModalOpen} onClose={() => setIsPackageModalOpen(false)} title={packageForm.id ? "Paketi Düzenle" : "Yeni Paket Oluştur"} size="lg">
        <form onSubmit={handleSavePackage} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase">Paket Adı</label>
              <input type="text" value={packageForm.name} onChange={e => setPackageForm({...packageForm, name: e.target.value})} className={inputClass} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase">Aylık Ücret (TL)</label>
              <input type="number" value={packageForm.priceMonthly} onChange={e => setPackageForm({...packageForm, priceMonthly: Number(e.target.value)})} className={inputClass} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase">Yıllık Ücret (TL)</label>
              <input type="number" value={packageForm.priceYearly} onChange={e => setPackageForm({...packageForm, priceYearly: Number(e.target.value)})} className={inputClass} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase">Kullanıcı Limiti</label>
              <input type="number" value={packageForm.maxUsers} onChange={e => setPackageForm({...packageForm, maxUsers: Number(e.target.value)})} className={inputClass} required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-900 dark:text-white mb-3">Modül Seçimi (Dahil Olan Özellikler)</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableModules.map(module => (
                <div 
                  key={module.id} 
                  onClick={() => toggleModule(module.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center ${
                    packageForm.modules?.includes(module.id)
                      ? 'bg-brand-50 border-brand-500 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400'
                      : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded border mr-3 flex items-center justify-center ${packageForm.modules?.includes(module.id) ? 'bg-brand-600 border-brand-600' : 'border-slate-400'}`}>
                    {packageForm.modules?.includes(module.id) && <CheckCircle size={14} className="text-white" />}
                  </div>
                  <span className="text-sm font-medium">{module.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
            <input 
              type="checkbox" 
              id="isPopular"
              checked={packageForm.isPopular}
              onChange={e => setPackageForm({...packageForm, isPopular: e.target.checked})}
              className="w-5 h-5 text-brand-600 rounded"
            />
            <label htmlFor="isPopular" className="text-sm font-bold cursor-pointer">Bu paketi "Popüler" olarak işaretle</label>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
            <button type="submit" className="bg-brand-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-brand-700 shadow-lg shadow-brand-600/20 transition-all">
              Paketi Kaydet
            </button>
          </div>
        </form>
      </Modal>

      {/* Tenant Create Modal */}
      <Modal isOpen={isTenantModalOpen} onClose={() => setIsTenantModalOpen(false)} title="Yeni Firma & Yönetici Oluştur" size="md">
          <form onSubmit={handleSaveTenant} className="space-y-6">
              <div>
                  <label className="block text-sm font-bold mb-1">Firma Adı</label>
                  <div className="relative">
                      <Building className="absolute left-3 top-2.5 text-slate-400" size={18} />
                      <input type="text" value={tenantForm.companyName} onChange={e => setTenantForm({...tenantForm, companyName: e.target.value})} className={`${inputClass} pl-10`} required placeholder="Şirket Adı Ltd. Şti." />
                  </div>
              </div>
              <div>
                  <label className="block text-sm font-bold mb-1">Yönetici E-posta</label>
                  <input type="email" value={tenantForm.email} onChange={e => setTenantForm({...tenantForm, email: e.target.value})} className={inputClass} required placeholder="admin@sirket.com" />
              </div>
              <div>
                  <label className="block text-sm font-bold mb-1">Yönetici Şifre</label>
                  <div className="relative">
                      <Key className="absolute left-3 top-2.5 text-slate-400" size={18} />
                      <input type="password" value={tenantForm.password} onChange={e => setTenantForm({...tenantForm, password: e.target.value})} className={`${inputClass} pl-10`} required placeholder="******" />
                  </div>
              </div>
              <div>
                  <label className="block text-sm font-bold mb-1">Paket Seçimi</label>
                  <select value={tenantForm.packageId} onChange={e => setTenantForm({...tenantForm, packageId: e.target.value})} className={inputClass}>
                      <option value="">Seçiniz...</option>
                      {packages.map(p => (
                          <option key={p.id} value={p.id}>{p.name} - ₺{p.priceMonthly}/ay</option>
                      ))}
                  </select>
              </div>
              <div className="flex justify-end pt-4">
                  <button type="submit" className="bg-brand-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-brand-700 transition-all">
                      Firma Oluştur
                  </button>
              </div>
          </form>
      </Modal>

      {/* Ticket Detail & Reply Modal */}
      <Modal isOpen={isTicketModalOpen} onClose={() => setIsTicketModalOpen(false)} title="Destek Talebi" size="md">
          {selectedTicket && (
              <div className="space-y-6">
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="flex justify-between items-start mb-4">
                          <div>
                              <h3 className="font-bold text-lg text-slate-900 dark:text-white">{selectedTicket.subject}</h3>
                              <p className="text-sm text-slate-500 dark:text-slate-400">{selectedTicket.tenantName} • {selectedTicket.userEmail}</p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${selectedTicket.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {selectedTicket.status}
                          </span>
                      </div>
                      <div className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap">
                          {selectedTicket.message}
                      </div>
                  </div>

                  <div>
                      <label className="block text-sm font-bold mb-2">Yanıtla</label>
                      <textarea 
                          rows={4} 
                          className={inputClass} 
                          placeholder="Müşteriye yanıtınızı yazın..."
                          value={ticketReply}
                          onChange={(e) => setTicketReply(e.target.value)}
                      ></textarea>
                  </div>

                  <div className="flex justify-between items-center pt-4">
                      <button 
                          onClick={handleCloseTicket}
                          className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white text-sm font-medium"
                      >
                          Talebi Kapat
                      </button>
                      <button 
                          onClick={handleSendReply}
                          disabled={!ticketReply}
                          className="bg-brand-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-brand-700 transition-all disabled:opacity-50"
                      >
                          Yanıtı Gönder
                      </button>
                  </div>
              </div>
          )}
      </Modal>
    </div>
  );
};

export default SuperAdmin;
