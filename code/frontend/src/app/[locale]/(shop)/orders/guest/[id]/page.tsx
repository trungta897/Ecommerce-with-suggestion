'use client';

import { useLocale, useTranslations } from 'next-intl';
import { ChevronRight, Loader2, AlertCircle } from '@/components/base/icons';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  OrderStatusTimeline,
  LiveTrackingBadge,
  OrderShippingInfo,
  OrderPricingSummary,
  OrderItemsSummary,
} from '@/components/features/orders';
import { orderService } from '@/services/order-service';
import { Order } from '@/types/order';
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABEL_KEY, isOrderStatus } from '@/constants/order';
import { useRepayOrder } from '@/hooks/use-repay-order';
import { getApiErrorMessage } from '@/utils/get-api-error-message';
import toast from 'react-hot-toast';

export default function GuestOrderDetailPage({ params }: { params: { id: string } }) {
  const locale = useLocale();
  const t = useTranslations('order');
  const tCommon = useTranslations('common');

  const searchParams = useSearchParams();
  const phone = searchParams.get('phone');

  const [order, setOrder] = useState<Order | null>(null);
  const [trackingToken, setTrackingToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = useCallback(async () => {
    if (!phone) {
      toast.error(t('lookupPhoneRequired'));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await orderService.getGuestOrderById(params.id, phone);
      setOrder(data);
      if (data.trackingToken) {
        setTrackingToken(data.trackingToken);
      }
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err) ?? t('orderNotFoundToast'));
    } finally {
      setLoading(false);
    }
  }, [params.id, phone, t]);

  const { isRepaying, handleRepay } = useRepayOrder({
    guestPhone: phone,
    onRefetch: fetchOrder,
  });

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Realtime Server-Sent Events (SSE) tracking using GuestTrackingToken
  useEffect(() => {
    if (!trackingToken || !order?.id) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const eventSource = new EventSource(
      `${apiUrl}/orders/guest/${params.id}/tracking?token=${encodeURIComponent(trackingToken)}`
    );

    eventSource.onmessage = (event) => {
      try {
        const payload: { status?: unknown } = JSON.parse(event.data);
        const rawStatus = payload?.status;
        if (typeof rawStatus === 'string') {
          const statusText = isOrderStatus(rawStatus)
            ? t(`statusLabels.${ORDER_STATUS_LABEL_KEY[rawStatus]}`)
            : rawStatus;
          toast.success(t('orderStatusUpdated', { status: statusText }));
          fetchOrder();
        }
      } catch (e) {
        console.error('Failed to parse SSE payload', e);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [trackingToken, order?.id, params.id, fetchOrder, t]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
        <p className="text-ink-2">{t('loadingOrder')}</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-ink mb-2">{t('orderNotFound')}</h2>
        <p className="text-ink-2 mb-6">{t('guestLookupNotFoundDesc')}</p>
        <Link
          href="/orders/lookup"
          className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
        >
          {t('tryLookupAgain')}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-ink-2 mb-6">
        <Link href="/" className="hover:text-primary transition-colors">
          {tCommon('home')}
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link href="/orders/lookup" className="hover:text-primary transition-colors">
          {t('lookup')}
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-ink font-medium">{order.id}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink mb-1">{t('orderDetail')}</h1>
          <p className="text-ink-2 text-sm">
            {t('orderId')}: <span className="font-semibold text-ink">{order.id}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <LiveTrackingBadge />
          <span
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border ${
              ORDER_STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800 border-gray-200'
            }`}
          >
            {isOrderStatus(order.status)
              ? t(`statusLabels.${ORDER_STATUS_LABEL_KEY[order.status]}`)
              : order.status}
          </span>
        </div>
      </div>

      {/* Tracking Timeline */}
      <OrderStatusTimeline order={order} variant="guest" />

      {/* Shipping & Payment Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <OrderShippingInfo order={order} />
        <OrderPricingSummary
          order={order}
          locale={locale}
          showPayAgainButton={true}
          isRepaying={isRepaying}
          onPayAgain={() => handleRepay(order.id)}
        />
      </div>

      {/* Items Summary */}
      <OrderItemsSummary
        items={order.items}
        locale={locale}
        canReview={false}
        orderStatus={order.status}
      />
    </div>
  );
}
