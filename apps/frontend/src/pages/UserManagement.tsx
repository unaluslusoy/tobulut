
import React, { useState, useEffect } from 'react';
import { 
  Users, Shield, UserPlus, Edit, Trash2, CheckCircle, 
  XCircle, Search, Filter, Lock, Key, Mail, Loader2,
  LayoutGrid, CheckSquare, Square
} from 'lucide-react';
import { api } from '../services/api';
import { SystemUser, ModuleType } from '../types';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth(); // Get current user to inherit tenantId
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    role: string;
    password: string;
    status: string;
    allowedModules: ModuleType[];
  }>({
    name: '',
    email: '',
    role: 'cashier',
    password: '',
    status: 'active',
    allowedModules: []
  });

  const availableModules: {id: ModuleType, label: string}[] = [
    { id: 'finance', label: 'Finans & Muhasebe' },
    { id: 'inventory', label: 'Stok Yönetimi' },
    { id: 'sales', label: 'Satış & POS' },
    { id: 'hr', label: 'İnsan Kaynakları' },
    { id: 'reports', label: 'Raporlama' },
    { id: 'service', label: 'Teknik Servis' },
    { id: 'settings', label: 'Ayarlar' },
  ];

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.users.getAll();
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const toggleModule = (moduleId: ModuleType) => {
    const current = formData.allowedModules;
    if (current.includes(moduleId)) {
      setFormData({ ...formData, allowedModules: current.filter(m => m !== moduleId) });
    } else {
      setFormData({ ...formData, allowedModules: [...current, moduleId] });
    }
  };

  const handleEdit = (user: SystemUser) => {
    setEditingId(user.id);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      password: '', // Password placeholder empty
      allowedModules: user.allowedModules || []
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) {
        try {
            await api.users.delete(id);
            setUsers(users.filter(u => u.id !== id));
        } catch (error) {
            console.error(error);
        }
    }
  };

  const toggleStatus = async (user: SystemUser) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
        const updatedUser = { ...user, status: newStatus as any };
        await api.users.update(updatedUser);
        setUsers(users.map(u => u.id === user.id ? updatedUser : u));
    } catch (error) {
        console.error(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
        if (editingId) {
            const userToUpdate = users.find(u => u.id === editingId);
            if (userToUpdate) {
                const updatedUser = {
                    ...userToUpdate,
                    name: formData.name,
                    email: formData.email,
                    role: formData.role as any,
                    status: formData.status as any,
                    allowedModules: formData.allowedModules
                };
                await api.users.update(updatedUser);
                setUsers(users.map(u => u.id === editingId ? updatedUser : u));
            }
        } else {
            const newUser: SystemUser = {
                id: `USR-${Date.now()}`,
                // Important: Assign current admin's tenantId to the new user
                tenantId: currentUser?.tenantId || 'tenant-1', 
                name: formData.name,
                email: formData.email,
                role: formData.role as any,
                status: formData.status as any,
                lastLogin: 'Henüz giriş yapmadı',
                avatar: `https://ui-avatars.com/api/?name=${formData.name}&background=random`,
                allowedModules: formData.allowedModules
            };
            await api.users.create(newUser);
            setUsers([...users, newUser]);
        }
        
        setIsModalOpen(false);
        setEditingId(null);
        setFormData({ name: '', email: '', role: 'cashier', password: '', status: 'active', allowedModules: [] });
    } catch (error) {
        alert("Kullanıcı kaydedilirken hata oluştu.");
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' ? true : user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: string) => {
    switch(role) {
      case 'admin': return { color: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800', label: 'Yönetici' };
      case 'manager': return { color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800', label: 'Müdür' };
      case 'accountant': return { color: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800', label: 'Muhasebe' };
      case 'technician': return { color: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800', label: 'Tekniker' };
      default: return { color: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600', label: 'Kasiyer' };
    }
  };

  const inputClass = "w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white";

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="text-brand-600" />
            Kullanıcı ve Yetki Yönetimi
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Alt kullanıcılarınızı ve erişim izinlerini yönetin.
            {currentUser?.tenantId !== 'system' && <span className="ml-2 text-xs bg-brand-100 text-brand-800 px-2 py-0.5 rounded">Kurum: {currentUser?.tenantId}</span>}
          </p>
        </div>
        <button 
          onClick={() => {
            setEditingId(null);
            setFormData({ name: '', email: '', role: 'cashier', password: '', status: 'active', allowedModules: [] });
            setIsModalOpen(true);
          }}
          className="flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 shadow-lg shadow-brand-600/20 transition-colors"
        >
          <UserPlus size={16} className="mr-2" />
          Yeni Kullanıcı
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
         <div className="bg-white dark:bg-enterprise-800 p-6 rounded-xl shadow-card border border-slate-200 dark:border-slate-700/50 flex items-center justify-between transition-colors">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Toplam Kullanıcı</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{loading ? '...' : users.length}</h3>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
              <Users size={24} />
            </div>
         </div>
         <div className="bg-white dark:bg-enterprise-800 p-6 rounded-xl shadow-card border border-slate-200 dark:border-slate-700/50 flex items-center justify-between transition-colors">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Aktif Oturumlar</p>
              <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">
                {loading ? '...' : users.filter(u => u.status === 'active').length}
              </h3>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
              <CheckCircle size={24} />
            </div>
         </div>
         <div className="bg-white dark:bg-enterprise-800 p-6 rounded-xl shadow-card border border-slate-200 dark:border-slate-700/50 flex items-center justify-between transition-colors">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Yöneticiler</p>
              <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {loading ? '...' : users.filter(u => u.role === 'admin').length}
              </h3>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
              <Shield size={24} />
            </div>
         </div>
      </div>

      <div className="bg-white dark:bg-enterprise-800 rounded-xl shadow-card border border-slate-200 dark:border-slate-700/50 overflow-hidden transition-colors">
        
        {/* Filters */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex bg-white dark:bg-slate-700 p-1 rounded-lg border border-slate-200 dark:border-slate-600">
            {(['all', 'admin', 'manager', 'cashier'] as const).map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-all ${
                  roleFilter === role ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {role === 'all' ? 'Tümü' : role === 'admin' ? 'Yönetici' : role === 'manager' ? 'Müdür' : 'Kasiyer'}
              </button>
            ))}
          </div>
          
          <div className="relative">
            <input
              type="text"
              placeholder="İsim veya e-posta ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-4 pr-10 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white dark:bg-slate-900 text-slate-900 dark:text-white w-full sm:w-64"
            />
            <Search size={16} className="absolute right-3 top-2.5 text-slate-400 dark:text-slate-500" />
          </div>
        </div>

        {loading ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                <Loader2 size={40} className="animate-spin mb-4 text-brand-600" />
                <p>Kullanıcılar yükleniyor...</p>
            </div>
        ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                <tr>
                    <th className="px-6 py-4 font-semibold">Kullanıcı</th>
                    <th className="px-6 py-4 font-semibold">Rol</th>
                    <th className="px-6 py-4 font-semibold">Modül Erişimi</th>
                    <th className="px-6 py-4 font-semibold">Durum</th>
                    <th className="px-6 py-4 font-semibold">Son Giriş</th>
                    <th className="px-6 py-4 font-semibold text-right">İşlemler</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {filteredUsers.map(user => {
                    const roleBadge = getRoleBadge(user.role);
                    return (
                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-6 py-4">
                        <div className="flex items-center">
                            <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-600 mr-3" />
                            <div>
                            <div className="font-medium text-slate-900 dark:text-white">{user.name}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{user.email}</div>
                            </div>
                        </div>
                        </td>
                        <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${roleBadge.color}`}>
                            {roleBadge.label}
                        </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {(!user.allowedModules || user.allowedModules.length === 0) ? (
                                <span className="text-xs text-slate-500 italic">Tam Erişim (Rol Bazlı)</span>
                            ) : (
                                user.allowedModules.slice(0, 3).map(mod => (
                                    <span key={mod} className="text-[10px] bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-1.5 py-0.5 rounded capitalize text-slate-600 dark:text-slate-300">
                                        {availableModules.find(m => m.id === mod)?.label.split(' ')[0] || mod}
                                    </span>
                                ))
                            )}
                            {user.allowedModules && user.allowedModules.length > 3 && (
                                <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-500">+{user.allowedModules.length - 3}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                        <button 
                            onClick={() => toggleStatus(user)}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${user.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}`}
                        >
                            {user.status === 'active' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                            {user.status === 'active' ? 'Aktif' : 'Pasif'}
                        </button>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                        {user.lastLogin.includes('T') ? new Date(user.lastLogin).toLocaleString('tr-TR') : user.lastLogin}
                        </td>
                        <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                            <button 
                            onClick={() => handleEdit(user)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                            title="Düzenle"
                            >
                            <Edit size={18} />
                            </button>
                            <button 
                            onClick={() => handleDelete(user.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                            title="Sil"
                            >
                            <Trash2 size={18} />
                            </button>
                        </div>
                        </td>
                    </tr>
                    );
                })}
                </tbody>
            </table>
            </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingId ? "Kullanıcı Düzenle" : "Yeni Kullanıcı Ekle"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ad Soyad</label>
                <input 
                type="text" 
                name="name" 
                required
                value={formData.name}
                onChange={handleInputChange}
                className={inputClass}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">E-posta Adresi</label>
                <div className="relative">
                <Mail size={18} className="absolute left-3 top-2.5 text-slate-400" />
                <input 
                    type="email" 
                    name="email" 
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`${inputClass} pl-10`}
                />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Rol / Yetki</label>
                <select 
                name="role" 
                value={formData.role}
                onChange={handleInputChange}
                className={inputClass}
                >
                <option value="admin">Yönetici (Admin)</option>
                <option value="manager">Müdür</option>
                <option value="accountant">Muhasebe</option>
                <option value="cashier">Kasiyer</option>
                <option value="technician">Tekniker</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Durum</label>
                <select 
                name="status" 
                value={formData.status}
                onChange={handleInputChange}
                className={inputClass}
                >
                <option value="active">Aktif</option>
                <option value="inactive">Pasif</option>
                </select>
            </div>
            
            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {editingId ? 'Yeni Şifre (Değiştirmek istemiyorsanız boş bırakın)' : 'Şifre'}
                </label>
                <div className="relative">
                <Key size={18} className="absolute left-3 top-2.5 text-slate-400" />
                <input 
                    type="password" 
                    name="password" 
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`${inputClass} pl-10`}
                    required={!editingId}
                    placeholder="********"
                />
                </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
             <label className="block text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
               <LayoutGrid size={16} className="text-brand-600" />
               Erişim İzinleri (Modüller)
             </label>
             <p className="text-xs text-slate-500 mb-4">
               Kullanıcının erişebileceği modülleri seçin. Hiçbiri seçilmezse, kullanıcının rolüne (Role) ait varsayılan tüm yetkiler geçerli olur.
             </p>
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
               {availableModules.map(module => {
                 const isSelected = formData.allowedModules.includes(module.id);
                 return (
                   <div 
                     key={module.id}
                     onClick={() => toggleModule(module.id)}
                     className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                       isSelected 
                         ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-500 text-brand-700 dark:text-brand-400' 
                         : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                     }`}
                   >
                     <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 transition-colors ${isSelected ? 'bg-brand-600 border-brand-600' : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-500'}`}>
                        {isSelected && <CheckSquare size={14} className="text-white" />}
                     </div>
                     <span className="text-sm font-medium">{module.label}</span>
                   </div>
                 )
               })}
             </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-700">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              İptal
            </button>
            <button 
              type="submit" 
              className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 shadow-sm transition-colors font-bold"
            >
              {editingId ? 'Güncelle' : 'Kaydet'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserManagement;
