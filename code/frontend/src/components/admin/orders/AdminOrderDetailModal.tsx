'use client';

import React from 'react';
import { BaseButton, BaseModal } from '@/components/base';
import { formatPrice } from '@/utils/format';
import { Order } from '@/types/order';
import { ORDER_STATUS_COLORS } from '@/constants/order';
import { useTranslations, useLocale } from 'next-intl';

interface AdminOrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onApprove: (orderId: string) => Promise<void>;
  approving?: boolean;
}

export function AdminOrderDetailModal({
  isOpen,
  onClose,
  order,
  onApprove,
  approving = false,
}: AdminOrderDetailModalProps) {
  const tOrder = useTranslations('order');
  const tAdmin = useTranslations('admin.orders');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  if (!order) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={tAdmin('orderDetailTitle', { id: order.id ? `#${order.id.slice(0, 8)}` : '' })}
    >
      <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4 text-sm bg-paper-2 p-4 rounded-xl">
          <div>
            <p className="text-ink-2">{tAdmin('customerLabel')}</p>
            <p className="font-semibold text-ink">{order.shippingName}</p>
            <p className="text-xs text-ink-2">{order.shippingPhone}</p>
          </div>
          <div>
            <p className="text-ink-2">{tAdmin('statusLabel')}</p>
            <span
              className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border mt-1 ${
                ORDER_STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'
              }`}
            >
              {tOrder(`statusLabels.${order.status.toLowerCase()}` as Parameters<typeof tOrder>[0])}
            </span>
          </div>
          <div className="col-span-2">
            <p className="text-ink-2">{tAdmin('shippingAddressLabel')}</p>
            <p className="font-medium text-ink">{order.shippingAddress}</p>
          </div>
          {(order.deliveryPartner || order.trackingId) && (
            <div className="col-span-2 pt-2 border-t border-rule">
              <p className="text-xs text-ink-2">
                {tAdmin('shippingCarrierLabel')}{' '}
                <strong>{order.deliveryPartner || tAdmin('noneYet')}</strong> ·{' '}
                {tAdmin('trackingCodeLabel')}{' '}
                <strong className="font-mono">{order.trackingId || tAdmin('noneYet')}</strong>
              </p>
            </div>
          )}
        </div>

        {/* Items */}
        <div>
          <h4 className="font-bold text-ink mb-3">{tAdmin('productList')}</h4>
          <div className="divide-y divide-rule border border-rule rounded-xl overflow-hidden">
            {order.items?.map((item) => (
              <div key={item.id} className="p-3 flex items-center justify-between bg-white">
                <div>
                  <p className="font-medium text-ink">
                    {item.product?.name || tAdmin('productDefault')}
                  </p>
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
          <span>{tAdmin('totalAmount')}</span>
          <span className="text-primary">{formatPrice(order.totalAmount, locale)}</span>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-rule">
          <BaseButton variant="outline" onClick={onClose}>
            {tCommon('close')}
          </BaseButton>
          {['PENDING', 'pending'].includes(order.status) && (
            <BaseButton onClick={() => onApprove(order.id)} disabled={approving}>
              {approving ? tAdmin('approving') : tAdmin('approve')}
            </BaseButton>
          )}
        </div>
      </div>
    </BaseModal>
  );
}
