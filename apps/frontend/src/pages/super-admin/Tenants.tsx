import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, CreditCard, Search, Filter, MoreVertical, 
  Trash2, Edit, AlertCircle, CheckCircle, Package, Calendar, 
  Mail, Phone, Lock, Eye, EyeOff, MapPin, FileText, Smartphone,
  UserPlus, Camera, Plus, RefreshCw, XCircle, Clock, TrendingUp,
  ExternalLink, Settings, BarChart3, Edit2
} from 'lucide-react';
import { Tenant } from '../../types';
import { api } from '../../services/api';
import Modal from '../../components/Modal';
import Swal from 'sweetalert2';

// Custom Toast notification - minimal style
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  background: '#1e293b',
  color: '#f8fafc',
  iconColor: '#a855f7',
  customClass: {
    popup: '!rounded-xl !shadow-2xl !border !border-slate-700/50 !backdrop-blur-xl',
    title: '!text-sm !font-medium',
    timerProgressBar: '!bg-purple-500'
  },
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  }
});

// Custom confirm dialog - matching theme
const showConfirmDialog = (options: {
  title: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  type: 'danger' | 'warning' | 'success';
}) => {
  const colors = {
    danger: { bg: '#fef2f2', icon: '#ef4444', btn: '#ef4444' },
    warning: { bg: '#fffbeb', icon: '#f59e0b', btn: '#f59e0b' },
    success: { bg: '#f0fdf4', icon: '#22c55e', btn: '#22c55e' }
  };
  const color = colors[options.type];
  
  return Swal.fire({
    title: options.title,
    html: `
      <div style="padding: 16px 0;">
        <p style="color: #64748b; font-size: 14px; line-height: 1.6;">${options.message}</p>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: options.confirmText,
    cancelButtonText: options.cancelText || 'İptal',
    confirmButtonColor: color.btn,
    cancelButtonColor: '#94a3b8',
    reverseButtons: true,
    focusCancel: true,
    background: '#ffffff',
    color: '#1e293b',
    customClass: {
      container: '!z-[99999]',
      popup: '!rounded-2xl !shadow-2xl !border-0 !p-0 !overflow-hidden !z-[99999]',
      title: '!text-lg !font-semibold !pt-6 !px-6 !pb-0 !text-left',
      htmlContainer: '!px-6 !m-0',
      actions: '!px-6 !pb-6 !pt-4 !border-t !border-slate-100 !bg-slate-50/50',
      confirmButton: '!rounded-xl !px-5 !py-2.5 !text-sm !font-medium !shadow-lg',
      cancelButton: '!rounded-xl !px-5 !py-2.5 !text-sm !font-medium !bg-white !text-slate-700 !border !border-slate-200 hover:!bg-slate-50'
    },
    showClass: {
      popup: 'animate__animated animate__fadeIn animate__faster'
    },
    hideClass: {
      popup: 'animate__animated animate__fadeOut animate__faster'
    }
  });
};

// Mask helpers
const formatPhoneNumber = (value: string) => {
  if (!value) return value;
  const phoneNumber = value.replace(/[^\d]/g, '');
  const phoneNumberLength = phoneNumber.length;
  if (phoneNumberLength < 4) return phoneNumber;
  if (phoneNumberLength < 7) {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
  }
  return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)} ${phoneNumber.slice(6, 8)} ${phoneNumber.slice(8, 11)}`;
};

const formatTaxNumber = (value: string) => {
  return value.replace(/[^\d]/g, '').slice(0, 11);
};

const Tenants: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'trial'>('all');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editingTenantId, setEditingTenantId] = useState<string | null>(null);

  // Form states
  const [isIndefinite, setIsIndefinite] = useState(false);
  const [form, setForm] = useState({
    // Company Info
    companyName: '',
    type: 'corporate' as 'corporate' | 'individual',
    taxNumber: '',
    taxOffice: '',
    address: '',
    phone: '',
    gsm: '',
    contactEmail: '', // Official company email
    
    // Admin Info
    adminName: '', // Full Name
    email: '', // Admin Login Email
    password: '',
    forcePasswordChange: true,
    avatar: '', // Base64 string

    // Subscription
    packageId: '',
    subscriptionEnd: '' // YYYY-MM-DD
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
    // Basic validation
    if (!form.companyName) {
      Toast.fire({ icon: 'warning', title: 'Firma adı zorunludur.' });
      return;
    }
    
    // Email validation
    if (!form.contactEmail) {
      Toast.fire({ icon: 'warning', title: 'Firma e-posta adresi zorunludur.' });
      return;
    }
    
    // Tax validation for corporate
    if (form.type === 'corporate' && (!form.taxNumber || !form.taxOffice)) {
      Toast.fire({ icon: 'warning', title: 'Kurumsal firmalar için vergi no ve dairesi zorunludur.' });
      return;
    }

    if (!editMode) {
      // New tenant validation
      if (!form.adminName) {
        Toast.fire({ icon: 'warning', title: 'Yönetici adı zorunludur.' });
        return;
      }
      if (!form.email) {
        Toast.fire({ icon: 'warning', title: 'Yönetici e-posta adresi zorunludur.' });
        return;
      }
      if (!form.password || form.password.length < 6) {
        Toast.fire({ icon: 'warning', title: 'Şifre en az 6 karakter olmalıdır.' });
        return;
      }
    }

    try {
      if (editMode && editingTenantId) {
        // Update existing tenant
        await api.superAdmin.updateTenant(editingTenantId, {
          name: form.companyName,
          type: form.type,
          taxNumber: form.taxNumber,
          taxOffice: form.taxOffice,
          contactEmail: form.contactEmail,
          contactPhone: form.phone,
          address: form.address,
          config: form.gsm ? { gsm: form.gsm } : undefined,
          packageId: form.packageId || undefined,
          subscriptionEnd: isIndefinite ? null : (form.subscriptionEnd ? new Date(form.subscriptionEnd) : undefined)
        });
      } else {
        // Create new tenant
        const tenantData = {
          // Company Info
          companyName: form.companyName,
          type: form.type,
          taxNumber: form.taxNumber,
          taxOffice: form.taxOffice,
          address: form.address,
          phone: form.phone,
          gsm: form.gsm,
          contactEmail: form.contactEmail,
          
          // Admin Info
          adminName: form.adminName,
          email: form.email,
          password: form.password,
          forcePasswordChange: form.forcePasswordChange,
          avatar: form.avatar,

          // Subscription
          packageId: form.packageId || undefined,
          isIndefinite: isIndefinite,
          subscriptionEnd: form.subscriptionEnd
        };
        await api.superAdmin.createTenant(tenantData, {});
      }
      
      await fetchData();
      setIsModalOpen(false);
      resetForm();
      Toast.fire({
        icon: 'success',
        title: editMode ? 'Firma güncellendi' : 'Firma oluşturuldu'
      });
    } catch (error: any) {
      console.error('Save error:', error);
      Toast.fire({
        icon: 'error',
        title: error.message || 'İşlem sırasında hata oluştu'
      });
    }
  };

  const resetForm = () => {
    setForm({
      companyName: '',
      type: 'corporate',
      taxNumber: '',
      taxOffice: '',
      address: '',
      phone: '',
      gsm: '',
      contactEmail: '',
      adminName: '',
      email: '',
      password: '',
      forcePasswordChange: true,
      avatar: '',
      packageId: '',
      subscriptionEnd: ''
    });
    setEditMode(false);
    setEditingTenantId(null);
    setIsIndefinite(false);
  };

  const handleEditTenant = (tenant: Tenant) => {
    setForm({
      companyName: tenant.name,
      type: tenant.type || 'corporate',
      taxNumber: tenant.taxNumber || '',
      taxOffice: tenant.taxOffice || '', // Need to add to type
      address: (tenant.address as any)?.fullAddress || '',
      phone: tenant.contactPhone || '',
      gsm: (tenant.config as any)?.gsm || '',
      contactEmail: tenant.contactEmail || '',
      
      // Admin info not editable here directly for security, separate user manage
      adminName: '', 
      email: '',
      password: '',
      forcePasswordChange: false,
      avatar: '',
      
      packageId: tenant.subscriptionPackage?.id || '',
      subscriptionEnd: tenant.subscriptionEnd ? new Date(tenant.subscriptionEnd).toISOString().split('T')[0] : ''
    });
    setIsIndefinite(!tenant.subscriptionEnd);
    setEditMode(true);
    setEditingTenantId(tenant.id);
    setIsModalOpen(true);
    setActiveDropdown(null);
  };

  const handleViewDetail = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsDetailModalOpen(true);
    setActiveDropdown(null);
  };

  const handleDeleteTenant = async (id: string) => {
    console.log('Delete tenant called with id:', id);
    
    const result = await showConfirmDialog({
      title: 'Firmayı Sil',
      message: 'Bu firmayı silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve tüm firma verileri silinecektir.',
      confirmText: 'Evet, Sil',
      type: 'danger'
    });

    console.log('Dialog result:', result);

    if (!result.isConfirmed) {
      console.log('User cancelled delete');
      setActiveDropdown(null);
      return;
    }
    
    try {
      console.log('Calling API to delete tenant:', id);
      const response = await api.superAdmin.deleteTenant(id);
      console.log('Delete response:', response);
      await fetchData();
      setActiveDropdown(null);
      Toast.fire({ icon: 'success', title: 'Firma başarıyla silindi' });
    } catch (error: any) {
      console.error('Delete error full:', error);
      Toast.fire({ icon: 'error', title: error.message || 'Firma silinirken hata oluştu' });
    }
  };

  const handleToggleStatus = async (tenant: Tenant) => {
    const newStatus = tenant.status === 'active' ? 'suspended' : 'active';
    const statusText = newStatus === 'active' ? 'aktif' : 'pasif';
    const actionText = newStatus === 'active' ? 'aktif etmek' : 'pasife almak';
    
    const result = await showConfirmDialog({
      title: newStatus === 'active' ? 'Firmayı Aktif Et' : 'Firmayı Pasife Al',
      message: `"${tenant.name}" firmasını ${actionText} istediğinize emin misiniz?`,
      confirmText: newStatus === 'active' ? 'Aktif Et' : 'Pasife Al',
      type: newStatus === 'active' ? 'success' : 'warning'
    });

    if (!result.isConfirmed) {
      setActiveDropdown(null);
      return;
    }
    
    try {
      await api.superAdmin.updateTenant(tenant.id, { status: newStatus });
      await fetchData();
      setActiveDropdown(null);
      Toast.fire({ icon: 'success', title: `Firma ${statusText} duruma alındı` });
    } catch (error: any) {
      Toast.fire({ icon: 'error', title: error.message || 'Durum güncellenirken hata oluştu' });
    }
  };

  const filteredTenants = tenants.filter(t => {
    const matchesSearch = searchQuery === '' ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.contactEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.taxNumber?.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && t.status === 'active') ||
      (statusFilter === 'suspended' && t.status === 'suspended') ||
      (statusFilter === 'trial' && t.status === 'trial');
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: tenants.length,
    active: tenants.filter(t => t.status === 'active').length,
    suspended: tenants.filter(t => t.status === 'suspended').length,
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
            <Building2 className="text-purple-500" />
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
              <Building2 size={20} className="text-slate-600 dark:text-slate-400" />
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
          onClick={() => setStatusFilter('suspended')}
          className={`bg-white dark:bg-slate-800 p-4 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'suspended' ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <XCircle size={20} className="text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.suspended}</p>
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
            <option value="suspended">Pasif</option>
            <option value="trial">Deneme</option>
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
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow group relative"
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
                      <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-[9999]">
                        <button 
                          onClick={() => handleViewDetail(tenant)}
                          className="w-full text-left px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 flex items-center gap-2.5 transition-colors"
                        >
                          <Eye size={15} className="text-purple-500" />
                          <span>Görüntüle</span>
                        </button>
                        <button 
                          onClick={() => handleEditTenant(tenant)}
                          className="w-full text-left px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-2.5 transition-colors"
                        >
                          <Edit2 size={15} className="text-blue-500" />
                          <span>Düzenle</span>
                        </button>
                        <button 
                          onClick={() => handleToggleStatus(tenant)}
                          className="w-full text-left px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2.5 transition-colors"
                        >
                          {tenant.status === 'active' 
                            ? <XCircle size={15} className="text-orange-500" />
                            : <CheckCircle size={15} className="text-green-500" />
                          }
                          <span>{tenant.status === 'active' ? 'Pasife Al' : 'Aktif Et'}</span>
                        </button>
                        <div className="my-1.5 mx-2 border-t border-slate-100 dark:border-slate-700" />
                        <button 
                          onClick={() => handleDeleteTenant(tenant.id)}
                          className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2.5 transition-colors"
                        >
                          <Trash2 size={15} />
                          <span>Sil</span>
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
              
              <div className="flex items-center gap-2 text-sm">
                <Users size={14} className="text-slate-400" />
                <span className="text-slate-600 dark:text-slate-300">
                  {tenant._count?.users || 0} Kullanıcı
                </span>
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
                    : tenant.status === 'trial'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                }`}>
                  {tenant.status === 'active' ? 'Aktif' : tenant.status === 'trial' ? 'Deneme' : 'Pasif'}
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

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editMode ? 'Firmayı Düzenle' : 'Yeni Firma Oluştur'}
        size="2xl"
      >
        <div className="space-y-6">
          {/* Hesap Tipi ve Genel Bilgiler */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Hesap Tipi
              </label>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: 'corporate' })}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                    form.type === 'corporate'
                      ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  Kurumsal
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: 'individual' })}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                    form.type === 'individual'
                      ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  Bireysel
                </button>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Firma İsmi / Ünvan <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
                  placeholder="Firma tam ünvanı"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Adres
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-slate-400" size={18} />
                <textarea
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  rows={2}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all resize-none"
                  placeholder="Açık adres"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Vergi No {form.type === 'corporate' && <span className="text-red-500">*</span>}
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={form.taxNumber}
                  onChange={(e) => setForm({ ...form, taxNumber: formatTaxNumber(e.target.value) })}
                  maxLength={11}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  placeholder={form.type === 'corporate' ? 'Vergi numarasını girin' : 'TCKN girin'}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Vergi Dairesi {form.type === 'corporate' && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                value={form.taxOffice}
                onChange={(e) => setForm({ ...form, taxOffice: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                placeholder="Vergi dairesi"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Telefon
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: formatPhoneNumber(e.target.value) })}
                  maxLength={15}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  placeholder="(0212) 555 55 55"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                GSM
              </label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={form.gsm}
                  onChange={(e) => setForm({ ...form, gsm: formatPhoneNumber(e.target.value) })}
                  maxLength={15}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  placeholder="(0555) 555 55 55"
                />
              </div>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Kurumsal E-posta <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  placeholder="info@sirket.com"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-700" />

          {/* Yönetici Bilgileri (Sadece Yeni Kayıtta) */}
          {!editMode && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus size={18} className="text-purple-500" />
                Yönetici Bilgileri
              </h3>
              
              <div className="flex gap-4 items-start">
                <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600 flex-shrink-0 cursor-pointer hover:border-purple-500 dark:hover:border-purple-500 transition-colors group relative">
                  <div className="text-center">
                    <Camera className="mx-auto text-slate-400 group-hover:text-purple-500 transition-colors" size={24} />
                    <span className="text-xs text-slate-500 mt-1 block">Fotoğraf</span>
                  </div>
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Adı Soyadı <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.adminName}
                      onChange={(e) => setForm({ ...form, adminName: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                      placeholder="Ad Soyad"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Giriş E-postası <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                      placeholder="admin@sirket.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Şifre <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                      placeholder="••••••"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={form.forcePasswordChange}
                        onChange={(e) => setForm({ ...form, forcePasswordChange: e.target.checked })}
                        className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-400">İlk girişte şifre değiştirilsin</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          <hr className="border-slate-100 dark:border-slate-700" />

          {/* Paket Seçimi */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Package size={18} className="text-purple-500" />
              Paket Bilgileri
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Abonelik Paketi
                </label>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select
                    value={form.packageId}
                    onChange={(e) => setForm({ ...form, packageId: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all appearance-none"
                  >
                    <option value="">Paket Seçin</option>
                    {packages.map(pkg => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name} - {pkg.priceMonthly} TL/Ay
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Süre
                </label>
                <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 h-[46px]">
                  <button
                    type="button"
                    onClick={() => setIsIndefinite(false)}
                    className={`flex-1 text-sm font-medium py-1.5 rounded-lg transition-all ${!isIndefinite ? 'bg-white dark:bg-slate-700 shadow text-purple-600' : 'text-slate-500'}`}
                  >
                    Süreli
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsIndefinite(true)}
                    className={`flex-1 text-sm font-medium py-1.5 rounded-lg transition-all ${isIndefinite ? 'bg-white dark:bg-slate-700 shadow text-purple-600' : 'text-slate-500'}`}
                  >
                    Süresiz
                  </button>
                </div>
              </div>
              
              {!isIndefinite && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Bitiş Tarihi
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="date"
                      value={form.subscriptionEnd}
                      onChange={(e) => setForm({ ...form, subscriptionEnd: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100 dark:border-slate-700">
          <button
            onClick={() => setIsModalOpen(false)}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl transition-colors font-medium"
          >
            İptal
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-lg shadow-purple-500/20 transition-all font-medium flex items-center gap-2"
          >
            {editMode ? 'Değişiklikleri Kaydet' : 'Firma Oluştur'}
          </button>
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
              <button 
                onClick={() => {
                  setIsDetailModalOpen(false);
                  handleEditTenant(selectedTenant);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                <Edit2 size={16} /> Düzenle
              </button>
              <button 
                onClick={() => {
                  setIsDetailModalOpen(false);
                  handleToggleStatus(selectedTenant);
                }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  selectedTenant.status === 'active' 
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200' 
                    : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200'
                }`}
              >
                {selectedTenant.status === 'active' ? <XCircle size={16} /> : <CheckCircle size={16} />}
                {selectedTenant.status === 'active' ? 'Pasife Al' : 'Aktif Et'}
              </button>
              <button 
                onClick={() => {
                  setIsDetailModalOpen(false);
                  handleDeleteTenant(selectedTenant.id);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 size={16} /> Sil
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Tenants;
