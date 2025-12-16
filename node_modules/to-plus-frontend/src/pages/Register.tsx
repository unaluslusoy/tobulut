
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';
import { 
  Eye, EyeOff, CheckCircle2, Check, Star, ShieldCheck 
} from 'lucide-react';

const Register: React.FC = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    fullName: '',
    companyName: '',
    phone: '',
    email: '',
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);

  // Password Validations
  const validations = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    special: /[0-9!@#$%^&*]/.test(formData.password)
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const legalLinks = [
    { title: "Kullanıcı Sözleşmesi", path: "/legal/kullanici-sozlesmesi" },
    { title: "Kullanım Koşulları", path: "/legal/kullanim-kosullari" },
    { title: "KVKK ve İşlenmesine İlişkin Aydınlatma Metni", path: "/legal/kvkk" },
    { title: "Açık Rıza Metni", path: "/legal/acik-riza" },
    { title: "Çerez Politikası", path: "/legal/cerez-politikasi" },
    { title: "API", path: "/legal/api" },
    { title: "e-Ticaret Modülü Kullanım Koşulları", path: "/legal/e-ticaret-kosullari" },
    { title: "e-Ticaret Modülü Aydınlatma Metni", path: "/legal/e-ticaret-aydinlatma" },
    { title: "İlgili Kişi Başvuru Formu", path: "/legal/basvuru-formu" },
    { title: "Yasal Uyarılar", path: "/legal/yasal-uyarilar" },
  ];

  // Dark input style class matching the screenshot requirement
  const inputClass = "w-full px-4 py-3 bg-slate-700 border-transparent rounded-lg focus:ring-2 focus:ring-brand-500 focus:bg-slate-600 outline-none transition-all text-white placeholder-slate-400";

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Column: Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center overflow-y-auto relative z-10">
            <div className="mb-8">
                <div className="cursor-pointer" onClick={() => navigate('/')}>
                    {/* Force dark text for "To" because background is white, even in dark mode */}
                    <BrandLogo size="lg" forceDarkText={true} />
                </div>
            </div>

            <div className="max-w-md w-full mx-auto md:mx-0">
            <h1 className="text-3xl font-black text-slate-900 mb-2">
                ToPlus'a abone olun,
            </h1>
            <h2 className="text-3xl font-black text-brand-600 mb-8">
                ücretsiz denemeye başlayın
            </h2>

            <div className="flex border-b-2 border-slate-100 mb-8">
                <button className="pb-3 border-b-2 border-brand-500 text-brand-600 font-bold text-sm px-4 transition-colors">
                1. Üyelik Bilgileri
                </button>
                <button className="pb-3 border-b-2 border-transparent text-slate-400 font-bold text-sm px-4 cursor-not-allowed">
                2. Evrak Türü
                </button>
            </div>

            <form className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                <input 
                    type="text" 
                    name="fullName"
                    placeholder="Ad Soyad"
                    value={formData.fullName}
                    onChange={handleChange}
                    className={inputClass}
                />
                <input 
                    type="text" 
                    name="companyName"
                    placeholder="Firma / Şahıs Adı"
                    value={formData.companyName}
                    onChange={handleChange}
                    className={inputClass}
                />
                </div>

                <div className="flex gap-2">
                <div className="w-24 px-3 py-3 border-transparent rounded-lg flex items-center justify-between text-slate-300 bg-slate-700">
                    <span className="flex items-center text-sm font-bold">
                        <span className="mr-2">🇹🇷</span> +90
                    </span>
                </div>
                <input 
                    type="tel" 
                    name="phone"
                    placeholder="Telefon Numarası"
                    value={formData.phone}
                    onChange={handleChange}
                    className="flex-1 px-4 py-3 bg-slate-700 border-transparent rounded-lg focus:ring-2 focus:ring-brand-500 focus:bg-slate-600 outline-none transition-all text-white placeholder-slate-400"
                />
                </div>

                <div className="relative">
                <label className="absolute -top-2 left-3 bg-white px-1 text-xs font-bold text-slate-500">e-Posta adresinizi girin</label>
                <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-brand-100 bg-brand-50/10 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-slate-800"
                />
                </div>

                {formData.email && (
                    <div className="flex items-center text-xs text-green-600 font-bold mb-2">
                        <CheckCircle2 size={14} className="mr-1" />
                        E-mail adresi kullanılabilir
                    </div>
                )}

                <div className="relative">
                <input 
                    type={showPassword ? 'text' : 'password'} 
                    name="password"
                    placeholder="Şifre oluşturun"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-brand-100 bg-brand-50/10 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-slate-800"
                />
                <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600"
                >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
                </div>

                {/* Validations */}
                <div className="space-y-2 py-2">
                    <div className={`flex items-center text-xs ${validations.length ? 'text-green-600' : 'text-slate-400'}`}>
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center mr-2 ${validations.length ? 'bg-green-500 text-white' : 'bg-slate-200 text-white'}`}>
                            {validations.length && <Check size={10} />}
                        </div>
                        Şifre en az 8 karakter olmalıdır.
                    </div>
                    <div className={`flex items-center text-xs ${validations.uppercase ? 'text-green-600' : 'text-slate-400'}`}>
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center mr-2 ${validations.uppercase ? 'bg-green-500 text-white' : 'bg-slate-200 text-white'}`}>
                            {validations.uppercase && <Check size={10} />}
                        </div>
                        Şifre en az bir büyük harf içermelidir.
                    </div>
                    <div className={`flex items-center text-xs ${validations.special ? 'text-green-600' : 'text-slate-400'}`}>
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center mr-2 ${validations.special ? 'bg-green-500 text-white' : 'bg-slate-200 text-white'}`}>
                            {validations.special && <Check size={10} />}
                        </div>
                        Şifre en az bir rakam veya özel karakter içermelidir.
                    </div>
                </div>

                <button 
                    type="button"
                    onClick={() => navigate('/login')}
                    className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg transition-all shadow-lg shadow-brand-600/30 mt-4"
                >
                    Üyeliğe Devam Et
                </button>
                
                <p className="text-center text-sm text-slate-500 mt-4">
                    ToPlus hesabın var mı? <span className="text-brand-600 font-bold cursor-pointer hover:underline" onClick={() => navigate('/login')}>Giriş Yap</span>
                </p>
            </form>
            </div>
        </div>

        {/* Right Column: Visual */}
        <div className="hidden md:block w-1/2 relative bg-slate-50 overflow-hidden">
            {/* Curved Shape Mask */}
            <div className="absolute top-0 left-0 w-full h-full z-10 pointer-events-none">
                <svg height="100%" width="100%" preserveAspectRatio="none" viewBox="0 0 100 100">
                    <path d="M0 0 C 30 10 30 90 0 100 L 0 100 L 0 0 Z" fill="white" />
                </svg>
            </div>

            {/* Content Container */}
            <div className="h-full w-full flex items-center justify-center relative pl-20">
                {/* Background Image */}
                <img 
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1888&auto=format&fit=crop" 
                    className="absolute right-0 bottom-0 h-[90%] object-contain object-bottom z-0 opacity-90 mix-blend-multiply"
                    alt="Happy Customer"
                />
                
                {/* Floating Ratings */}
                <div className="absolute top-1/4 left-32 bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-xl z-20 w-64 animate-float">
                    <div className="flex items-end mb-2">
                        <span className="text-4xl font-black text-slate-800">4,8</span>
                        <div className="flex ml-2 mb-1.5 text-slate-800">
                            <Star size={16} fill="currentColor" />
                        </div>
                        <span className="text-xs text-slate-500 mb-1.5 ml-2">2,03 B Yorum</span>
                    </div>
                    <div className="flex gap-1 mb-4">
                        {[1,2,3,4,5].map(i => (
                            <Star key={i} size={24} className="text-yellow-400 fill-yellow-400" />
                        ))}
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 font-bold">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" className="h-8" alt="Play Store" />
                    </div>
                </div>

                <div className="absolute bottom-1/4 left-32 bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-xl z-20 w-64 animate-float-delayed">
                    <div className="flex items-end mb-2">
                        <span className="text-4xl font-black text-slate-800">4,5</span>
                        <div className="flex ml-2 mb-1.5 text-slate-800">
                            <Star size={16} fill="currentColor" />
                        </div>
                        <span className="text-xs text-slate-500 mb-1.5 ml-2">2,2 B Oy</span>
                    </div>
                    <div className="flex gap-1 mb-4">
                        {[1,2,3,4].map(i => (
                            <Star key={i} size={24} className="text-yellow-400 fill-yellow-400" />
                        ))}
                        <Star size={24} className="text-yellow-400 fill-yellow-400 opacity-50" />
                    </div>
                    <div className="flex items-center gap-2 text-slate-800 font-bold text-xl">
                        <svg viewBox="0 0 384 512" width="24" fill="currentColor">
                            <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 52.3-11.4 69.5-34.3z"/>
                        </svg>
                        App Store
                    </div>
                </div>

                {/* Testimonial Badge */}
                <div className="absolute bottom-20 right-12 bg-brand-600 text-white p-4 rounded-full rounded-tl-none shadow-lg z-20 flex items-center gap-4 max-w-sm">
                    <div>
                    <div className="font-bold text-sm">Zeynep Yılmaz</div>
                    <div className="text-xs opacity-90">XYZ Lojistik</div>
                    </div>
                    <div className="text-right border-l border-white/20 pl-4">
                    <div className="font-serif italic text-lg leading-tight">mutlu<br/>patronlar</div>
                    </div>
                </div>

            </div>
        </div>
      </div>

      {/* --- LEGAL FOOTER --- */}
      <div className="bg-[#1e1b2e] text-slate-400 py-8 px-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center gap-x-8 gap-y-3 text-xs">
            {legalLinks.map((link, idx) => (
                <Link 
                    key={idx} 
                    to={link.path} 
                    className="hover:text-white transition-colors"
                >
                    {link.title}
                </Link>
            ))}
        </div>
        <div className="text-center mt-6 text-[10px] text-slate-600">
            &copy; 2024 ToPlus Bilişim Teknolojileri A.Ş. Tüm hakları saklıdır.
        </div>
      </div>

    </div>
  );
};

export default Register;
