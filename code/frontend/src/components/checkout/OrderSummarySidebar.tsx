'use client';

import { useLocale, useTranslations } from 'next-intl';
import { formatPrice } from '@/utils/format';

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
    <div className="lg:w-80">
      <div className="bg-white border border-rule rounded-xl p-6 sticky top-4 shadow-sm">
        <h3 className="text-lg font-bold text-ink mb-4 border-b border-rule pb-3">
          {t('orderSummary')}
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-ink-2">{t('subtotal')}</span>
            <span className="font-semibold">{formatPrice(subtotal, locale)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-ink-2">{t('shippingFee')}</span>
            <span className="font-semibold">{formatPrice(shippingFee, locale)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-ink-2">{t('discount')}</span>
            <span className="font-semibold text-green-600">-{formatPrice(discount, locale)}</span>
          </div>
          <div className="border-t border-rule pt-3 mt-3">
            <div className="flex justify-between items-center pt-4 border-t border-rule">
              <span className="text-base font-bold text-ink">{t('total')}</span>
              <span className="text-lg font-bold text-primary">{formatPrice(total, locale)}</span>
            </div>
            {isDepositRequired && (
              <div className="flex justify-between items-center pt-2 mt-2 border-t border-dashed border-rule text-orange-600">
                <span className="text-sm font-semibold">Cần thanh toán cọc trước:</span>
                <span className="text-sm font-bold">{formatPrice(50000, locale)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
