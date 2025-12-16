
import React from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export interface ToastProps {
  id: string;
  message: string;
  title?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose?: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({
  id,
  message,
  title,
  type = 'info',
  onClose,
}) => {
  const config = {
    success: {
      icon: <CheckCircle className="w-5 h-5" />,
      bg: 'bg-emerald-50 dark:bg-emerald-900/30',
      border: 'border-emerald-200 dark:border-emerald-800',
      iconColor: 'text-emerald-500',
      titleColor: 'text-emerald-800 dark:text-emerald-200',
    },
    error: {
      icon: <AlertCircle className="w-5 h-5" />,
      bg: 'bg-red-50 dark:bg-red-900/30',
      border: 'border-red-200 dark:border-red-800',
      iconColor: 'text-red-500',
      titleColor: 'text-red-800 dark:text-red-200',
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5" />,
      bg: 'bg-amber-50 dark:bg-amber-900/30',
      border: 'border-amber-200 dark:border-amber-800',
      iconColor: 'text-amber-500',
      titleColor: 'text-amber-800 dark:text-amber-200',
    },
    info: {
      icon: <Info className="w-5 h-5" />,
      bg: 'bg-sky-50 dark:bg-sky-900/30',
      border: 'border-sky-200 dark:border-sky-800',
      iconColor: 'text-sky-500',
      titleColor: 'text-sky-800 dark:text-sky-200',
    },
  };

  const { icon, bg, border, iconColor, titleColor } = config[type];

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-xl border shadow-lg
        ${bg} ${border}
        animate-fade-in
        min-w-[300px] max-w-md
      `}
      role="alert"
    >
      <span className={`flex-shrink-0 ${iconColor}`}>{icon}</span>
      
      <div className="flex-1 min-w-0">
        {title && (
          <p className={`font-semibold text-sm ${titleColor}`}>{title}</p>
        )}
        <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>
      </div>

      {onClose && (
        <button
          onClick={() => onClose(id)}
          className="flex-shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

// Toast Container Component
export const ToastContainer: React.FC<{
  toasts: ToastProps[];
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  onClose?: (id: string) => void;
}> = ({ toasts, position = 'top-right', onClose }) => {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  if (toasts.length === 0) return null;

  return (
    <div className={`fixed z-[100] ${positionClasses[position]} flex flex-col gap-3`}>
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  );
};

export default Toast;
