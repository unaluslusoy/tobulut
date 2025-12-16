
import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  trendLabel?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  loading?: boolean;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  trendLabel,
  icon,
  iconBg = 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400',
  loading = false,
  className = '',
}) => {
  const getTrendIcon = () => {
    if (!trend) return <Minus className="w-4 h-4" />;
    if (trend > 0) return <TrendingUp className="w-4 h-4" />;
    return <TrendingDown className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    if (!trend) return 'text-slate-500 bg-slate-100 dark:bg-slate-800';
    if (trend > 0) return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400';
    return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24" />
            <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-xl" />
          </div>
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-32 mb-2" />
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-20" />
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 transition-all hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-600 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {title}
        </span>
        {icon && (
          <div className={`p-2.5 rounded-xl ${iconBg}`}>
            {icon}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="text-2xl font-bold text-slate-900 dark:text-white">
          {value}
        </div>
        
        <div className="flex items-center gap-2">
          {trend !== undefined && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${getTrendColor()}`}>
              {getTrendIcon()}
              {Math.abs(trend)}%
            </span>
          )}
          {(subtitle || trendLabel) && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {trendLabel || subtitle}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
