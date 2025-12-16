
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';
import { ArrowLeft } from 'lucide-react';

const Legal: React.FC = () => {
  const { type } = useParams();

  const getTitle = (slug: string) => {
    switch(slug) {
      case 'kullanici-sozlesmesi': return 'Kullanıcı Sözleşmesi';
      case 'kullanim-kosullari': return 'Kullanım Koşulları';
      case 'kvkk': return 'KVKK ve Aydınlatma Metni';
      case 'acik-riza': return 'Açık Rıza Metni';
      case 'cerez-politikasi': return 'Çerez Politikası';
      case 'api': return 'API Kullanım Şartları';
      case 'e-ticaret-kosullari': return 'E-Ticaret Modülü Kullanım Koşulları';
      case 'e-ticaret-aydinlatma': return 'E-Ticaret Aydınlatma Metni';
      case 'basvuru-formu': return 'İlgili Kişi Başvuru Formu';
      case 'yasal-uyarilar': return 'Yasal Uyarılar';
      default: return 'Yasal Metin';
    }
  };

  const title = type ? getTitle(type) : 'Yasal Metin';

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/">
            <BrandLogo size="md" />
          </Link>
          <Link to="/register" className="flex items-center text-sm font-bold text-slate-500 hover:text-brand-600 transition-colors">
            <ArrowLeft size={16} className="mr-2" />
            Geri Dön
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-slate-200">
          <h1 className="text-3xl font-black text-slate-900 mb-8">{title}</h1>
          
          <div className="prose prose-slate max-w-none text-slate-600">
            <p className="lead">
              Bu sayfa, ToPlus ERP sistemi ve ilgili hizmetlerin kullanımına ilişkin yasal hükümleri içerir.
              Lütfen hizmetlerimizi kullanmaya başlamadan önce bu metni dikkatlice okuyunuz.
            </p>
            
            <h3>1. Genel Hükümler</h3>
            <p>
              ToPlus Bilişim Teknolojileri A.Ş. ("Şirket") tarafından sunulan hizmetlerden yararlanan tüm kullanıcılar,
              işbu sözleşme şartlarını peşinen kabul etmiş sayılırlar. Hizmetlerimizin kullanımı, yürürlükteki Türkiye Cumhuriyeti
              yasalarına tabidir.
            </p>

            <h3>2. Gizlilik ve Güvenlik</h3>
            <p>
              Kullanıcı verilerinin güvenliği bizim için en önemli önceliktir. Verileriniz, 256-bit SSL şifreleme
              yöntemleri ile korunmakta ve KVKK kapsamında işlenmektedir. Detaylı bilgi için KVKK Aydınlatma Metni'ni inceleyiniz.
            </p>

            <h3>3. Hizmet Kapsamı</h3>
            <p>
              Şirket, ön muhasebe, stok takibi, e-fatura ve benzeri kurumsal kaynak planlama hizmetlerini SaaS (Hizmet Olarak Yazılım)
              modeli ile sunmaktadır. Hizmetlerin kesintisiz çalışması için gerekli teknik altyapı sağlanmakla birlikte,
              mücbir sebeplerden kaynaklı kesintilerden şirket sorumlu tutulamaz.
            </p>

            <h3>4. Fikri Mülkiyet</h3>
            <p>
              Yazılımın kaynak kodları, veritabanı yapısı ve arayüz tasarımları ToPlus Bilişim Teknolojileri A.Ş.'ye aittir.
              İzinsiz kopyalanması, çoğaltılması veya tersine mühendislik işlemlerine tabi tutulması yasaktır.
            </p>

            {/* Placeholder for specific content */}
            <div className="mt-8 p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500 italic">
              Not: Bu sayfa demo amaçlı oluşturulmuştur. Gerçek uygulamada buraya "{title}" ile ilgili tam hukuki metin gelecektir.
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-slate-900 text-slate-400 py-12 mt-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-sm">&copy; 2024 ToPlus Bilişim Teknolojileri A.Ş. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  );
};

export default Legal;
