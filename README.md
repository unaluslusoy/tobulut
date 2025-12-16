# ToBulut - Kurumsal Kaynak Planlama (ERP) & CRM Platformu

**ToBulut**, işletmelerin tüm süreçlerini tek bir merkezden yönetmelerini sağlayan modern, bulut tabanlı ve modüler bir ERP sistemidir. Finans, Stok, İK, Satış ve Müşteri İlişkileri yönetimini yapay zeka destekli araçlarla birleştirir.

![Tasarım Önizleme](https://via.placeholder.com/1200x500.png?text=ToBulut+Dashboard+Preview)

## 🚀 Özellikler

### 👥 Müşteri İlişkileri (CRM)
- Detaylı müşteri profilleri ve etkileşim takibi
- Satış fırsatları ve teklif yönetimi
- Müşteri bazlı özel fiyatlandırma ve iskontolar

### 💰 Finans & Muhasebe
- Gelir/Gider takibi ve nakit akışı yönetimi
- Fatura, irsaliye ve makbuz oluşturma
- Banka entegrasyonları ve kasa takibi

### 📦 Stok & Depo Yönetimi
- Çoklu depo desteği
- Kritik stok uyarıları ve otomatik sipariş önerileri
- Barkodlu giriş/çıkış işlemleri

### 📝 Dosya Yöneticisi
- Sürükle-bırak destekli gelişmiş dosya yönetimi
- Klasör ağacı yapısı (Tree view)
- Detaylı ve Izgara (Grid) görünüm seçenekleri
- Yetkilendirilmiş erişim kontrolü

### 🛡️ Güvenlik & Yetkilendirme
- Rol tabanlı erişim kontrolü (RBAC) - Admin, Personel, Muhasebeci vb.
- İki faktörlü kimlik doğrulama (2FA - Email & WhatsApp)
- Güvenli oturum yönetimi ve loglama

## 🛠 Teknoloji Yığını

**Frontend:**
- **React.js** (Vite ile)
- **TypeScript** - Tip güvenliği için
- **Tailwind CSS** - Modern stillendirme
- **Recharts** - Veri görselleştirme
- **Lucide React** - Modern ikon seti

**Backend:**
- **NestJS** - Scalable Node.js framework
- **MongoDB** - Esnek doküman tabanlı veritabanı
- **JWT** - Güvenli kimlik doğrulama

## 🔧 Kurulum ve Çalıştırma

Projeyi yerel ortamınızda çalıştırmak için aşağıdaki adımları izleyin:

### Gereksinimler
- Node.js (v18+)
- MongoDB (Yerel veya Atlas URI)

### Adımlar

1. **Depoyu klonlayın:**
   ```bash
   git clone https://github.com/unaluslusoy/tobulut.git
   cd tobulut
   ```

2. **Bağımlılıkları yükleyin (Root dizinde):**
   ```bash
   npm install
   ```

3. **Çevresel Değişkenleri Ayarlayın:**
   - `apps/backend` ve `apps/frontend` klasörlerindeki `.env.example` dosyalarını `.env` olarak kopyalayın ve gerekli değerleri girin.

4. **Geliştirme Sunucusunu Başlatın:**
   
   Backend için:
   ```bash
   cd apps/backend
   npm run start:dev
   ```

   Frontend için:
   ```bash
   cd apps/frontend
   npm run dev
   ```

## 🤝 Katkıda Bulunma

1. Bu depoyu Forklayın
2. Yeni bir feature branch oluşturun (`git checkout -b feature/HarikaOzellik`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: Harika özellik eklendi'`)
4. Branch'inizi pushlayın (`git push origin feature/HarikaOzellik`)
5. Bir Pull Request oluşturun

## 📄 Lisans

Bu proje [MIT Lisansı](LICENSE) ile lisanslanmıştır.
