
import React from 'react';
import { 
  CheckCircle, AlertTriangle, Box 
} from 'lucide-react';

const StyleGuide: React.FC = () => {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12">
      
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-700 pb-8">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2">Tasarım Sistemi</h1>
            <p className="text-slate-500 dark:text-slate-400">ToPlus ERP V2.0 UI Bileşen Kütüphanesi.</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">Dev Only</span>
          </div>
        </div>
      </div>

      {/* UI Components */}
      <section>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center">
          <Box className="mr-3 text-blue-500" /> UI Bileşenleri
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Buttons */}
          <div className="bg-white dark:bg-enterprise-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Butonlar</h3>
            <div className="flex flex-wrap gap-4 items-center mb-6">
              <button className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-bold shadow-lg shadow-brand-600/20 transition-all active:scale-95">
                Primary Button
              </button>
              <button className="px-6 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-white rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
                Secondary
              </button>
              <button className="px-6 py-2.5 text-brand-600 dark:text-brand-400 font-medium hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors">
                Ghost Button
              </button>
            </div>
            <div className="flex gap-4">
               <button className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium text-sm flex items-center gap-2 shadow-sm">
                 <AlertTriangle size={16} /> Tehlike
               </button>
               <button className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium text-sm flex items-center gap-2 shadow-sm">
                 <CheckCircle size={16} /> Başarılı
               </button>
            </div>
          </div>

          {/* Form Elements */}
          <div className="bg-white dark:bg-enterprise-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Form Elemanları</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Standart Input</label>
                <input 
                  type="text" 
                  placeholder="Metin giriniz..." 
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none transition-all"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                   <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Seçim Kutusu</label>
                   <select className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-brand-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none">
                     <option>Seçenek 1</option>
                     <option>Seçenek 2</option>
                   </select>
                </div>
                <div className="flex-1">
                   <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Hatalı Input</label>
                   <input 
                    type="text" 
                    defaultValue="Geçersiz değer"
                    className="w-full px-4 py-2.5 border border-red-500 rounded-lg focus:ring-2 focus:ring-red-500 bg-red-50 dark:bg-red-900/10 text-red-900 dark:text-red-200 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
};

export default StyleGuide;
