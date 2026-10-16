'use client';

import { useTranslations } from 'next-intl';
import { Order } from '@/types/order';

interface OrderShippingInfoProps {
  order: Order;
}

export function OrderShippingInfo({ order }: OrderShippingInfoProps) {
  const t = useTranslations('order');

  return (
    <div className="bg-white border border-rule rounded-xl p-6 shadow-sm">
      <h3 className="font-bold text-ink mb-4">{t('shippingInfo')}</h3>
      <div className="space-y-2 text-sm text-ink-2">
        <p>
          <span className="font-medium text-ink">{order.shippingName}</span>
        </p>
        <p>{order.shippingPhone}</p>
        <p>{order.shippingAddress}</p>
        {order.deliveryMethod && (
          <p className="pt-2 text-xs text-ink-2">
            {t('methodLabel')}: {order.deliveryMethod}
          </p>
        )}
      </div>
    </div>
  );
}
