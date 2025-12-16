
import React, { useState, useEffect } from 'react';
import { 
  Upload, Download, Database, RefreshCw, FileSpreadsheet, 
  CheckCircle, AlertCircle, ShoppingBag, CreditCard, Link, 
  Globe, Server, X, ArrowRight, Loader2, FileText as FileTextIcon, Lock, Plus, Trash2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { api } from '../services/api';
import { Product, Account, ModuleType, WebhookConfig } from '../types';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

const DataManagement: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'import' | 'export' | 'integrations' | 'webhooks'>('import');
  
  // Import State
  const [importType, setImportType] = useState<'products' | 'customers' | 'suppliers'>('products');
  const [dragActive, setDragActive] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'preview' | 'processing' | 'success' | 'error'>('idle');
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [importedCount, setImportedCount] = useState(0);

  // Webhook State
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
  const [webhookForm, setWebhookForm] = useState<Partial<WebhookConfig>>({
      url: '',
      events: [],
      status: 'active'
  });

  // Integration State
  const [integrations, setIntegrations] = useState([
    { id: 1, name: 'Trendyol', type: 'E-Ticaret', status: 'connected', lastSync: '10 dakika önce', icon: ShoppingBag, module: 'sales' },
    { id: 2, name: 'Hepsiburada', type: 'E-Ticaret', status: 'disconnected', lastSync: '-', icon: ShoppingBag, module: 'sales' },
    { id: 3, name: 'Paraşüt', type: 'Muhasebe', status: 'connected', lastSync: '1 saat önce', icon: FileTextIcon, module: 'finance' },
    { id: 4, name: 'Garanti Sanal POS', type: 'Banka', status: 'connected', lastSync: 'Anlık', icon: CreditCard, module: 'finance' },
    { id: 5, name: 'WooCommerce', type: 'Web', status: 'disconnected', lastSync: '-', icon: Globe, module: 'sales' },
  ]);

  // Helper to check module access
  const hasAccess = (module: ModuleType) => {
    if (!user?.allowedModules || user.allowedModules.length === 0) return true;
    return user.allowedModules.includes(module);
  };

  useEffect(() => {
      if (activeTab === 'webhooks') {
          api.webhooks.getAll().then(setWebhooks);
      }
  }, [activeTab]);

  // Drag handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    setImportStatus('processing');
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(worksheet);
            
            if (json && json.length > 0) {
                setPreviewData(json);
                setImportStatus('preview');
            } else {
                alert("Dosya boş veya okunamadı.");
                setImportStatus('idle');
            }
        } catch (error) {
            console.error("File parse error", error);
            alert("Dosya işlenirken hata oluştu.");
            setImportStatus('error');
        }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = async () => {
      setImportStatus('processing');
      let successCount = 0;

      try {
          // Process based on type
          if (importType === 'products') {
              for (const row of previewData) {
                  // Basic mapping (assuming headers match or are simple)
                  const newProduct: Product = {
                      id: `PRD-IMP-${Date.now()}-${Math.floor(Math.random()*1000)}`,
                      tenantId: user?.tenantId || 'tenant-1',
                      name: row['Ürün Adı'] || row['name'] || 'İsimsiz Ürün',
                      code: row['Stok Kodu'] || row['code'] || `KOD-${Date.now()}`,
                      category: row['Kategori'] || row['category'] || 'Genel',
                      price: parseFloat(row['Fiyat'] || row['price']) || 0,
                      stock: parseInt(row['Stok'] || row['stock']) || 0,
                      minStock: 5,
                      currency: 'TRY', // Default
                      status: 'active'
                  };
                  await api.products.create(newProduct);
                  successCount++;
              }
          } else if (importType === 'customers' || importType === 'suppliers') {
              for (const row of previewData) {
                  const newAccount: Account = {
                      id: `ACC-IMP-${Date.now()}-${Math.floor(Math.random()*1000)}`,
                      tenantId: user?.tenantId || 'tenant-1',
                      accountCode: row['Cari Kodu'] || row['code'] || `CARI-${Date.now()}`,
                      type: importType === 'customers' ? 'customer' : 'supplier',
                      category: 'corporate',
                      name: row['Ünvan'] || row['name'] || 'İsimsiz Cari',
                      authorizedPerson: row['Yetkili'] || row['contact'] || '-',
                      email: row['E-posta'] || row['email'] || '',
                      phone: row['Telefon'] || row['phone'] || '',
                      balance: 0,
                      status: 'active'
                  };
                  await api.accounts.create(newAccount);
                  successCount++;
              }
          }

          setImportedCount(successCount);
          setImportStatus('success');
      } catch (error) {
          console.error("Import execution failed", error);
          setImportStatus('error');
      }
  };

  const resetImport = () => {
      setImportStatus('idle');
      setPreviewData([]);
      setImportedCount(0);
  };

  const toggleIntegration = (id: number) => {
    setIntegrations(prev => prev.map(int => 
      int.id === id ? { ...int, status: int.status === 'connected' ? 'disconnected' : 'connected' } : int
    ));
  };

  const handleWebhookSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!webhookForm.url) return;
      const newWebhook: WebhookConfig = {
          id: `WH-${Date.now()}`,
          tenantId: user?.tenantId || 'tenant-1',
          url: webhookForm.url,
          events: webhookForm.events as any,
          secret: `whsec_${Math.random().toString(36).substring(7)}`,
          status: 'active'
      };
      await api.webhooks.create(newWebhook);
      setWebhooks([...webhooks, newWebhook]);
      setIsWebhookModalOpen(false);
      setWebhookForm({ url: '', events: [], status: 'active' });
  };

  const handleDeleteWebhook = async (id: string) => {
      await api.webhooks.delete(id);
      setWebhooks(webhooks.filter(w => w.id !== id));
  };

  const toggleWebhookEvent = (event: string) => {
      const current = webhookForm.events || [];
      if(current.includes(event as any)) {
          setWebhookForm({ ...webhookForm, events: current.filter(e => e !== event) });
      } else {
          setWebhookForm({ ...webhookForm, events: [...current, event as any] });
      }
  };

  // Helper icons for display
  const PackageIcon = () => <div className="p-1 bg-purple-100 text-purple-600 rounded"><ShoppingBag size={16}/></div>;
  const UsersIcon = () => <div className="p-1 bg-blue-100 text-blue-600 rounded"><Globe size={16}/></div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Veri ve Entegrasyon</h1>
          <p className="text-slate-500 dark:text-slate-400">Veri aktarımı ve 3. parti bağlantı yönetimi.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('import')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center ${activeTab === 'import' ? 'border-brand-600 text-brand-600 dark:text-brand-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
        >
          <Upload size={16} className="mr-2" />
          İçe Aktar (Import)
        </button>
        <button 
          onClick={() => setActiveTab('export')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center ${activeTab === 'export' ? 'border-brand-600 text-brand-600 dark:text-brand-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
        >
          <Download size={16} className="mr-2" />
          Dışa Aktar (Export)
        </button>
        <button 
          onClick={() => setActiveTab('integrations')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center ${activeTab === 'integrations' ? 'border-brand-600 text-brand-600 dark:text-brand-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
        >
          <Link size={16} className="mr-2" />
          Entegrasyonlar
        </button>
        <button 
          onClick={() => setActiveTab('webhooks')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center ${activeTab === 'webhooks' ? 'border-brand-600 text-brand-600 dark:text-brand-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
        >
          <Globe size={16} className="mr-2" />
          Webhooks
        </button>
      </div>

      {/* --- IMPORT TAB --- */}
      {activeTab === 'import' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-enterprise-800 rounded-xl shadow-card border border-slate-200 dark:border-slate-700/50 p-6">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Excel / CSV İçe Aktarma</h3>
                  {importStatus === 'preview' && (
                      <button onClick={resetImport} className="text-sm text-red-500 hover:underline">İptal</button>
                  )}
              </div>
              
              {importStatus === 'idle' || importStatus === 'processing' ? (
                  <>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Veri Türü</label>
                        <div className="grid grid-cols-3 gap-3">
                          
                          <button
                            onClick={() => setImportType('products')}
                            disabled={!hasAccess('inventory')}
                            className={`py-3 px-4 rounded-lg text-sm font-medium border transition-colors capitalize flex flex-col items-center justify-center ${
                                importType === 'products' 
                                ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-500 text-brand-700 dark:text-brand-400' 
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                            } ${!hasAccess('inventory') ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <span>Ürünler</span>
                            {!hasAccess('inventory') && <Lock size={12} className="mt-1" />}
                          </button>

                          <button
                            onClick={() => setImportType('customers')}
                            disabled={!hasAccess('sales') && !hasAccess('finance')}
                            className={`py-3 px-4 rounded-lg text-sm font-medium border transition-colors capitalize flex flex-col items-center justify-center ${
                                importType === 'customers' 
                                ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-500 text-brand-700 dark:text-brand-400' 
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                            } ${(!hasAccess('sales') && !hasAccess('finance')) ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <span>Müşteriler</span>
                            {(!hasAccess('sales') && !hasAccess('finance')) && <Lock size={12} className="mt-1" />}
                          </button>

                          <button
                            onClick={() => setImportType('suppliers')}
                            disabled={!hasAccess('finance') && !hasAccess('inventory')}
                            className={`py-3 px-4 rounded-lg text-sm font-medium border transition-colors capitalize flex flex-col items-center justify-center ${
                                importType === 'suppliers' 
                                ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-500 text-brand-700 dark:text-brand-400' 
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                            } ${(!hasAccess('finance') && !hasAccess('inventory')) ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <span>Tedarikçiler</span>
                            {(!hasAccess('finance') && !hasAccess('inventory')) && <Lock size={12} className="mt-1" />}
                          </button>

                        </div>
                    </div>

                    {/* Drag & Drop Zone */}
                    <div 
                        className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-all ${
                        dragActive 
                            ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/10' 
                            : 'border-slate-300 dark:border-slate-600 hover:border-brand-400 dark:hover:border-brand-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                        }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <input 
                        type="file" 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleFileChange}
                        accept=".xlsx,.xls,.csv"
                        disabled={importStatus === 'processing'}
                        />
                        
                        {importStatus === 'processing' ? (
                        <div className="flex flex-col items-center">
                            <Loader2 size={40} className="text-brand-500 animate-spin mb-3" />
                            <p className="text-slate-900 dark:text-white font-medium">Dosya işleniyor...</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Veriler hazırlanıyor.</p>
                        </div>
                        ) : (
                        <div className="flex flex-col items-center pointer-events-none">
                            <FileSpreadsheet size={40} className="text-slate-400 dark:text-slate-500 mb-3" />
                            <p className="text-slate-900 dark:text-white font-medium">Dosyayı buraya sürükleyin</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">veya seçmek için tıklayın</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">Desteklenen: .xlsx, .xls, .csv</p>
                        </div>
                        )}
                    </div>
                  </>
              ) : importStatus === 'preview' ? (
                  <div className="space-y-4">
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-300">
                          <strong>{previewData.length}</strong> satır veri bulundu. İlk 5 satır aşağıda gösterilmektedir.
                      </div>
                      
                      <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                          <table className="w-full text-left text-sm">
                              <thead className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                  <tr>
                                      {Object.keys(previewData[0] || {}).slice(0, 5).map(key => (
                                          <th key={key} className="px-4 py-2 font-medium">{key}</th>
                                      ))}
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
                                  {previewData.slice(0, 5).map((row, idx) => (
                                      <tr key={idx}>
                                          {Object.values(row).slice(0, 5).map((val: any, vIdx) => (
                                              <td key={vIdx} className="px-4 py-2 text-slate-700 dark:text-slate-300">{val}</td>
                                          ))}
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>

                      <div className="flex justify-end gap-3 pt-4">
                          <button onClick={resetImport} className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg transition-colors">İptal</button>
                          <button onClick={handleConfirmImport} className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg shadow-sm font-medium flex items-center">
                              <CheckCircle size={18} className="mr-2" />
                              Onayla ve Yükle
                          </button>
                      </div>
                  </div>
              ) : importStatus === 'success' ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle size={40} className="text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">İçe Aktarma Başarılı!</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-center mb-6">
                        Toplam <strong>{importedCount}</strong> kayıt sisteme başarıyla eklendi.
                    </p>
                    <button 
                      onClick={resetImport}
                      className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg shadow-sm font-medium"
                    >
                      Yeni Dosya Yükle
                    </button>
                  </div>
              ) : (
                  <div className="flex flex-col items-center justify-center py-10">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                        <AlertCircle size={40} className="text-red-600 dark:text-red-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Hata Oluştu!</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-center mb-6">
                        Dosya işlenirken bir sorun oluştu. Lütfen dosya formatını kontrol ediniz.
                    </p>
                    <button 
                      onClick={resetImport}
                      className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg shadow-sm font-medium"
                    >
                      Tekrar Dene
                    </button>
                  </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800 h-full">
              <h4 className="font-bold text-blue-900 dark:text-blue-200 mb-4 flex items-center">
                <AlertCircle size={20} className="mr-2" />
                Önemli Bilgiler
              </h4>
              <ul className="space-y-3 text-sm text-blue-800 dark:text-blue-300">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Excel dosyasının ilk satırı başlık olmalıdır (Ürün Adı, Fiyat vb.).</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Ürünler için: 'Ürün Adı', 'Fiyat', 'Stok' sütunları önerilir.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Cariler için: 'Ünvan', 'Telefon', 'E-posta' sütunları önerilir.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Maksimum dosya boyutu 10MB'dır.</span>
                </li>
              </ul>
              
              <button className="w-full mt-6 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 font-medium py-3 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors flex items-center justify-center shadow-sm">
                <Download size={18} className="mr-2" />
                Örnek Şablonu İndir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- EXPORT TAB --- */}
      {activeTab === 'export' && (
        <div className="bg-white dark:bg-enterprise-800 rounded-xl shadow-card border border-slate-200 dark:border-slate-700/50 p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Sistem Verilerini Dışa Aktar</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { id: 'financial', title: 'Finansal Raporlar', desc: 'Gelir/Gider, Kasa Hareketleri', icon: FileTextIcon, module: 'finance' },
              { id: 'inventory', title: 'Stok Durumu', desc: 'Mevcut Stoklar, Kritik Seviyeler', icon: PackageIcon, module: 'inventory' },
              { id: 'sales', title: 'Satış Verileri', desc: 'Fatura Listesi, Ürün Satışları', icon: ShoppingBag, module: 'sales' },
              { id: 'customers', title: 'Cari Hesaplar', desc: 'Müşteri ve Tedarikçi Listesi', icon: UsersIcon, module: 'finance' },
              { id: 'hr', title: 'Personel Verileri', desc: 'Maaş Bordroları, İzinler', icon: FileTextIcon, module: 'hr' },
              { id: 'logs', title: 'Sistem Logları', desc: 'İşlem Geçmişi, Hata Kayıtları', icon: Database, module: 'settings' },
            ].map(item => {
              const accessible = hasAccess(item.module as ModuleType);
              return (
                <div key={item.id} className={`border border-slate-200 dark:border-slate-700 rounded-xl p-5 transition-all group bg-slate-50/50 dark:bg-slate-800/50 ${accessible ? 'hover:border-brand-500 dark:hover:border-brand-500 hover:shadow-md cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-lg ${accessible ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 group-hover:bg-brand-100 dark:group-hover:bg-brand-900/30 group-hover:text-brand-600 dark:group-hover:text-brand-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                      <item.icon size={24} />
                    </div>
                    {!accessible && <Lock size={16} className="text-slate-400" />}
                    {accessible && <div className="h-6 w-6 rounded-full border-2 border-slate-300 dark:border-slate-600 group-hover:border-brand-500 transition-colors"></div>}
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1">{item.title}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 flex justify-end items-center gap-4">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Format: <span className="font-bold text-slate-900 dark:text-white">Excel (.xlsx)</span>
            </div>
            <button className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium shadow-sm transition-colors flex items-center">
              <Download size={18} className="mr-2" />
              Seçilenleri İndir
            </button>
          </div>
        </div>
      )}

      {/* --- INTEGRATIONS TAB --- */}
      {activeTab === 'integrations' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-enterprise-800 rounded-xl shadow-card border border-slate-200 dark:border-slate-700/50 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Entegrasyon Adı</th>
                  <th className="px-6 py-4">Tür</th>
                  <th className="px-6 py-4">Son Eşitleme</th>
                  <th className="px-6 py-4">Durum</th>
                  <th className="px-6 py-4 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {integrations.map(int => {
                  const accessible = hasAccess(int.module as ModuleType);
                  return (
                    <tr key={int.id} className={`transition-colors ${accessible ? 'hover:bg-slate-50 dark:hover:bg-slate-700/30' : 'opacity-50 bg-slate-50/50 dark:bg-slate-900/50'}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 mr-3">
                            <int.icon size={20} />
                          </div>
                          <div>
                            <div className="font-medium text-slate-900 dark:text-white">{int.name}</div>
                            {!accessible && <span className="text-[10px] text-red-500 flex items-center"><Lock size={10} className="mr-1"/> Yetki Yok</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{int.type}</td>
                      <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 flex items-center">
                        <RefreshCw size={14} className="mr-2" />
                        {int.lastSync}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          int.status === 'connected' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                        }`}>
                          {int.status === 'connected' ? 'Bağlı' : 'Bağlantı Yok'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <label className={`relative inline-flex items-center cursor-pointer ${!accessible ? 'pointer-events-none' : ''}`}>
                          <input 
                            type="checkbox" 
                            checked={int.status === 'connected'} 
                            onChange={() => toggleIntegration(int.id)}
                            className="sr-only peer" 
                            disabled={!accessible}
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-600"></div>
                        </label>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {hasAccess('settings') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-white dark:bg-enterprise-800 rounded-xl shadow-card border border-slate-200 dark:border-slate-700/50 p-6">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                    <Server size={20} className="mr-2 text-brand-600" />
                    API Erişimi
                  </h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    Harici sistemlerin ToPlus verilerine erişebilmesi için API anahtarı oluşturun.
                  </p>
                  <div className="bg-slate-100 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-sm text-slate-600 dark:text-slate-300 break-all">
                    tp_live_8392ns92ks020sk293...
                  </div>
                  <button className="mt-3 text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline">
                    Yeni Anahtar Oluştur
                  </button>
               </div>
            </div>
          )}
        </div>
      )}

      {/* --- WEBHOOKS TAB --- */}
      {activeTab === 'webhooks' && (
          <div>
              <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Webhook Yapılandırması</h3>
                  <button 
                      onClick={() => setIsWebhookModalOpen(true)}
                      className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center"
                  >
                      <Plus size={16} className="mr-2" /> Yeni Webhook
                  </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                  {webhooks.length === 0 ? (
                      <div className="text-center py-10 text-slate-500 bg-white dark:bg-enterprise-800 rounded-xl border border-slate-200 dark:border-slate-700">
                          Henüz webhook tanımlanmamış.
                      </div>
                  ) : (
                      webhooks.map(wh => (
                          <div key={wh.id} className="bg-white dark:bg-enterprise-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center">
                              <div>
                                  <div className="flex items-center gap-2 mb-1">
                                      <span className="font-bold text-slate-900 dark:text-white">{wh.url}</span>
                                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${wh.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                          {wh.status}
                                      </span>
                                  </div>
                                  <div className="flex gap-2">
                                      {wh.events.map(ev => (
                                          <span key={ev} className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-300">
                                              {ev}
                                          </span>
                                      ))}
                                  </div>
                                  <div className="mt-2 text-xs text-slate-400 font-mono">Secret: {wh.secret}</div>
                              </div>
                              <button onClick={() => handleDeleteWebhook(wh.id)} className="text-slate-400 hover:text-red-500 p-2 mt-4 md:mt-0">
                                  <Trash2 size={18} />
                              </button>
                          </div>
                      ))
                  )}
              </div>
          </div>
      )}

      {/* Webhook Modal */}
      <Modal isOpen={isWebhookModalOpen} onClose={() => setIsWebhookModalOpen(false)} title="Yeni Webhook Ekle">
          <form onSubmit={handleWebhookSubmit} className="space-y-4">
              <div>
                  <label className="block text-sm font-bold mb-1">Payload URL</label>
                  <input 
                      type="url" 
                      required 
                      className="w-full px-4 py-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700" 
                      placeholder="https://api.domain.com/callback"
                      value={webhookForm.url}
                      onChange={e => setWebhookForm({...webhookForm, url: e.target.value})}
                  />
              </div>
              <div>
                  <label className="block text-sm font-bold mb-2">Tetikleyiciler (Events)</label>
                  <div className="space-y-2">
                      {['order.created', 'stock.low', 'invoice.paid', 'ticket.created'].map(ev => (
                          <label key={ev} className="flex items-center gap-2 cursor-pointer">
                              <input 
                                  type="checkbox" 
                                  checked={webhookForm.events?.includes(ev as any)}
                                  onChange={() => toggleWebhookEvent(ev)}
                                  className="rounded text-brand-600"
                              />
                              <span className="text-sm">{ev}</span>
                          </label>
                      ))}
                  </div>
              </div>
              <div className="flex justify-end pt-4">
                  <button type="submit" className="bg-brand-600 text-white px-4 py-2 rounded-lg font-bold">Oluştur</button>
              </div>
          </form>
      </Modal>
    </div>
  );
};

export default DataManagement;
