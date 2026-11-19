'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { BaseInput, BaseButton, BaseModal } from '@/components/base';
import { DELIVERY_PARTNERS } from '@/constants/order';

interface AdminOrderShippingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCarrier: string;
  onCarrierChange: (carrier: string) => void;
  trackingIdInput: string;
  onTrackingIdChange: (trackingId: string) => void;
  shippingStatus: string;
  onShippingStatusChange: (status: string) => void;
  onSubmit: () => Promise<void>;
  submitting?: boolean;
}

export function AdminOrderShippingModal({
  isOpen,
  onClose,
  selectedCarrier,
  onCarrierChange,
  trackingIdInput,
  onTrackingIdChange,
  shippingStatus,
  onShippingStatusChange,
  onSubmit,
  submitting = false,
}: AdminOrderShippingModalProps) {
  const tAdmin = useTranslations('admin.orders');
  const tCommon = useTranslations('common');

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={tAdmin('manualShippingModalTitle')}>
      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-ink">{tAdmin('deliveryCarrier')}</label>
          <select
            value={selectedCarrier}
            onChange={(e) => onCarrierChange(e.target.value)}
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
          <label className="text-sm font-medium text-ink">{tAdmin('trackingCode')}</label>
          <BaseInput
            placeholder={tAdmin('trackingCodePlaceholder')}
            value={trackingIdInput}
            onChange={(e) => onTrackingIdChange(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-ink">{tAdmin('changeStatusTo')}</label>
          <select
            value={shippingStatus}
            onChange={(e) => onShippingStatusChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-rule text-sm bg-white focus:outline-none focus:border-primary"
          >
            <option value="HANDED_OVER">{tAdmin('statusHandedOver')}</option>
            <option value="DELIVERING">{tAdmin('statusDelivering')}</option>
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-3">
          <BaseButton variant="outline" onClick={onClose} disabled={submitting}>
            {tCommon('close')}
          </BaseButton>
          <BaseButton onClick={onSubmit} disabled={submitting}>
            {submitting ? tCommon('loading') : tAdmin('confirmUpdate')}
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  );
}
