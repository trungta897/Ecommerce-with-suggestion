import { useTranslations } from 'next-intl';
import { Package, Truck, CheckCircle2, Clock, ChevronRight } from '@/components/base/icons';
import { BaseButton } from '@/components/base';
import Link from 'next/link';

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const t = useTranslations('order');
  const tCommon = useTranslations('common');

  const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN').format(price) + '₫';

  // Mock order data
  const order = {
    id: params.id,
    date: '20/07/2026',
    status: 'delivering',
    total: 29590000,
    shippingFee: 30000,
    paymentMethod: 'cod',
    shippingName: 'Nguyễn Văn A',
    shippingPhone: '0900 000 000',
    shippingAddress: '123 Đường ABC, Quận 1, TP.HCM',
    items: [{ name: 'iPhone 15 Pro Max 256GB', quantity: 1, price: 29590000 }],
  };

  const trackingSteps = [
    {
      key: 'pending',
      label: t('statusLabels.pending' as Parameters<typeof t>[0]),
      done: true,
      icon: Clock,
    },
    {
      key: 'confirmed',
      label: t('statusLabels.confirmed' as Parameters<typeof t>[0]),
      done: true,
      icon: CheckCircle2,
    },
    {
      key: 'delivering',
      label: t('statusLabels.delivering' as Parameters<typeof t>[0]),
      done: true,
      icon: Truck,
    },
    {
      key: 'completed',
      label: t('statusLabels.completed' as Parameters<typeof t>[0]),
      done: false,
      icon: Package,
    },
  ];

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

      <h1 className="text-2xl font-bold text-ink mb-2">{t('orderDetail')}</h1>
      <p className="text-ink-2 text-sm mb-8">
        {t('orderId')}: <span className="font-semibold text-ink">{order.id}</span> ·{' '}
        {t('orderDate')}: {order.date}
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
            <p>{order.paymentMethod === 'cod' ? 'COD' : 'VNPay'}</p>
            <p className="text-lg font-bold text-primary">{formatPrice(order.total)}</p>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white border border-rule rounded-xl p-6 mb-6">
        <h3 className="font-bold text-ink mb-4">{t('items')}</h3>
        {order.items.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center gap-4 py-3 border-b border-rule last:border-0"
          >
            <div className="w-16 h-16 bg-paper-2 rounded-lg flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-ink">{item.name}</p>
              <p className="text-sm text-ink-2">x{item.quantity}</p>
            </div>
            <span className="font-semibold text-ink">{formatPrice(item.price)}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {order.status === 'completed' && (
          <BaseButton variant="outline">{t('returnOrder')}</BaseButton>
        )}
        {(order.status === 'pending' || order.status === 'pending_payment') && (
          <BaseButton variant="destructive">{t('cancelOrder')}</BaseButton>
        )}
      </div>
    </div>
  );
}
