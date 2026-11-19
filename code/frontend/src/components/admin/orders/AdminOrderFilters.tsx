'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { BaseInput } from '@/components/base';
import { Search } from '@/components/base/icons';
import { ORDER_STATUS_COLORS } from '@/constants/order';

interface AdminOrderFiltersProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
}

export const AdminOrderFilters: React.FC<AdminOrderFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedStatus,
  onStatusChange,
}) => {
  const t = useTranslations('admin.orders');
  const tOrder = useTranslations('order');

  // Filter out lowercase alias keys from ORDER_STATUS_COLORS
  const uppercaseStatuses = Object.keys(ORDER_STATUS_COLORS).filter(
    (key) => key === key.toUpperCase()
  );

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-2" />
        <BaseInput
          placeholder={t('searchPlaceholder')}
          className="pl-10"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <select
        value={selectedStatus}
        onChange={(e) => onStatusChange(e.target.value)}
        className="px-3.5 py-2 rounded-xl border border-rule text-sm bg-white focus:outline-none focus:border-primary text-ink"
      >
        <option value="">{t('all_statuses')}</option>
        {uppercaseStatuses.map((st) => (
          <option key={st} value={st}>
            {tOrder(`statusLabels.${st.toLowerCase()}` as Parameters<typeof tOrder>[0])}
          </option>
        ))}
      </select>
    </div>
  );
};
