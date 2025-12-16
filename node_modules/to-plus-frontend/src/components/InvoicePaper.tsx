
import React from 'react';
import { Invoice, Account } from '../types';
import { Printer, X, Download, Share2 } from 'lucide-react';

interface InvoicePaperProps {
  invoice: Invoice;
  account?: Account;
  onClose: () => void;
}

const InvoicePaper: React.FC<InvoicePaperProps> = ({ invoice, account, onClose }) => {
  
  const handlePrint = () => {
    window.print();
  };

  // Helper to calculate tax breakdown
  const taxGroups = invoice.items.reduce((acc, item) => {
    const taxRate = item.taxRate;
    const baseAmount = item.quantity * item.unitPrice * (1 - item.discountRate / 100);
    const taxAmount = baseAmount * (taxRate / 100);
    
    if (!acc[taxRate]) {
      acc[taxRate] = { base: 0, tax: 0 };
    }
    acc[taxRate].base += baseAmount;
    acc[taxRate].tax += taxAmount;
    return acc;
  }, {} as Record<number, { base: number, tax: number }>);

  const currencySymbol = invoice.currency === 'USD' ? '$' : invoice.currency === 'EUR' ? '€' : '₺';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex justify-center py-8 print:p-0 print:bg-white print:static print:block">
      
      {/* Action Bar - Hidden on Print */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur flex items-center justify-between px-6 shadow-sm z-50 print:hidden border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="text-sm font-medium text-gray-500 dark:text-slate-400">
          Önizleme: <span className="text-gray-900 dark:text-white font-bold">{invoice.invoiceNumber}</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium text-sm shadow-sm"
          >
            <Printer size={16} />
            Yazdır
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
            <h1 className="text-4xl font-bold text-brand-900 tracking-tight mb-2">
              {invoice.type === 'sales' ? 'SATIŞ FATURASI' : 'ALIŞ FATURASI'}
            </h1>
            <p className="text-sm text-gray-500 font-medium">#{invoice.invoiceNumber}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-brand-600 mb-1">TODESTEK BİLİŞİM</div>
            <div className="text-xs text-gray-500 leading-relaxed">
              Teknoloji Mah. Sanayi Cad. No:42<br/>
              Maslak, İstanbul / Türkiye<br/>
              VKN: 1234567890 - Maslak V.D.<br/>
              info@todestek.com | +90 850 123 45 67
            </div>
          </div>
        </div>

        {/* Client & Invoice Info */}
        <div className="flex justify-between gap-8 mb-12">
          <div className="flex-1">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">SAYIN (MÜŞTERİ)</h3>
            <div className="text-sm font-bold text-gray-900 mb-1">
              {account?.name || invoice.accountName}
            </div>
            <div className="text-xs text-gray-600 leading-relaxed">
              {account?.address || 'Adres bilgisi bulunamadı.'}<br/>
              {account?.city && `${account.city} / ${account.district}`}<br/>
              {account?.taxNumber && `VKN/TCKN: ${account.taxNumber} ${account?.taxOffice ? `- ${account.taxOffice} V.D.` : ''}`}
            </div>
          </div>
          <div className="flex-1 max-w-[250px]">
            <div className="flex justify-between text-sm py-1 border-b border-gray-100">
              <span className="text-gray-500">Düzenleme Tarihi:</span>
              <span className="font-medium">{new Date(invoice.date).toLocaleDateString('tr-TR')}</span>
            </div>
            <div className="flex justify-between text-sm py-1 border-b border-gray-100">
              <span className="text-gray-500">Vade Tarihi:</span>
              <span className="font-medium">{new Date(invoice.dueDate).toLocaleDateString('tr-TR')}</span>
            </div>
            <div className="flex justify-between text-sm py-1 border-b border-gray-100">
              <span className="text-gray-500">Para Birimi:</span>
              <span className="font-medium">{invoice.currency}</span>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-brand-900 text-xs font-bold text-gray-600 uppercase tracking-wider">
                <th className="py-3 pl-2">Ürün / Hizmet</th>
                <th className="py-3 text-right">Miktar</th>
                <th className="py-3 text-right">Birim Fiyat</th>
                <th className="py-3 text-right">İsk.</th>
                <th className="py-3 text-right">KDV</th>
                <th className="py-3 text-right pr-2">Tutar</th>
              </tr>
            </thead>
            <tbody className="text-sm border-b border-gray-200">
              {invoice.items.map((item, index) => (
                <tr key={item.id} className="border-b border-gray-100 last:border-0">
                  <td className="py-3 pl-2">
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
                  <td className="py-3 text-right tabular-nums text-gray-500">
                    %{item.taxRate}
                  </td>
                  <td className="py-3 text-right pr-2 font-medium tabular-nums">
                    {currencySymbol}{item.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals & Tax Breakdown */}
        <div className="flex justify-end mb-12">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Ara Toplam</span>
              <span>{currencySymbol}{invoice.subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
            </div>
            
            {invoice.lineDiscountTotal > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Satır İskonto</span>
                <span className="text-red-600">-{currencySymbol}{invoice.lineDiscountTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
              </div>
            )}

            {invoice.discountTotal > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Genel İskonto</span>
                <span className="text-red-600">-{currencySymbol}{invoice.discountTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
              </div>
            )}

            <div className="py-2 border-t border-gray-100 my-2">
              {Object.entries(taxGroups).map(([rate, vals]) => {
                const v = vals as { base: number, tax: number };
                return (
                  <div key={rate} className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>KDV %{rate} (Matrah: {currencySymbol}{v.base.toLocaleString('tr-TR', {minimumFractionDigits:2})})</span>
                    <span>{currencySymbol}{v.tax.toLocaleString('tr-TR', {minimumFractionDigits:2})}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between text-lg font-bold text-brand-900 border-t-2 border-brand-900 pt-2">
              <span>GENEL TOPLAM</span>
              <span>{currencySymbol}{invoice.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mb-12 p-4 bg-gray-50 rounded border border-gray-100">
            <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Notlar</h4>
            <p className="text-sm text-gray-700">{invoice.notes}</p>
          </div>
        )}

        {/* Footer / Signature */}
        <div className="absolute bottom-[20mm] left-[10mm] right-[10mm]">
          <div className="grid grid-cols-2 gap-12">
            <div>
              <div className="text-xs font-bold text-gray-400 mb-12">TESLİM EDEN</div>
              <div className="h-px bg-gray-300 w-32"></div>
              <div className="text-xs text-gray-500 mt-1">İmza / Kaşe</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-gray-400 mb-12">TESLİM ALAN</div>
              <div className="h-px bg-gray-300 w-32 ml-auto"></div>
              <div className="text-xs text-gray-500 mt-1">İmza / Kaşe</div>
            </div>
          </div>
          <div className="text-center mt-8 text-[10px] text-gray-400">
            Bu belge ToPlus ERP sistemi tarafından oluşturulmuştur.
          </div>
        </div>

      </div>
    </div>
  );
};

export default InvoicePaper;
