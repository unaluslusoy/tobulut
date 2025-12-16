
import React, { createContext, useContext } from 'react';

interface RadioGroupContextValue {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const RadioGroupContext = createContext<RadioGroupContextValue>({});

export interface RadioGroupProps {
  children: React.ReactNode;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  orientation?: 'horizontal' | 'vertical';
  label?: string;
  error?: string;
  className?: string;
}

export interface RadioProps {
  value: string;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

const RadioGroup: React.FC<RadioGroupProps> & { Radio: React.FC<RadioProps> } = ({
  children,
  value,
  onChange,
  disabled = false,
  size = 'md',
  orientation = 'vertical',
  label,
  error,
  className = '',
}) => {
  return (
    <RadioGroupContext.Provider value={{ value, onChange, disabled, size }}>
      <div className={className} role="radiogroup">
        {label && (
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            {label}
          </label>
        )}
        <div className={`flex ${orientation === 'vertical' ? 'flex-col space-y-3' : 'flex-wrap gap-4'}`}>
          {children}
        </div>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-2">{error}</p>
        )}
      </div>
    </RadioGroupContext.Provider>
  );
};

const Radio: React.FC<RadioProps> = ({
  value,
  label,
  description,
  disabled: itemDisabled = false,
  className = '',
}) => {
  const context = useContext(RadioGroupContext);
  const isDisabled = context.disabled || itemDisabled;
  const isChecked = context.value === value;
  const size = context.size || 'md';

  const sizes = {
    sm: { outer: 'w-4 h-4', inner: 'w-2 h-2' },
    md: { outer: 'w-5 h-5', inner: 'w-2.5 h-2.5' },
    lg: { outer: 'w-6 h-6', inner: 'w-3 h-3' },
  };

  const currentSize = sizes[size];

  const handleChange = () => {
    if (!isDisabled && context.onChange) {
      context.onChange(value);
    }
  };

  return (
    <label className={`inline-flex items-start cursor-pointer ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      <div className="relative flex-shrink-0">
        <input
          type="radio"
          checked={isChecked}
          onChange={handleChange}
          disabled={isDisabled}
          className="sr-only"
        />
        <div
          className={`
            ${currentSize.outer}
            rounded-full border-2 transition-all duration-200
            flex items-center justify-center
            ${isChecked
              ? 'border-brand-600 bg-brand-600'
              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
            }
            ${!isDisabled && !isChecked ? 'hover:border-brand-400' : ''}
          `}
        >
          {isChecked && (
            <div className={`${currentSize.inner} rounded-full bg-white`} />
          )}
        </div>
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

RadioGroup.Radio = Radio;

export default RadioGroup;
