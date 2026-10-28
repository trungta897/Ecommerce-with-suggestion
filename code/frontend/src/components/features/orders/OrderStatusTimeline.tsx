'use client';

import { useTranslations } from 'next-intl';
import { Package, Truck, CheckCircle2, Clock, XCircle } from '@/components/base/icons';
import { Order, OrderStatus } from '@/types/order';

interface OrderStatusTimelineProps {
  order: Order;
  variant?: 'user' | 'guest';
}

export function LiveTrackingBadge() {
  const t = useTranslations('order');
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium border border-emerald-200">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      <span>{t('liveTracking')}</span>
    </div>
  );
}

export function OrderStatusTimeline({ order, variant = 'user' }: OrderStatusTimelineProps) {
  const t = useTranslations('order');

  const isCancelled =
    order.status === OrderStatus.CANCELLED || order.status === ('cancelled' as OrderStatus);

  const trackingSteps = [
    {
      key: 'pending',
      label: t('statusLabels.pending'),
      done: !isCancelled,
      icon: Clock,
    },
    {
      key: 'confirmed',
      label: t('statusLabels.confirmed'),
      done: [
        'CONFIRMED',
        'HANDED_OVER',
        'DELIVERING',
        'COMPLETED',
        'confirmed',
        'handed_over',
        'delivering',
        'completed',
      ].includes(order.status),
      icon: CheckCircle2,
    },
    {
      key: 'delivering',
      label: t('statusLabels.delivering'),
      done: [
        'HANDED_OVER',
        'DELIVERING',
        'COMPLETED',
        'handed_over',
        'delivering',
        'completed',
      ].includes(order.status),
      icon: Truck,
    },
    {
      key: 'completed',
      label: t('statusLabels.completed'),
      done: ['COMPLETED', 'completed'].includes(order.status),
      icon: Package,
    },
  ];

  if (isCancelled) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6 flex items-center gap-4">
        <XCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
        <div>
          <h3 className="font-bold text-red-800">{t('orderCancelledTitle')}</h3>
          <p className="text-sm text-red-600">
            {variant === 'guest' ? t('orderCancelledGuestDesc') : t('orderCancelledUserDesc')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-rule rounded-xl p-6 mb-6 shadow-sm">
      <h3 className="font-bold text-ink mb-6">{t('trackOrder')}</h3>
      <div className="flex items-center justify-between">
        {trackingSteps.map((step, idx) => (
          <div key={step.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  step.done ? 'bg-primary text-white shadow-sm' : 'bg-paper-2 text-ink-2'
                }`}
              >
                <step.icon className="w-5 h-5" />
              </div>
              <span
                className={`text-xs mt-2 text-center font-medium ${
                  step.done ? 'text-primary' : 'text-ink-2'
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < trackingSteps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 transition-colors ${
                  trackingSteps[idx + 1].done ? 'bg-primary' : 'bg-rule'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {(order.deliveryPartner || order.trackingId) && (
        <div className="mt-6 pt-4 border-t border-rule flex flex-wrap gap-4 text-sm text-ink-2">
          {order.deliveryPartner && (
            <div>
              <span className="font-medium text-ink">{t('deliveryPartnerLabel')}:</span>{' '}
              {order.deliveryPartner}
            </div>
          )}
          {order.trackingId && (
            <div>
              <span className="font-medium text-ink">{t('trackingIdLabel')}:</span>{' '}
              <span className="font-mono font-semibold text-primary">{order.trackingId}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
