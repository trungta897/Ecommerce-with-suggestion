'use client';

import React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
  Package,
  Loader2,
} from '@/components/base/icons';
import { Order } from '@/types/order';
import { ORDER_STATUS_COLORS } from '@/constants/order';
import { formatPrice } from '@/utils/format';

interface AdminOrderTableProps {
  orders: Order[];
  loading: boolean;
  onViewDetail: (order: Order) => void;
  onApproveOrder: (orderId: string) => void;
  onOpenShippingModal: (order: Order) => void;
  onCompleteOrder: (orderId: string) => void;
  onApproveReturn: (orderId: string) => void;
  onRejectReturn: (orderId: string) => void;
  onOpenCancelModal: (orderId: string) => void;
  submittingAction: boolean;
}

export const AdminOrderTable: React.FC<AdminOrderTableProps> = ({
  orders,
  loading,
  onViewDetail,
  onApproveOrder,
  onOpenShippingModal,
  onCompleteOrder,
  onApproveReturn,
  onRejectReturn,
  onOpenCancelModal,
  submittingAction,
}) => {
  const locale = useLocale();
  const t = useTranslations('admin.orders');
  const tOrder = useTranslations('order');

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-ink-2">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
        <p className="text-sm">{t('loading_orders')}</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-ink-2">
        <Package className="w-12 h-12 text-ink-3 mb-3" />
        <p className="font-medium text-ink">{t('no_orders')}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-ink-2 border-b border-rule bg-paper-2 font-medium">
            <th className="px-5 py-3.5">{t('orderId')}</th>
            <th className="px-5 py-3.5">{t('customer')}</th>
            <th className="px-5 py-3.5">{t('date')}</th>
            <th className="px-5 py-3.5">{t('total')}</th>
            <th className="px-5 py-3.5">{t('status')}</th>
            <th className="px-5 py-3.5 text-right">{t('actions')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-rule">
          {orders.map((order) => {
            const statusKey = order.status ? order.status.toUpperCase() : '';
            const statusColor =
              ORDER_STATUS_COLORS[statusKey] ||
              ORDER_STATUS_COLORS[order.status?.toLowerCase()] ||
              'bg-gray-100 text-gray-800 border-gray-200';

            return (
              <tr key={order.id} className="hover:bg-paper-2/50 transition-colors">
                <td className="px-5 py-4 font-mono font-bold text-ink">
                  #{order.id.slice(-8).toUpperCase()}
                </td>
                <td className="px-5 py-4">
                  <p className="font-semibold text-ink">{order.shippingName}</p>
                  <p className="text-xs text-ink-2">{order.shippingPhone}</p>
                </td>
                <td className="px-5 py-4 text-ink-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-ink-3" />
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString(
                          locale === 'vi' ? 'vi-VN' : 'en-US'
                        )
                      : '-'}
                  </div>
                </td>
                <td className="px-5 py-4 font-bold text-ink">
                  {formatPrice(order.totalAmount, locale)}
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusColor}`}
                  >
                    {tOrder(
                      `statusLabels.${order.status?.toLowerCase()}` as Parameters<typeof tOrder>[0]
                    )}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {/* View Detail */}
                    <button
                      onClick={() => onViewDetail(order)}
                      className="p-1.5 rounded-lg hover:bg-paper-2 text-ink-2 hover:text-ink transition-colors"
                      title={t('viewDetail')}
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Quick Approve */}
                    {['PENDING', 'pending'].includes(order.status) && (
                      <button
                        onClick={() => onApproveOrder(order.id)}
                        disabled={submittingAction}
                        className="p-1.5 rounded-lg hover:bg-green-50 text-ink-2 hover:text-green-600 transition-colors"
                        title={t('quick_approve')}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}

                    {/* Fallback Manual Shipping */}
                    <button
                      onClick={() => onOpenShippingModal(order)}
                      className="p-1.5 rounded-lg hover:bg-indigo-50 text-ink-2 hover:text-indigo-600 transition-colors"
                      title={t('manual_shipping')}
                    >
                      <Truck className="w-4 h-4" />
                    </button>

                    {/* Mark Completed */}
                    {['DELIVERING', 'delivering'].includes(order.status) && (
                      <button
                        onClick={() => onCompleteOrder(order.id)}
                        disabled={submittingAction}
                        className="p-1.5 rounded-lg hover:bg-green-50 text-ink-2 hover:text-green-600 transition-colors"
                        title={t('mark_completed')}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}

                    {/* Return Requested approval */}
                    {['RETURN_REQUESTED', 'return_requested'].includes(order.status) && (
                      <>
                        <button
                          onClick={() => onApproveReturn(order.id)}
                          disabled={submittingAction}
                          className="p-1.5 rounded-lg hover:bg-green-50 text-ink-2 hover:text-green-600 transition-colors"
                          title={t('approve_return')}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onRejectReturn(order.id)}
                          disabled={submittingAction}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-ink-2 hover:text-red-600 transition-colors"
                          title={t('reject_return')}
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {/* Cancel Order */}
                    {['PENDING', 'PENDING_PAYMENT', 'pending', 'pending_payment'].includes(
                      order.status
                    ) && (
                      <button
                        onClick={() => onOpenCancelModal(order.id)}
                        disabled={submittingAction}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-ink-2 hover:text-red-600 transition-colors"
                        title={t('cancel_order')}
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
