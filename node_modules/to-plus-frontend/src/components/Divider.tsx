
import React from 'react';

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  variant?: 'solid' | 'dashed' | 'dotted';
  label?: string;
  labelPosition?: 'left' | 'center' | 'right';
  className?: string;
}

const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  variant = 'solid',
  label,
  labelPosition = 'center',
  className = '',
}) => {
  const variantClasses = {
    solid: 'border-solid',
    dashed: 'border-dashed',
    dotted: 'border-dotted',
  };

  if (orientation === 'vertical') {
    return (
      <div 
        className={`
          inline-block h-full min-h-[1em] w-px
          border-l border-slate-200 dark:border-slate-700
          ${variantClasses[variant]}
          ${className}
        `}
      />
    );
  }

  if (label) {
    const labelPositionClasses = {
      left: 'justify-start',
      center: 'justify-center',
      right: 'justify-end',
    };

    return (
      <div className={`flex items-center ${labelPositionClasses[labelPosition]} ${className}`}>
        {(labelPosition === 'center' || labelPosition === 'right') && (
          <div className={`flex-1 border-t border-slate-200 dark:border-slate-700 ${variantClasses[variant]}`} />
        )}
        <span className="px-4 text-sm font-medium text-slate-500 dark:text-slate-400">
          {label}
        </span>
        {(labelPosition === 'center' || labelPosition === 'left') && (
          <div className={`flex-1 border-t border-slate-200 dark:border-slate-700 ${variantClasses[variant]}`} />
        )}
      </div>
    );
  }

  return (
    <hr 
      className={`
        border-t border-slate-200 dark:border-slate-700
        ${variantClasses[variant]}
        ${className}
      `}
    />
  );
};

export default Divider;
