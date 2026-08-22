'use client';

import { useLocale, useTranslations } from 'next-intl';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ChevronRight,
  Loader2,
  XCircle,
  AlertCircle,
} from '@/components/base/icons';
import { BaseButton, BaseModal } from '@/components/base';
import Link from 'next/link';
import { formatPrice } from '@/utils/format';
import { useState, useEffect, useCallback } from 'react';
import { ReturnModal } from '@/components/features/orders/ReturnModal';
import { orderService } from '@/services/order-service';
import { Order, OrderStatus } from '@/types/order';
import { ORDER_STATUS_COLORS } from '@/constants/order';
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
      toast.error('Không tìm thấy thông tin đơn hàng');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Realtime Server-Sent Events (SSE) tracking
  useEffect(() => {
    if (!order?.id) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const eventSource = new EventSource(`${apiUrl}/orders/${params.id}/tracking`, {
      withCredentials: true,
    });

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload?.status) {
          toast.success(`Trạng thái đơn hàng đã cập nhật: ${payload.status}`);
          fetchOrder();
        }
      } catch (e) {
        console.error('Failed to parse SSE payload', e);
      }
    };

    eventSource.onerror = () => {
      // EventSource may close on idle or errors
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [order?.id, params.id, fetchOrder]);

  const handleCancelOrder = async () => {
    try {
      setCancelling(true);
      await orderService.cancelOrder(params.id);
      toast.success('Hủy đơn hàng thành công');
      setShowCancelModal(false);
      fetchOrder();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Lỗi khi hủy đơn hàng');
    } finally {
      setCancelling(false);
    }
  };

  const handlePayAgain = async () => {
    try {
      await orderService.payAgain(params.id);
      toast.success('Đang chuyển hướng đến cổng thanh toán...');
      fetchOrder();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Lỗi khi thanh toán lại');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
        <p className="text-ink-2">Đang tải thông tin đơn hàng...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-ink mb-2">Không tìm thấy đơn hàng</h2>
        <p className="text-ink-2 mb-6">
          Đơn hàng không tồn tại hoặc bạn không có quyền xem đơn hàng này.
        </p>
        <Link href="/orders" className="text-primary font-medium hover:underline">
          Quay lại danh sách đơn hàng
        </Link>
      </div>
    );
  }

  const statusKey = order.status.toLowerCase();
  const isCancelled =
    order.status === OrderStatus.CANCELLED || order.status === ('cancelled' as OrderStatus);

  const trackingSteps = [
    {
      key: 'pending',
      label: t('statusLabels.pending' as Parameters<typeof t>[0]),
      done: !isCancelled,
      icon: Clock,
    },
    {
      key: 'confirmed',
      label: t('statusLabels.confirmed' as Parameters<typeof t>[0]),
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
      label: t('statusLabels.delivering' as Parameters<typeof t>[0]),
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
      label: t('statusLabels.completed' as Parameters<typeof t>[0]),
      done: ['COMPLETED', 'completed'].includes(order.status),
      icon: Package,
    },
  ];

  const formattedDate = new Date(
    (order as unknown as { createdAt: string }).createdAt || Date.now()
  ).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink mb-1">{t('orderDetail')}</h1>
          <p className="text-ink-2 text-sm">
            {t('orderId')}: <span className="font-semibold text-ink">{order.id}</span> ·{' '}
            {t('orderDate')}: {formattedDate}
          </p>
        </div>

        <div>
          <span
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border ${
              ORDER_STATUS_COLORS[order.status] ||
              ORDER_STATUS_COLORS[statusKey] ||
              'bg-gray-100 text-gray-800 border-gray-200'
            }`}
          >
            {t(`statusLabels.${statusKey}` as Parameters<typeof t>[0])}
          </span>
        </div>
      </div>

      {/* Tracking Timeline */}
      {isCancelled ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6 flex items-center gap-4">
          <XCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-red-800">Đơn hàng đã bị hủy</h3>
            <p className="text-sm text-red-600">
              Đơn hàng này đã kết thúc và tồn kho đã được hoàn trả.
            </p>
          </div>
        </div>
      ) : (
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
                    className={`text-xs mt-2 text-center font-medium ${step.done ? 'text-primary' : 'text-ink-2'}`}
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
                  <span className="font-medium text-ink">Đơn vị vận chuyển:</span>{' '}
                  {order.deliveryPartner}
                </div>
              )}
              {order.trackingId && (
                <div>
                  <span className="font-medium text-ink">Mã vận đơn:</span>{' '}
                  <span className="font-mono font-semibold text-primary">{order.trackingId}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Shipping Info */}
        <div className="bg-white border border-rule rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-ink mb-4">{t('shippingInfo')}</h3>
          <div className="space-y-2 text-sm text-ink-2">
            <p>
              <span className="font-medium text-ink">{order.shippingName}</span>
            </p>
            <p>{order.shippingPhone}</p>
            <p>{order.shippingAddress}</p>
            {order.deliveryMethod && (
              <p className="pt-2 text-xs text-ink-2">Phương thức: {order.deliveryMethod}</p>
            )}
          </div>
        </div>

        {/* Payment Info */}
        <div className="bg-white border border-rule rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-ink mb-4">{t('paymentInfo')}</h3>
          <div className="space-y-2 text-sm text-ink-2">
            <p>
              Phương thức:{' '}
              <span className="font-semibold uppercase text-ink">{order.paymentMethod}</span>
            </p>
            {order.shippingFee > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span>Phí vận chuyển</span>
                <span>{formatPrice(order.shippingFee, locale)}</span>
              </div>
            )}
            {order.discountAmount > 0 && (
              <div className="flex justify-between items-center text-sm text-green-600">
                <span>Giảm giá</span>
                <span>-{formatPrice(order.discountAmount, locale)}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-3 border-t border-rule mt-3">
              <span className="text-lg font-bold text-ink">{t('total')}</span>
              <p className="text-lg font-bold text-primary">
                {formatPrice(order.totalAmount, locale)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white border border-rule rounded-xl p-6 mb-6 shadow-sm">
        <h3 className="font-bold text-ink mb-4">{t('items')}</h3>
        <div className="divide-y divide-rule">
          {order.items?.map((item) => (
            <div key={item.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
              <div className="w-16 h-16 bg-paper-2 rounded-lg flex-shrink-0 flex items-center justify-center">
                <Package className="w-6 h-6 text-ink-2" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-semibold text-ink truncate pr-2">
                    {item.product?.name || 'Sản phẩm'}
                  </h4>
                  <span className="font-semibold text-ink whitespace-nowrap">
                    {formatPrice(item.unitPrice, locale)}
                  </span>
                </div>
                <p className="text-sm text-ink-2">Số lượng: x{item.quantity}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 justify-end">
        {order.status === ('PENDING_PAYMENT' as OrderStatus) && (
          <BaseButton onClick={handlePayAgain} variant="default">
            Thanh toán ngay
          </BaseButton>
        )}

        {(order.status === OrderStatus.PENDING ||
          order.status === OrderStatus.PENDING_PAYMENT ||
          order.status === ('pending' as OrderStatus) ||
          order.status === ('pending_payment' as OrderStatus)) && (
          <BaseButton variant="destructive" onClick={() => setShowCancelModal(true)}>
            {t('cancelOrder')}
          </BaseButton>
        )}

        {(order.status === OrderStatus.COMPLETED ||
          order.status === ('completed' as OrderStatus)) && (
          <BaseButton variant="outline" onClick={() => setIsReturnModalOpen(true)}>
            {t('returnOrder')}
          </BaseButton>
        )}
      </div>

      {/* Cancel Order Confirm Modal */}
      <BaseModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Xác nhận hủy đơn hàng"
      >
        <div className="space-y-4">
          <p className="text-sm text-ink-2">
            Bạn có chắc chắn muốn hủy đơn hàng <strong>{order.id}</strong> không? Thao tác này sẽ
            hoàn trả lại tồn kho và không thể hoàn tác.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <BaseButton
              variant="outline"
              onClick={() => setShowCancelModal(false)}
              disabled={cancelling}
            >
              Đóng
            </BaseButton>
            <BaseButton variant="destructive" onClick={handleCancelOrder} disabled={cancelling}>
              {cancelling ? 'Đang hủy...' : 'Xác nhận hủy'}
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
