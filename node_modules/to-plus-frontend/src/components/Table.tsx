
import React from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  className?: string;
}

export interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyField?: keyof T;
  loading?: boolean;
  emptyMessage?: string;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  onRowClick?: (row: T, index: number) => void;
  hoverable?: boolean;
  striped?: boolean;
  compact?: boolean;
  className?: string;
}

function Table<T extends Record<string, any>>({
  data,
  columns,
  keyField = 'id' as keyof T,
  loading = false,
  emptyMessage = 'Veri bulunamadı',
  sortKey,
  sortDirection,
  onSort,
  onRowClick,
  hoverable = true,
  striped = false,
  compact = false,
  className = '',
}: TableProps<T>) {
  
  const getCellValue = (row: T, key: string): any => {
    const keys = key.split('.');
    let value: any = row;
    for (const k of keys) {
      value = value?.[k];
    }
    return value;
  };

  const getSortIcon = (columnKey: string) => {
    if (sortKey !== columnKey) {
      return <ChevronsUpDown className="w-4 h-4 text-slate-400" />;
    }
    return sortDirection === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-brand-600" />
      : <ChevronDown className="w-4 h-4 text-brand-600" />;
  };

  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  const cellPadding = compact ? 'px-4 py-2' : 'px-6 py-4';
  const headerPadding = compact ? 'px-4 py-2' : 'px-6 py-3';

  return (
    <div className={`overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 ${className}`}>
      <table className="w-full">
        <thead className="bg-slate-50 dark:bg-slate-800/50">
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className={`
                  ${headerPadding}
                  text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider
                  ${alignClasses[column.align || 'left']}
                  ${column.sortable ? 'cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors' : ''}
                  ${column.className || ''}
                `}
                style={{ width: column.width }}
                onClick={() => column.sortable && onSort?.(String(column.key))}
              >
                <div className={`flex items-center gap-1 ${column.align === 'right' ? 'justify-end' : column.align === 'center' ? 'justify-center' : ''}`}>
                  {column.header}
                  {column.sortable && getSortIcon(String(column.key))}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        
        <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center">
                <div className="flex items-center justify-center gap-2 text-slate-400">
                  <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                  <span>Yükleniyor...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={String(row[keyField]) || rowIndex}
                className={`
                  ${hoverable ? 'hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors' : ''}
                  ${striped && rowIndex % 2 === 1 ? 'bg-slate-50/50 dark:bg-slate-800/30' : ''}
                  ${onRowClick ? 'cursor-pointer' : ''}
                `}
                onClick={() => onRowClick?.(row, rowIndex)}
              >
                {columns.map((column) => {
                  const value = getCellValue(row, String(column.key));
                  return (
                    <td
                      key={String(column.key)}
                      className={`
                        ${cellPadding}
                        text-sm text-slate-700 dark:text-slate-300
                        ${alignClasses[column.align || 'left']}
                        ${column.className || ''}
                      `}
                    >
                      {column.render 
                        ? column.render(value, row, rowIndex) 
                        : value ?? '-'
                      }
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
