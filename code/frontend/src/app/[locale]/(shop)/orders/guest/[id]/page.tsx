'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Package, Truck, CheckCircle2, Clock, ChevronRight } from '@/components/base/icons';
import { BaseButton } from '@/components/base';
import Link from 'next/link';
import { formatPrice } from '@/utils/format';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { orderService } from '@/services/order-service';
import toast from 'react-hot-toast';

export default function GuestOrderDetailPage({ params }: { params: { id: string } }) {
  const locale = useLocale();
  const t = useTranslations('order');
  const tCommon = useTranslations('common');

  const searchParams = useSearchParams();
  const phone = searchParams.get('phone');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (phone) {
      fetchOrder();
    } else {
      toast.error('Thiếu thông tin số điện thoại');
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, phone]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const data = await orderService.getGuestOrderById(params.id, phone!);
      setOrder(data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không tìm thấy đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handlePayAgain = async () => {
    try {
      await orderService.payAgainGuest(params.id, phone!);
      toast.success('Đã gửi yêu cầu thanh toán lại');
      fetchOrder();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi thanh toán');
    }
  };

  const trackingSteps = [
    {
      key: 'pending',
      label: t('statusLabels.pending' as Parameters<typeof t>[0]),
      done: order?.status !== 'CANCELLED',
      icon: Clock,
    },
    {
      key: 'confirmed',
      label: t('statusLabels.confirmed' as Parameters<typeof t>[0]),
      done: order?.status === 'SHIPPED' || order?.status === 'DELIVERED',
      icon: CheckCircle2,
    },
    {
      key: 'delivering',
      label: t('statusLabels.delivering' as Parameters<typeof t>[0]),
      done: order?.status === 'SHIPPED' || order?.status === 'DELIVERED',
      icon: Truck,
    },
    {
      key: 'completed',
      label: t('statusLabels.completed' as Parameters<typeof t>[0]),
      done: order?.status === 'DELIVERED',
      icon: Package,
    },
  ];

  if (loading) {
    return <div className="text-center p-8">Đang tải...</div>;
  }

  if (!order) {
    return (
      <div className="text-center p-8">
        Không tìm thấy đơn hàng.{' '}
        <Link href="/orders/lookup" className="text-primary hover:underline">
          Thử lại
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
          Tra cứu đơn
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-ink font-medium">{order.id}</span>
      </nav>

      <h1 className="text-2xl font-bold text-ink mb-2">Chi tiết đơn hàng (Khách)</h1>
      <p className="text-ink-2 text-sm mb-8">
        {t('orderId')}: <span className="font-semibold text-ink">{order.id}</span>
      </p>

      {/* Tracking Timeline */}
      <div className="bg-white border border-rule rounded-xl p-6 mb-6">
        <h3 className="font-bold text-ink mb-6">{t('trackOrder')}</h3>
        <div className="flex items-center justify-between">
          {trackingSteps.map((step, idx) => (
            <div key={step.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step.done ? 'bg-primary text-white' : 'bg-paper-2 text-ink-2'
                  }`}
                >
                  <step.icon className="w-5 h-5" />
                </div>
                <span
                  className={`text-xs mt-2 text-center ${step.done ? 'text-primary font-semibold' : 'text-ink-2'}`}
                >
                  {step.label}
                </span>
              </div>
              {idx < trackingSteps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${step.done ? 'bg-primary' : 'bg-rule'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Shipping Info */}
        <div className="bg-white border border-rule rounded-xl p-6">
          <h3 className="font-bold text-ink mb-4">{t('shippingInfo')}</h3>
          <div className="space-y-2 text-sm text-ink-2">
            <p>
              <span className="font-medium text-ink">{order.shippingName}</span>
            </p>
            <p>{order.shippingPhone}</p>
            <p>{order.shippingAddress}</p>
          </div>
        </div>

        {/* Payment Info */}
        <div className="bg-white border border-rule rounded-xl p-6">
          <h3 className="font-bold text-ink mb-4">{t('paymentInfo')}</h3>
          <div className="space-y-2 text-sm text-ink-2">
            <p>
              {order.paymentMethod} - Trạng thái: {order.status}
            </p>
            <div className="flex justify-between items-center py-4 border-t border-rule mt-4">
              <span className="text-lg font-bold text-ink">{t('total')}</span>
              <p className="text-lg font-bold text-primary">
                {formatPrice(order.totalAmount, locale)}
              </p>
            </div>
            {(order.status === 'PENDING_PAYMENT' || order.status === 'CANCELLED') && (
              <BaseButton onClick={handlePayAgain} className="w-full mt-4">
                Thanh toán lại
              </BaseButton>
            )}
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white border border-rule rounded-xl p-6 mb-6">
        <h3 className="font-bold text-ink mb-4">{t('items')}</h3>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {order.items?.map((item: any, idx: number) => (
          <div
            key={idx}
            className="flex items-center gap-4 py-3 border-b border-rule last:border-0"
          >
            <div className="w-16 h-16 bg-paper-2 rounded-lg flex-shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-ink">{item.product?.name || 'Sản phẩm'}</h4>
                <span className="font-semibold text-ink">
                  {formatPrice(item.unitPrice, locale)}
                </span>
              </div>
              <p className="text-sm text-ink-2">x{item.quantity}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
