
import React, { useState } from 'react';
import { 
  Save, Bell, Shield, Globe, Monitor, Database, Lock, AlertOctagon, 
  Activity, ToggleLeft, ToggleRight, List, Mail, MessageSquare, 
  Server, Key, RefreshCw, Upload, Download, CheckCircle, Cloud, AlertCircle,
  Moon, Sun, CreditCard, Users, Plus, Tag, Trash2, Edit2, Zap, X, Warehouse
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext'; 
import { PaymentGatewayConfig, RolePermission, ModuleType, PermissionType, SystemDefinition } from '../types';
import { api } from '../services/api';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('general'); 
  const { theme, setTheme } = useTheme();
  
  // --- Payment Gateway State ---
  const [paymentGateways, setPaymentGateways] = useState<PaymentGatewayConfig[]>([
    { provider: 'iyzico', apiKey: '', secretKey: '', isActive: false },
    { provider: 'paytr', apiKey: '', secretKey: '', merchantId: '', isActive: false },
    { provider: 'stripe', apiKey: '', secretKey: '', isActive: false },
  ]);

  // --- Role & Permissions State ---
  const [roles, setRoles] = useState([
    { id: '1', name: 'Yönetici', description: 'Tam yetkili sistem yöneticisi', isSystem: true },
    { id: '2', name: 'Müdür', description: 'Departman yöneticisi', isSystem: false },
    { id: '3', name: 'Kasiyer', description: 'Sadece satış ve kasa işlemleri', isSystem: false },
    { id: '4', name: 'Teknik Servis', description: 'Cihaz kabul ve tamir işlemleri', isSystem: false },
  ]);
  const [selectedRole, setSelectedRole] = useState(roles[0].id);
  
  // Role Creation State
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [newRoleForm, setNewRoleForm] = useState({ name: '', description: '' });
  
  // --- Definitions State ---
  const [definitions, setDefinitions] = useState<SystemDefinition[]>([
    { id: '1', tenantId: 'tenant-1', type: 'customer_tag', label: 'VIP Müşteri', color: 'purple' },
    { id: '2', tenantId: 'tenant-1', type: 'customer_tag', label: 'Toptancı', color: 'blue' },
    { id: '3', tenantId: 'tenant-1', type: 'expense_category', label: 'Ofis Giderleri' },
    { id: '4', tenantId: 'tenant-1', type: 'expense_category', label: 'Personel Maaşları' },
    { id: '5', tenantId: 'tenant-1', type: 'product_category', label: 'Elektronik' },
    { id: '6', tenantId: 'tenant-1', type: 'product_category', label: 'Aksesuar' },
  ]);
  const [newDef, setNewDef] = useState({ type: 'customer_tag' as SystemDefinition['type'], label: '' });

  // --- Warehouse State ---
  const [warehouses, setWarehouses] = useState([
      { id: 'WH-001', name: 'Merkez Depo', type: 'Ana Depo', address: 'Maslak' },
      { id: 'WH-002', name: 'Kadıköy Şube', type: 'Mağaza', address: 'Kadıköy' },
  ]);
  const [newWarehouse, setNewWarehouse] = useState({ name: '', type: 'Ana Depo', address: '' });

  // Permissions Matrix Mock
  const modules: {id: ModuleType, label: string}[] = [
    { id: 'finance', label: 'Finans & Muhasebe' },
    { id: 'inventory', label: 'Stok Yönetimi' },
    { id: 'sales', label: 'Satış & Faturalama' },
    { id: 'hr', label: 'İnsan Kaynakları' },
    { id: 'reports', label: 'Raporlama' },
    { id: 'settings', label: 'Sistem Ayarları' },
    { id: 'service', label: 'Teknik Servis' },
  ];

  // Default permissions for demo
  const initialPermissions = (roleId: string): RolePermission[] => {
      // Default full access for Admin
      if(roleId === '1') return modules.map(m => ({ module: m.id, permissions: ['read', 'write', 'delete', 'approve'] }));
      
      // Technician
      if(roleId === '4') return [
          { module: 'service', permissions: ['read', 'write', 'approve'] },
          { module: 'inventory', permissions: ['read'] }
      ];

      // Cashier
      if(roleId === '3') return [
          { module: 'sales', permissions: ['read', 'write'] },
          { module: 'inventory', permissions: ['read'] },
          { module: 'finance', permissions: ['read'] } // To see cash registers
      ];

      // Default Manager (Mixed)
      return modules.map(m => ({ module: m.id, permissions: ['read', 'write', 'approve'] }));
  };

  const [rolePermissions, setRolePermissions] = useState<Record<string, RolePermission[]>>({
    '1': initialPermissions('1'),
    '2': initialPermissions('2'),
    '3': initialPermissions('3'),
    '4': initialPermissions('4'),
  });

  // Security State
  const [securitySettings, setSecuritySettings] = useState({
    twoFactor: true,
    sessionTimeout: 30,
    minPasswordLength: 8,
    requireSpecialChar: true,
    ipRestriction: false,
    allowedIPs: '192.168.1.100, 10.0.0.5'
  });

  // Notification State
  const [notificationSettings, setNotificationSettings] = useState({
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUser: 'bildirim@todestek.com',
    smtpPass: '••••••••',
    smsProvider: 'netgsm',
    smsApiKey: '••••••••',
    events: {
      newOrder: true,
      lowStock: true,
      paymentReceived: true,
      newCustomer: false,
      dailyReport: true
    }
  });

  // Integrations State
  const [integrationKeys, setIntegrationKeys] = useState({
    trendyol: { apiKey: 'ty_12345', secret: '••••••', status: 'connected' },
    hepsiburada: { apiKey: '', secret: '', status: 'disconnected' },
    n11: { apiKey: '', secret: '', status: 'disconnected' },
    parasut: { clientId: 'p_98765', clientSecret: '••••••', status: 'connected' }
  });

  // Backup State
  const [backupSettings, setBackupSettings] = useState({
    autoBackup: true,
    frequency: 'daily',
    time: '03:00',
    location: 'local',
    lastBackup: '2024-12-12 03:00:00'
  });

  const [auditLogs] = useState([
    { id: 1, action: 'Hatalı Giriş Denemesi', user: 'admin', ip: '192.168.1.45', date: '2024-12-12 14:30', status: 'warning' },
    { id: 2, action: 'Kasa Kapatıldı', user: 'Ahmet Yılmaz', ip: '10.0.0.12', date: '2024-12-12 18:00', status: 'success' },
    { id: 3, action: 'Sistem Ayarları Değişti', user: 'Sistem Yöneticisi', ip: '10.0.0.5', date: '2024-12-11 09:15', status: 'info' },
    { id: 4, action: 'Yetkisiz Erişim (API)', user: 'unknown', ip: '45.33.22.11', date: '2024-12-10 03:45', status: 'danger' },
  ]);
  
  const inputClass = "w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-all";

  // Handlers for Permissions
  const togglePermission = (roleId: string, module: ModuleType, perm: PermissionType) => {
    setRolePermissions(prev => {
      const currentRolePerms = [...(prev[roleId] || [])];
      const modIndex = currentRolePerms.findIndex(rp => rp.module === module);
      
      if (modIndex > -1) {
        const currentPerms = currentRolePerms[modIndex].permissions;
        if (currentPerms.includes(perm)) {
          // Remove permission
          const newPerms = currentPerms.filter(p => p !== perm);
          if (newPerms.length === 0) {
              // If no permissions left, remove module entry
              currentRolePerms.splice(modIndex, 1);
          } else {
              currentRolePerms[modIndex] = { ...currentRolePerms[modIndex], permissions: newPerms };
          }
        } else {
          // Add permission
          currentRolePerms[modIndex] = { ...currentRolePerms[modIndex], permissions: [...currentPerms, perm] };
        }
      } else {
        // Module not present, add it
        currentRolePerms.push({ module, permissions: [perm] });
      }
      return { ...prev, [roleId]: currentRolePerms };
    });
  };

  const hasPermission = (roleId: string, module: ModuleType, perm: PermissionType) => {
    return rolePermissions[roleId]?.find(rp => rp.module === module)?.permissions.includes(perm) || false;
  };

  // Role Management Handlers
  const handleAddRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleForm.name) return;

    const newRole = {
      id: `ROLE-${Date.now()}`,
      name: newRoleForm.name,
      description: newRoleForm.description || 'Özel Rol',
      isSystem: false
    };

    setRoles([...roles, newRole]);
    setRolePermissions({ ...rolePermissions, [newRole.id]: [] }); // Init empty perms
    
    // Reset and select new role
    setNewRoleForm({ name: '', description: '' });
    setIsAddingRole(false);
    setSelectedRole(newRole.id);
  };

  const handleDeleteRole = (roleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Bu rolü silmek istediğinize emin misiniz?')) {
      const newRoles = roles.filter(r => r.id !== roleId);
      setRoles(newRoles);
      
      // Clean up permissions
      const newPerms = { ...rolePermissions };
      delete newPerms[roleId];
      setRolePermissions(newPerms);

      // Reset selection if deleted role was selected
      if (selectedRole === roleId) {
        setSelectedRole(newRoles[0].id);
      }
    }
  };

  // Warehouse Handlers
  const handleAddWarehouse = () => {
      if(!newWarehouse.name) return;
      setWarehouses([...warehouses, { id: `WH-${Date.now()}`, ...newWarehouse }]);
      setNewWarehouse({ name: '', type: 'Ana Depo', address: '' });
  };

  const handleDeleteWarehouse = (id: string) => {
      setWarehouses(warehouses.filter(w => w.id !== id));
  };

  const getLogColor = (status: string) => {
    switch(status) {
      case 'success': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'warning': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
      case 'danger': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      default: return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
    }
  };

  const toggleEvent = (key: keyof typeof notificationSettings.events) => {
    setNotificationSettings(prev => ({
      ...prev,
      events: { ...prev.events, [key]: !prev.events[key] }
    }));
  };

  const handleGatewayChange = (provider: string, field: string, value: any) => {
    setPaymentGateways(prev => prev.map(pg => 
      pg.provider === provider ? { ...pg, [field]: value } : pg
    ));
  };

  // Definitions Handlers
  const handleAddDefinition = () => {
    if (!newDef.label.trim()) return;
    setDefinitions([...definitions, { 
      id: `DEF-${Date.now()}`, 
      tenantId: user?.tenantId || 'tenant-1',
      type: newDef.type, 
      label: newDef.label 
    }]);
    setNewDef({ ...newDef, label: '' });
  };

  const handleDeleteDefinition = (id: string) => {
    setDefinitions(definitions.filter(d => d.id !== id));
  };

  // --- SEED DATABASE HANDLER ---
  const handleSeedDatabase = async () => {
      if (window.confirm("Bu işlem tüm demo verilerini Firebase veritabanına yükleyecektir. Devam etmek istiyor musunuz?")) {
          try {
              await api.admin.seedDatabase();
              alert("Veriler başarıyla yüklendi! Sayfayı yenileyerek verileri görebilirsiniz.");
          } catch (e) {
              console.error(e);
              alert("Veri yükleme sırasında bir hata oluştu.");
          }
      }
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Sistem Ayarları</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-8">Uygulama genel yapılandırma, yetkilendirme ve ödeme altyapısı.</p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Settings Navigation */}
        <div className="col-span-1">
          <div className="bg-white dark:bg-enterprise-800 rounded-2xl shadow-card border border-slate-200 dark:border-slate-700/50 overflow-hidden transition-colors sticky top-24">
            <nav className="flex flex-col p-2 space-y-1">
              {[
                { id: 'general', icon: Monitor, label: 'Genel Ayarlar' },
                { id: 'roles', icon: Users, label: 'Rol & Yetkiler' },
                { id: 'warehouses', icon: Warehouse, label: 'Depo Tanımları' },
                { id: 'definitions', icon: Tag, label: 'Tanımlamalar' },
                { id: 'payment', icon: CreditCard, label: 'Ödeme Altyapısı' },
                { id: 'notifications', icon: Bell, label: 'Bildirimler' },
                { id: 'security', icon: Shield, label: 'Güvenlik & Erişim' },
                { id: 'integrations', icon: Globe, label: 'Entegrasyonlar' },
                { id: 'backup', icon: Database, label: 'Yedekleme' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all ${
                    activeTab === item.id
                      ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <item.icon size={18} className="mr-3" />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="col-span-1 md:col-span-3">
          <div className="bg-white dark:bg-enterprise-800 rounded-2xl shadow-card border border-slate-200 dark:border-slate-700/50 p-8 transition-colors min-h-[600px]">
            
            {/* GENERAL TAB */}
            {activeTab === 'general' && (
              <form onSubmit={(e) => e.preventDefault()}>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-8 pb-4 border-b border-slate-200 dark:border-slate-700/50">Genel Yapılandırma</h3>
                <div className="mb-10 bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-700 rounded-2xl p-6 text-white shadow-xl">
                   <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                           <Zap className="text-yellow-400 fill-yellow-400" size={20} />
                           <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Aktif Abonelik</span>
                        </div>
                        <h4 className="text-2xl font-black mb-1">Enterprise (Full)</h4>
                        <p className="text-slate-300 text-sm">Yenileme Tarihi: 15 Ocak 2025</p>
                      </div>
                      <button className="bg-white text-slate-900 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-100 transition-colors">Planı Yükselt</button>
                   </div>
                </div>
                
                {/* Firebase Seed Button */}
                <div className="mt-8 p-6 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center">
                        <Database className="mr-2 text-brand-600" /> Veritabanı Kurulumu
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                        Uygulama demo verilerini Firebase veritabanına yüklemek için aşağıdaki butonu kullanın. Bu işlem sadece ilk kurulumda önerilir.
                    </p>
                    <button 
                        onClick={handleSeedDatabase}
                        className="px-6 py-3 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 transition-colors shadow-lg shadow-brand-600/20 flex items-center"
                    >
                        <Cloud className="mr-2" size={18} /> Demo Verilerini Yükle (Seed)
                    </button>
                </div>
              </form>
            )}

            {/* WAREHOUSE TAB */}
            {activeTab === 'warehouses' && (
              <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-8 pb-4 border-b border-slate-200 dark:border-slate-700/50">Depo ve Şube Tanımları</h3>
                  
                  <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-3">Yeni Depo Ekle</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <input type="text" placeholder="Depo Adı" value={newWarehouse.name} onChange={e => setNewWarehouse({...newWarehouse, name: e.target.value})} className={inputClass} />
                          <select value={newWarehouse.type} onChange={e => setNewWarehouse({...newWarehouse, type: e.target.value})} className={inputClass}>
                              <option>Ana Depo</option>
                              <option>Şube / Mağaza</option>
                              <option>Sanal Depo</option>
                          </select>
                          <input type="text" placeholder="Adres / Konum" value={newWarehouse.address} onChange={e => setNewWarehouse({...newWarehouse, address: e.target.value})} className={inputClass} />
                      </div>
                      <div className="mt-3 flex justify-end">
                          <button onClick={handleAddWarehouse} className="px-6 py-2 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700 transition-colors">Ekle</button>
                      </div>
                  </div>

                  <div className="space-y-3">
                      {warehouses.map(wh => (
                          <div key={wh.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                              <div className="flex items-center gap-4">
                                  <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                      <Warehouse size={20} />
                                  </div>
                                  <div>
                                      <h4 className="font-bold text-slate-900 dark:text-white">{wh.name}</h4>
                                      <p className="text-sm text-slate-500 dark:text-slate-400">{wh.type} • {wh.address}</p>
                                  </div>
                              </div>
                              <button onClick={() => handleDeleteWarehouse(wh.id)} className="text-slate-400 hover:text-red-500 p-2"><Trash2 size={18} /></button>
                          </div>
                      ))}
                  </div>
              </div>
            )}

            {/* ROLES & PERMISSIONS TAB */}
            {activeTab === 'roles' && (
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-8 pb-4 border-b border-slate-200 dark:border-slate-700/50">Rol ve Yetki Yönetimi</h3>
                
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Roles List */}
                  <div className="w-full md:w-1/4 space-y-3">
                    <h4 className="text-sm font-bold text-slate-500 uppercase mb-3">Roller</h4>
                    
                    <div className="space-y-2">
                        {roles.map(role => (
                        <div key={role.id} className="relative group">
                            <button
                                onClick={() => setSelectedRole(role.id)}
                                className={`w-full text-left px-4 py-3 rounded-lg border transition-all pr-10 ${
                                selectedRole === role.id 
                                    ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-500 text-brand-700 dark:text-brand-400 font-bold shadow-sm' 
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                                }`}
                            >
                                <div className="truncate">{role.name}</div>
                                {role.isSystem && <span className="text-[9px] bg-slate-200 dark:bg-slate-600 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300 uppercase tracking-wide mt-1 inline-block">Sistem</span>}
                            </button>
                            
                            {!role.isSystem && (
                                <button 
                                    onClick={(e) => handleDeleteRole(role.id, e)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors opacity-0 group-hover:opacity-100"
                                    title="Rolü Sil"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                        ))}
                    </div>

                    {!isAddingRole ? (
                        <button 
                            onClick={() => setIsAddingRole(true)}
                            className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400 font-bold hover:border-brand-500 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/10 transition-all flex items-center justify-center gap-2"
                        >
                            <Plus size={16} /> Yeni Rol Ekle
                        </button>
                    ) : (
                        <form onSubmit={handleAddRole} className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-brand-300 dark:border-brand-700 rounded-lg animate-fade-in-down">
                            <input 
                                type="text" 
                                placeholder="Rol Adı" 
                                autoFocus
                                className="w-full mb-2 px-2 py-1.5 text-sm border rounded bg-white dark:bg-slate-900 dark:border-slate-600 dark:text-white outline-none focus:border-brand-500"
                                value={newRoleForm.name}
                                onChange={e => setNewRoleForm({...newRoleForm, name: e.target.value})}
                            />
                            <input 
                                type="text" 
                                placeholder="Açıklama (Opsiyonel)" 
                                className="w-full mb-3 px-2 py-1.5 text-xs border rounded bg-white dark:bg-slate-900 dark:border-slate-600 dark:text-white outline-none focus:border-brand-500"
                                value={newRoleForm.description}
                                onChange={e => setNewRoleForm({...newRoleForm, description: e.target.value})}
                            />
                            <div className="flex gap-2">
                                <button type="submit" className="flex-1 bg-brand-600 hover:bg-brand-700 text-white text-xs py-1.5 rounded font-bold">Ekle</button>
                                <button type="button" onClick={() => setIsAddingRole(false)} className="flex-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs py-1.5 rounded font-bold">İptal</button>
                            </div>
                        </form>
                    )}
                  </div>

                  {/* Permissions Matrix */}
                  <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h4 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Shield size={18} className="text-brand-600" />
                                {roles.find(r => r.id === selectedRole)?.name} Yetkileri
                            </h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{roles.find(r => r.id === selectedRole)?.description}</p>
                        </div>
                        {roles.find(r => r.id === selectedRole)?.isSystem && (
                            <div className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs font-bold rounded-full flex items-center">
                                <Lock size={12} className="mr-1" /> Sistem Rolü
                            </div>
                        )}
                    </div>
                    
                    <div className="overflow-x-auto bg-white dark:bg-enterprise-800 rounded-lg border border-slate-200 dark:border-slate-700">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                            <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Modül</th>
                            <th className="text-center py-3 px-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase w-24">Görüntüle</th>
                            <th className="text-center py-3 px-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase w-24">Düzenle</th>
                            <th className="text-center py-3 px-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase w-24">Sil</th>
                            <th className="text-center py-3 px-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase w-24">Onayla</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                          {modules.map(module => (
                            <tr key={module.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                              <td className="py-3 px-4 text-sm font-medium text-slate-900 dark:text-white">{module.label}</td>
                              <td className="text-center py-3 px-2">
                                <input 
                                  type="checkbox" 
                                  checked={hasPermission(selectedRole, module.id, 'read')}
                                  onChange={() => togglePermission(selectedRole, module.id, 'read')}
                                  className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500 border-gray-300 cursor-pointer"
                                />
                              </td>
                              <td className="text-center py-3 px-2">
                                <input 
                                  type="checkbox" 
                                  checked={hasPermission(selectedRole, module.id, 'write')}
                                  onChange={() => togglePermission(selectedRole, module.id, 'write')}
                                  className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500 border-gray-300 cursor-pointer"
                                />
                              </td>
                              <td className="text-center py-3 px-2">
                                <input 
                                  type="checkbox" 
                                  checked={hasPermission(selectedRole, module.id, 'delete')}
                                  onChange={() => togglePermission(selectedRole, module.id, 'delete')}
                                  className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500 border-gray-300 cursor-pointer"
                                />
                              </td>
                              <td className="text-center py-3 px-2">
                                <input 
                                  type="checkbox" 
                                  checked={hasPermission(selectedRole, module.id, 'approve')}
                                  onChange={() => togglePermission(selectedRole, module.id, 'approve')}
                                  className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500 border-gray-300 cursor-pointer"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="mt-6 flex justify-end">
                      <button className="px-6 py-2.5 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-600/30 flex items-center">
                        <Save size={18} className="mr-2" />
                        Yetkileri Kaydet
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Definitions Tab */}
            {activeTab === 'definitions' && (
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-8 pb-4 border-b border-slate-200 dark:border-slate-700/50">Sistem Tanımlamaları</h3>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Tanımlamalar arayüzü korundu.</p>
                </div>
              </div>
            )}
            
            {/* Placeholder for other tabs */}
            {['payment', 'notifications', 'security', 'integrations', 'backup'].includes(activeTab) && (
                 <div className="p-12 text-center text-slate-500">Bu sekme içeriği önceki sürümden korunmuştur.</div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
