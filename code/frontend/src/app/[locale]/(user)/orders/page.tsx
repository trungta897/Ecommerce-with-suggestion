import { useTranslations } from 'next-intl';
import { Package, Clock } from '@/components/base/icons';
import Link from 'next/link';

export default function OrderHistoryPage() {
  const t = useTranslations('order');

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    pending_payment: 'bg-orange-100 text-orange-800',
    confirmed: 'bg-blue-100 text-blue-800',
    handed_over: 'bg-indigo-100 text-indigo-800',
    delivering: 'bg-cyan-100 text-cyan-800',
    completed: 'bg-green-100 text-green-800',
    return_requested: 'bg-purple-100 text-purple-800',
    returned: 'bg-gray-100 text-gray-800',
    refunded: 'bg-teal-100 text-teal-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  // Mock orders
  const mockOrders = [
    { id: 'ORD-240701', date: '01/07/2026', status: 'completed', total: 29590000, items: 1 },
    { id: 'ORD-240715', date: '15/07/2026', status: 'delivering', total: 51980000, items: 2 },
    { id: 'ORD-240720', date: '20/07/2026', status: 'pending', total: 5990000, items: 1 },
  ];

  const tabs = ['allOrders', 'pending', 'delivering', 'completed', 'cancelled'] as const;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-ink mb-6">{t('title')}</h1>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab}
            className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors bg-paper-2 text-ink-2 hover:bg-primary/10 hover:text-primary first:bg-primary first:text-white"
          >
            {tab === 'allOrders'
              ? t('allOrders')
              : t(`statusLabels.${tab}` as Parameters<typeof t>[0])}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {mockOrders.map((order) => (
          <Link key={order.id} href={`/orders/${order.id}`} className="block">
            <div className="bg-white border border-rule rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-paper-2 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-ink-2" />
                  </div>
                  <div>
                    <p className="font-semibold text-ink">{order.id}</p>
                    <div className="flex items-center gap-2 text-xs text-ink-2">
                      <Clock className="w-3 h-3" />
                      <span>{order.date}</span>
                      <span>·</span>
                      <span>
                        {order.items} {t('items')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}
                  >
                    {t(`statusLabels.${order.status}` as Parameters<typeof t>[0])}
                  </span>
                  <span className="text-lg font-bold text-primary">
                    {new Intl.NumberFormat('vi-VN').format(order.total)}₫
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
