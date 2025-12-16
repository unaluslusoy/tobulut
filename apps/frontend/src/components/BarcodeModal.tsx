
import React, { useState } from 'react';
import { Product } from '../types';
import { X, Printer, Grid, FileText, Tag, Copy, Minus, Plus } from 'lucide-react';
import Modal from './Modal';

interface BarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProducts: Product[];
}

const BarcodeModal: React.FC<BarcodeModalProps> = ({ isOpen, onClose, selectedProducts }) => {
  const [labelType, setLabelType] = useState<'shelf' | 'sticker' | 'list'>('sticker');
  const [copies, setCopies] = useState<Record<string, number>>(
    selectedProducts.reduce((acc, p) => ({ ...acc, [p.id]: 1 }), {})
  );

  const handlePrint = () => {
    window.print();
  };

  const updateCopy = (id: string, delta: number) => {
    setCopies(prev => ({
      ...prev,
      [id]: Math.max(1, (prev[id] || 1) + delta)
    }));
  };

  // Helper to get total items to render
  const itemsToRender: Product[] = [];
  selectedProducts.forEach(p => {
    const count = copies[p.id] || 1;
    for (let i = 0; i < count; i++) {
      itemsToRender.push(p);
    }
  });

  return (
    <>
      {/* Configuration Modal (Visible on Screen) */}
      <Modal isOpen={isOpen} onClose={onClose} title="Etiket ve Barkod Yazdır" size="xl">
        <div className="flex flex-col h-full">
          <div className="flex gap-6 mb-6">
            {/* Sidebar Controls */}
            <div className="w-64 shrink-0 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Etiket Tipi</label>
                <div className="space-y-2">
                  <button 
                    onClick={() => setLabelType('sticker')}
                    className={`w-full text-left px-4 py-3 rounded-lg border flex items-center transition-all ${labelType === 'sticker' ? 'bg-brand-50 border-brand-500 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400' : 'bg-white dark:bg-enterprise-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                  >
                    <Tag size={18} className="mr-2" />
                    <div>
                      <div className="font-bold text-sm">Ürün Etiketi</div>
                      <div className="text-[10px] opacity-70">Standart yapışkanlı barkod</div>
                    </div>
                  </button>
                  <button 
                    onClick={() => setLabelType('shelf')}
                    className={`w-full text-left px-4 py-3 rounded-lg border flex items-center transition-all ${labelType === 'shelf' ? 'bg-brand-50 border-brand-500 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400' : 'bg-white dark:bg-enterprise-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                  >
                    <Grid size={18} className="mr-2" />
                    <div>
                      <div className="font-bold text-sm">Raf Etiketi</div>
                      <div className="text-[10px] opacity-70">Fiyat odaklı raf kartı</div>
                    </div>
                  </button>
                  <button 
                    onClick={() => setLabelType('list')}
                    className={`w-full text-left px-4 py-3 rounded-lg border flex items-center transition-all ${labelType === 'list' ? 'bg-brand-50 border-brand-500 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400' : 'bg-white dark:bg-enterprise-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                  >
                    <FileText size={18} className="mr-2" />
                    <div>
                      <div className="font-bold text-sm">Stok Listesi</div>
                      <div className="text-[10px] opacity-70">A4 döküm listesi</div>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Adet Ayarları</label>
                <div className="max-h-48 overflow-y-auto custom-scrollbar border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                  {selectedProducts.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-2 border-b border-slate-100 dark:border-slate-800 last:border-0 text-sm">
                      <div className="truncate flex-1 pr-2 text-slate-700 dark:text-slate-300" title={p.name}>{p.name}</div>
                      <div className="flex items-center bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                        <button onClick={() => updateCopy(p.id, -1)} className="p-1 hover:text-red-500 transition-colors"><Minus size={12}/></button>
                        <span className="w-6 text-center font-medium text-slate-900 dark:text-white">{copies[p.id] || 1}</span>
                        <button onClick={() => updateCopy(p.id, 1)} className="p-1 hover:text-green-500 transition-colors"><Plus size={12}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 overflow-y-auto custom-scrollbar flex flex-col">
               <div className="flex justify-between items-center mb-2">
                 <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Önizleme (A4 Kağıt)</h4>
                 <div className="text-xs text-slate-400">{itemsToRender.length} etiket yazdırılacak</div>
               </div>
               
               <div className="bg-white mx-auto shadow-lg p-[5mm] w-[210mm] min-h-[297mm] origin-top scale-50 sm:scale-75 lg:scale-90 transition-transform origin-center">
                  <div className={`
                    ${labelType === 'sticker' ? 'grid grid-cols-4 gap-2' : ''}
                    ${labelType === 'shelf' ? 'grid grid-cols-3 gap-4' : ''}
                    ${labelType === 'list' ? 'flex flex-col gap-0' : ''}
                  `}>
                    {itemsToRender.map((product, idx) => (
                      <React.Fragment key={`${product.id}-${idx}`}>
                        {labelType === 'sticker' && (
                          <div className="border border-gray-200 rounded p-2 flex flex-col items-center justify-center text-center h-[35mm] overflow-hidden">
                            <div className="text-[8px] font-bold text-gray-800 line-clamp-1 w-full mb-1">{product.name}</div>
                            {/* Barcode Font: *CODE* */}
                            <div className="font-barcode text-4xl text-black">
                              *{product.barcode || product.code}*
                            </div>
                            <div className="text-[10px] font-mono text-gray-600 tracking-widest -mt-1">
                              {product.barcode || product.code}
                            </div>
                            <div className="text-xs font-bold text-black mt-1">
                              {product.currency === 'USD' ? '$' : product.currency === 'EUR' ? '€' : '₺'}{product.price.toLocaleString('tr-TR')}
                            </div>
                          </div>
                        )}

                        {labelType === 'shelf' && (
                          <div className="border-2 border-black p-3 flex flex-col justify-between h-[60mm] relative">
                            <div className="text-center border-b-2 border-black pb-2 mb-2">
                              <h3 className="font-black text-lg text-black leading-tight line-clamp-2">{product.name}</h3>
                              <p className="text-xs text-gray-600 mt-1">{product.category}</p>
                            </div>
                            <div className="text-center flex-1 flex items-center justify-center">
                              <span className="text-4xl font-black text-black">
                                {product.currency === 'USD' ? '$' : product.currency === 'EUR' ? '€' : '₺'}{product.price.toLocaleString('tr-TR')}
                              </span>
                            </div>
                            <div className="flex justify-between items-end pt-2 border-t border-black">
                                <div className="text-left">
                                  <div className="font-barcode text-3xl text-black">*{product.barcode || product.code}*</div>
                                </div>
                                <div className="text-right">
                                  <p className="text-[10px] font-bold">TODESTEK</p>
                                  <p className="text-[8px]">{new Date().toLocaleDateString('tr-TR')}</p>
                                </div>
                            </div>
                          </div>
                        )}

                        {labelType === 'list' && (
                          <div className="flex items-center justify-between border-b border-gray-300 py-2 px-2 text-black">
                             <div className="flex items-center gap-4">
                               <div className="w-8 text-xs text-gray-500">{idx + 1}</div>
                               <div className="font-barcode text-4xl leading-none">*{product.barcode || product.code}*</div>
                               <div>
                                 <div className="font-bold text-sm">{product.name}</div>
                                 <div className="text-xs font-mono">{product.code}</div>
                               </div>
                             </div>
                             <div className="font-bold text-sm">
                               {product.currency === 'USD' ? '$' : product.currency === 'EUR' ? '€' : '₺'}{product.price.toLocaleString('tr-TR')}
                             </div>
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
               </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-700">
            <button 
              onClick={handlePrint}
              className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm transition-colors"
            >
              <Printer size={18} />
              Yazdır
            </button>
          </div>
        </div>
      </Modal>

      {/* Hidden Print Container */}
      <div className="print:block hidden fixed inset-0 bg-white z-[9999]">
        <div className="p-[5mm]">
          <div className={`
            ${labelType === 'sticker' ? 'grid grid-cols-4 gap-4' : ''}
            ${labelType === 'shelf' ? 'grid grid-cols-3 gap-6' : ''}
            ${labelType === 'list' ? 'flex flex-col gap-0' : ''}
          `}>
            {itemsToRender.map((product, idx) => (
              <React.Fragment key={`print-${product.id}-${idx}`}>
                {labelType === 'sticker' && (
                  <div className="border border-gray-300 rounded p-2 flex flex-col items-center justify-center text-center h-[35mm] overflow-hidden break-inside-avoid">
                    <div className="text-[9px] font-bold text-black line-clamp-2 w-full mb-1 leading-tight">{product.name}</div>
                    <div className="font-barcode text-5xl text-black">*{product.barcode || product.code}*</div>
                    <div className="text-[10px] font-mono text-black tracking-widest -mt-1">{product.barcode || product.code}</div>
                    <div className="text-sm font-bold text-black mt-1">
                      {product.currency === 'USD' ? '$' : product.currency === 'EUR' ? '€' : '₺'}{product.price.toLocaleString('tr-TR')}
                    </div>
                  </div>
                )}

                {labelType === 'shelf' && (
                  <div className="border-2 border-black p-4 flex flex-col justify-between h-[60mm] relative break-inside-avoid">
                    <div className="text-center border-b-2 border-black pb-2 mb-2">
                      <h3 className="font-black text-xl text-black leading-tight line-clamp-2">{product.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{product.category}</p>
                    </div>
                    <div className="text-center flex-1 flex items-center justify-center">
                      <span className="text-5xl font-black text-black">
                        {product.currency === 'USD' ? '$' : product.currency === 'EUR' ? '€' : '₺'}{product.price.toLocaleString('tr-TR')}
                      </span>
                    </div>
                    <div className="flex justify-between items-end pt-2 border-t border-black">
                        <div className="text-left">
                          <div className="font-barcode text-4xl text-black">*{product.barcode || product.code}*</div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold">TODESTEK</p>
                          <p className="text-[8px]">{new Date().toLocaleDateString('tr-TR')}</p>
                        </div>
                    </div>
                  </div>
                )}

                {labelType === 'list' && (
                  <div className="flex items-center justify-between border-b border-black py-3 px-2 text-black break-inside-avoid">
                      <div className="flex items-center gap-6">
                        <div className="w-8 text-sm text-gray-600">{idx + 1}</div>
                        <div className="font-barcode text-5xl leading-none">*{product.barcode || product.code}*</div>
                        <div>
                          <div className="font-bold text-base">{product.name}</div>
                          <div className="text-xs font-mono">{product.code}</div>
                        </div>
                      </div>
                      <div className="font-bold text-base">
                        {product.currency === 'USD' ? '$' : product.currency === 'EUR' ? '€' : '₺'}{product.price.toLocaleString('tr-TR')}
                      </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default BarcodeModal;
