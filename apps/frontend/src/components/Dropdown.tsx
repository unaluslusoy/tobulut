
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export interface DropdownItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
  onClick?: () => void;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  width?: 'auto' | 'trigger' | number;
  className?: string;
}

const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  align = 'left',
  width = 'auto',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getWidthStyle = (): React.CSSProperties => {
    if (width === 'auto') return { minWidth: '160px' };
    if (width === 'trigger' && triggerRef.current) {
      return { width: triggerRef.current.offsetWidth };
    }
    if (typeof width === 'number') return { width: `${width}px` };
    return {};
  };

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <div
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer"
      >
        {trigger}
      </div>

      {isOpen && (
        <div
          className={`
            absolute z-50 mt-2 py-1
            bg-white dark:bg-slate-800
            border border-slate-200 dark:border-slate-700
            rounded-xl shadow-xl
            animate-fade-in
            ${align === 'right' ? 'right-0' : 'left-0'}
          `}
          style={getWidthStyle()}
        >
          {items.map((item, index) => {
            if (item.divider) {
              return (
                <div 
                  key={item.key || index} 
                  className="my-1 border-t border-slate-100 dark:border-slate-700" 
                />
              );
            }

            return (
              <button
                key={item.key}
                disabled={item.disabled}
                onClick={() => {
                  if (!item.disabled) {
                    item.onClick?.();
                    setIsOpen(false);
                  }
                }}
                className={`
                  w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left
                  transition-colors
                  ${item.disabled 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }
                  ${item.danger 
                    ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20' 
                    : 'text-slate-700 dark:text-slate-300'
                  }
                `}
              >
                {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Simple Dropdown Button variant
export const DropdownButton: React.FC<{
  label: string;
  items: DropdownItem[];
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  className?: string;
}> = ({ label, items, variant = 'secondary', size = 'md', icon, className = '' }) => {
  const variantClasses = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700',
    secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600',
    ghost: 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };

  return (
    <Dropdown
      items={items}
      className={className}
      trigger={
        <div className={`
          inline-flex items-center gap-2 rounded-xl font-semibold transition-colors
          ${variantClasses[variant]}
          ${sizeClasses[size]}
        `}>
          {icon}
          {label}
          <ChevronDown size={16} />
        </div>
      }
    />
  );
};

export default Dropdown;
