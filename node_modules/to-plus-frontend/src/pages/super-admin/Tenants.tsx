
import React, { useState, useEffect } from 'react';
import { Plus, MoreVertical, Edit2 } from 'lucide-react';
import { Tenant } from '../../types';
import { api } from '../../services/api';
import Table, { Column } from '../../components/Table';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Badge from '../../components/Badge';
import SearchInput from '../../components/SearchInput';

const Tenants: React.FC = () => {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [packages, setPackages] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Form
    const [form, setForm] = useState({
        companyName: '',
        email: '',
        password: '',
        packageId: '',
        type: 'corporate',
        taxNumber: ''
    });

    const fetchData = async () => {
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
        try {
            const newTenant = {
              name: form.companyName,
              contactEmail: form.email,
              type: form.type,
              taxNumber: form.taxNumber,
              packageId: form.packageId
            };
            const newAdmin = {
                adminName: 'Yönetici',
                adminEmail: form.email,
                adminPassword: form.password
            };

            await api.superAdmin.createTenant(newTenant, newAdmin);
            await fetchData();
            setIsModalOpen(false);
            setForm({ companyName: '', email: '', password: '', packageId: '', type: 'corporate', taxNumber: '' });
        } catch (error) {
            alert('Firma oluşturulurken hata oluştu.');
        }
    };

    const filteredTenants = tenants.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.contactEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.taxNumber?.includes(searchQuery)
    );

    const columns: Column<Tenant>[] = [
        {
            key: 'name',
            header: 'Firma / Abone',
            render: (val, row) => (
                <div>
                    <div className="font-bold text-slate-900 dark:text-white">{val}</div>
                    <div className="text-xs text-slate-500">{row.taxNumber ? `VN: ${row.taxNumber}` : 'Bireysel'}</div>
                </div>
            )
        },
        {
            key: 'contactEmail',
            header: 'İletişim',
            render: (val) => <span className="text-sm text-slate-600 dark:text-slate-300">{val}</span>
        },
        {
            key: 'subscriptionPackage',
            header: 'Paket',
            render: (val: any) => (
                <Badge variant="purple">{val?.name || 'Paketsiz'}</Badge>
            )
        },
        {
            key: 'status',
            header: 'Durum',
            render: (val) => (
                <Badge variant={val === 'active' ? 'success' : 'danger'}>
                    {val === 'active' ? 'Aktif' : 'Pasif'}
                </Badge>
            )
        },
        {
            key: 'subscriptionEnd',
            header: 'Bitiş Tarihi',
            render: (val) => val ? new Date(val).toLocaleDateString('tr-TR') : '-'
        },
        {
            key: 'actions',
            header: 'İşlem',
            align: 'right',
            render: () => (
                <button className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                    <MoreVertical size={18} />
                </button>
            )
        }
    ];

    const packageOptions = packages.map(p => ({
        value: p.id,
        label: `${p.name} - ₺${p.priceMonthly}/ay`
    }));

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                   <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Aboneler & Firmalar</h1>
                   <p className="text-slate-500 dark:text-slate-400">Sistemdeki tüm kayıtlı firmaları yönetin.</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} icon={<Plus size={18} />}>
                   Yeni Firma Ekle
                </Button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
                <div className="mb-4 max-w-md">
                     <SearchInput 
                        placeholder="Firma adı, email veya vergi no ara..." 
                        value={searchQuery}
                        onChange={setSearchQuery}
                     />
                </div>
                
                <Table 
                    data={filteredTenants}
                    columns={columns}
                    loading={loading}
                    emptyMessage="Kayıtlı firma bulunamadı."
                />
            </div>

            <Modal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title="Yeni Firma Oluştur" 
                size="lg"
            >
                <div className="space-y-4">
                     <Input 
                        label="Firma Adı"
                        value={form.companyName}
                        onChange={e => setForm({...form, companyName: e.target.value})}
                        placeholder="Şirket Ünvanı"
                     />
                    <div className="grid grid-cols-2 gap-4">
                        <Select 
                            label="Tip"
                            options={[
                                { value: 'corporate', label: 'Kurumsal' },
                                { value: 'individual', label: 'Bireysel' }
                            ]}
                            value={form.type}
                            onChange={val => setForm({...form, type: val})}
                        />
                        <Input 
                            label="Vergi No / TC"
                            value={form.taxNumber}
                            onChange={e => setForm({...form, taxNumber: e.target.value})}
                            placeholder="1234567890"
                        />
                    </div>
                    <Input 
                        label="Yönetici Email"
                        type="email"
                        value={form.email}
                        onChange={e => setForm({...form, email: e.target.value})}
                        placeholder="admin@sirket.com"
                    />
                    <Input 
                        label="Geçici Şifre"
                        type="password"
                        value={form.password}
                        onChange={e => setForm({...form, password: e.target.value})}
                        placeholder="******"
                    />
                    <Select 
                        label="Abonelik Paketi"
                        options={packageOptions}
                        value={form.packageId}
                        onChange={val => setForm({...form, packageId: val})}
                        placeholder="Paket Seçiniz"
                    />
                    <div className="flex justify-end pt-4 gap-2">
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)}>İptal</Button>
                        <Button onClick={handleSubmit}>Kaydet</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Tenants;
