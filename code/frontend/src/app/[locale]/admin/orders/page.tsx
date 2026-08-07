'use client';

import { useTranslations, useLocale } from 'next-intl';
import { BaseInput } from '@/components/base';
import { Search, Eye, CheckCircle2, Clock } from '@/components/base/icons';
import { formatPrice } from '@/utils/format';

export default function AdminOrdersPage() {
  const t = useTranslations('admin.orders');
  const tOrder = useTranslations('order');
  const locale = useLocale();

  const mockOrders = [
    {
      id: 'ORD-240720',
      customer: 'Nguyễn Văn A',
      email: 'a@gmail.com',
      total: 29590000,
      status: 'pending',
      payment: 'cod',
      date: '20/07/2026',
    },
    {
      id: 'ORD-240719',
      customer: 'Trần Thị B',
      email: 'b@gmail.com',
      total: 51980000,
      status: 'delivering',
      payment: 'vnpay',
      date: '19/07/2026',
    },
    {
      id: 'ORD-240718',
      customer: 'Lê Văn C',
      email: 'c@gmail.com',
      total: 5990000,
      status: 'completed',
      payment: 'cod',
      date: '18/07/2026',
    },
    {
      id: 'ORD-240717',
      customer: 'Phạm Thị D',
      email: 'd@gmail.com',
      total: 31990000,
      status: 'confirmed',
      payment: 'vnpay',
      date: '17/07/2026',
    },
    {
      id: 'ORD-240716',
      customer: 'Hoàng Văn E',
      email: 'e@gmail.com',
      total: 19990000,
      status: 'pending_payment',
      payment: 'vnpay',
      date: '16/07/2026',
    },
    {
      id: 'ORD-240715',
      customer: 'Đỗ Thị F',
      email: 'f@gmail.com',
      total: 27990000,
      status: 'cancelled',
      payment: 'cod',
      date: '15/07/2026',
    },
  ];

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    pending_payment: 'bg-orange-100 text-orange-800',
    confirmed: 'bg-blue-100 text-blue-800',
    delivering: 'bg-cyan-100 text-cyan-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-ink mb-8">{t('title')}</h1>

      {/* Search */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-2" />
          <BaseInput placeholder={t('searchPlaceholder')} className="pl-10" />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-rule overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-2 border-b border-rule bg-paper-2">
                <th className="px-5 py-3 font-medium">{t('orderId')}</th>
                <th className="px-5 py-3 font-medium">{t('customer')}</th>
                <th className="px-5 py-3 font-medium">{t('total')}</th>
                <th className="px-5 py-3 font-medium">{t('payment')}</th>
                <th className="px-5 py-3 font-medium">{t('status')}</th>
                <th className="px-5 py-3 font-medium">{t('date')}</th>
                <th className="px-5 py-3 font-medium">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {mockOrders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-rule last:border-0 hover:bg-paper-2 transition-colors"
                >
                  <td className="px-5 py-3 font-semibold text-ink">{order.id}</td>
                  <td className="px-5 py-3">
                    <div>
                      <p className="font-medium text-ink">{order.customer}</p>
                      <p className="text-xs text-ink-2">{order.email}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3 font-semibold text-ink">
                    {formatPrice(order.total, locale)}
                  </td>
                  <td className="px-5 py-3 text-ink-2 uppercase text-xs font-semibold">
                    {order.payment}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}
                    >
                      {tOrder(`statusLabels.${order.status}` as Parameters<typeof tOrder>[0])}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-ink-2 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {order.date}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        className="p-1.5 rounded-lg hover:bg-paper-2 text-ink-2 hover:text-primary transition-colors"
                        title={t('viewDetail')}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {order.status === 'pending' && (
                        <button
                          className="p-1.5 rounded-lg hover:bg-green-50 text-ink-2 hover:text-green-600 transition-colors"
                          title={t('approve')}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
