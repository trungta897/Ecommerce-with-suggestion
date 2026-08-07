'use client';

import { useLocale, useTranslations } from 'next-intl';
import { TrendingUp, ShoppingBag, Package, Users, Clock } from '@/components/base/icons';
import { formatPrice } from '@/utils/format';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const locale = useLocale();
  const t = useTranslations('admin.dashboard');

  const stats = [
    {
      key: 'revenue',
      value: formatPrice(245800000, locale),
      change: '+12.5%',
      icon: TrendingUp,
      color: 'from-green-500 to-emerald-600',
    },
    {
      key: 'totalOrders',
      value: '156',
      change: '+8.2%',
      icon: Package,
      color: 'from-blue-500 to-indigo-600',
    },
    {
      key: 'totalUsers',
      value: '2,340',
      change: '+15.3%',
      icon: Users,
      color: 'from-purple-500 to-violet-600',
    },
    {
      key: 'totalProducts',
      value: '89',
      change: '+2.1%',
      icon: ShoppingBag,
      color: 'from-orange-500 to-red-500',
    },
  ];

  const recentOrders = [
    {
      id: 'ORD-240720',
      customer: 'Nguyễn Văn A',
      total: 29590000,
      status: 'pending',
      date: '20/07',
    },
    {
      id: 'ORD-240719',
      customer: 'Trần Thị B',
      total: 51980000,
      status: 'delivering',
      date: '19/07',
    },
    { id: 'ORD-240718', customer: 'Lê Văn C', total: 5990000, status: 'completed', date: '18/07' },
    {
      id: 'ORD-240717',
      customer: 'Phạm Thị D',
      total: 31990000,
      status: 'confirmed',
      date: '17/07',
    },
    {
      id: 'ORD-240716',
      customer: 'Hoàng Văn E',
      total: 19990000,
      status: 'completed',
      date: '16/07',
    },
  ];

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    delivering: 'bg-cyan-100 text-cyan-800',
    completed: 'bg-green-100 text-green-800',
    confirmed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-ink">{t('title')}</h1>
        <span className="text-sm text-ink-2">{t('thisMonth')}</span>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.key}
            className="bg-white rounded-xl border border-rule p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-ink-2">
                {t(stat.key as Parameters<typeof t>[0])}
              </span>
              <div
                className={`w-9 h-9 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}
              >
                <stat.icon className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-ink">{stat.value}</p>
            <span className="text-xs font-semibold text-green-600">{stat.change}</span>
          </div>
        ))}
      </div>

      {/* AI Insights */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl p-6 mb-8">
        <h3 className="font-bold mb-2 text-lg">{t('insights')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <p className="text-sm text-white/80">Top Category</p>
            <p className="text-xl font-bold">Điện thoại</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <p className="text-sm text-white/80">Conversion Rate</p>
            <p className="text-xl font-bold">4.8%</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <p className="text-sm text-white/80">Avg. Order Value</p>
            <p className="text-xl font-bold">{formatPrice(1575000, locale)}</p>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl border border-rule">
        <div className="flex items-center justify-between p-5 border-b border-rule">
          <h3 className="font-bold text-ink">{t('recentOrders')}</h3>
          <Link href="/admin/orders" className="text-sm text-primary hover:underline font-medium">
            {t('viewAll')}
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-2 border-b border-rule">
                <th className="px-5 py-3 font-medium">ID</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-rule last:border-0 hover:bg-paper-2 transition-colors"
                >
                  <td className="px-5 py-3 font-semibold text-ink">{order.id}</td>
                  <td className="px-5 py-3 text-ink-2">{order.customer}</td>
                  <td className="px-5 py-3 font-semibold text-ink">
                    {formatPrice(order.total, locale)}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[order.status]}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-ink-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {order.date}
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
