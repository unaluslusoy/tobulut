
import React from 'react';
import { Check, Minus } from 'lucide-react';

export interface CheckboxProps {
  checked?: boolean;
  indeterminate?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  description?: string;
  error?: string;
  className?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({
  checked = false,
  indeterminate = false,
  onChange,
  disabled = false,
  size = 'md',
  label,
  description,
  error,
  className = '',
}) => {
  const handleChange = () => {
    if (!disabled && onChange) {
      onChange(!checked);
    }
  };

  const sizes = {
    sm: { box: 'w-4 h-4', icon: 12 },
    md: { box: 'w-5 h-5', icon: 14 },
    lg: { box: 'w-6 h-6', icon: 16 },
  };

  const currentSize = sizes[size];
  const isChecked = checked || indeterminate;

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
            ${currentSize.box}
            rounded-md border-2 transition-all duration-200
            flex items-center justify-center
            ${isChecked
              ? 'bg-brand-600 border-brand-600'
              : error
                ? 'border-red-300 dark:border-red-600 bg-white dark:bg-slate-800'
                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
            }
            ${!disabled && !isChecked ? 'hover:border-brand-400' : ''}
          `}
        >
          {indeterminate ? (
            <Minus className="text-white" size={currentSize.icon} strokeWidth={3} />
          ) : checked ? (
            <Check className="text-white" size={currentSize.icon} strokeWidth={3} />
          ) : null}
        </div>
      </div>
      
      {(label || description) && (
        <div className="ml-3">
          {label && (
            <span className={`text-sm font-medium ${error ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
              {label}
            </span>
          )}
          {description && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {description}
            </p>
          )}
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-0.5">
              {error}
            </p>
          )}
        </div>
      )}
    </label>
  );
};

export default Checkbox;
