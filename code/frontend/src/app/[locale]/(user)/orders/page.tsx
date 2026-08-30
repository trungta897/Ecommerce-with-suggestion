'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Package, Clock, ChevronRight, Loader2 } from '@/components/base/icons';
import Link from 'next/link';
import { formatPrice } from '@/utils/format';
import { useState, useEffect } from 'react';
import { orderService } from '@/services/order-service';
import { Order } from '@/types/order';
import { ORDER_STATUS_COLORS, ORDER_TABS } from '@/constants/order';
import toast from 'react-hot-toast';

export default function OrderHistoryPage() {
  const t = useTranslations('order');
  const locale = useLocale();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchOrders(page);
  }, [page]);

  const fetchOrders = async (p: number) => {
    try {
      setLoading(true);
      const res = await orderService.getMyOrders(p, 10);
      setOrders(res.data || []);
      setTotalPages(res.totalPages || 1);
    } catch (err: unknown) {
      console.error(err);
      toast.error('Lỗi khi tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (selectedTab === 'ALL') return true;
    const tabObj = ORDER_TABS.find((t) => t.key === selectedTab);
    return tabObj?.status ? order.status === tabObj.status : true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-ink mb-6">{t('title')}</h1>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
        {ORDER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedTab(tab.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedTab === tab.key
                ? 'bg-primary text-white shadow-sm'
                : 'bg-paper-2 text-ink-2 hover:bg-primary/10 hover:text-primary'
            }`}
          >
            {t(tab.labelKey as Parameters<typeof t>[0])}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-ink-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
          <p className="text-sm">Đang tải danh sách đơn hàng...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white border border-rule rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-paper-2 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-ink-2" />
          </div>
          <p className="font-semibold text-ink text-lg mb-1">{t('noOrders')}</p>
          <p className="text-sm text-ink-2 mb-6">Khám phá các sản phẩm và tiến hành mua sắm ngay</p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
          >
            Mua sắm ngay
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const statusKey = order.status.toLowerCase();
            const itemCount = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
            const formattedDate = new Date(
              (order as unknown as { createdAt: string }).createdAt || Date.now()
            ).toLocaleDateString('vi-VN');

            return (
              <Link key={order.id} href={`/orders/${order.id}`} className="block group">
                <div className="bg-white border border-rule rounded-xl p-5 hover:border-primary/40 hover:shadow-md transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-paper-2 rounded-lg flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                        <Package className="w-5 h-5 text-ink-2 group-hover:text-primary transition-colors" />
                      </div>
                      <div>
                        <p className="font-semibold text-ink">{order.id}</p>
                        <div className="flex items-center gap-2 text-xs text-ink-2">
                          <Clock className="w-3 h-3" />
                          <span>{formattedDate}</span>
                          <span>·</span>
                          <span>
                            {itemCount} {t('items')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                          ORDER_STATUS_COLORS[order.status] ||
                          ORDER_STATUS_COLORS[statusKey] ||
                          'bg-gray-100 text-gray-800 border-gray-200'
                        }`}
                      >
                        {t(`statusLabels.${statusKey}` as Parameters<typeof t>[0])}
                      </span>
                      <span className="text-lg font-bold text-primary">
                        {formatPrice(order.totalAmount, locale)}
                      </span>
                      <ChevronRight className="w-5 h-5 text-ink-2 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-6">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-paper-2 text-ink-2 disabled:opacity-50 hover:bg-primary/10 hover:text-primary transition-colors"
              >
                Trước
              </button>
              <span className="px-4 py-2 text-sm font-semibold text-ink">
                Trang {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-paper-2 text-ink-2 disabled:opacity-50 hover:bg-primary/10 hover:text-primary transition-colors"
              >
                Sau
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
