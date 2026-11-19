'use client';

import { useTranslations } from 'next-intl';
import { CheckCircle2 } from '@/components/base/icons';
import { BaseButton } from '@/components/base';
import Link from 'next/link';

export function CheckoutSuccess() {
  const t = useTranslations('checkout');
  const tCommon = useTranslations('common');

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center animate-in zoom-in duration-300">
        <CheckCircle2 className="w-10 h-10 text-green-600" />
      </div>
      <h2 className="text-2xl font-bold text-ink mb-2">{t('orderSuccess')}</h2>
      <p className="text-ink-2 mb-2">{t('orderSuccessDesc')}</p>
      <p className="text-lg font-bold text-primary mb-8">#ORD-{Date.now().toString().slice(-6)}</p>
      <Link href="/">
        <BaseButton size="lg">{tCommon('home')}</BaseButton>
      </Link>
    </div>
  );
}
