
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Shield, Lock, Check } from 'lucide-react';
import { api } from '../../services/api';
import Table, { Column } from '../../components/Table';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import ConfirmDialog from '../../components/ConfirmDialog';
import Badge from '../../components/Badge';

interface SuperAdminRole {
    id: string;
    name: string;
    description: string;
    permissions: string[];
    _count?: { users: number };
}

const PERMISSION_GROUPS = [
    {
        id: 'tenants',
        label: 'Aboneler (Firmalar)',
        permissions: [
            { id: 'tenants.read', label: 'Görüntüleme' },
            { id: 'tenants.write', label: 'Düzenleme/Ekleme' },
            { id: 'tenants.delete', label: 'Silme' }
        ]
    },
    {
        id: 'packages',
        label: 'Paket Yönetimi',
        permissions: [
            { id: 'packages.read', label: 'Görüntüleme' },
            { id: 'packages.write', label: 'Düzenleme/Ekleme' }
        ]
    },
    {
        id: 'users',
        label: 'Yöneticiler',
        permissions: [
            { id: 'users.read', label: 'Görüntüleme' },
            { id: 'users.write', label: 'Düzenleme/Ekleme' }
        ]
    },
    {
        id: 'support',
        label: 'Destek Talepleri',
        permissions: [
            { id: 'support.read', label: 'Görüntüleme' },
            { id: 'support.write', label: 'Yanıtla/Düzenle' }
        ]
    },
    {
        id: 'finance',
        label: 'Finansal Veriler',
        permissions: [
            { id: 'finance.read', label: 'Görüntüleme' }
        ]
    }
];

const UserGroups: React.FC = () => {
    const [roles, setRoles] = useState<SuperAdminRole[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<SuperAdminRole | null>(null);
    
    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        permissions: [] as string[]
    });

    const fetchData = async () => {
        try {
            const data = await api.superAdmin.getRoles();
            setRoles(data);
        } catch (error) {
            console.error("Error fetching roles:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const resetForm = () => {
        setFormData({ name: '', description: '', permissions: [] });
        setSelectedRole(null);
    };

    const handleOpenModal = (role?: SuperAdminRole) => {
        if (role) {
            setSelectedRole(role);
            setFormData({
                name: role.name,
                description: role.description || '',
                permissions: role.permissions || []
            });
        } else {
            resetForm();
        }
        setIsModalOpen(true);
    };

    const togglePermission = (permId: string) => {
        setFormData(prev => {
            const exists = prev.permissions.includes(permId);
            if (exists) {
                return { ...prev, permissions: prev.permissions.filter(p => p !== permId) };
            } else {
                return { ...prev, permissions: [...prev.permissions, permId] };
            }
        });
    };

    const handleSave = async () => {
        if (!formData.name) return alert("Grup adı gereklidir.");
        try {
            if (selectedRole) {
                await api.superAdmin.updateRole(selectedRole.id, formData);
            } else {
                await api.superAdmin.createRole(formData);
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error: any) {
            alert("Hata: " + error?.response?.data?.message || "İşlem başarısız");
        }
    };

    const handleDelete = async () => {
        if (!selectedRole) return;
        try {
            await api.superAdmin.deleteRole(selectedRole.id);
            setIsDeleteOpen(false);
            fetchData();
        } catch (error: any) {
            alert("Hata: " + (error?.response?.data?.message || "Silme başarısız. Bu role bağlı kullanıcılar olabilir."));
        }
    };

    const columns: Column<SuperAdminRole>[] = [
        {
            key: 'name',
            header: 'Grup Adı',
            render: (val, row) => (
                <div className="flex flex-col">
                    <span className="font-medium text-slate-900 dark:text-white">{val}</span>
                    <span className="text-xs text-slate-500">{row.description}</span>
                </div>
            )
        },
        {
            key: 'permissions',
            header: 'Yetkiler',
            render: (val: string[], row) => (
               <div className="flex flex-wrap gap-1">
                 {val && val.length > 0 ? (
                     <Badge variant="neutral" size="sm">{val.length} Yetki</Badge>
                 ) : (
                     <span className="text-xs text-slate-400">Yetki yok</span>
                 )}
               </div>
            )
        },
        {
            key: '_count',
            header: 'Kullanıcılar',
            render: (val) => (
                <Badge variant="info" size="sm">{val?.users || 0} Kullanıcı</Badge>
            )
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
                        onClick={(e) => { e.stopPropagation(); setSelectedRole(row); setIsDeleteOpen(true); }}
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
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Yetki Grupları</h1>
                    <p className="text-slate-500 dark:text-slate-400">Yöneticiler için yetki grupları tanımlayın.</p>
                </div>
                <Button onClick={() => handleOpenModal()} variant="primary" icon={<Plus size={18} />}>
                    Yeni Grup
                </Button>
            </div>

            <Table 
                data={roles} 
                columns={columns} 
                loading={loading}
                emptyMessage="Henüz yetki grubu bulunmuyor."
            />

            {/* Edit/Create Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedRole ? 'Grup Düzenle' : 'Yeni Yetki Grubu'}
                size="lg"
            >
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input 
                            label="Grup Adı"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            placeholder="Örn: Destek Ekibi"
                        />
                        <Input 
                            label="Açıklama"
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            placeholder="Grup hakkında kısa bilgi"
                        />
                    </div>

                    <div className="border rounded-xl p-4 bg-slate-50 dark:bg-slate-800/50">
                        <h3 className="font-medium text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <Lock size={16} className="text-brand-500" />
                            Yetki Ayarları
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {PERMISSION_GROUPS.map(group => (
                                <div key={group.id} className="space-y-3">
                                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 pb-1">
                                        {group.label}
                                    </h4>
                                    <div className="space-y-2">
                                        {group.permissions.map(perm => {
                                            const isChecked = formData.permissions.includes(perm.id);
                                            return (
                                                <label key={perm.id} className="flex items-center gap-2 cursor-pointer group">
                                                    <div className={`
                                                        w-5 h-5 rounded border flex items-center justify-center transition-colors
                                                        ${isChecked 
                                                            ? 'bg-brand-600 border-brand-600 text-white' 
                                                            : 'bg-white border-slate-300 dark:bg-slate-700 dark:border-slate-600'}
                                                    `}>
                                                        {isChecked && <Check size={12} />}
                                                        <input 
                                                            type="checkbox" 
                                                            className="hidden"
                                                            checked={isChecked}
                                                            onChange={() => togglePermission(perm.id)}
                                                        />
                                                    </div>
                                                    <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                                                        {perm.label}
                                                    </span>
                                                </label>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
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
                title="Grubu Sil"
                message={`"${selectedRole?.name}" grubunu silmek istediğinize emin misiniz?`}
                type="danger"
            />
        </div>
    );
};

export default UserGroups;
