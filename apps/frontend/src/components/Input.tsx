
import React, { forwardRef } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  helperText?: string;
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  success,
  helperText,
  prefixIcon,
  suffixIcon,
  fullWidth = true,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  const hasError = !!error;
  const hasSuccess = !!success;

  const baseInputClasses = `
    w-full px-4 py-2.5 rounded-xl border transition-all duration-200
    bg-white dark:bg-slate-800
    text-slate-900 dark:text-white
    placeholder:text-slate-400 dark:placeholder:text-slate-500
    focus:outline-none focus:ring-2 focus:ring-offset-0
    disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 dark:disabled:bg-slate-900
  `;

  const stateClasses = hasError
    ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 dark:border-red-600'
    : hasSuccess
    ? 'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/20 dark:border-emerald-600'
    : 'border-slate-200 focus:border-brand-500 focus:ring-brand-500/20 dark:border-slate-700 dark:focus:border-brand-400';

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        {prefixIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {prefixIcon}
          </div>
        )}
        
        <input
          ref={ref}
          id={inputId}
          className={`
            ${baseInputClasses}
            ${stateClasses}
            ${prefixIcon ? 'pl-10' : ''}
            ${suffixIcon || hasError || hasSuccess ? 'pr-10' : ''}
          `}
          {...props}
        />
        
        {(suffixIcon || hasError || hasSuccess) && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {hasError ? (
              <AlertCircle className="w-5 h-5 text-red-500" />
            ) : hasSuccess ? (
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            ) : (
              <span className="text-slate-400">{suffixIcon}</span>
            )}
          </div>
        )}
      </div>

      {(error || success || helperText) && (
        <p className={`mt-1.5 text-sm ${
          hasError ? 'text-red-600 dark:text-red-400' :
          hasSuccess ? 'text-emerald-600 dark:text-emerald-400' :
          'text-slate-500 dark:text-slate-400'
        }`}>
          {error || success || helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
