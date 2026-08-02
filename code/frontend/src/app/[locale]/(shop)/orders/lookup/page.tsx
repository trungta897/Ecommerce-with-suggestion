'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { BaseButton, BaseInput } from '@/components/base';
import { Search, Package } from '@/components/base/icons';

export default function OrderLookupPage() {
  const t = useTranslations('order');
  const [searched, setSearched] = useState(false);

  return (
    <div className="max-w-xl mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
          <Search className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-ink mb-2">{t('lookup')}</h1>
        <p className="text-ink-2 text-sm">{t('lookupDesc')}</p>
      </div>

      <div className="bg-white border border-rule rounded-xl p-6 space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-ink">{t('lookupOrderId')}</label>
          <BaseInput placeholder="ORD-XXXXXX" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-ink">{t('lookupContact')}</label>
          <BaseInput placeholder="0900 000 000" />
        </div>
        <BaseButton className="w-full" onClick={() => setSearched(true)}>
          {t('lookupButton')}
        </BaseButton>
      </div>

      {searched && (
        <div className="mt-8 text-center py-12 bg-white border border-rule rounded-xl">
          <Package className="w-12 h-12 mx-auto mb-3 text-muted" />
          <p className="text-ink-2">{t('lookupNotFound')}</p>
        </div>
      )}
    </div>
  );
}
