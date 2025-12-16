
import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  showFirstLast?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  showFirstLast = true,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'h-8 min-w-8 text-xs',
    md: 'h-10 min-w-10 text-sm',
    lg: 'h-12 min-w-12 text-base',
  };

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 18,
  };

  // Generate page numbers array
  const getPageNumbers = (): (number | string)[] => {
    const totalNumbers = siblingCount * 2 + 3; // siblings + current + first + last
    const totalBlocks = totalNumbers + 2; // + 2 for ellipsis

    if (totalPages <= totalBlocks) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const showLeftEllipsis = leftSiblingIndex > 2;
    const showRightEllipsis = rightSiblingIndex < totalPages - 1;

    if (!showLeftEllipsis && showRightEllipsis) {
      const leftRange = Array.from({ length: 3 + 2 * siblingCount }, (_, i) => i + 1);
      return [...leftRange, '...', totalPages];
    }

    if (showLeftEllipsis && !showRightEllipsis) {
      const rightRange = Array.from(
        { length: 3 + 2 * siblingCount },
        (_, i) => totalPages - (3 + 2 * siblingCount) + i + 1
      );
      return [1, '...', ...rightRange];
    }

    const middleRange = Array.from(
      { length: rightSiblingIndex - leftSiblingIndex + 1 },
      (_, i) => leftSiblingIndex + i
    );
    return [1, '...', ...middleRange, '...', totalPages];
  };

  const pageNumbers = getPageNumbers();

  const buttonBase = `
    ${sizeClasses[size]}
    flex items-center justify-center
    rounded-lg font-medium transition-colors
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const buttonInactive = 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800';
  const buttonActive = 'bg-brand-600 text-white hover:bg-brand-700';

  return (
    <nav className={`flex items-center gap-1 ${className}`} aria-label="Pagination">
      {/* First */}
      {showFirstLast && (
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className={`${buttonBase} ${buttonInactive}`}
          aria-label="İlk sayfa"
        >
          <ChevronsLeft size={iconSizes[size]} />
        </button>
      )}

      {/* Previous */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`${buttonBase} ${buttonInactive}`}
        aria-label="Önceki sayfa"
      >
        <ChevronLeft size={iconSizes[size]} />
      </button>

      {/* Page Numbers */}
      {pageNumbers.map((pageNumber, index) => {
        if (pageNumber === '...') {
          return (
            <span
              key={`ellipsis-${index}`}
              className={`${sizeClasses[size]} flex items-center justify-center text-slate-400`}
            >
              ...
            </span>
          );
        }

        const page = pageNumber as number;
        const isActive = page === currentPage;

        return (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`${buttonBase} ${isActive ? buttonActive : buttonInactive}`}
            aria-current={isActive ? 'page' : undefined}
          >
            {page}
          </button>
        );
      })}

      {/* Next */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`${buttonBase} ${buttonInactive}`}
        aria-label="Sonraki sayfa"
      >
        <ChevronRight size={iconSizes[size]} />
      </button>

      {/* Last */}
      {showFirstLast && (
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className={`${buttonBase} ${buttonInactive}`}
          aria-label="Son sayfa"
        >
          <ChevronsRight size={iconSizes[size]} />
        </button>
      )}
    </nav>
  );
};

export default Pagination;
