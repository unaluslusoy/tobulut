
import React from 'react';
import { Offer, Account } from '../types';
import { Printer, X, FileCheck } from 'lucide-react';

interface OfferPaperProps {
  offer: Offer;
  account?: Account;
  onClose: () => void;
}

const OfferPaper: React.FC<OfferPaperProps> = ({ offer, account, onClose }) => {
  
  const handlePrint = () => {
    window.print();
  };

  const currencySymbol = offer.currency === 'USD' ? '$' : offer.currency === 'EUR' ? '€' : '₺';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex justify-center py-8 print:p-0 print:bg-white print:static print:block">
      
      {/* Action Bar - Hidden on Print */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur flex items-center justify-between px-6 shadow-sm z-50 print:hidden border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="text-sm font-medium text-gray-500 dark:text-slate-400">
          Teklif Önizleme: <span className="text-gray-900 dark:text-white font-bold">{offer.offerNumber}</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium text-sm shadow-sm"
          >
            <Printer size={16} />
            Yazdır / PDF
          </button>
          <button 
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* A4 Paper Container */}
      <div className="bg-white w-[210mm] min-h-[297mm] shadow-2xl mx-auto mt-16 p-[10mm] relative text-gray-900 print:shadow-none print:m-0 print:w-full print:h-full box-border rounded-sm">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-12">
          <div>
            <h1 className="text-4xl font-bold text-brand-900 tracking-tight mb-2 flex items-center">
              FİYAT TEKLİFİ
            </h1>
            <p className="text-sm text-gray-500 font-medium">#{offer.offerNumber}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-brand-600 mb-1">TODESTEK BİLİŞİM</div>
            <div className="text-xs text-gray-500 leading-relaxed">
              Teknoloji Mah. Sanayi Cad. No:42<br/>
              Maslak, İstanbul / Türkiye<br/>
              www.todestek.com<br/>
              info@todestek.com | +90 850 123 45 67
            </div>
          </div>
        </div>

        {/* Client & Info */}
        <div className="flex justify-between gap-8 mb-12 bg-gray-50 p-6 rounded-xl border border-gray-100 print:bg-transparent print:p-0 print:border-0">
          <div className="flex-1">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">SAYIN</h3>
            <div className="text-sm font-bold text-gray-900 mb-1">
              {account?.name || offer.accountName}
            </div>
            <div className="text-xs text-gray-600 leading-relaxed">
              {account?.authorizedPerson && <span className="block font-medium">{account.authorizedPerson}</span>}
              {account?.phone && <span className="block">{account.phone}</span>}
              {account?.email && <span className="block">{account.email}</span>}
            </div>
          </div>
          <div className="flex-1 max-w-[250px]">
            <div className="flex justify-between text-sm py-1 border-b border-gray-200">
              <span className="text-gray-500">Tarih:</span>
              <span className="font-medium">{new Date(offer.date).toLocaleDateString('tr-TR')}</span>
            </div>
            <div className="flex justify-between text-sm py-1 border-b border-gray-200">
              <span className="text-gray-500">Geçerlilik:</span>
              <span className="font-medium text-red-600">{new Date(offer.validUntil).toLocaleDateString('tr-TR')}</span>
            </div>
            <div className="flex justify-between text-sm py-1 border-b border-gray-200">
              <span className="text-gray-500">Para Birimi:</span>
              <span className="font-medium">{offer.currency}</span>
            </div>
          </div>
        </div>

        {/* Introduction Text */}
        <div className="mb-8 text-sm text-gray-700 leading-relaxed">
          Sayın Yetkili,<br/><br/>
          Talebiniz üzerine hazırlanan ürün/hizmet teklifimiz aşağıda bilgilerinize sunulmuştur.
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-50 border-b-2 border-brand-900 text-xs font-bold text-brand-900 uppercase tracking-wider print:bg-gray-100">
                <th className="py-3 pl-3 rounded-tl-lg">Ürün / Hizmet</th>
                <th className="py-3 text-right">Miktar</th>
                <th className="py-3 text-right">Birim Fiyat</th>
                <th className="py-3 text-right">İsk.</th>
                <th className="py-3 text-right pr-3 rounded-tr-lg">Tutar</th>
              </tr>
            </thead>
            <tbody className="text-sm border-b border-gray-200">
              {offer.items.map((item, index) => (
                <tr key={item.id} className="border-b border-gray-100 last:border-0 even:bg-gray-50/50 print:even:bg-transparent">
                  <td className="py-3 pl-3">
                    <div className="font-medium text-gray-900">{item.productName}</div>
                    {item.description && <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>}
                  </td>
                  <td className="py-3 text-right tabular-nums">{item.quantity}</td>
                  <td className="py-3 text-right tabular-nums">
                    {currencySymbol}{item.unitPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 text-right tabular-nums text-gray-500">
                    {item.discountRate > 0 ? `%${item.discountRate}` : '-'}
                  </td>
                  <td className="py-3 text-right pr-3 font-medium tabular-nums">
                    {currencySymbol}{item.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-12">
          <div className="w-72 space-y-2 bg-gray-50 p-4 rounded-xl border border-gray-100 print:bg-transparent print:border-0 print:p-0">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Ara Toplam</span>
              <span>{currencySymbol}{offer.subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
            </div>
            
            {(offer.lineDiscountTotal > 0 || offer.discountTotal > 0) && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>İskonto Toplamı</span>
                <span className="text-red-600">-{currencySymbol}{(offer.lineDiscountTotal + offer.discountTotal).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
              </div>
            )}

            <div className="flex justify-between text-sm text-gray-600">
              <span>KDV Toplam</span>
              <span>{currencySymbol}{offer.taxTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="flex justify-between text-xl font-bold text-brand-900 border-t-2 border-brand-900 pt-2 mt-2">
              <span>GENEL TOPLAM</span>
              <span>{currencySymbol}{offer.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Terms & Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-200 pt-8">
          <div>
             <h4 className="text-xs font-bold text-gray-900 uppercase mb-2">Teklif Şartları</h4>
             <ul className="text-xs text-gray-600 space-y-1 list-disc pl-4">
               <li>Bu teklif <strong>{new Date(offer.validUntil).toLocaleDateString('tr-TR')}</strong> tarihine kadar geçerlidir.</li>
               <li>Teslimat süresi sipariş onayından itibaren 3 iş günüdür.</li>
               <li>Fiyatlara KDV dahildir/hariçtir (Yukarıda belirtilmiştir).</li>
               <li>Ödeme %50 peşin, kalanı teslimatta tahsil edilir.</li>
             </ul>
          </div>
          {offer.notes && (
            <div>
              <h4 className="text-xs font-bold text-gray-900 uppercase mb-2">Notlar</h4>
              <p className="text-xs text-gray-600 bg-yellow-50 p-2 rounded border border-yellow-100 print:bg-transparent print:border-0 print:p-0">
                {offer.notes}
              </p>
            </div>
          )}
        </div>

        {/* Footer / Signature */}
        <div className="absolute bottom-[20mm] left-[10mm] right-[10mm]">
          <div className="grid grid-cols-2 gap-12">
            <div>
              <div className="text-xs font-bold text-gray-900 mb-1">HAZIRLAYAN</div>
              <div className="text-xs text-gray-500 mb-8">TODESTEK Bilişim Hizmetleri</div>
              <div className="h-px bg-gray-300 w-32"></div>
              <div className="text-[10px] text-gray-400 mt-1">İmza</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-gray-900 mb-1">ONAYLAYAN</div>
              <div className="text-xs text-gray-500 mb-8">{account?.name || 'Müşteri'}</div>
              <div className="h-px bg-gray-300 w-32 ml-auto"></div>
              <div className="text-[10px] text-gray-400 mt-1">İmza / Kaşe</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default OfferPaper;
