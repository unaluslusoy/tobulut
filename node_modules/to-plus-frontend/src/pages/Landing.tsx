
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';
import { 
  CheckCircle2, ArrowRight, BarChart3, ShieldCheck, 
  Zap, Globe, Users, CreditCard, Layers, PieChart,
  Box, Smartphone, Lock, ChevronRight, PlayCircle,
  Menu, X, TrendingUp
} from 'lucide-react';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Smooth Scroll Handler
  const scrollToSection = (id: string) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
  
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  // Mock Client Logos
  const clients = ["ACME Corp", "GlobalLogistics", "TechFlow", "Stripe", "NextGen", "Uber", "Amazon"];

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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-brand-500 selection:text-white overflow-x-hidden">
      
      {/* --- NAVIGATION --- */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-200' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex-shrink-0 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <BrandLogo size="md" />
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-10">
              <button onClick={() => scrollToSection('features')} className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">Özellikler</button>
              <button onClick={() => scrollToSection('solutions')} className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">Çözümler</button>
              <button onClick={() => scrollToSection('pricing')} className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">Fiyatlandırma</button>
              <button onClick={() => scrollToSection('contact')} className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">İletişim</button>
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <button 
                onClick={() => navigate('/login')}
                className="text-sm font-bold text-slate-700 hover:text-brand-600 transition-colors px-4 py-2"
              >
                Giriş Yap
              </button>
              <button 
                onClick={() => navigate('/register')} 
                className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-brand-600 transition-all shadow-lg hover:shadow-brand-600/20 active:scale-95"
              >
                Ücretsiz Başla
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-600 p-2">
                {isMobileMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 absolute w-full left-0 top-20 p-6 flex flex-col space-y-4 shadow-xl animate-fade-in-down">
              <button onClick={() => scrollToSection('features')} className="text-left font-medium text-slate-600 py-2">Özellikler</button>
              <button onClick={() => scrollToSection('solutions')} className="text-left font-medium text-slate-600 py-2">Çözümler</button>
              <button onClick={() => scrollToSection('pricing')} className="text-left font-medium text-slate-600 py-2">Fiyatlandırma</button>
              <hr />
              <button onClick={() => navigate('/login')} className="w-full text-center py-3 font-bold text-slate-700 border border-slate-200 rounded-xl">Giriş Yap</button>
              <button onClick={() => navigate('/register')} className="w-full text-center py-3 font-bold bg-brand-600 text-white rounded-xl">Ücretsiz Dene</button>
          </div>
        )}
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-24 overflow-hidden bg-white">
        {/* Abstract Shapes */}
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-brand-50/50 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
        <div className="absolute bottom-[10%] left-[-10%] w-[500px] h-[500px] bg-blue-50/50 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center relative z-10">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wide mb-8 hover:border-brand-300 transition-colors cursor-default">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            V2.0 Enterprise Yayında
          </div>
          
          {/* Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-slate-900 mb-6 leading-[1.1] tracking-tight max-w-5xl mx-auto">
            İşletmenizin Dijital <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600">Tek Gerçeklik Kaynağı.</span>
          </h1>
          
          {/* Subheadline */}
          <p className="text-lg md:text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed font-light">
            Finans, Stok, İK ve Operasyonel süreçlerinizi entegre bir platformda birleştirin. 
            Karmaşık ERP sistemlerinin gücünü, modern arayüzün sadeliğiyle deneyimleyin.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
            <button 
              onClick={() => navigate('/register')}
              className="px-8 py-4 bg-brand-600 text-white rounded-xl font-bold text-lg hover:bg-brand-700 transition-all shadow-xl shadow-brand-600/30 hover:-translate-y-1 flex items-center justify-center"
            >
              Hemen Başlayın
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
            <button className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold text-lg hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm hover:-translate-y-1 flex items-center justify-center group">
              <PlayCircle className="mr-2 w-5 h-5 text-slate-400 group-hover:text-brand-600 transition-colors" />
              Nasıl Çalışır?
            </button>
          </div>
          
          {/* App UI Mockup */}
          <div className="relative mx-auto max-w-6xl -mb-32 md:-mb-48 perspective-1000">
             <div className="relative rounded-2xl bg-slate-900 p-2 shadow-2xl ring-1 ring-slate-900/10">
                <div className="rounded-xl overflow-hidden bg-white aspect-[16/10] relative">
                    {/* Mockup Header */}
                    <div className="h-8 bg-slate-100 border-b border-slate-200 flex items-center px-4 space-x-2">
                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    {/* Mockup Content - Abstract Dashboard */}
                    <div className="p-6 grid grid-cols-4 gap-6 h-full bg-slate-50">
                        {/* Sidebar Mock */}
                        <div className="hidden md:block col-span-1 bg-white rounded-xl border border-slate-200 h-[80%] shadow-sm p-4 space-y-3">
                            <div className="h-8 bg-slate-100 rounded w-3/4 mb-6"></div>
                            <div className="h-4 bg-slate-100 rounded w-full"></div>
                            <div className="h-4 bg-slate-100 rounded w-full"></div>
                            <div className="h-4 bg-slate-100 rounded w-5/6"></div>
                            <div className="h-4 bg-slate-100 rounded w-4/6"></div>
                        </div>
                        {/* Main Content Mock */}
                        <div className="col-span-4 md:col-span-3 space-y-6">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="h-24 bg-white rounded-xl border border-slate-200 shadow-sm"></div>
                                <div className="h-24 bg-white rounded-xl border border-slate-200 shadow-sm"></div>
                                <div className="h-24 bg-white rounded-xl border border-slate-200 shadow-sm"></div>
                            </div>
                            <div className="h-64 bg-white rounded-xl border border-slate-200 shadow-sm flex items-end justify-between p-6 gap-2">
                                {[40, 60, 45, 70, 30, 55, 65, 80, 50, 90, 75, 60].map((h, i) => (
                                    <div key={i} className="w-full bg-brand-100 rounded-t-sm relative group">
                                        <div className="absolute bottom-0 w-full bg-brand-500 rounded-t-sm transition-all duration-1000" style={{height: `${h}%`}}></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Floating Info Cards */}
                    <div className="absolute top-20 right-10 bg-white p-4 rounded-xl shadow-xl border border-slate-100 hidden lg:block animate-float">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 text-green-600 rounded-lg"><TrendingUp size={20}/></div>
                            <div>
                                <div className="text-[10px] text-slate-400 font-bold uppercase">Net Kar</div>
                                <div className="text-lg font-black text-slate-900">+₺124.500</div>
                            </div>
                        </div>
                    </div>
                </div>
             </div>
             {/* Glow Effect under mockup */}
             <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[90%] h-20 bg-brand-600/20 blur-[100px] -z-10"></div>
          </div>

        </div>
      </section>

      {/* --- LOGO STRIP --- */}
      <section className="pt-40 pb-16 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-10">500+ Öncü Şirket Tarafından Güveniliyor</p>
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
            {clients.map((client, i) => (
              <span key={i} className="text-2xl font-black text-slate-800">{client}</span>
            ))}
          </div>
        </div>
      </section>

      {/* --- BENTO GRID FEATURES --- */}
      <section id="features" className="py-24 bg-slate-50 relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">Tüm İhtiyaçlarınız İçin <br/>Modüler Çözümler</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              İhtiyacınız olan modülleri seçin, sadece kullandığınız kadar ödeyin. ToPlus, işletmenizle birlikte büyür.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 auto-rows-[minmax(300px,auto)]">
            
            {/* Feature 1: Finance (Large) */}
            <div className="md:col-span-2 row-span-2 bg-slate-900 rounded-[2rem] p-8 md:p-12 relative overflow-hidden group text-white flex flex-col justify-between shadow-2xl">
               <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/20 rounded-full blur-[100px] -mr-20 -mt-20 pointer-events-none"></div>
               <div className="relative z-10">
                 <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 border border-white/10">
                    <PieChart className="text-brand-400 w-8 h-8" />
                 </div>
                 <h3 className="text-3xl font-bold mb-4">Gelişmiş Finansal Kontrol</h3>
                 <p className="text-slate-400 max-w-md leading-relaxed text-lg">
                    Gelir, gider, nakit akışı ve karlılık analizleri. Banka entegrasyonları ile hesap hareketlerinizi anlık takip edin ve finansal sağlığınızı koruyun.
                 </p>
               </div>
               
               {/* Visual Element inside Card */}
               <div className="relative mt-12 h-64 w-full bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden shadow-inner group-hover:scale-[1.02] transition-transform duration-500">
                  <div className="absolute inset-0 flex items-end justify-around px-8 pb-0 pt-8">
                      <div className="w-1/5 bg-brand-500/20 h-[40%] rounded-t-lg"></div>
                      <div className="w-1/5 bg-brand-500/40 h-[60%] rounded-t-lg"></div>
                      <div className="w-1/5 bg-brand-500/60 h-[30%] rounded-t-lg"></div>
                      <div className="w-1/5 bg-brand-500 h-[80%] rounded-t-lg shadow-[0_0_30px_rgba(14,165,233,0.3)]"></div>
                  </div>
               </div>
            </div>

            {/* Feature 2: Operations */}
            <div className="bg-white rounded-[2rem] p-8 border border-slate-200 hover:border-brand-200 transition-colors shadow-sm group">
               <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mb-6 text-purple-600">
                  <Box />
               </div>
               <h3 className="text-xl font-bold text-slate-900 mb-3">Akıllı Stok Yönetimi</h3>
               <p className="text-slate-500 leading-relaxed text-sm">
                 Kritik stok uyarıları, varyantlı ürün takibi ve çoklu depo yönetimi ile envanteriniz her zaman kontrol altında.
               </p>
            </div>

            {/* Feature 3: HR */}
            <div className="bg-white rounded-[2rem] p-8 border border-slate-200 hover:border-brand-200 transition-colors shadow-sm group">
               <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center mb-6 text-orange-600">
                  <Users />
               </div>
               <h3 className="text-xl font-bold text-slate-900 mb-3">İK ve Bordrolama</h3>
               <p className="text-slate-500 leading-relaxed text-sm">
                 Personel izinleri, maaş hesaplamaları ve performans takibi. Ekip yönetimini dijitalleştirin.
               </p>
            </div>

            {/* Feature 4: Tech Service */}
            <div className="md:col-span-1 bg-gradient-to-br from-brand-600 to-indigo-600 rounded-[2rem] p-8 text-white relative overflow-hidden group shadow-xl">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
               <div className="relative z-10 flex flex-col h-full justify-between">
                 <div>
                    <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mb-6">
                        <Zap />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Teknik Servis</h3>
                    <p className="text-brand-100 text-sm mb-6">
                    Cihaz kabulden teslimata kadar uçtan uca servis takibi.
                    </p>
                 </div>
                 <button className="text-xs font-bold bg-white/10 hover:bg-white/20 px-4 py-3 rounded-xl transition-colors flex items-center w-full justify-between">
                   Modülü İncele <ChevronRight size={14} />
                 </button>
               </div>
            </div>

             {/* Feature 5: Mobile (Wide) */}
             <div className="md:col-span-2 bg-white rounded-[2rem] p-8 border border-slate-200 flex flex-col md:flex-row items-center gap-8 overflow-hidden group hover:border-brand-200 transition-colors shadow-sm">
               <div className="flex-1">
                 <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mb-6 text-green-600">
                    <Smartphone />
                 </div>
                 <h3 className="text-2xl font-bold text-slate-900 mb-3">Saha Satış ve Mobil Erişim</h3>
                 <p className="text-slate-500 mb-6">
                   Plasiyerleriniz sahada sipariş alsın, teknisyenleriniz yerinde servis versin. ToPlus mobil uyumlu arayüzü ile işiniz her an cebinizde.
                 </p>
                 <ul className="space-y-2">
                   <li className="flex items-center text-sm text-slate-700 font-medium"><CheckCircle2 size={16} className="mr-2 text-green-500"/> Offline Çalışma Modu</li>
                   <li className="flex items-center text-sm text-slate-700 font-medium"><CheckCircle2 size={16} className="mr-2 text-green-500"/> GPS Konum Takibi</li>
                 </ul>
               </div>
               {/* Mobile Graphic Placeholder */}
               <div className="w-full md:w-1/2 h-48 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-x-8 bottom-0 h-[90%] bg-white rounded-t-xl border-t border-x border-slate-200 shadow-lg"></div>
               </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- ENTERPRISE SECURITY --- */}
      <section id="solutions" className="py-24 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
           <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
             <path d="M0 100 C 20 0 50 0 100 100 Z" fill="#3b82f6" />
           </svg>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
           <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="flex-1">
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-900/50 border border-brand-700 text-brand-300 text-xs font-bold uppercase tracking-wide mb-6">
                    <ShieldCheck size={14} /> Güvenlik Öncelikli
                 </div>
                 <h2 className="text-3xl md:text-5xl font-black mb-6">
                   Verileriniz Banka Standartlarında Korunur
                 </h2>
                 <p className="text-slate-400 text-lg mb-10 leading-relaxed">
                   256-bit SSL şifreleme, günlük otomatik yedekleme ve rol tabanlı erişim kontrolü ile iş sürekliliğinizi garanti altına alıyoruz.
                 </p>
                 
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    {[
                        { icon: Lock, title: "SSL Şifreleme", desc: "Uçtan uca veri güvenliği." },
                        { icon: Layers, title: "Otomatik Yedek", desc: "Her gün düzenli yedekleme." },
                        { icon: Globe, title: "Rol Tabanlı Yetki", desc: "Detaylı erişim kontrolü." },
                        { icon: CheckCircle2, title: "%99.9 Uptime", desc: "Kesintisiz erişim garantisi." },
                    ].map((item, i) => (
                        <div key={i} className="flex items-start">
                            <item.icon className="text-brand-400 mr-4 shrink-0 mt-1" size={24} />
                            <div>
                                <h4 className="font-bold text-white mb-1 text-lg">{item.title}</h4>
                                <p className="text-sm text-slate-500">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                 </div>
              </div>
              
              <div className="flex-1 w-full max-w-lg">
                 <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-2xl relative">
                    <div className="flex items-center gap-4 mb-8 border-b border-slate-700 pb-6">
                       <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center text-green-500">
                          <Lock size={28} />
                       </div>
                       <div>
                          <div className="font-bold text-lg">Güvenlik Durumu</div>
                          <div className="text-sm text-green-400 font-medium">Sistem Güvenli • Aktif İzleniyor</div>
                       </div>
                    </div>
                    <div className="space-y-6">
                       <div>
                           <div className="flex justify-between text-sm text-slate-400 mb-2">
                              <span>Tehdit Algılama</span>
                              <span className="text-white font-mono">Aktif</span>
                           </div>
                           <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                              <div className="h-full bg-brand-500 w-[98%] rounded-full"></div>
                           </div>
                       </div>
                       <div>
                           <div className="flex justify-between text-sm text-slate-400 mb-2">
                              <span>Yedekleme (03:00)</span>
                              <span className="text-white font-mono">Tamamlandı</span>
                           </div>
                           <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                              <div className="h-full bg-purple-500 w-[100%] rounded-full"></div>
                           </div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* --- PRICING --- */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Şeffaf ve Esnek Fiyatlandırma</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Gizli ücret yok. İster aylık ödeyin, ister yıllık ödeyip %20 kar edin.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {/* Starter Plan */}
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 hover:shadow-xl hover:border-slate-300 transition-all">
               <h3 className="text-xl font-bold text-slate-900 mb-2">Başlangıç</h3>
               <div className="text-4xl font-black text-slate-900 mb-6">
                  ₺199<span className="text-lg font-medium text-slate-500">/ay</span>
               </div>
               <p className="text-sm text-slate-500 mb-8 h-10">Küçük işletmeler ve yeni girişimler için temel özellikler.</p>
               <button className="w-full py-4 rounded-xl border-2 border-slate-200 text-slate-700 font-bold hover:border-brand-500 hover:text-brand-600 transition-colors mb-8">
                  Hemen Başla
               </button>
               <ul className="space-y-4 text-sm text-slate-700">
                  <li className="flex items-center"><CheckCircle2 size={18} className="text-green-500 mr-3 shrink-0"/> 3 Kullanıcı</li>
                  <li className="flex items-center"><CheckCircle2 size={18} className="text-green-500 mr-3 shrink-0"/> Ön Muhasebe</li>
                  <li className="flex items-center"><CheckCircle2 size={18} className="text-green-500 mr-3 shrink-0"/> Stok Takibi (Temel)</li>
                  <li className="flex items-center"><CheckCircle2 size={18} className="text-green-500 mr-3 shrink-0"/> 500 E-Fatura/Ay</li>
               </ul>
            </div>

            {/* Pro Plan (Popular) */}
            <div className="bg-slate-900 p-8 rounded-[2rem] border-2 border-slate-800 shadow-2xl relative transform md:-translate-y-4 text-white">
               <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg">
                  En Popüler
               </div>
               <h3 className="text-xl font-bold text-white mb-2">Profesyonel</h3>
               <div className="text-4xl font-black text-white mb-6">
                  ₺399<span className="text-lg font-medium text-slate-400">/ay</span>
               </div>
               <p className="text-sm text-slate-400 mb-8 h-10">Büyüyen işletmeler için gelişmiş operasyonel araçlar.</p>
               <button className="w-full py-4 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-500 transition-colors shadow-lg shadow-brand-600/30 mb-8">
                  Ücretsiz Dene
               </button>
               <ul className="space-y-4 text-sm text-slate-300">
                  <li className="flex items-center"><CheckCircle2 size={18} className="text-brand-400 mr-3 shrink-0"/> <strong>10 Kullanıcı</strong></li>
                  <li className="flex items-center"><CheckCircle2 size={18} className="text-brand-400 mr-3 shrink-0"/> <strong>Teknik Servis Modülü</strong></li>
                  <li className="flex items-center"><CheckCircle2 size={18} className="text-brand-400 mr-3 shrink-0"/> İK ve Bordro Yönetimi</li>
                  <li className="flex items-center"><CheckCircle2 size={18} className="text-brand-400 mr-3 shrink-0"/> Sınırsız E-Fatura</li>
                  <li className="flex items-center"><CheckCircle2 size={18} className="text-brand-400 mr-3 shrink-0"/> API Erişimi</li>
               </ul>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 hover:shadow-xl hover:border-slate-300 transition-all">
               <h3 className="text-xl font-bold text-slate-900 mb-2">Kurumsal</h3>
               <div className="text-4xl font-black text-slate-900 mb-6">
                  Özel<span className="text-lg font-medium text-slate-500">/yıllık</span>
               </div>
               <p className="text-sm text-slate-500 mb-8 h-10">Büyük ölçekli organizasyonlar ve özel ihtiyaçlar için.</p>
               <button className="w-full py-4 rounded-xl bg-slate-100 text-slate-900 font-bold hover:bg-slate-200 transition-colors mb-8">
                  Satışla Görüş
               </button>
               <ul className="space-y-4 text-sm text-slate-700">
                  <li className="flex items-center"><CheckCircle2 size={18} className="text-slate-900 mr-3 shrink-0"/> Sınırsız Kullanıcı</li>
                  <li className="flex items-center"><CheckCircle2 size={18} className="text-slate-900 mr-3 shrink-0"/> Özel Sunucu (On-Premise)</li>
                  <li className="flex items-center"><CheckCircle2 size={18} className="text-slate-900 mr-3 shrink-0"/> SLA Garantisi</li>
                  <li className="flex items-center"><CheckCircle2 size={18} className="text-slate-900 mr-3 shrink-0"/> 7/24 Öncelikli Destek</li>
                  <li className="flex items-center"><CheckCircle2 size={18} className="text-slate-900 mr-3 shrink-0"/> Özel Geliştirme</li>
               </ul>
            </div>
          </div>
        </div>
      </section>

      {/* --- CONTACT / FOOTER --- */}
      <footer id="contact" className="bg-slate-950 text-slate-400 py-20 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
              <BrandLogo size="lg" light />
              <p className="mt-6 text-sm leading-relaxed text-slate-500">
                ToPlus, işletmelerin dijital dönüşüm yolculuğunda güvenilir teknoloji ortağıdır. 
                2024 yılında İstanbul'da kurulmuştur.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6">Ürün</h4>
              <ul className="space-y-3 text-sm">
                <li><button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors">Özellikler</button></li>
                <li><button onClick={() => scrollToSection('solutions')} className="hover:text-white transition-colors">Modüller</button></li>
                <li><button onClick={() => scrollToSection('pricing')} className="hover:text-white transition-colors">Fiyatlandırma</button></li>
              </ul>
            </div>
            
            {/* Legal Links Column */}
            <div className="col-span-2">
                <h4 className="text-white font-bold mb-6">Yasal & Kurumsal</h4>
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
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
            </div>
          </div>
          <div className="border-t border-slate-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-slate-600">&copy; 2024 ToPlus Bilişim Teknolojileri A.Ş. Tüm hakları saklıdır.</p>
            <div className="flex space-x-6">
               <div className="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 cursor-pointer flex items-center justify-center transition-colors">
                  <span className="text-xs font-bold">in</span>
               </div>
               <div className="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 cursor-pointer flex items-center justify-center transition-colors">
                  <span className="text-xs font-bold">𝕏</span>
               </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
