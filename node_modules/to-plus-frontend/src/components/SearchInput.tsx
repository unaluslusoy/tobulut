
import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';

export interface SearchInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  loading?: boolean;
  debounceMs?: number;
  clearable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  autoFocus?: boolean;
  className?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({
  value: controlledValue,
  onChange,
  onSearch,
  placeholder = 'Ara...',
  loading = false,
  debounceMs = 300,
  clearable = true,
  size = 'md',
  fullWidth = false,
  autoFocus = false,
  className = '',
}) => {
  const [internalValue, setInternalValue] = useState(controlledValue || '');
  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (controlledValue !== undefined) {
      setInternalValue(controlledValue);
    }
  }, [controlledValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    onChange?.(newValue);

    // Debounced search
    if (onSearch) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        onSearch(newValue);
      }, debounceMs);
    }
  };

  const handleClear = () => {
    setInternalValue('');
    onChange?.('');
    onSearch?.('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onSearch) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      onSearch(value);
    }
    if (e.key === 'Escape' && clearable) {
      handleClear();
    }
  };

  const sizeClasses = {
    sm: 'h-8 text-xs pl-8 pr-8',
    md: 'h-10 text-sm pl-10 pr-10',
    lg: 'h-12 text-base pl-12 pr-12',
  };

  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 20,
  };

  const iconPositions = {
    sm: 'left-2.5',
    md: 'left-3',
    lg: 'left-3.5',
  };

  const rightIconPositions = {
    sm: 'right-2',
    md: 'right-3',
    lg: 'right-3.5',
  };

  return (
    <div className={`relative ${fullWidth ? 'w-full' : 'w-auto'} ${className}`}>
      {/* Search Icon */}
      <div className={`absolute ${iconPositions[size]} top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none`}>
        <Search size={iconSizes[size]} />
      </div>

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={`
          w-full rounded-xl border border-slate-200 dark:border-slate-700
          bg-white dark:bg-slate-800
          text-slate-900 dark:text-white
          placeholder:text-slate-400 dark:placeholder:text-slate-500
          focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500
          transition-all duration-200
          ${sizeClasses[size]}
        `}
      />

      {/* Right Side - Loading or Clear */}
      <div className={`absolute ${rightIconPositions[size]} top-1/2 -translate-y-1/2`}>
        {loading ? (
          <Loader2 size={iconSizes[size]} className="text-slate-400 animate-spin" />
        ) : clearable && value ? (
          <button
            onClick={handleClear}
            className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={iconSizes[size]} />
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default SearchInput;
