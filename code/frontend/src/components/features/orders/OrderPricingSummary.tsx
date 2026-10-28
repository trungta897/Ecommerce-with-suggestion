'use client';

import { useTranslations } from 'next-intl';
import { BaseButton } from '@/components/base';
import { formatPrice } from '@/utils/format';
import { Order, OrderStatus } from '@/types/order';
import { canRepayOrder } from '@/utils/order-payment';

interface OrderPricingSummaryProps {
  order: Order;
  locale: string;
  onPayAgain?: () => void;
  showPayAgainButton?: boolean;
  isRepaying?: boolean;
}

export function OrderPricingSummary({
  order,
  locale,
  onPayAgain,
  showPayAgainButton = false,
  isRepaying = false,
}: OrderPricingSummaryProps) {
  const t = useTranslations('order');

  const canRepay = showPayAgainButton && canRepayOrder(order);
  const isReturnRejected = String(order.status || '').toUpperCase() === OrderStatus.RETURN_REJECTED;

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
        {order.isDepositPayment && Number(order.depositAmount) > 0 && (
          <div className="flex justify-between items-center text-sm text-orange-700 font-medium">
            <span>{t('depositAmountLabel')}</span>
            <span>{formatPrice(Number(order.depositAmount), locale)}</span>
          </div>
        )}
        <div className="flex justify-between items-center py-3 border-t border-rule mt-3">
          <span className="text-lg font-bold text-ink">{t('total')}</span>
          <p className="text-lg font-bold text-primary">{formatPrice(order.totalAmount, locale)}</p>
        </div>

        {isReturnRejected && (
          <div className="p-3 mt-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            <span className="font-semibold">{t('returnRejectedReasonLabel')}: </span>
            <span>{order.returnRejectReason || t('noReasonProvided')}</span>
          </div>
        )}

        {canRepay && onPayAgain && (
          <BaseButton
            onClick={onPayAgain}
            disabled={isRepaying}
            className="w-full mt-4"
            variant="default"
          >
            {isRepaying ? t('repaying') : t('payAgain')}
          </BaseButton>
        )}
      </div>
    </div>
  );
}
