
import React from 'react';
import { Inbox, Search, FileX, AlertCircle } from 'lucide-react';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'search' | 'error' | 'no-data';
  action?: React.ReactNode;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  variant = 'default',
  action,
  className = '',
}) => {
  const variants = {
    default: {
      icon: <Inbox className="w-12 h-12" />,
      title: 'Veri Bulunamadı',
      description: 'Henüz hiç kayıt eklenmemiş.',
    },
    search: {
      icon: <Search className="w-12 h-12" />,
      title: 'Sonuç Bulunamadı',
      description: 'Arama kriterlerinize uygun kayıt bulunamadı.',
    },
    error: {
      icon: <AlertCircle className="w-12 h-12" />,
      title: 'Bir Hata Oluştu',
      description: 'Veriler yüklenirken bir sorun oluştu. Lütfen tekrar deneyin.',
    },
    'no-data': {
      icon: <FileX className="w-12 h-12" />,
      title: 'Veri Yok',
      description: 'Bu alanda gösterilecek veri bulunmuyor.',
    },
  };

  const config = variants[variant];

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 dark:text-slate-500 mb-4">
        {icon || config.icon}
      </div>
      
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
        {title || config.title}
      </h3>
      
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6">
        {description || config.description}
      </p>
      
      {action && (
        <div className="flex gap-3">
          {action}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
