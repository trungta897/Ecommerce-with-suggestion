'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { BaseButton, BaseInput } from '@/components/base';
import { Search } from '@/components/base/icons';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function OrderLookupPage() {
  const t = useTranslations('order');
  const router = useRouter();
  const [orderId, setOrderId] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLookup = () => {
    if (!orderId || !phone) {
      toast.error(t('lookupMissingFields'));
      return;
    }
    setLoading(true);
    router.push(`/orders/guest/${orderId.trim()}?phone=${phone.trim()}`);
  };

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
          <BaseInput
            placeholder="ORD-XXXXXX"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-ink">{t('lookupContact')}</label>
          <BaseInput
            placeholder="0900 000 000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <BaseButton className="w-full" onClick={handleLookup} disabled={loading}>
          {loading ? t('lookupSearching') : t('lookupButton')}
        </BaseButton>
      </div>
    </div>
  );
}
