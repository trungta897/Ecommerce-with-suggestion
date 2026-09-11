'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

interface AdminPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  className?: string;
}

export const AdminPagination: React.FC<AdminPaginationProps> = ({
  page,
  totalPages,
  onPageChange,
  className = '',
}) => {
  const t = useTranslations('admin.pagination');

  if (totalPages <= 1) return null;

  return (
    <div
      className={`flex items-center justify-between px-6 py-4 border-t border-rule bg-white ${className}`}
    >
      <button
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="px-3.5 py-1.5 text-sm font-medium rounded-lg bg-paper-2 text-ink-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/10 hover:text-primary transition-colors"
      >
        {t('prev')}
      </button>
      <span className="text-xs text-ink-2">{t('page_of', { page, total: totalPages })}</span>
      <button
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="px-3.5 py-1.5 text-sm font-medium rounded-lg bg-paper-2 text-ink-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/10 hover:text-primary transition-colors"
      >
        {t('next')}
      </button>
    </div>
  );
};
