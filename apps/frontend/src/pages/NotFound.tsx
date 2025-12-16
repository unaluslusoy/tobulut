
import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-enterprise-50 dark:bg-enterprise-900 flex flex-col items-center justify-center p-4 text-center transition-colors">
      <div className="bg-white dark:bg-enterprise-800 p-8 rounded-2xl shadow-card max-w-md w-full border border-slate-200 dark:border-slate-700/50 relative overflow-hidden">
        {/* Decorative Background Blur */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        
        <div className="w-20 h-20 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-orange-500 dark:text-orange-400 border border-orange-100 dark:border-orange-800 relative z-10">
          <AlertTriangle size={40} />
        </div>
        
        <h1 className="text-5xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">404</h1>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4">Sayfa Bulunamadı</h2>
        
        <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
          Aradığınız sayfa mevcut değil, taşınmış veya geçici olarak erişilemiyor olabilir.
        </p>
        
        <Link 
          to="/" 
          className="inline-flex items-center justify-center w-full px-6 py-3.5 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-all shadow-lg shadow-brand-600/30 hover:scale-[1.02]"
        >
          <Home size={20} className="mr-2" />
          Ana Sayfaya Dön
        </Link>
      </div>
      
      <div className="mt-8 text-xs font-mono text-slate-400 dark:text-slate-600">
        ToPlus ERP System &copy; {new Date().getFullYear()}
      </div>
    </div>
  );
};

export default NotFound;
