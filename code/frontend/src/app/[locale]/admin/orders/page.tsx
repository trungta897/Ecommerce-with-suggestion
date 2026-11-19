'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { AdminOrderFilters } from '@/components/admin/orders/AdminOrderFilters';
import { AdminOrderTable } from '@/components/admin/orders/AdminOrderTable';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { ReturnRejectModal } from '@/components/features/orders/ReturnRejectModal';
import { AdminOrderDetailModal } from '@/components/admin/orders/AdminOrderDetailModal';
import { AdminOrderShippingModal } from '@/components/admin/orders/AdminOrderShippingModal';
import { AdminOrderCancelModal } from '@/components/admin/orders/AdminOrderCancelModal';
import { orderService } from '@/services/order-service';
import { Order, OrderStatus } from '@/types/order';
import { DELIVERY_PARTNERS } from '@/constants/order';
import { getApiErrorMessage } from '@/utils/get-api-error-message';

export default function AdminOrdersPage() {
  const t = useTranslations('admin.orders');
  const searchParams = useSearchParams();
  const initialStatus = searchParams?.get('status') || '';

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>(initialStatus);
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

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  const [submittingAction, setSubmittingAction] = useState(false);

  // Sync if URL search params change
  useEffect(() => {
    const statusFromUrl = searchParams?.get('status');
    if (statusFromUrl !== null && statusFromUrl !== undefined) {
      setSelectedStatus(statusFromUrl);
      setPage(1);
    }
  }, [searchParams]);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await orderService.getAdminOrders(page, 15, selectedStatus);
      setOrders(res.data || []);
      setTotalPages(res.totalPages || 1);
    } catch (err: unknown) {
      console.error(err);
      toast.error(t('toast_load_error'));
    } finally {
      setLoading(false);
    }
  }, [page, selectedStatus, t]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleApproveOrder = async (orderId: string) => {
    try {
      setSubmittingAction(true);
      await orderService.updateOrderStatus(orderId, OrderStatus.CONFIRMED);
      toast.success(t('toast_approve_success'));
      fetchOrders();
      if (viewingOrder?.id === orderId) {
        setViewingOrder((prev) => (prev ? { ...prev, status: OrderStatus.CONFIRMED } : null));
      }
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err);
      toast.error(msg || t('toast_load_error'));
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleOpenShippingModal = (order: Order) => {
    setShippingOrderId(order.id);
    setSelectedCarrier(order.deliveryPartner || DELIVERY_PARTNERS[0].name);
    setTrackingIdInput(order.trackingId || '');
    setShippingStatus(
      ['HANDED_OVER', 'DELIVERING'].includes(order.status) ? order.status : 'HANDED_OVER'
    );
    setShippingModalOpen(true);
  };

  const handleUpdateShipping = async () => {
    if (!shippingOrderId) return;
    try {
      setSubmittingAction(true);
      await orderService.recordManualShipping(shippingOrderId, {
        carrier: selectedCarrier,
        trackingCode: trackingIdInput.trim() || undefined,
        status: shippingStatus as OrderStatus,
      });
      toast.success(t('confirmUpdate'));
      setShippingModalOpen(false);
      fetchOrders();
      if (viewingOrder?.id === shippingOrderId) {
        setViewingOrder((prev) =>
          prev
            ? {
                ...prev,
                status: shippingStatus as OrderStatus,
                deliveryPartner: selectedCarrier,
                trackingId: trackingIdInput.trim() || undefined,
              }
            : null
        );
      }
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err);
      toast.error(msg || t('toast_load_error'));
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleCompleteOrder = async (orderId: string) => {
    try {
      setSubmittingAction(true);
      await orderService.updateOrderStatus(orderId, OrderStatus.COMPLETED);
      toast.success(t('toast_complete_success'));
      fetchOrders();
      if (viewingOrder?.id === orderId) {
        setViewingOrder((prev) => (prev ? { ...prev, status: OrderStatus.COMPLETED } : null));
      }
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err);
      toast.error(msg || t('toast_load_error'));
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleCancelOrderAdmin = async () => {
    if (!cancellingOrderId) return;
    try {
      setSubmittingAction(true);
      await orderService.cancelOrder(cancellingOrderId);
      toast.success(t('toast_cancel_success'));
      setCancelModalOpen(false);
      fetchOrders();
      if (viewingOrder?.id === cancellingOrderId) {
        setViewingOrder((prev) => (prev ? { ...prev, status: OrderStatus.CANCELLED } : null));
      }
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err);
      toast.error(msg || t('toast_load_error'));
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleApproveReturn = async (orderId: string) => {
    try {
      await orderService.approveReturn(orderId);
      toast.success(t('toast_return_approve_success'));
      fetchOrders();
    } catch (error: unknown) {
      const msg = getApiErrorMessage(error);
      toast.error(msg || t('toast_load_error'));
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
      <AdminOrderFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedStatus={selectedStatus}
        onStatusChange={(st) => {
          setSelectedStatus(st);
          setPage(1);
        }}
      />

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-rule overflow-hidden shadow-sm">
        <AdminOrderTable
          orders={filteredOrders}
          loading={loading}
          onViewDetail={(order) => {
            setViewingOrder(order);
            setDetailModalOpen(true);
          }}
          onApproveOrder={handleApproveOrder}
          onOpenShippingModal={handleOpenShippingModal}
          onCompleteOrder={handleCompleteOrder}
          onApproveReturn={handleApproveReturn}
          onRejectReturn={(orderId) => {
            setSelectedOrderId(orderId);
            setRejectModalOpen(true);
          }}
          onOpenCancelModal={(orderId) => {
            setCancellingOrderId(orderId);
            setCancelModalOpen(true);
          }}
          submittingAction={submittingAction}
        />

        {/* Pagination */}
        <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
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
          onSuccess={fetchOrders}
        />
      )}
    </div>
  );
}
