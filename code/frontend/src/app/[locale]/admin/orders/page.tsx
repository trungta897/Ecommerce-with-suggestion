'use client';

import { useTranslations, useLocale } from 'next-intl';
import { BaseInput } from '@/components/base';
import {
  Search,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
  Package,
  Loader2,
} from '@/components/base/icons';
import { formatPrice } from '@/utils/format';
import { useState, useEffect, useCallback } from 'react';
import { ReturnRejectModal } from '@/components/features/orders/ReturnRejectModal';
import { AdminOrderDetailModal } from '@/components/admin/orders/AdminOrderDetailModal';
import { AdminOrderShippingModal } from '@/components/admin/orders/AdminOrderShippingModal';
import { AdminOrderCancelModal } from '@/components/admin/orders/AdminOrderCancelModal';
import { orderService } from '@/services/order-service';
import { Order, OrderStatus } from '@/types/order';
import { ORDER_STATUS_COLORS, DELIVERY_PARTNERS } from '@/constants/order';
import toast from 'react-hot-toast';

export default function AdminOrdersPage() {
  const t = useTranslations('admin.orders');
  const tOrder = useTranslations('order');
  const locale = useLocale();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  const [shippingModalOpen, setShippingModalOpen] = useState(false);
  const [shippingOrderId, setShippingOrderId] = useState<string | null>(null);
  const [selectedCarrier, setSelectedCarrier] = useState(DELIVERY_PARTNERS[0].name);
  const [trackingIdInput, setTrackingIdInput] = useState('');
  const [shippingStatus, setShippingStatus] = useState<string>('HANDED_OVER');
  const [submittingAction, setSubmittingAction] = useState(false);

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await orderService.getAdminOrders(page, 15, selectedStatus);
      setOrders(res.data || []);
      setTotalPages(res.totalPages || 1);
    } catch (err: unknown) {
      console.error(err);
      toast.error('Lỗi khi tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  }, [page, selectedStatus]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleApproveOrder = async (orderId: string) => {
    try {
      setSubmittingAction(true);
      await orderService.updateOrderStatus(orderId, OrderStatus.CONFIRMED);
      toast.success('Duyệt đơn hàng thành công');
      fetchOrders();
      if (viewingOrder?.id === orderId) {
        setViewingOrder((prev) => (prev ? { ...prev, status: OrderStatus.CONFIRMED } : null));
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Lỗi khi duyệt đơn hàng');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleOpenShippingModal = (order: Order) => {
    setShippingOrderId(order.id);
    setSelectedCarrier(order.deliveryPartner || DELIVERY_PARTNERS[0].name);
    setTrackingIdInput(order.trackingId || '');
    setShippingStatus('HANDED_OVER');
    setShippingModalOpen(true);
  };

  const handleUpdateShipping = async () => {
    if (!shippingOrderId) return;
    try {
      setSubmittingAction(true);
      await orderService.updateOrderStatus(shippingOrderId, shippingStatus, {
        deliveryPartner: selectedCarrier,
        trackingId: trackingIdInput.trim() || undefined,
      });
      toast.success('Cập nhật vận chuyển thành công');
      setShippingModalOpen(false);
      fetchOrders();
      if (viewingOrder?.id === shippingOrderId) {
        setViewingOrder((prev) =>
          prev
            ? {
                ...prev,
                status: shippingStatus as OrderStatus,
                deliveryPartner: selectedCarrier,
                trackingId: trackingIdInput.trim(),
              }
            : null
        );
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Lỗi khi cập nhật vận chuyển');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleCompleteOrder = async (orderId: string) => {
    try {
      setSubmittingAction(true);
      await orderService.updateOrderStatus(orderId, OrderStatus.COMPLETED);
      toast.success('Đã xác nhận hoàn thành đơn hàng');
      fetchOrders();
      if (viewingOrder?.id === orderId) {
        setViewingOrder((prev) => (prev ? { ...prev, status: OrderStatus.COMPLETED } : null));
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Lỗi khi hoàn thành đơn');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleCancelOrderAdmin = async () => {
    if (!cancellingOrderId) return;
    try {
      setSubmittingAction(true);
      await orderService.cancelOrder(cancellingOrderId);
      toast.success('Hủy đơn hàng và hoàn tồn kho thành công');
      setCancelModalOpen(false);
      fetchOrders();
      if (viewingOrder?.id === cancellingOrderId) {
        setViewingOrder((prev) => (prev ? { ...prev, status: OrderStatus.CANCELLED } : null));
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Lỗi khi hủy đơn hàng');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleApproveReturn = async (orderId: string) => {
    try {
      await orderService.approveReturn(orderId);
      toast.success('Đã duyệt yêu cầu trả hàng');
      fetchOrders();
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      toast.error(msg || 'Lỗi khi duyệt trả hàng');
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      order.id.toLowerCase().includes(q) ||
      order.shippingName.toLowerCase().includes(q) ||
      order.shippingPhone.includes(q) ||
      order.user?.email?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold text-ink">{t('title')}</h1>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-2" />
          <BaseInput
            placeholder={t('searchPlaceholder')}
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          value={selectedStatus}
          onChange={(e) => {
            setSelectedStatus(e.target.value);
            setPage(1);
          }}
          className="px-3.5 py-2 rounded-xl border border-rule text-sm bg-white focus:outline-none focus:border-primary text-ink"
        >
          <option value="">Tất cả trạng thái</option>
          {Object.keys(ORDER_STATUS_COLORS).map((st) => (
            <option key={st} value={st}>
              {tOrder(`statusLabels.${st.toLowerCase()}` as Parameters<typeof tOrder>[0])}
            </option>
          ))}
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-rule overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-ink-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
            <p className="text-sm">Đang tải danh sách đơn hàng...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-ink-2">
            <Package className="w-12 h-12 text-ink-3 mb-3" />
            <p className="font-medium text-ink">Không tìm thấy đơn hàng</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-2 border-b border-rule bg-paper-2 font-medium">
                  <th className="px-5 py-3.5">Mã đơn</th>
                  <th className="px-5 py-3.5">Khách hàng</th>
                  <th className="px-5 py-3.5">Ngày đặt</th>
                  <th className="px-5 py-3.5">Tổng tiền</th>
                  <th className="px-5 py-3.5">Trạng thái</th>
                  <th className="px-5 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {filteredOrders.map((order) => {
                  const statusColor =
                    ORDER_STATUS_COLORS[order.status] ||
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
                            ? new Date(order.createdAt).toLocaleDateString('vi-VN')
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
                            `statusLabels.${order.status.toLowerCase()}` as Parameters<
                              typeof tOrder
                            >[0]
                          )}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* View Detail */}
                          <button
                            onClick={() => {
                              setViewingOrder(order);
                              setDetailModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg hover:bg-paper-2 text-ink-2 hover:text-ink transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Quick Approve */}
                          {['PENDING', 'pending'].includes(order.status) && (
                            <button
                              onClick={() => handleApproveOrder(order.id)}
                              className="p-1.5 rounded-lg hover:bg-green-50 text-ink-2 hover:text-green-600 transition-colors"
                              title="Duyệt đơn hàng"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Fallback Manual Shipping */}
                          <button
                            onClick={() => handleOpenShippingModal(order)}
                            className="p-1.5 rounded-lg hover:bg-indigo-50 text-ink-2 hover:text-indigo-600 transition-colors"
                            title="Ghi nhận giao hàng thủ công"
                          >
                            <Truck className="w-4 h-4" />
                          </button>

                          {/* Mark Completed */}
                          {['DELIVERING', 'delivering'].includes(order.status) && (
                            <button
                              onClick={() => handleCompleteOrder(order.id)}
                              className="p-1.5 rounded-lg hover:bg-green-50 text-ink-2 hover:text-green-600 transition-colors"
                              title="Xác nhận đã giao hoàn thành"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Return Requested approval */}
                          {['RETURN_REQUESTED', 'return_requested'].includes(order.status) && (
                            <>
                              <button
                                onClick={() => handleApproveReturn(order.id)}
                                className="p-1.5 rounded-lg hover:bg-green-50 text-ink-2 hover:text-green-600 transition-colors"
                                title="Duyệt trả hàng"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedOrderId(order.id);
                                  setRejectModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-ink-2 hover:text-red-600 transition-colors"
                                title="Từ chối trả hàng"
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
                              onClick={() => {
                                setCancellingOrderId(order.id);
                                setCancelModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-ink-2 hover:text-red-600 transition-colors"
                              title="Hủy đơn hàng"
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
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-rule bg-white">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3.5 py-1.5 text-sm font-medium rounded-lg bg-paper-2 text-ink-2 disabled:opacity-50 hover:bg-primary/10 hover:text-primary transition-colors"
            >
              Trước
            </button>
            <span className="text-xs text-ink-2">
              Trang {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3.5 py-1.5 text-sm font-medium rounded-lg bg-paper-2 text-ink-2 disabled:opacity-50 hover:bg-primary/10 hover:text-primary transition-colors"
            >
              Sau
            </button>
          </div>
        )}
      </div>

      {/* Sub-components Modals */}
      <AdminOrderShippingModal
        isOpen={shippingModalOpen}
        onClose={() => setShippingModalOpen(false)}
        selectedCarrier={selectedCarrier}
        onCarrierChange={setSelectedCarrier}
        trackingIdInput={trackingIdInput}
        onTrackingIdChange={setTrackingIdInput}
        shippingStatus={shippingStatus}
        onShippingStatusChange={setShippingStatus}
        onSubmit={handleUpdateShipping}
        submitting={submittingAction}
      />

      <AdminOrderDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        order={viewingOrder}
        onApprove={handleApproveOrder}
        approving={submittingAction}
      />

      <AdminOrderCancelModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        orderId={cancellingOrderId}
        onConfirm={handleCancelOrderAdmin}
        submitting={submittingAction}
      />

      {/* Return Reject Modal */}
      {selectedOrderId && (
        <ReturnRejectModal
          isOpen={rejectModalOpen}
          onClose={() => setRejectModalOpen(false)}
          orderId={selectedOrderId}
          onSuccess={() => {
            fetchOrders();
          }}
        />
      )}
    </div>
  );
}
