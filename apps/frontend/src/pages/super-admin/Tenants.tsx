
import React, { useState, useEffect } from 'react';
import { 
  Plus, Building, Search, Filter, RefreshCw, MoreVertical, 
  Edit2, Trash2, Eye, Mail, Phone, Calendar, Package, 
  CheckCircle, XCircle, Clock, TrendingUp, Users, CreditCard,
  ExternalLink, Settings, BarChart3
} from 'lucide-react';
import { Tenant } from '../../types';
import { api } from '../../services/api';
import Modal from '../../components/Modal';

const Tenants: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const [form, setForm] = useState({
    companyName: '',
    email: '',
    password: '',
    packageId: '',
    type: 'corporate',
    taxNumber: '',
    phone: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tnts, pkgs] = await Promise.all([
        api.superAdmin.getTenants(),
        api.superAdmin.getPackages()
      ]);
      setTenants(tnts);
      setPackages(pkgs);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async () => {
    if (!form.companyName || !form.email || !form.password) {
      alert('Lütfen zorunlu alanları doldurun.');
      return;
    }

    try {
      // Backend expects these field names from super-admin.service.ts createTenant()
      const tenantData = {
        companyName: form.companyName,
        type: form.type,
        taxNumber: form.taxNumber,
        contactEmail: form.email,
        packageId: form.packageId || undefined,
        adminName: 'Yönetici',
        adminEmail: form.email,
        adminPassword: form.password
      };

      await api.superAdmin.createTenant(tenantData, {});
      await fetchData();
      setIsModalOpen(false);
      resetForm();
    } catch (error: any) {
      alert(error.message || 'Firma oluşturulurken hata oluştu.');
    }
  };

  const resetForm = () => {
    setForm({ companyName: '', email: '', password: '', packageId: '', type: 'corporate', taxNumber: '', phone: '' });
  };

  const handleViewDetail = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsDetailModalOpen(true);
    setActiveDropdown(null);
  };

  const handleDeleteTenant = async (id: string) => {
    if (!confirm('Bu firmayı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
      return;
    }
    
    try {
      await api.superAdmin.updateTenant({ id, status: 'inactive' });
      await fetchData();
      setActiveDropdown(null);
    } catch (error: any) {
      alert(error.message || 'Firma silinirken hata oluştu.');
    }
  };

  const handleToggleStatus = async (tenant: Tenant) => {
    const newStatus = tenant.status === 'active' ? 'inactive' : 'active';
    try {
      await api.superAdmin.updateTenant({ id: tenant.id, status: newStatus });
      await fetchData();
      setActiveDropdown(null);
    } catch (error: any) {
      alert(error.message || 'Durum güncellenirken hata oluştu.');
    }
  };

  const filteredTenants = tenants.filter(t => {
    const matchesSearch = searchQuery === '' ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.contactEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.taxNumber?.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: tenants.length,
    active: tenants.filter(t => t.status === 'active').length,
    inactive: tenants.filter(t => t.status === 'inactive').length,
    expiringSoon: tenants.filter(t => {
      if (!t.subscriptionEnd) return false;
      const diff = new Date(t.subscriptionEnd).getTime() - Date.now();
      return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
    }).length
  };

  const packageOptions = packages.map(p => ({
    value: p.id,
    label: `${p.name} - ₺${p.priceMonthly}/ay`
  }));

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building className="text-purple-500" />
            Aboneler & Firmalar
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Sistemdeki tüm kayıtlı firmaları yönetin.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl font-medium transition-colors"
          >
            <RefreshCw size={18} />
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-purple-500/20"
          >
            <Plus size={18} />
            Yeni Firma
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div 
          onClick={() => setStatusFilter('all')}
          className={`bg-white dark:bg-slate-800 p-4 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'all' ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
              <Building size={20} className="text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
              <p className="text-xs text-slate-500">Toplam Firma</p>
            </div>
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter('active')}
          className={`bg-white dark:bg-slate-800 p-4 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'active' ? 'border-green-500 ring-2 ring-green-500/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.active}</p>
              <p className="text-xs text-slate-500">Aktif</p>
            </div>
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter('inactive')}
          className={`bg-white dark:bg-slate-800 p-4 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'inactive' ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <XCircle size={20} className="text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.inactive}</p>
              <p className="text-xs text-slate-500">Pasif</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Clock size={20} className="text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.expiringSoon}</p>
              <p className="text-xs text-slate-500">Süresi Dolacak</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Firma adı, email veya vergi no ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="active">Aktif</option>
            <option value="inactive">Pasif</option>
          </select>
        </div>
      </div>

      {/* Tenants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading && (
          <div className="col-span-full flex items-center justify-center py-12">
            <RefreshCw size={24} className="animate-spin text-purple-500 mr-2" />
            <span className="text-slate-500">Yükleniyor...</span>
          </div>
        )}
        {!loading && filteredTenants.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-500">
            Kayıtlı firma bulunamadı.
          </div>
        )}
        {filteredTenants.map(tenant => (
          <div 
            key={tenant.id}
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-shadow group"
          >
            {/* Card Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-purple-500/20">
                    {tenant.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">{tenant.name}</h3>
                    <p className="text-xs text-slate-500">
                      {tenant.taxNumber ? `VN: ${tenant.taxNumber}` : 'Bireysel'}
                    </p>
                  </div>
                </div>
                <div className="relative">
                  <button 
                    onClick={() => setActiveDropdown(activeDropdown === tenant.id ? null : tenant.id)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <MoreVertical size={18} />
                  </button>
                  {activeDropdown === tenant.id && (
                    <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-10">
                      <button 
                        onClick={() => handleViewDetail(tenant)}
                        className="w-full text-left px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                      >
                        <Eye size={14} /> Detay
                      </button>
                      <button 
                        onClick={() => handleToggleStatus(tenant)}
                        className="w-full text-left px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                      >
                        {tenant.status === 'active' ? <XCircle size={14} /> : <CheckCircle size={14} />}
                        {tenant.status === 'active' ? 'Pasife Al' : 'Aktif Et'}
                      </button>
                      <hr className="my-1 border-slate-100 dark:border-slate-700" />
                      <button 
                        onClick={() => handleDeleteTenant(tenant.id)}
                        className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                      >
                        <Trash2 size={14} /> Sil
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail size={14} className="text-slate-400" />
                <span className="text-slate-600 dark:text-slate-300 truncate">{tenant.contactEmail}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package size={14} className="text-slate-400" />
                  <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-medium rounded-full">
                    {tenant.subscriptionPackage?.name || 'Paketsiz'}
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  tenant.status === 'active' 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                    : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                }`}>
                  {tenant.status === 'active' ? 'Aktif' : 'Pasif'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-700">
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {tenant.subscriptionEnd ? new Date(tenant.subscriptionEnd).toLocaleDateString('tr-TR') : 'Süresiz'}
                </span>
                <button 
                  onClick={() => handleViewDetail(tenant)}
                  className="text-purple-500 hover:text-purple-600 font-medium flex items-center gap-1"
                >
                  Detay <ExternalLink size={12} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); resetForm(); }} 
        title="Yeni Firma Oluştur" 
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Firma Adı</label>
            <input
              type="text"
              value={form.companyName}
              onChange={e => setForm({...form, companyName: e.target.value})}
              placeholder="Şirket Ünvanı"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tip</label>
              <select
                value={form.type}
                onChange={e => setForm({...form, type: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
              >
                <option value="corporate">Kurumsal</option>
                <option value="individual">Bireysel</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Vergi No / TC</label>
              <input
                type="text"
                value={form.taxNumber}
                onChange={e => setForm({...form, taxNumber: e.target.value})}
                placeholder="1234567890"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Yönetici E-posta</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              placeholder="admin@sirket.com"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Geçici Şifre</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Abonelik Paketi</label>
            <select
              value={form.packageId}
              onChange={e => setForm({...form, packageId: e.target.value})}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
            >
              <option value="">Paket Seçiniz</option>
              {packageOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button 
              onClick={() => { setIsModalOpen(false); resetForm(); }}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              İptal
            </button>
            <button 
              onClick={handleSubmit}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-purple-500/20"
            >
              Kaydet
            </button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal 
        isOpen={isDetailModalOpen} 
        onClose={() => setIsDetailModalOpen(false)} 
        title="Firma Detayı" 
        size="lg"
      >
        {selectedTenant && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl text-white">
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center text-2xl font-bold">
                {selectedTenant.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold">{selectedTenant.name}</h2>
                <p className="text-white/80">{selectedTenant.contactEmail}</p>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <Package size={16} className="text-slate-400" />
                  <span className="text-xs text-slate-500">Paket</span>
                </div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {selectedTenant.subscriptionPackage?.name || 'Paketsiz'}
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle size={16} className="text-slate-400" />
                  <span className="text-xs text-slate-500">Durum</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  selectedTenant.status === 'active'
                    ? 'bg-green-100 text-green-600'
                    : 'bg-red-100 text-red-600'
                }`}>
                  {selectedTenant.status === 'active' ? 'Aktif' : 'Pasif'}
                </span>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard size={16} className="text-slate-400" />
                  <span className="text-xs text-slate-500">Vergi No</span>
                </div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {selectedTenant.taxNumber || '-'}
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar size={16} className="text-slate-400" />
                  <span className="text-xs text-slate-500">Bitiş Tarihi</span>
                </div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {selectedTenant.subscriptionEnd 
                    ? new Date(selectedTenant.subscriptionEnd).toLocaleDateString('tr-TR')
                    : 'Süresiz'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                <Edit2 size={16} /> Düzenle
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                <BarChart3 size={16} /> Raporlar
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                <ExternalLink size={16} /> Panele Git
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Tenants;
