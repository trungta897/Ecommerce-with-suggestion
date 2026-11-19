'use client';

import { useLocale, useTranslations } from 'next-intl';
import { ChevronRight, Loader2, AlertCircle } from '@/components/base/icons';
import { BaseButton, BaseModal } from '@/components/base';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import {
  ReturnModal,
  OrderStatusTimeline,
  LiveTrackingBadge,
  OrderShippingInfo,
  OrderPricingSummary,
  OrderItemsSummary,
} from '@/components/features/orders';
import { orderService } from '@/services/order-service';
import { Order, OrderStatus } from '@/types/order';
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABEL_KEY, isOrderStatus } from '@/constants/order';
import { useRepayOrder } from '@/hooks/use-repay-order';
import { canRepayOrder } from '@/utils/order-payment';
import { getApiErrorMessage } from '@/utils/get-api-error-message';
import toast from 'react-hot-toast';

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const locale = useLocale();
  const t = useTranslations('order');
  const tCommon = useTranslations('common');

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      const data = await orderService.getOrderById(params.id);
      setOrder(data);
    } catch (err: unknown) {
      console.error(err);
      toast.error(getApiErrorMessage(err) ?? t('orderNotFoundToast'));
    } finally {
      setLoading(false);
    }
  }, [params.id, t]);

  const { isRepaying, handleRepay } = useRepayOrder({
    onRefetch: fetchOrder,
  });

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Realtime Server-Sent Events (SSE) tracking
  useEffect(() => {
    if (!order?.id) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const eventSource = new EventSource(`${apiUrl}/orders/${params.id}/tracking`, {
      withCredentials: true,
    });

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
  }, [order?.id, params.id, fetchOrder, t]);

  const handleCancelOrder = async () => {
    try {
      setCancelling(true);
      await orderService.cancelOrder(params.id);
      toast.success(t('cancelSuccess'));
      setShowCancelModal(false);
      fetchOrder();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err) ?? t('cancelError'));
    } finally {
      setCancelling(false);
    }
  };

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
        <p className="text-ink-2 mb-6">{t('orderNotFoundDesc')}</p>
        <Link href="/orders" className="text-primary font-medium hover:underline">
          {t('backToOrders')}
        </Link>
      </div>
    );
  }

  const formattedDate = new Date(order.createdAt || Date.now()).toLocaleDateString(
    locale === 'vi' ? 'vi-VN' : 'en-US',
    {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }
  );

  const canRepay = canRepayOrder(order);
  const statusUpper = String(order.status || '').toUpperCase();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-ink-2 mb-6">
        <Link href="/" className="hover:text-primary transition-colors">
          {tCommon('home')}
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link href="/orders" className="hover:text-primary transition-colors">
          {t('title')}
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-ink font-medium">{order.id}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink mb-1">{t('orderDetail')}</h1>
          <p className="text-ink-2 text-sm">
            {t('orderId')}: <span className="font-semibold text-ink">{order.id}</span> ·{' '}
            {t('orderDate')}: {formattedDate}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <LiveTrackingBadge />
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${
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
      <OrderStatusTimeline order={order} variant="user" />

      {/* Shipping & Payment Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <OrderShippingInfo order={order} />
        <OrderPricingSummary order={order} locale={locale} />
      </div>

      {/* Items Summary */}
      <OrderItemsSummary
        items={order.items}
        locale={locale}
        canReview={true}
        orderStatus={order.status}
      />

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 justify-end">
        {canRepay && (
          <BaseButton onClick={() => handleRepay(order.id)} disabled={isRepaying} variant="default">
            {isRepaying
              ? t('repaying')
              : statusUpper === OrderStatus.CANCELLED
                ? t('payAgain')
                : t('payNow')}
          </BaseButton>
        )}

        {(statusUpper === OrderStatus.PENDING || statusUpper === OrderStatus.PENDING_PAYMENT) && (
          <BaseButton variant="destructive" onClick={() => setShowCancelModal(true)}>
            {t('cancelOrder')}
          </BaseButton>
        )}

        {statusUpper === OrderStatus.COMPLETED && (
          <BaseButton variant="outline" onClick={() => setIsReturnModalOpen(true)}>
            {t('returnOrder')}
          </BaseButton>
        )}
      </div>

      {/* Cancel Order Confirm Modal */}
      <BaseModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title={t('cancelConfirmTitle')}
      >
        <div className="space-y-4">
          <p className="text-sm text-ink-2">{t('cancelConfirmDesc', { id: order.id })}</p>
          <div className="flex justify-end gap-3 pt-2">
            <BaseButton
              variant="outline"
              onClick={() => setShowCancelModal(false)}
              disabled={cancelling}
            >
              {tCommon('close')}
            </BaseButton>
            <BaseButton variant="destructive" onClick={handleCancelOrder} disabled={cancelling}>
              {cancelling ? t('cancelling') : t('confirmCancel')}
            </BaseButton>
          </div>
        </div>
      </BaseModal>

      {/* Return Modal */}
      <ReturnModal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        orderId={order.id}
        onSuccess={() => {
          fetchOrder();
        }}
      />
    </div>
  );
}
