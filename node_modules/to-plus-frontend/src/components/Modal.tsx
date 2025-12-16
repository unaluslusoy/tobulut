
import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  position?: 'center' | 'bottom';
  level?: 1 | 2 | 3; // Support nesting depth
}

const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  position = 'center',
  level = 1
}) => {
  const [show, setShow] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShow(true);
    } else {
      const timer = setTimeout(() => setShow(false), 300); // Wait for animation
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!show && !isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-6xl',
    'full': 'w-full h-full m-0 rounded-none' // Full screen override
  };

  const containerClasses = position === 'bottom' 
    ? 'items-end' 
    : 'items-center justify-center';

  const panelClasses = position === 'bottom'
    ? `w-full rounded-t-2xl h-[95vh] ${isOpen ? 'translate-y-0' : 'translate-y-full'}`
    : size === 'full' 
        ? `w-full h-full rounded-none ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`
        : `relative w-full ${sizeClasses[size]} rounded-2xl mx-4 ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`;

  // Dynamic Z-Index based on nesting level
  const zIndexBase = 50 + (level * 10); // Level 1 = 60, Level 2 = 70, etc.

  return (
    <div className={`fixed inset-0 flex ${containerClasses} overflow-hidden`} style={{ zIndex: zIndexBase }}>
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Modal Panel */}
      <div className={`${panelClasses} bg-white dark:bg-enterprise-800 shadow-2xl ring-1 ring-gray-200 dark:ring-slate-700/50 flex flex-col transition-all duration-300 transform z-50`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700/50 p-5 shrink-0 bg-white dark:bg-enterprise-800 z-10 rounded-t-2xl">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar h-full relative text-gray-700 dark:text-gray-300">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
