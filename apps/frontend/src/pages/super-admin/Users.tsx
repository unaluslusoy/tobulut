
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Shield, User } from 'lucide-react';
import { api } from '../../services/api';
import Table, { Column } from '../../components/Table';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import ConfirmDialog from '../../components/ConfirmDialog';
import { SystemUser } from '../../types';

const Users: React.FC = () => {
    const [users, setUsers] = useState<SystemUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
    
    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        status: 'active',
        roleId: ''
    });
    
    const [roles, setRoles] = useState<any[]>([]);

    const fetchData = async () => {
        try {
            const [usersData, rolesData] = await Promise.all([
                api.superAdmin.getSuperAdmins(),
                api.superAdmin.getRoles()
            ]);
            setUsers(usersData);
            setRoles(rolesData);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const resetForm = () => {
        setFormData({ name: '', email: '', password: '', status: 'active', roleId: '' });
        setSelectedUser(null);
    };

    const handleOpenModal = (user?: SystemUser) => {
        if (user) {
            setSelectedUser(user);
            setFormData({
                name: user.name,
                email: user.email,
                password: '', // Password placeholder
                status: user.status || 'active',
                roleId: user.superAdminRoleId || ''
            });
        } else {
            resetForm();
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        try {
            if (selectedUser) {
                // Update
                const updateData: any = { ...formData };
                if (!updateData.password) delete updateData.password; // Don't send empty password
                
                await api.superAdmin.updateSuperAdmin(selectedUser.id, updateData);
            } else {
                // Create
                if (!formData.password) {
                    alert('Şifre gereklidir.');
                    return;
                }
                await api.superAdmin.createSuperAdmin(formData);
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error("Save error:", error);
            alert("İşlem sırasında bir hata oluştu: " + (error as Error).message);
        }
    };

    const handleDelete = async () => {
        if (!selectedUser) return;
        try {
            await api.superAdmin.deleteSuperAdmin(selectedUser.id);
            setIsDeleteOpen(false);
            fetchData();
        } catch (error) {
            console.error(error);
            alert("Silme başarısız.");
        }
    };

    const columns: Column<SystemUser>[] = [
        {
            key: 'name',
            header: 'Ad Soyad',
            render: (val, row) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold">
                        {val ? val.charAt(0).toUpperCase() : <User size={16}/>}
                    </div>
                    <div>
                        <div className="font-medium text-slate-900 dark:text-white">{val}</div>
                        <div className="text-xs text-slate-500">{row.email}</div>
                    </div>
                </div>
            )
        },
        {
            key: 'role',
            header: 'Rol',
            render: (val, row) => (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-purple-100 text-purple-700 text-xs font-bold">
                    <Shield size={12} />
                    {row.superAdminRole?.name || (val === 'superuser' ? 'Süper Yönetici' : val)}
                </span>
            )
        },
        {
            key: 'status',
            header: 'Durum',
            render: (val) => (
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${val === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {val === 'active' ? 'Aktif' : 'Pasif'}
                </span>
            )
        },
        {
            key: 'createdAt',
            header: 'Kayıt Tarihi',
            render: (val) => new Date(val).toLocaleDateString('tr-TR')
        },
        {
            key: 'actions',
            header: 'İşlemler',
            align: 'right',
            width: '120px',
            render: (_, row) => (
                <div className="flex justify-end gap-2">
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleOpenModal(row); }}
                        className="p-1 text-slate-400 hover:text-brand-600 transition-colors"
                        title="Düzenle"
                    >
                        <Edit2 size={18} />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedUser(row); setIsDeleteOpen(true); }}
                        className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                        title="Sil"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Yöneticiler</h1>
                    <p className="text-slate-500 dark:text-slate-400">Sistem yöneticilerini ve yetkilerini yönetin.</p>
                </div>
                <Button onClick={() => handleOpenModal()} variant="primary" icon={<Plus size={18} />}>
                    Yeni Yönetici
                </Button>
            </div>

            <Table 
                data={users} 
                columns={columns} 
                loading={loading}
                emptyMessage="Henüz yönetici bulunmuyor."
            />

            {/* Edit/Create Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedUser ? 'Yönetici Düzenle' : 'Yeni Yönetici Ekle'}
                size="md"
            >
                <div className="space-y-4">
                    <Input 
                        label="Ad Soyad"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="Örn: Ahmet Yılmaz"
                    />
                    <Input 
                        label="E-Posta"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="ornek@sistem.com"
                    />
                    <Input 
                        label={selectedUser ? "Şifre (Değiştirmek istemiyorsanız boş bırakın)" : "Şifre"}
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        placeholder="******"
                    />
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Durum</label>
                        <select 
                            value={formData.status}
                            onChange={(e) => setFormData({...formData, status: e.target.value})}
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                        >
                            <option value="active">Aktif</option>
                            <option value="passive">Pasif</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Yetki Grubu (Rol)</label>
                        <select 
                            value={formData.roleId}
                            onChange={(e) => setFormData({...formData, roleId: e.target.value})}
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                        >
                            <option value="">-- Grup Seçin (Opsiyonel) --</option>
                            {roles.map(role => (
                                <option key={role.id} value={role.id}>{role.name}</option>
                            ))}
                        </select>
                        <p className="mt-1 text-xs text-slate-500">Grup seçilmezse 'Süper Yönetici' olarak tam yetkili açılır.</p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>İptal</Button>
                        <Button variant="primary" onClick={handleSave}>Kaydet</Button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmDialog 
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleDelete}
                title="Yöneticiyi Sil"
                message={`"${selectedUser?.name}" adlı yöneticiyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
                type="danger"
            />
        </div>
    );
};

export default Users;
