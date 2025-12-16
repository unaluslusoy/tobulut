
import React from 'react';
import { AlertTriangle, Trash2, Info, HelpCircle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'question';
  loading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Onayla',
  cancelText = 'İptal',
  variant = 'danger',
  loading = false,
}) => {
  const variantConfig = {
    danger: {
      icon: <Trash2 className="w-6 h-6" />,
      iconBg: 'bg-red-100 dark:bg-red-900/30',
      iconColor: 'text-red-600 dark:text-red-400',
      defaultTitle: 'Silmek istediğinizden emin misiniz?',
      defaultMessage: 'Bu işlem geri alınamaz. Devam etmek istiyor musunuz?',
      buttonVariant: 'danger' as const,
    },
    warning: {
      icon: <AlertTriangle className="w-6 h-6" />,
      iconBg: 'bg-amber-100 dark:bg-amber-900/30',
      iconColor: 'text-amber-600 dark:text-amber-400',
      defaultTitle: 'Dikkat!',
      defaultMessage: 'Bu işlemi gerçekleştirmek istediğinizden emin misiniz?',
      buttonVariant: 'primary' as const,
    },
    info: {
      icon: <Info className="w-6 h-6" />,
      iconBg: 'bg-sky-100 dark:bg-sky-900/30',
      iconColor: 'text-sky-600 dark:text-sky-400',
      defaultTitle: 'Bilgi',
      defaultMessage: 'Bu işlemi onaylıyor musunuz?',
      buttonVariant: 'primary' as const,
    },
    question: {
      icon: <HelpCircle className="w-6 h-6" />,
      iconBg: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
      defaultTitle: 'Onay Gerekli',
      defaultMessage: 'Bu işlemi yapmak istiyor musunuz?',
      buttonVariant: 'primary' as const,
    },
  };

  const config = variantConfig[variant];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="sm" level={2}>
      <div className="text-center py-4">
        {/* Icon */}
        <div className={`inline-flex items-center justify-center w-14 h-14 rounded-full ${config.iconBg} ${config.iconColor} mb-4`}>
          {config.icon}
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
          {title || config.defaultTitle}
        </h3>

        {/* Message */}
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
          {message || config.defaultMessage}
        </p>

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={config.buttonVariant}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
