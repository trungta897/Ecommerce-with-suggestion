'use client';

import { useTranslations, useLocale } from 'next-intl';
import { BaseInput, BaseButton, BaseModal } from '@/components/base';
import {
  Search,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
  Package,
  Loader2,
  AlertCircle,
} from '@/components/base/icons';
import { formatPrice } from '@/utils/format';
import { useState, useEffect, useCallback } from 'react';
import { ReturnRejectModal } from '@/components/features/orders/ReturnRejectModal';
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
          className="px-3.5 py-2 rounded-lg border border-rule bg-white text-sm text-ink focus:outline-none focus:border-primary"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="PENDING">Chờ xác nhận (Pending)</option>
          <option value="PENDING_PAYMENT">Chờ thanh toán (Pending Payment)</option>
          <option value="CONFIRMED">Đã xác nhận (Confirmed)</option>
          <option value="HANDED_OVER">Đã giao cho ĐVVC (Handed Over)</option>
          <option value="DELIVERING">Đang giao hàng (Delivering)</option>
          <option value="COMPLETED">Hoàn thành (Completed)</option>
          <option value="RETURN_REQUESTED">Yêu cầu trả hàng (Return Requested)</option>
          <option value="RETURNED">Đã trả hàng (Returned)</option>
          <option value="CANCELLED">Đã hủy (Cancelled)</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-rule overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-ink-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm">Đang tải danh sách đơn hàng...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-ink-2">
            <Package className="w-10 h-10 mx-auto mb-2 text-ink-2" />
            <p className="font-semibold text-ink">Không có đơn hàng nào phù hợp</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-2 border-b border-rule bg-paper-2">
                  <th className="px-5 py-3.5 font-medium">{t('orderId')}</th>
                  <th className="px-5 py-3.5 font-medium">{t('customer')}</th>
                  <th className="px-5 py-3.5 font-medium">{t('total')}</th>
                  <th className="px-5 py-3.5 font-medium">{t('payment')}</th>
                  <th className="px-5 py-3.5 font-medium">{t('status')}</th>
                  <th className="px-5 py-3.5 font-medium">{t('date')}</th>
                  <th className="px-5 py-3.5 font-medium">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {filteredOrders.map((order) => {
                  const statusKey = order.status.toLowerCase();
                  const dateStr = new Date(
                    (order as unknown as { createdAt: string }).createdAt || Date.now()
                  ).toLocaleDateString('vi-VN');

                  return (
                    <tr key={order.id} className="hover:bg-paper-2/60 transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-ink">{order.id}</td>
                      <td className="px-5 py-3.5">
                        <div>
                          <p className="font-medium text-ink">{order.shippingName}</p>
                          <p className="text-xs text-ink-2">
                            {order.shippingPhone} {order.user?.email ? `· ${order.user.email}` : ''}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-ink">
                        {formatPrice(order.totalAmount, locale)}
                      </td>
                      <td className="px-5 py-3.5 text-ink-2 uppercase text-xs font-semibold">
                        {order.paymentMethod}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            ORDER_STATUS_COLORS[order.status] ||
                            ORDER_STATUS_COLORS[statusKey] ||
                            'bg-gray-100 text-gray-800 border-gray-200'
                          }`}
                        >
                          {tOrder(`statusLabels.${statusKey}` as Parameters<typeof tOrder>[0])}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-ink-2 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Clock className="w-3.5 h-3.5 text-ink-2" />
                          {dateStr}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {/* View Detail */}
                          <button
                            onClick={() => {
                              setViewingOrder(order);
                              setDetailModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg hover:bg-paper-2 text-ink-2 hover:text-primary transition-colors"
                            title={t('viewDetail')}
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Approve (Pending -> Confirmed) */}
                          {(order.status === OrderStatus.PENDING ||
                            order.status === ('pending' as OrderStatus)) && (
                            <button
                              onClick={() => handleApproveOrder(order.id)}
                              className="p-1.5 rounded-lg hover:bg-green-50 text-ink-2 hover:text-green-600 transition-colors"
                              title="Duyệt đơn hàng"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Manual Shipping handover/delivering */}
                          {['CONFIRMED', 'HANDED_OVER', 'confirmed', 'handed_over'].includes(
                            order.status
                          )}
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

      {/* Manual Shipping Modal */}
      <BaseModal
        isOpen={shippingModalOpen}
        onClose={() => setShippingModalOpen(false)}
        title="Ghi nhận giao hàng thủ công (Fallback)"
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-ink">Đơn vị vận chuyển</label>
            <select
              value={selectedCarrier}
              onChange={(e) => setSelectedCarrier(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-rule text-sm bg-white focus:outline-none focus:border-primary"
            >
              {DELIVERY_PARTNERS.map((partner) => (
                <option key={partner.id} value={partner.name}>
                  {partner.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-ink">Mã vận đơn (Tracking Code)</label>
            <BaseInput
              placeholder="VD: GHTK123456789"
              value={trackingIdInput}
              onChange={(e) => setTrackingIdInput(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-ink">Chuyển sang trạng thái</label>
            <select
              value={shippingStatus}
              onChange={(e) => setShippingStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-rule text-sm bg-white focus:outline-none focus:border-primary"
            >
              <option value="HANDED_OVER">Đã giao cho ĐVVC (HANDED_OVER)</option>
              <option value="DELIVERING">Đang giao hàng (DELIVERING)</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <BaseButton
              variant="outline"
              onClick={() => setShippingModalOpen(false)}
              disabled={submittingAction}
            >
              Đóng
            </BaseButton>
            <BaseButton onClick={handleUpdateShipping} disabled={submittingAction}>
              {submittingAction ? 'Đang lưu...' : 'Xác nhận cập nhật'}
            </BaseButton>
          </div>
        </div>
      </BaseModal>

      {/* Order Detail Modal */}
      <BaseModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={`Chi tiết đơn hàng ${viewingOrder?.id || ''}`}
      >
        {viewingOrder && (
          <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4 text-sm bg-paper-2 p-4 rounded-xl">
              <div>
                <p className="text-ink-2">Khách hàng:</p>
                <p className="font-semibold text-ink">{viewingOrder.shippingName}</p>
                <p className="text-xs text-ink-2">{viewingOrder.shippingPhone}</p>
              </div>
              <div>
                <p className="text-ink-2">Trạng thái:</p>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border mt-1 ${
                    ORDER_STATUS_COLORS[viewingOrder.status] || 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {tOrder(
                    `statusLabels.${viewingOrder.status.toLowerCase()}` as Parameters<
                      typeof tOrder
                    >[0]
                  )}
                </span>
              </div>
              <div className="col-span-2">
                <p className="text-ink-2">Địa chỉ giao hàng:</p>
                <p className="font-medium text-ink">{viewingOrder.shippingAddress}</p>
              </div>
              {(viewingOrder.deliveryPartner || viewingOrder.trackingId) && (
                <div className="col-span-2 pt-2 border-t border-rule">
                  <p className="text-xs text-ink-2">
                    Vận chuyển: <strong>{viewingOrder.deliveryPartner || 'Chưa có'}</strong> · Mã
                    vận đơn:{' '}
                    <strong className="font-mono">{viewingOrder.trackingId || 'Chưa có'}</strong>
                  </p>
                </div>
              )}
            </div>

            {/* Items */}
            <div>
              <h4 className="font-bold text-ink mb-3">Danh sách sản phẩm</h4>
              <div className="divide-y divide-rule border border-rule rounded-xl overflow-hidden">
                {viewingOrder.items?.map((item) => (
                  <div key={item.id} className="p-3 flex items-center justify-between bg-white">
                    <div>
                      <p className="font-medium text-ink">{item.product?.name || 'Sản phẩm'}</p>
                      <p className="text-xs text-ink-2">
                        {formatPrice(item.unitPrice, locale)} x {item.quantity}
                      </p>
                    </div>
                    <span className="font-semibold text-ink">
                      {formatPrice(item.unitPrice * item.quantity, locale)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-between items-center pt-2 font-bold text-lg text-ink">
              <span>Tổng tiền thanh toán:</span>
              <span className="text-primary">{formatPrice(viewingOrder.totalAmount, locale)}</span>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-rule">
              <BaseButton variant="outline" onClick={() => setDetailModalOpen(false)}>
                Đóng
              </BaseButton>
              {['PENDING', 'pending'].includes(viewingOrder.status) && (
                <BaseButton onClick={() => handleApproveOrder(viewingOrder.id)}>
                  Duyệt đơn
                </BaseButton>
              )}
            </div>
          </div>
        )}
      </BaseModal>

      {/* Cancel Order Modal */}
      <BaseModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Xác nhận hủy đơn hàng (Admin)"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-xs">
              Thao tác này sẽ hủy đơn hàng và hoàn trả lại số lượng tồn kho của các sản phẩm.
            </p>
          </div>
          <p className="text-sm text-ink-2">
            Bạn có chắc chắn muốn hủy đơn <strong>{cancellingOrderId}</strong> không?
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <BaseButton
              variant="outline"
              onClick={() => setCancelModalOpen(false)}
              disabled={submittingAction}
            >
              Hủy bỏ
            </BaseButton>
            <BaseButton
              variant="destructive"
              onClick={handleCancelOrderAdmin}
              disabled={submittingAction}
            >
              {submittingAction ? 'Đang hủy...' : 'Xác nhận hủy đơn'}
            </BaseButton>
          </div>
        </div>
      </BaseModal>

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
