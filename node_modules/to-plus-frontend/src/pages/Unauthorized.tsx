
import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const Unauthorized: React.FC = () => {
  return (
    <div className="min-h-screen bg-enterprise-50 dark:bg-enterprise-900 flex flex-col items-center justify-center p-4 text-center transition-colors">
      <div className="bg-white dark:bg-enterprise-800 p-8 rounded-2xl shadow-card max-w-md w-full border border-slate-200 dark:border-slate-700/50 relative overflow-hidden">
        {/* Decorative Background Blur */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

        <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800 relative z-10">
          <ShieldAlert size={40} />
        </div>
        
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Erişim Engellendi</h1>
        <h2 className="text-lg font-medium text-slate-600 dark:text-slate-300 mb-6">
          Bu sayfayı görüntülemek için gerekli yetkiye sahip değilsiniz.
        </h2>
        
        <div className="space-y-4">
          <Link 
            to="/" 
            className="inline-flex items-center justify-center w-full px-6 py-3.5 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-all shadow-lg shadow-brand-600/30 hover:scale-[1.02]"
          >
            <ArrowLeft size={20} className="mr-2" />
            Ana Sayfaya Dön
          </Link>
          <div className="text-xs text-slate-400 dark:text-slate-500 pt-2 font-mono">
            Hata Kodu: 403 Forbidden
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
