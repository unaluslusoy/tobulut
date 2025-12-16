
import React from 'react';
import { ServiceTicket } from '../types';
import { Printer, X } from 'lucide-react';

interface ServiceReceiptProps {
  ticket: ServiceTicket;
  onClose: () => void;
}

const ServiceReceipt: React.FC<ServiceReceiptProps> = ({ ticket, onClose }) => {
  
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex justify-center py-8 print:p-0 print:bg-white print:static print:block">
      
      {/* Action Bar - Hidden on Print */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur flex items-center justify-between px-6 shadow-sm z-50 print:hidden border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="text-sm font-medium text-gray-500 dark:text-slate-400">
          Fiş Önizleme: <span className="text-gray-900 dark:text-white font-bold">{ticket.id}</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium text-sm shadow-sm"
          >
            <Printer size={16} />
            Yazdır (Termal)
          </button>
          <button 
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Thermal Paper Container (80mm width approximation approx 302px or relative) */}
      {/* Used 320px + margins to simulate standard 80mm paper */}
      <div className="bg-white w-[80mm] min-h-[100mm] shadow-2xl mx-auto mt-16 p-2 relative text-black font-mono text-xs print:shadow-none print:m-0 print:w-full print:h-auto box-border rounded-sm">
        
        {/* Receipt Header */}
        <div className="text-center mb-4 border-b-2 border-black pb-2 border-dashed">
          <h1 className="text-lg font-bold">TODESTEK TEKNİK</h1>
          <p className="text-[10px]">Teknik Servis & Onarım Merkezi</p>
          <p className="text-[10px]">Maslak / İstanbul</p>
          <p className="text-[10px] mt-1">Tel: 0850 123 45 67</p>
          <div className="my-2 text-sm font-bold border py-1 border-black">SERVİS KABUL FİŞİ</div>
          <p className="text-[10px]">{new Date(ticket.entryDate).toLocaleString('tr-TR')}</p>
        </div>

        {/* Barcode Simulation */}
        <div className="flex justify-center mb-4">
           <div className="bg-black h-8 w-48"></div> {/* Visual placeholder for barcode */}
        </div>
        <div className="text-center font-bold text-sm mb-4">*{ticket.id}*</div>

        {/* Customer Info */}
        <div className="mb-4">
          <div className="border-b border-black border-dashed mb-1 pb-1 font-bold">MÜŞTERİ BİLGİLERİ</div>
          <div className="grid grid-cols-3 gap-1">
            <span className="col-span-1">Ad Soyad:</span>
            <span className="col-span-2 font-bold">{ticket.customerName}</span>
            
            <span className="col-span-1">Telefon:</span>
            <span className="col-span-2">{ticket.phone || '-'}</span>
          </div>
        </div>

        {/* Device Info */}
        <div className="mb-4">
          <div className="border-b border-black border-dashed mb-1 pb-1 font-bold">CİHAZ BİLGİLERİ</div>
          <div className="grid grid-cols-3 gap-1">
            <span className="col-span-1">Cihaz:</span>
            <span className="col-span-2 font-bold">{ticket.device}</span>
            
            <span className="col-span-1">Marka:</span>
            <span className="col-span-2">{ticket.brand || '-'}</span>

            <span className="col-span-1">Seri No:</span>
            <span className="col-span-2">{ticket.serialNumber || '-'}</span>

            <span className="col-span-1">Şifre/Pın:</span>
            <span className="col-span-2 font-bold border border-black px-1 inline-block">{ticket.devicePassword || 'YOK'}</span>
            
            <span className="col-span-1 mt-1">Aksesuar:</span>
            <span className="col-span-2 mt-1 italic">{ticket.accessories || 'YOK'}</span>
          </div>
        </div>

        {/* Issue Description */}
        <div className="mb-4">
          <div className="border-b border-black border-dashed mb-1 pb-1 font-bold">ARIZA / İŞLEM</div>
          <p className="uppercase leading-tight">{ticket.issue}</p>
        </div>

        {/* Financial */}
        <div className="mb-4 border-t-2 border-black border-dashed pt-2">
          <div className="flex justify-between text-sm font-bold">
            <span>TAHMİNİ TUTAR:</span>
            <span>₺{ticket.estimatedCost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Terms */}
        <div className="text-[9px] text-justify leading-tight mb-8">
          <p><strong>KOŞULLAR:</strong></p>
          <ol className="list-decimal pl-3 space-y-0.5">
            <li>Teslim tarihinden itibaren 90 gün alınmayan cihazlardan firmamız sorumlu değildir.</li>
            <li>Yazılım işlemlerinde veri kaybından servisimiz sorumlu değildir. Yedekleme müşteri sorumluluğundadır.</li>
            <li>Arıza tespiti sonrası onaylanmayan işlemlerden servis ücreti alınabilir.</li>
            <li>Bu belge olmadan cihaz teslimi yapılmaz.</li>
          </ol>
        </div>

        {/* Signatures */}
        <div className="flex justify-between items-end mt-4 mb-8">
           <div className="text-center w-24">
             <div className="h-8 border-b border-black mb-1"></div>
             Teslim Alan<br/>(İmza)
           </div>
           <div className="text-center w-24">
             <div className="h-8 border-b border-black mb-1"></div>
             Müşteri<br/>(İmza)
           </div>
        </div>

        <div className="text-center font-bold text-sm">www.todestek.com</div>

      </div>
    </div>
  );
};

export default ServiceReceipt;
