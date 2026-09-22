'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

interface AdminPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  className?: string;
  totalItems?: number;
  limit?: number;
  itemLabel?: string;
}

export const AdminPagination: React.FC<AdminPaginationProps> = ({
  page,
  totalPages,
  onPageChange,
  className = '',
  totalItems,
  limit = 10,
  itemLabel,
}) => {
  const t = useTranslations('admin.pagination');

  if (totalPages <= 1 && (totalItems === undefined || totalItems <= 0)) {
    return null;
  }

  const from = totalItems && totalItems > 0 ? (page - 1) * limit + 1 : 0;
  const to = totalItems ? Math.min(page * limit, totalItems) : 0;
  const label = itemLabel || t('itemsLabelProducts');

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-rule bg-white ${className}`}
    >
      <div>
        {totalItems !== undefined && (
          <p className="text-xs text-ink-2">
            {totalItems > 0
              ? t('showingRange', { from, to, total: totalItems, item: label })
              : t('totalItems', { total: 0, item: label })}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="px-3.5 py-1.5 text-sm font-medium rounded-lg bg-paper-2 text-ink-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/10 hover:text-primary transition-colors"
        >
          {t('prev')}
        </button>
        <span className="text-xs text-ink-2">
          {t('pageOf', { page, total: Math.max(totalPages, 1) })}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="px-3.5 py-1.5 text-sm font-medium rounded-lg bg-paper-2 text-ink-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/10 hover:text-primary transition-colors"
        >
          {t('next')}
        </button>
      </div>
    </div>
  );
};
