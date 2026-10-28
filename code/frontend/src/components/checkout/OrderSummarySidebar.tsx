'use client';

import { useLocale, useTranslations } from 'next-intl';
import { formatPrice } from '@/utils/format';
import { DEPOSIT_AMOUNT_VND } from '@/constants/order';

interface OrderSummarySidebarProps {
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  isDepositRequired?: boolean;
}

export function OrderSummarySidebar({
  subtotal,
  shippingFee,
  discount,
  total,
  isDepositRequired,
}: OrderSummarySidebarProps) {
  const locale = useLocale();
  const t = useTranslations('checkout');

  return (
    <div className="w-full mb-6">
      <div className="bg-white border border-rule rounded-xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between border-b border-rule pb-3 mb-4 gap-2">
          <h3 className="text-base font-bold text-ink">{t('orderSummary')}</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-2 font-medium">{t('total')}:</span>
            <span className="text-lg font-bold text-primary">{formatPrice(total, locale)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100">
            <span className="block text-xs text-ink-2 mb-1">{t('subtotal')}</span>
            <span className="font-semibold text-ink">{formatPrice(subtotal, locale)}</span>
          </div>
          <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100">
            <span className="block text-xs text-ink-2 mb-1">{t('shippingFee')}</span>
            <span className="font-semibold text-ink">
              {shippingFee === 0 ? t('free') : formatPrice(shippingFee, locale)}
            </span>
          </div>
          <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100">
            <span className="block text-xs text-ink-2 mb-1">{t('discount')}</span>
            <span className="font-semibold text-emerald-600">
              {discount > 0 ? `-${formatPrice(discount, locale)}` : '0 đ'}
            </span>
          </div>
          <div className="p-3 bg-primary/5 rounded-xl border border-primary/20">
            <span className="block text-xs text-primary font-medium mb-1">{t('total')}</span>
            <span className="font-bold text-primary text-base">{formatPrice(total, locale)}</span>
          </div>
        </div>

        {isDepositRequired && (
          <div className="flex items-center justify-between mt-3 p-3 bg-orange-50 border border-orange-200 rounded-xl text-orange-700 text-xs">
            <span className="font-semibold">{t('depositRequired')}</span>
            <span className="font-bold text-sm">{formatPrice(DEPOSIT_AMOUNT_VND, locale)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
