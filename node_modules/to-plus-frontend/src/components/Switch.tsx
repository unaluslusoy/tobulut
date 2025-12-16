
import React from 'react';

export interface SwitchProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  description?: string;
  className?: string;
}

const Switch: React.FC<SwitchProps> = ({
  checked = false,
  onChange,
  disabled = false,
  size = 'md',
  label,
  description,
  className = '',
}) => {
  const handleChange = () => {
    if (!disabled && onChange) {
      onChange(!checked);
    }
  };

  const sizes = {
    sm: {
      track: 'w-8 h-4',
      thumb: 'w-3 h-3',
      translate: 'translate-x-4',
    },
    md: {
      track: 'w-11 h-6',
      thumb: 'w-5 h-5',
      translate: 'translate-x-5',
    },
    lg: {
      track: 'w-14 h-7',
      thumb: 'w-6 h-6',
      translate: 'translate-x-7',
    },
  };

  const currentSize = sizes[size];

  return (
    <label className={`inline-flex items-start cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      <div className="relative flex-shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          className="sr-only"
        />
        <div
          className={`
            ${currentSize.track}
            rounded-full transition-colors duration-200
            ${checked 
              ? 'bg-brand-600' 
              : 'bg-slate-200 dark:bg-slate-700'
            }
          `}
        />
        <div
          className={`
            absolute top-0.5 left-0.5
            ${currentSize.thumb}
            bg-white rounded-full shadow-md
            transition-transform duration-200
            ${checked ? currentSize.translate : 'translate-x-0'}
          `}
        />
      </div>
      
      {(label || description) && (
        <div className="ml-3">
          {label && (
            <span className="text-sm font-medium text-slate-900 dark:text-white">
              {label}
            </span>
          )}
          {description && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {description}
            </p>
          )}
        </div>
      )}
    </label>
  );
};

export default Switch;
