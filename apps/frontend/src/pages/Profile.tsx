
import React, { useState, useRef, useEffect } from 'react';
import { 
  User, Lock, Settings, Camera, Mail, Phone, MapPin, Save, Globe, Bell, Moon, 
  Upload, CheckCircle, AlertCircle, Loader2, Edit, X, CreditCard, 
  FileText, Package, Cloud, Activity, Download, Shield 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import UserAvatar from '../components/UserAvatar';

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'personal' | 'security' | 'preferences' | 'billing' | 'subscription' | 'invoices'>('personal');
  const [showToast, setShowToast] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  
  // Local state for editing form
  const [formData, setFormData] = useState({
      name: user?.name || '',
      email: user?.email || '',
      title: user?.role === 'admin' ? 'Yönetici' : 'Personel',
      phone: user?.phoneNumber || '', 
      location: '',
      bio: user?.bio || '',
      avatar: user?.avatar || ''
  });

  // Re-sync if user changes
  useEffect(() => {
    if(user && !isEditing) {
        setFormData(prev => ({
            ...prev,
            name: user.name || '',
            email: user.email || '',
            phone: user.phoneNumber || '',
            bio: user.bio || '',
            avatar: user.avatar || ''
        }));
    }
  }, [user, isEditing]);

  const [billingInfo, setBillingInfo] = useState({
      companyName: '',
      taxOffice: '',
      taxNumber: '',
      billingAddress: ''
  });

  const [preferences, setPreferences] = useState({
      language: 'tr',
      theme: 'light',
      notifications: {
        email: true,
        desktop: true,
        weekly: false
      }
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatPhoneNumber = (value: string) => {
    const phoneNumber = value.replace(/\D/g, '');
    if (phoneNumber.length === 0) return '';
    if (phoneNumber.length <= 3) return `(${phoneNumber}`;
    if (phoneNumber.length <= 6) return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    if (phoneNumber.length <= 8) return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)} ${phoneNumber.slice(6)}`;
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)} ${phoneNumber.slice(6, 8)} ${phoneNumber.slice(8, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatPhoneNumber(e.target.value);
      setFormData({ ...formData, phone: formatted });
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, avatar: imageUrl }));
      
      try {
          const uploadedUrl = await api.uploadFile(file, 'avatars');
          setFormData(prev => ({ ...prev, avatar: uploadedUrl }));
      } catch (error) {
          console.error("Avatar upload failed", error);
          alert("Fotoğraf yüklenemedi.");
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleBillingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setBillingInfo({ ...billingInfo, [name]: value });
  };

  const handlePreferenceChange = (section: string, value: any) => {
    if (section === 'notifications') {
       setPreferences({
        ...preferences,
        notifications: { ...preferences.notifications, ...value }
      });
    } else {
      setPreferences({ ...preferences, [section]: value });
    }
  };

  const showSuccessMessage = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleCancelEdit = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      title: user?.role === 'admin' ? 'Yönetici' : 'Personel',
      phone: user?.phoneNumber || '', 
      location: '',
      bio: user?.bio || '',
      avatar: user?.avatar || ''
    });
    setIsEditing(false);
  };

  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
        const cleanPhone = formData.phone.replace(/\D/g, '');

        const updatedUser = {
            ...user,
            name: formData.name,
            email: formData.email,
            avatar: formData.avatar,
            phone: cleanPhone, 
            phoneNumber: cleanPhone,
            bio: formData.bio
        };
        
        await api.auth.updateProfile(updatedUser);
        updateUser(updatedUser);
        showSuccessMessage();
        setIsEditing(false);
    } catch (error) {
        console.error("Profile update failed", error);
        alert("Profil güncellenirken hata oluştu.");
    } finally {
        setLoading(false);
    }
  };

  const passwordRequirements = [
    { id: 'length', text: 'En az 8 karakter', valid: passwordForm.new.length >= 8 },
    { id: 'uppercase', text: 'En az bir büyük harf', valid: /[A-Z]/.test(passwordForm.new) },
    { id: 'lowercase', text: 'En az bir küçük harf', valid: /[a-z]/.test(passwordForm.new) },
    { id: 'number', text: 'En az bir rakam', valid: /[0-9]/.test(passwordForm.new) },
    { id: 'special', text: 'En az bir özel karakter (!@#$%^&*)', valid: /[^A-Za-z0-9]/.test(passwordForm.new) },
  ];

  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (passwordForm.new !== passwordForm.confirm) {
      setPasswordError('Yeni şifreler eşleşmiyor!');
      return;
    }

    const isPasswordValid = passwordRequirements.every(req => req.valid);
    if (!isPasswordValid) {
      setPasswordError('Şifre tüm güvenlik gereksinimlerini karşılamalıdır.');
      return;
    }

    try {
        setLoading(true);
        await api.auth.changePassword(user.id, passwordForm.current, passwordForm.new);
        setPasswordForm({ current: '', new: '', confirm: '' });
        showSuccessMessage();
    } catch (error: any) {
        setPasswordError(error.message || 'Şifre değiştirilirken hata oluştu.');
    } finally {
        setLoading(false);
    }
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    showSuccessMessage();
  };
  
  const handleSaveBilling = (e: React.FormEvent) => {
      e.preventDefault();
      showSuccessMessage();
  };

  const inputClass = "w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400";
  const labelClass = "block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide";
  const readOnlyClass = "text-slate-900 dark:text-white font-medium text-base py-2.5 border-b border-slate-100 dark:border-slate-800 w-full";

  if (!user) return null;

  return (
    <div className="p-6 max-w-7xl mx-auto relative min-h-screen">
      {/* Success Toast */}
      {showToast && (
        <div className="fixed top-24 right-8 bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center z-50 animate-fade-in-down border border-emerald-500/50">
          <CheckCircle size={22} className="mr-3" />
          <span className="font-semibold">İşlem başarıyla tamamlandı!</span>
        </div>
      )}

      <div className="mb-8 pl-1">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Profil & Ayarlar</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Hesap bilgilerinizi ve tercihlerinizi yönetin.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* User Card */}
          <div className="bg-white dark:bg-enterprise-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 p-6 flex flex-col items-center text-center">
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageChange} 
              className="hidden" 
              accept="image/*"
            />

            <div 
              className="relative mb-5 group cursor-pointer"
              onClick={isEditing ? triggerFileInput : undefined}
            >
              <div className="w-28 h-28 rounded-full overflow-hidden border-[5px] border-slate-50 dark:border-slate-800 shadow-md">
                <UserAvatar 
                    name={formData.name} 
                    src={formData.avatar} 
                    size="3xl" 
                    className="w-full h-full"
                />
              </div>
              {isEditing && (
                <div className="absolute bottom-0 right-0 p-2.5 bg-brand-600 text-white rounded-full hover:bg-brand-700 transition-colors shadow-lg z-10 border-4 border-white dark:border-slate-900">
                  <Camera size={16} />
                </div>
              )}
            </div>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{formData.name}</h2>
            <p className="text-xs text-brand-600 dark:text-brand-400 font-bold bg-brand-50 dark:bg-brand-900/30 px-3 py-1 rounded-full mb-4">
               {formData.title} #{user.userNo || user.id}
            </p>
            
            {isEditing && (
              <button 
                onClick={triggerFileInput}
                className="mb-4 px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors flex items-center w-full justify-center shadow-sm"
              >
                <Upload size={14} className="mr-2" />
                Fotoğraf Yükle
              </button>
            )}

             <div className="w-full space-y-3 text-left mt-2 pt-5 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center text-slate-600 dark:text-slate-400 text-sm">
                  <Mail size={16} className="mr-3 text-brand-500" />
                  <span className="truncate">{formData.email}</span>
                </div>
                {formData.phone && (
                   <div className="flex items-center text-slate-600 dark:text-slate-400 text-sm">
                    <Phone size={16} className="mr-3 text-brand-500" />
                    <span>{formData.phone}</span>
                   </div>
               )}
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="bg-white dark:bg-enterprise-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700 font-bold text-xs uppercase text-slate-500 dark:text-slate-400">
                Hesap & Güvenlik
            </div>
            <nav className="flex flex-col p-2 space-y-1">
              {[
                { id: 'personal', label: 'Kişisel Bilgiler', icon: User },
                { id: 'security', label: 'Güvenlik', icon: Shield },
                { id: 'preferences', label: 'Tercihler', icon: Settings }
              ].map(item => (
                  <button 
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all ${
                      activeTab === item.id 
                        ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <item.icon size={18} className="mr-3" />
                    {item.label}
                  </button>
              ))}
            </nav>

            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-y border-slate-100 dark:border-slate-700 font-bold text-xs uppercase text-slate-500 dark:text-slate-400 mt-2">
                Ödemeler & Faturalar
            </div>
             <nav className="flex flex-col p-2 space-y-1">
              {[
                { id: 'billing', label: 'Fatura Bilgileri', icon: FileText },
                { id: 'subscription', label: 'Abonelik', icon: Package },
                { id: 'invoices', label: 'Faturalar & Ekstre', icon: CreditCard }
              ].map(item => (
                  <button 
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all ${
                      activeTab === item.id 
                        ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <item.icon size={18} className="mr-3" />
                    {item.label}
                  </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9">
          <div className="bg-white dark:bg-enterprise-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 p-8 min-h-[600px] relative">
            
            {/* PERSONAL TAB */}
            {activeTab === 'personal' && (
              <form onSubmit={handleSavePersonal} className="animate-fade-in">
                <div className="flex justify-between items-center mb-10 pb-6 border-b border-slate-100 dark:border-slate-700">
                    <div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Kişisel Bilgiler</h3>
                        <p className="text-slate-500 text-sm mt-1">Kimlik ve iletişim bilgilerinizi güncelleyin.</p>
                    </div>
                    {!isEditing ? (
                        <button 
                            type="button" 
                            onClick={() => setIsEditing(true)}
                            className="flex items-center px-5 py-2.5 bg-slate-900 dark:bg-slate-700 text-white rounded-xl text-sm font-bold hover:bg-slate-800 dark:hover:bg-slate-600 transition-all shadow-lg shadow-slate-900/10"
                        >
                            <Edit size={16} className="mr-2" /> Düzenle
                        </button>
                    ) : (
                        <button 
                            type="button" 
                            onClick={handleCancelEdit}
                            className="flex items-center px-5 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                        >
                            <X size={16} className="mr-2" /> Vazgeç
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-1">
                        <label className={labelClass}>Ad Soyad</label>
                        {isEditing ? (
                            <input 
                                type="text" 
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className={inputClass}
                            />
                        ) : (
                            <div className={readOnlyClass}>{formData.name}</div>
                        )}
                    </div>

                    <div className="space-y-1">
                        <label className={labelClass}>E-posta Adresi</label>
                         {isEditing ? (
                            <input 
                                type="email" 
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className={inputClass}
                            />
                        ) : (
                            <div className={readOnlyClass}>{formData.email}</div>
                        )}
                    </div>

                     <div className="space-y-1">
                        <label className={labelClass}>Telefon</label>
                         {isEditing ? (
                            <input 
                                type="tel" 
                                name="phone"
                                value={formData.phone}
                                onChange={handlePhoneChange}
                                placeholder="(5XX) XXX XX XX"
                                className={inputClass}
                            />
                        ) : (
                            <div className={readOnlyClass}>{formData.phone || '-'}</div>
                        )}
                    </div>

                     <div className="space-y-1">
                        <label className={labelClass}>Konum</label>
                         {isEditing ? (
                            <input 
                                type="text" 
                                name="location"
                                value={formData.location}
                                onChange={handleInputChange}
                                placeholder="Şehir, Ülke"
                                className={inputClass}
                            />
                        ) : (
                            <div className={readOnlyClass}>{formData.location || '-'}</div>
                        )}
                    </div>

                     <div className="md:col-span-2 space-y-1">
                        <label className={labelClass}>Biyografi / Hakkında</label>
                         {isEditing ? (
                            <textarea 
                                name="bio"
                                value={formData.bio}
                                onChange={handleInputChange}
                                rows={4}
                                className={inputClass}
                                placeholder="Kendinizden kısaca bahsedin..."
                            />
                        ) : (
                            <div className={`${readOnlyClass} min-h-[80px]`}>{formData.bio || '-'}</div>
                        )}
                    </div>
                </div>

                {isEditing && (
                    <div className="mt-12 flex justify-end pt-6 border-t border-slate-100 dark:border-slate-800">
                    <button type="submit" disabled={loading} className="px-10 py-3.5 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all flex items-center shadow-xl shadow-brand-600/20 disabled:opacity-50 hover:scale-105 active:scale-95">
                        {loading ? <Loader2 size={20} className="animate-spin mr-2"/> : <Save size={20} className="mr-2" />}
                        Değişiklikleri Kaydet
                    </button>
                    </div>
                )}
              </form>
            )}

            {/* SECURITY TAB */}
            {activeTab === 'security' && (
              <div className="animate-fade-in">
              <form onSubmit={handleSaveSecurity}>
                <div className="mb-10 pb-6 border-b border-slate-100 dark:border-slate-700">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Güvenlik Ayarları</h3>
                    <p className="text-slate-500 text-sm mt-1">Şifrenizi ve doğrulama yöntemlerinizi yönetin.</p>
                </div>
                
                {passwordError && (
                  <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl flex items-center text-sm font-bold shadow-sm">
                    <AlertCircle size={20} className="mr-3 flex-shrink-0" />
                    {passwordError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <label className={labelClass}>Mevcut Şifre</label>
                      <input 
                        type="password" 
                        value={passwordForm.current}
                        onChange={(e) => setPasswordForm({...passwordForm, current: e.target.value})}
                        className={inputClass} 
                        placeholder="••••••••"
                      />
                    </div>
                     <div className="space-y-1">
                      <label className={labelClass}>Yeni Şifre</label>
                      <input 
                        type="password" 
                        value={passwordForm.new}
                        onChange={(e) => setPasswordForm({...passwordForm, new: e.target.value})}
                        className={inputClass} 
                        placeholder="••••••••"
                      />
                    </div>
                     <div className="space-y-1">
                      <label className={labelClass}>Yeni Şifre (Tekrar)</label>
                      <input 
                        type="password" 
                        value={passwordForm.confirm}
                        onChange={(e) => setPasswordForm({...passwordForm, confirm: e.target.value})}
                        className={inputClass} 
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <h4 className="font-bold text-slate-900 dark:text-white mb-4 text-sm flex items-center">
                        <Lock size={16} className="mr-2 text-brand-500"/>
                        Şifre Gereksinimleri
                    </h4>
                    <div className="space-y-3">
                      {passwordRequirements.map((req) => (
                        <div key={req.id} className="flex items-center text-sm">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-3 border transition-all duration-300 ${
                            req.valid 
                              ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400' 
                              : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-300 dark:text-slate-500'
                          }`}>
                            {req.valid && <CheckCircle size={12} strokeWidth={3} />}
                          </div>
                          <span className={`transition-colors font-medium ${req.valid ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-500'}`}>
                            {req.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                 <div className="mt-8 flex justify-end">
                  <button type="submit" disabled={loading} className="px-8 py-3 bg-slate-900 dark:bg-slate-700 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg disabled:opacity-50">
                    {loading ? 'Kaydediliyor...' : 'Şifreyi Güncelle'}
                  </button>
                </div>
              </form>

              <div className="mt-12 pt-10 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center">
                      <Phone size={20} className="mr-2 text-emerald-500"/>
                      WhatsApp İle İki Adımlı Doğrulama (2FA)
                  </h3>
                  
                  <div className="bg-slate-50 dark:bg-slate-800/20 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex items-start gap-5">
                      <div className="bg-white dark:bg-slate-700 p-3.5 rounded-xl shadow-sm text-emerald-600 dark:text-emerald-400 hidden sm:block">
                          <Shield size={28} />
                      </div>
                      <div className="flex-1">
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                              Hesabınızı hırsızlığa karşı koruyun. Giriş yaparken telefonunuza WhatsApp üzerinden gelen doğrulama kodunu girerek hesabınızı ekstra güvenceye alın.
                          </p>
                          
                          <div className="flex flex-col sm:flex-row gap-3 max-w-lg">
                              <input 
                                  type="tel" 
                                  placeholder="5XXXXXXXXX"
                                  value={formData.phone}
                                  onChange={handleInputChange}
                                  name="phone"
                                  className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                              />
                              <button 
                                  type="button"
                                  onClick={async () => {
                                      if(!formData.phone) {
                                          alert('Lütfen geçerli bir telefon numarası giriniz.');
                                          return;
                                      }
                                      try {
                                          setLoading(true);
                                          await api.auth.initiateWhatsapp2FA(user.id, formData.phone);
                                          const code = prompt('WhatsApp onay kodunuzu giriniz:');
                                          if (code) {
                                              await api.auth.verifyWhatsapp2FA(user.id, code);
                                              alert('2FA Başarıyla Aktifleştirildi!');
                                          }
                                      } catch (error: any) {
                                          alert(error.message || 'Bir hata oluştu');
                                      } finally {
                                          setLoading(false);
                                      }
                                  }}
                                  className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50 whitespace-nowrap"
                                  disabled={loading}
                              >
                                  {loading ? 'İşleniyor...' : 'Kurulumu Başlat'}
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
              </div>
            )}

            {/* PREFERENCES TAB */}
            {activeTab === 'preferences' && (
              <form onSubmit={handleSavePreferences} className="animate-fade-in">
                 <div className="mb-10 pb-6 border-b border-slate-100 dark:border-slate-700">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Sistem Tercihleri</h3>
                    <p className="text-slate-500 text-sm mt-1">Uygulama deneyiminizi kişiselleştirin.</p>
                </div>
                
                <div className="space-y-12 max-w-3xl">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-6 flex items-center uppercase tracking-wider">
                      <Globe size={18} className="mr-3 text-brand-500" />
                      Dil ve Bölge
                    </h4>
                    <div className="max-w-sm">
                       <label className={labelClass}>Sistem Dili</label>
                       <div className="relative">
                           <select 
                            value={preferences.language}
                            onChange={(e) => handlePreferenceChange('language', e.target.value)}
                            className={inputClass}
                           >
                             <option value="tr">Türkçe (Turkey)</option>
                             <option value="en">English (United States)</option>
                             <option value="de">Deutsch (Germany)</option>
                           </select>
                           <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                               <Globe size={16} />
                           </div>
                       </div>
                    </div>
                  </div>

                  <div className="pt-10 border-t border-slate-100 dark:border-slate-800">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-6 flex items-center uppercase tracking-wider">
                      <Moon size={18} className="mr-3 text-brand-500" />
                      Görünüm Modu
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {['light', 'dark', 'system'].map((theme) => (
                          <label key={theme} className={`cursor-pointer group`}>
                            <input 
                              type="radio" 
                              name="theme" 
                              value={theme}
                              checked={preferences.theme === theme}
                              onChange={(e) => handlePreferenceChange('theme', e.target.value)}
                              className="hidden"
                            />
                            <div className={`p-4 border-2 rounded-2xl transition-all h-full text-center hover:shadow-md ${
                                preferences.theme === theme 
                                ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' 
                                : 'border-slate-200 dark:border-slate-700 hover:border-brand-200 dark:hover:border-slate-600'
                            }`}>
                                <div className={`w-10 h-10 mx-auto rounded-full mb-3 flex items-center justify-center transition-colors ${
                                    preferences.theme === theme 
                                    ? 'bg-brand-500 text-white' 
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                }`}>
                                    {theme === 'light' && <Moon size={18} className="rotate-180" />}
                                    {theme === 'dark' && <Moon size={18} />}
                                    {theme === 'system' && <Settings size={18} />}
                                </div>
                                <span className={`block font-bold text-sm capitalize ${preferences.theme === theme ? 'text-brand-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                    {theme === 'light' ? 'Açık Tema' : theme === 'dark' ? 'Koyu Tema' : 'Sistem'}
                                </span>
                            </div>
                          </label>
                      ))}
                    </div>
                  </div>

                  <div className="pt-10 border-t border-slate-100 dark:border-slate-800">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-6 flex items-center uppercase tracking-wider">
                      <Bell size={18} className="mr-3 text-brand-500" />
                      Bildirim Ayarları
                    </h4>
                    <div className="space-y-4">
                      <label className="flex items-center justify-between cursor-pointer p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">E-posta Bildirimleri</span>
                        <div className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${preferences.notifications.email ? 'bg-brand-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${preferences.notifications.email ? 'translate-x-6' : ''}`}></div>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={preferences.notifications.email}
                          onChange={(e) => handlePreferenceChange('notifications', { email: e.target.checked })}
                          className="hidden" 
                        />
                      </label>
                       <label className="flex items-center justify-between cursor-pointer p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Masaüstü Bildirimleri</span>
                        <div className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${preferences.notifications.desktop ? 'bg-brand-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${preferences.notifications.desktop ? 'translate-x-6' : ''}`}></div>
                        </div>
                         <input 
                          type="checkbox" 
                          checked={preferences.notifications.desktop}
                          onChange={(e) => handlePreferenceChange('notifications', { desktop: e.target.checked })}
                          className="hidden" 
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mt-12 flex justify-end pt-6 border-t border-slate-100 dark:border-slate-800">
                  <button type="submit" className="px-10 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all flex items-center shadow-lg shadow-brand-600/30 hover:scale-105">
                    <Save size={20} className="mr-2" />
                    Ayarları Kaydet
                  </button>
                </div>
              </form>
            )}

            {/* BILLING INFO TAB */}
            {activeTab === 'billing' && (
                <form onSubmit={handleSaveBilling} className="animate-fade-in">
                    <div className="mb-10 pb-6 border-b border-slate-100 dark:border-slate-700">
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Fatura Bilgileri</h3>
                        <p className="text-slate-500 text-sm mt-1">Faturalarınızda yer alacak kurumsal bilgileri düzenleyin.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="md:col-span-2 space-y-1">
                            <label className={labelClass}>Firma Ünvanı / Ad Soyad</label>
                            <input 
                                type="text"
                                name="companyName"
                                value={billingInfo.companyName}
                                onChange={handleBillingChange}
                                className={inputClass}
                                placeholder="Örn: To-Plus Teknoloji A.Ş."
                            />
                        </div>
                        <div className="space-y-1">
                            <label className={labelClass}>Vergi Dairesi</label>
                            <input 
                                type="text"
                                name="taxOffice"
                                value={billingInfo.taxOffice}
                                onChange={handleBillingChange}
                                className={inputClass}
                                placeholder="Örn: Merter"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className={labelClass}>Vergi Numarası / TCKN</label>
                             <input 
                                type="text"
                                name="taxNumber"
                                value={billingInfo.taxNumber}
                                onChange={handleBillingChange}
                                className={inputClass}
                                placeholder="1234567890"
                            />
                        </div>
                         <div className="md:col-span-2 space-y-1">
                            <label className={labelClass}>Fatura Adresi</label>
                            <textarea 
                                name="billingAddress"
                                value={billingInfo.billingAddress}
                                onChange={handleBillingChange}
                                rows={3}
                                className={inputClass}
                                placeholder="Tam adresiniz..."
                            />
                        </div>
                    </div>

                    <div className="mt-12 flex justify-end pt-6 border-t border-slate-100 dark:border-slate-800">
                        <button type="submit" className="px-10 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all flex items-center shadow-lg shadow-brand-600/30 hover:scale-105">
                            <Save size={20} className="mr-2" />
                            Bilgileri Kaydet
                        </button>
                    </div>
                </form>
            )}

            {/* SUBSCRIPTION TAB */}
            {activeTab === 'subscription' && (
                <div className="animate-fade-in">
                    <div className="mb-10 pb-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-end">
                        <div>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Abonelik & Paket</h3>
                            <p className="text-slate-500 text-sm mt-1">Mevcut planınızı ve kullanım limitlerinizi görüntüleyin.</p>
                        </div>
                         <div className="bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 font-bold px-4 py-2 rounded-lg text-sm border border-brand-200 dark:border-brand-800">
                             Yıllık Plan (Aktif)
                         </div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden mb-10">
                        <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                            <div>
                                <h4 className="text-3xl font-extrabold mb-2">Pro Paket</h4>
                                <p className="text-slate-300 mb-6 max-w-md">Orta ve büyük ölçekli işletmeler için gelişmiş özellikler ve öncelikli destek.</p>
                                <div className="flex items-center gap-4 text-sm font-medium text-emerald-400">
                                    <CheckCircle size={18} fill="currentColor" className="text-slate-900" />
                                    <span>Sonraki Ödeme: 15.12.2025</span>
                                </div>
                            </div>
                            <div className="text-center md:text-right">
                                <div className="text-4xl font-bold mb-2">₺2.500<span className="text-xl font-medium text-slate-400">/yıl</span></div>
                                <button className="px-6 py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-100 transition-colors shadow-lg mt-2">
                                    Paketi Yükselt
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
                            <div className="flex justify-between mb-4">
                                <h5 className="font-bold text-slate-700 dark:text-slate-300 flex items-center">
                                    <User size={18} className="mr-2 text-brand-500"/> Kullanıcı Limiti
                                </h5>
                                <span className="text-sm font-bold text-slate-500">8 / 10</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                                <div className="bg-brand-500 h-full rounded-full w-[80%]"></div>
                            </div>
                            <p className="text-xs text-slate-400 mt-3">Paket limitinizin %80'ini kullanıyorsunuz.</p>
                        </div>
                         <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
                            <div className="flex justify-between mb-4">
                                <h5 className="font-bold text-slate-700 dark:text-slate-300 flex items-center">
                                    <Cloud size={18} className="mr-2 text-brand-500"/> Depolama Alanı
                                </h5>
                                <span className="text-sm font-bold text-slate-500">2.1 GB / 5 GB</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                                <div className="bg-emerald-500 h-full rounded-full w-[42%]"></div>
                            </div>
                             <p className="text-xs text-slate-400 mt-3">Dosya ve medya saklama alanınız.</p>
                        </div>
                    </div>
                </div>
            )}

             {/* INVOICES TAB */}
             {activeTab === 'invoices' && (
                <div className="animate-fade-in">
                    <div className="mb-8 pb-6 border-b border-slate-100 dark:border-slate-700">
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Faturalar & Ekstre</h3>
                        <p className="text-slate-500 text-sm mt-1">Geçmiş ödemelerinizi ve faturalarınızı görüntüleyin.</p>
                    </div>

                    <div className="bg-white dark:bg-enterprise-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                    <th className="px-6 py-4 font-bold">Fatura Tarihi</th>
                                    <th className="px-6 py-4 font-bold">Açıklama</th>
                                    <th className="px-6 py-4 font-bold">Tutar</th>
                                    <th className="px-6 py-4 font-bold text-center">Durum</th>
                                    <th className="px-6 py-4 font-bold text-right">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {[
                                    { date: '15.12.2024', desc: 'Pro Paket - Yıllık Yenileme', amount: '₺2.500,00', status: 'paid' },
                                    { date: '15.12.2023', desc: 'Pro Paket - Yıllık Yenileme', amount: '₺2.000,00', status: 'paid' },
                                    { date: '15.12.2022', desc: 'Başlangıç Paketi - Yıllık', amount: '₺1.200,00', status: 'paid' },
                                ].map((inv, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">{inv.date}</td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{inv.desc}</td>
                                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{inv.amount}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                Ödendi
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-brand-600 hover:text-brand-700 font-bold text-xs flex items-center justify-end ml-auto">
                                                <Download size={14} className="mr-1" /> PDF İndir
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
