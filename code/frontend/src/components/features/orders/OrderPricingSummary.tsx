'use client';

import { useTranslations } from 'next-intl';
import { BaseButton } from '@/components/base';
import { formatPrice } from '@/utils/format';
import { Order, OrderStatus } from '@/types/order';

interface OrderPricingSummaryProps {
  order: Order;
  locale: string;
  onPayAgain?: () => void;
  showPayAgainButton?: boolean;
}

export function OrderPricingSummary({
  order,
  locale,
  onPayAgain,
  showPayAgainButton = false,
}: OrderPricingSummaryProps) {
  const t = useTranslations('order');

  const canRepay =
    showPayAgainButton &&
    (order.status === ('PENDING_PAYMENT' as OrderStatus) ||
      order.status === ('pending_payment' as OrderStatus));

  return (
    <div className="bg-white border border-rule rounded-xl p-6 shadow-sm">
      <h3 className="font-bold text-ink mb-4">{t('paymentInfo')}</h3>
      <div className="space-y-2 text-sm text-ink-2">
        <p>
          {t('methodLabel')}:{' '}
          <span className="font-semibold uppercase text-ink">{order.paymentMethod}</span>
        </p>
        {order.shippingFee > 0 && (
          <div className="flex justify-between items-center text-sm">
            <span>{t('shippingFeeLabel')}</span>
            <span>{formatPrice(order.shippingFee, locale)}</span>
          </div>
        )}
        {order.discountAmount > 0 && (
          <div className="flex justify-between items-center text-sm text-green-600">
            <span>{t('discountLabel')}</span>
            <span>-{formatPrice(order.discountAmount, locale)}</span>
          </div>
        )}
        <div className="flex justify-between items-center py-3 border-t border-rule mt-3">
          <span className="text-lg font-bold text-ink">{t('total')}</span>
          <p className="text-lg font-bold text-primary">{formatPrice(order.totalAmount, locale)}</p>
        </div>

        {canRepay && onPayAgain && (
          <BaseButton onClick={onPayAgain} className="w-full mt-4" variant="default">
            {t('payAgain')}
          </BaseButton>
        )}
      </div>
    </div>
  );
}
