
import React, { useState, useEffect } from 'react';
import { Plus, Users, Activity, LayoutGrid, CheckCircle } from 'lucide-react';
import { SubscriptionPackage, ModuleType } from '../../types';
import { api } from '../../services/api';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import RichTextEditor from '../../components/RichTextEditor';
import { X } from 'lucide-react';

const Packages: React.FC = () => {
    const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form, setForm] = useState<Partial<SubscriptionPackage>>({
        name: '', 
        description: '', 
        priceMonthly: 0, 
        priceYearly: 0, 
        maxUsers: 5, 
        maxProducts: 100, 
        storageLimit: '10GB', 
        features: [], 
        modules: [], 
        isPopular: false
    });
    const [featureInput, setFeatureInput] = useState('');

    const fetchData = async () => {
        try {
            const data = await api.superAdmin.getPackages();
            setPackages(data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleEdit = (pkg: SubscriptionPackage) => {
        setForm(pkg);
        setFeatureInput('');
        setIsModalOpen(true);
    };

    const handleNew = () => {
        setForm({ 
            name: '', 
            description: '', 
            priceMonthly: 0, 
            priceYearly: 0, 
            maxUsers: 5, 
            maxProducts: 100, 
            storageLimit: '10GB', 
            features: [], 
            modules: [], 
            isPopular: false 
        });
        setFeatureInput('');
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        try {
            await api.superAdmin.savePackage({ ...form, id: form.id || undefined });
            fetchData();
            setIsModalOpen(false);
        } catch (error) {
            alert('Paket kaydedilirken hata oluştu.');
        }
    };

    const addFeature = () => {
        if (!featureInput.trim()) return;
        setForm({ ...form, features: [...(form.features || []), featureInput] });
        setFeatureInput('');
    };

    const removeFeature = (index: number) => {
        const newFeatures = [...(form.features || [])];
        newFeatures.splice(index, 1);
        setForm({ ...form, features: newFeatures });
    };

    const toggleModule = (moduleId: ModuleType) => {
        const currentHook = form.modules || [];
        if (currentHook.includes(moduleId)) {
            setForm({ ...form, modules: currentHook.filter(m => m !== moduleId) });
        } else {
            setForm({ ...form, modules: [...currentHook, moduleId] });
        }
    };

    const availableModules: {id: ModuleType, label: string}[] = [
        { id: 'tasks', label: 'İş Takibi' },
        { id: 'calendar', label: 'Takvim' },
        { id: 'inventory', label: 'Stok & Ürünler' },
        { id: 'service', label: 'Teknik Servis' },
        { id: 'pos', label: 'Hızlı Satış POS' },
        { id: 'accounts', label: 'Cari Hesaplar' },
        { id: 'cash_bank', label: 'Kasa & Banka' },
        { id: 'finance', label: 'Gelir / Gider' },
        { id: 'invoices', label: 'Faturalar' },
        { id: 'offers', label: 'Teklifler' },
        { id: 'hr', label: 'İK Personel' },
        { id: 'reports', label: 'Raporlar' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                   <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Paket Yönetimi</h1>
                   <p className="text-slate-500 dark:text-slate-400">Abonelik planlarını ve özelliklerini yapılandırın.</p>
                </div>
                <Button onClick={handleNew} icon={<Plus size={18} />}>
                   Yeni Paket
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {packages.map(pkg => (
                  <Card key={pkg.id} className={`relative flex flex-col h-full ${pkg.isPopular ? 'ring-2 ring-purple-500 shadow-xl' : ''}`}>
                    {pkg.isPopular && (
                        <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
                           <Badge variant="purple">POPÜLER</Badge>
                        </div>
                    )}
                    
                    <div className="mb-4">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{pkg.name}</h3>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-slate-900 dark:text-white">₺{Number(pkg.priceMonthly).toLocaleString()}</span>
                            <span className="text-sm font-medium text-slate-500">/ay</span>
                        </div>
                        <div className="text-sm text-slate-500 mt-1">₺{Number(pkg.priceYearly).toLocaleString()}/yıl</div>
                    </div>
                    
                    <div className="flex-1 space-y-4 mb-6">
                      <div className="flex items-center text-sm text-slate-700 dark:text-slate-300 gap-3">
                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500">
                             <Users size={18} />
                        </div>
                        <span className="font-medium">{pkg.maxUsers === 9999 ? 'Sınırsız' : pkg.maxUsers} Kullanıcı</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-slate-700 dark:text-slate-300 gap-3">
                         <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500">
                             <Activity size={18} />
                         </div>
                        <span className="font-medium">{pkg.storageLimit} Depolama</span>
                      </div>

                      <div className="flex items-center text-sm text-slate-700 dark:text-slate-300 gap-3">
                         <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500">
                             <LayoutGrid size={18} />
                         </div>
                        <span className="font-medium">{pkg.maxProducts === 9999 ? 'Sınırsız' : pkg.maxProducts} Ürün</span>
                      </div>

                      <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                         <div className="flex items-center gap-2 mb-3 text-sm font-bold text-slate-900 dark:text-white">
                             <LayoutGrid size={16} className="text-slate-400" />
                             <span>Modüller</span>
                         </div>
                         <div className="flex flex-wrap gap-2">
                           {(pkg.modules || []).map(m => (
                             <Badge key={m} variant="secondary" className="capitalize">{m}</Badge>
                           ))}
                         </div>
                      </div>
                    </div>

                    <Button 
                      variant="outline" 
                      onClick={() => handleEdit(pkg)}
                      fullWidth
                    >
                      Düzenle
                    </Button>
                  </Card>
                ))}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={form.id ? "Paketi Düzenle" : "Yeni Paket"} size="2xl">
                <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
                    <Input 
                        label="Paket Adı"
                        value={form.name}
                        onChange={e => setForm({...form, name: e.target.value})}
                        placeholder="Örn: Başlangıç Paketi"
                    />

                    <div className="space-y-1">
                        <RichTextEditor 
                            label="Paket Açıklaması"
                            value={form.description || ''}
                            onChange={val => setForm({...form, description: val})}
                            placeholder="Paket detaylarını buraya yazınız..."
                            height="150px"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                         <Input 
                            label="Aylık Fiyat (TL)"
                            type="number"
                            value={form.priceMonthly}
                            onChange={e => setForm({...form, priceMonthly: Number(e.target.value)})}
                        />
                        <Input 
                            label="Yıllık Fiyat (TL)"
                            type="number"
                            value={form.priceYearly}
                            onChange={e => setForm({...form, priceYearly: Number(e.target.value)})}
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <Input 
                            label="Maksimum Kullanıcı"
                            type="number"
                            value={form.maxUsers}
                            onChange={e => setForm({...form, maxUsers: Number(e.target.value)})}
                        />
                        <Input 
                            label="Ürün Limiti"
                            type="number"
                            value={form.maxProducts}
                            onChange={e => setForm({...form, maxProducts: Number(e.target.value)})}
                        />
                        <Input 
                            label="Depolama Limiti"
                            value={form.storageLimit}
                            onChange={e => setForm({...form, storageLimit: e.target.value})}
                            placeholder="Örn: 10GB"
                        />
                    </div>

                    {/* Features Editor */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Özellik Listesi (Pricing Card için)</label>
                        <div className="flex gap-2 mb-2">
                             <Input 
                                value={featureInput}
                                onChange={e => setFeatureInput(e.target.value)}
                                placeholder="Özellik ekle (örn: 7/24 Destek)"
                                className="flex-1"
                                onKeyDown={e => e.key === 'Enter' && addFeature()}
                            />
                            <Button onClick={addFeature} variant="secondary" size="sm">Ekle</Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {form.features?.map((feat, idx) => (
                                <div key={idx} className="flex items-center gap-1 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-sm">
                                    <span>{feat}</span>
                                    <button onClick={() => removeFeature(idx)} className="text-slate-400 hover:text-red-500">
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-3 text-slate-900 dark:text-white">Modüller</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {availableModules.map(module => {
                                const isSelected = form.modules?.includes(module.id);
                                return (
                                    <div 
                                        key={module.id} 
                                        onClick={() => toggleModule(module.id)}
                                        className={`
                                            p-3 rounded-xl border cursor-pointer flex items-center gap-3 transition-all
                                            ${isSelected
                                                ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-500 text-purple-700 dark:text-purple-300 ring-1 ring-purple-500'
                                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                            }
                                        `}
                                    >
                                        <div className={`
                                            w-5 h-5 rounded-full border flex items-center justify-center transition-colors
                                            ${isSelected ? 'bg-purple-600 border-purple-600' : 'border-slate-300 dark:border-slate-600'}
                                        `}>
                                            {isSelected && <CheckCircle size={12} className="text-white" />}
                                        </div>
                                        <span className="text-sm font-medium">{module.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                     <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                        <input 
                            type="checkbox" 
                            checked={form.isPopular} 
                            onChange={e => setForm({...form, isPopular: e.target.checked})} 
                            className="w-5 h-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500" 
                            id="pop" 
                        />
                        <label htmlFor="pop" className="text-sm font-bold cursor-pointer select-none">Bu paketi "Popüler" olarak işaretle</label>
                    </div>

                    <div className="flex justify-end pt-4 gap-2">
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)}>İptal</Button>
                        <Button onClick={handleSave}>Kaydet</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Packages;
