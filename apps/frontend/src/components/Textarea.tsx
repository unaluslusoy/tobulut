
import React, { forwardRef } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  success?: string;
  helperText?: string;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  fullWidth?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  success,
  helperText,
  resize = 'vertical',
  fullWidth = true,
  className = '',
  id,
  rows = 4,
  ...props
}, ref) => {
  const inputId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
  
  const hasError = !!error;
  const hasSuccess = !!success;

  const resizeClasses = {
    none: 'resize-none',
    vertical: 'resize-y',
    horizontal: 'resize-x',
    both: 'resize',
  };

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
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          className={`
            w-full px-4 py-3 rounded-xl border transition-all duration-200
            bg-white dark:bg-slate-800
            text-slate-900 dark:text-white
            placeholder:text-slate-400 dark:placeholder:text-slate-500
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 dark:disabled:bg-slate-900
            ${stateClasses}
            ${resizeClasses[resize]}
            ${hasError || hasSuccess ? 'pr-10' : ''}
          `}
          {...props}
        />
        
        {(hasError || hasSuccess) && (
          <div className="absolute right-3 top-3">
            {hasError ? (
              <AlertCircle className="w-5 h-5 text-red-500" />
            ) : (
              <CheckCircle className="w-5 h-5 text-emerald-500" />
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

Textarea.displayName = 'Textarea';

export default Textarea;
