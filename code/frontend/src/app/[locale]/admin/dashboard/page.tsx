'use client';

import { useLocale, useTranslations } from 'next-intl';
import { TrendingUp, ShoppingBag, Package, Users, Clock, RotateCw } from '@/components/base/icons';
import { formatPrice } from '@/utils/format';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { dashboardService } from '@/services/dashboard-service';
import { DashboardStats } from '@/types/dashboard';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  pending_payment: 'bg-orange-100 text-orange-800 border-orange-200',
  delivering: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  handed_over: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
};

export default function AdminDashboardPage() {
  const locale = useLocale();
  const t = useTranslations('admin.dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const data = await dashboardService.getStats(isRefresh);
      setStats(data);
    } catch (err: unknown) {
      console.error('Failed to load dashboard stats', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const statCards = [
    ...(stats?.revenue !== null && stats?.revenue !== undefined
      ? [
          {
            key: 'revenue',
            title: t('revenue'),
            value: formatPrice(stats.revenue, locale),
            icon: TrendingUp,
            color: 'from-green-500 to-emerald-600',
          },
        ]
      : []),
    {
      key: 'totalOrders',
      title: t('totalOrders'),
      value: stats ? stats.totalOrders.toLocaleString('vi-VN') : '0',
      icon: Package,
      color: 'from-blue-500 to-indigo-600',
    },
    ...(stats?.totalUsers !== null && stats?.totalUsers !== undefined
      ? [
          {
            key: 'totalUsers',
            title: t('totalUsers'),
            value: stats.totalUsers.toLocaleString('vi-VN'),
            icon: Users,
            color: 'from-purple-500 to-violet-600',
          },
        ]
      : []),
    {
      key: 'totalProducts',
      title: t('totalProducts'),
      value: stats ? stats.totalProducts.toLocaleString('vi-VN') : '0',
      icon: ShoppingBag,
      color: 'from-orange-500 to-red-500',
    },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-ink">{t('title')}</h1>
          <p className="text-sm text-ink-2 mt-1">
            Tổng quan chỉ số hoạt động kinh doanh và vận hành
          </p>
        </div>
        <button
          onClick={() => fetchStats(true)}
          disabled={refreshing || loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-rule bg-white hover:bg-paper-2 text-sm font-medium text-ink transition-colors disabled:opacity-50 shadow-sm"
        >
          <RotateCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div
            key={card.key}
            className="bg-white rounded-2xl border border-rule p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-ink-2">{card.title}</span>
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-sm`}
              >
                <card.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            {loading ? (
              <div className="h-8 bg-paper-2 animate-pulse rounded w-24 my-1" />
            ) : (
              <p className="text-2xl font-bold text-ink">{card.value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Order Status Distribution */}
      {stats?.orderStatusCounts && (
        <div className="bg-white rounded-2xl border border-rule p-6 mb-8 shadow-sm">
          <h3 className="font-bold text-ink mb-4">Thống kê đơn hàng theo trạng thái</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(stats.orderStatusCounts).map(([status, count]) => {
              const color =
                STATUS_COLORS[status.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
              return (
                <div
                  key={status}
                  className={`p-3 rounded-xl border ${color} flex flex-col items-center justify-center text-center`}
                >
                  <span className="text-xs font-semibold uppercase tracking-wider mb-1">
                    {status.replace('_', ' ')}
                  </span>
                  <span className="text-xl font-bold">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-rule overflow-hidden shadow-sm">
        <div className="flex items-center justify-between p-5 border-b border-rule bg-paper-2/50">
          <div>
            <h3 className="font-bold text-ink">{t('recentOrders')}</h3>
            <p className="text-xs text-ink-2">5 đơn hàng gần nhất trong hệ thống</p>
          </div>
          <Link href="/admin/orders" className="text-sm text-primary hover:underline font-medium">
            {t('viewAll')}
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-2 border-b border-rule font-medium">
                <th className="px-5 py-3.5">Mã đơn</th>
                <th className="px-5 py-3.5">Khách hàng</th>
                <th className="px-5 py-3.5">Tổng tiền</th>
                <th className="px-5 py-3.5">Trạng thái</th>
                <th className="px-5 py-3.5">Ngày đặt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-ink-2">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : !stats?.recentOrders || stats.recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-ink-2">
                    Chưa có đơn hàng nào
                  </td>
                </tr>
              ) : (
                stats.recentOrders.map((order) => {
                  const statusKey = order.status.toLowerCase();
                  const statusColor =
                    STATUS_COLORS[statusKey] || 'bg-gray-100 text-gray-800 border-gray-200';
                  return (
                    <tr key={order.id} className="hover:bg-paper-2/50 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-ink">
                        #{order.id.slice(-8).toUpperCase()}
                      </td>
                      <td className="px-5 py-3.5 text-ink">
                        <p className="font-medium">{order.user?.fullName || 'Khách vãng lai'}</p>
                        <p className="text-xs text-ink-2">{order.user?.email || '-'}</p>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-ink">
                        {formatPrice(order.totalAmount, locale)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusColor}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-ink-2 text-xs flex items-center gap-1 mt-1">
                        <Clock className="w-3.5 h-3.5 text-ink-3" />
                        {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
