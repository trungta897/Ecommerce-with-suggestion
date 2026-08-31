'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { BaseButton, BaseModal } from '@/components/base';
import { AlertCircle } from '@/components/base/icons';

interface AdminOrderCancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string | null;
  onConfirm: () => Promise<void>;
  submitting?: boolean;
}

export function AdminOrderCancelModal({
  isOpen,
  onClose,
  orderId,
  onConfirm,
  submitting = false,
}: AdminOrderCancelModalProps) {
  const tAdmin = useTranslations('admin.orders');
  const tCommon = useTranslations('common');

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={tAdmin('cancelOrderModalTitle')}>
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-xs">{tAdmin('cancelOrderWarning')}</p>
        </div>
        <p className="text-sm text-ink-2">{tAdmin('confirmCancelPrompt', { id: orderId || '' })}</p>
        <div className="flex justify-end gap-3 pt-2">
          <BaseButton variant="outline" onClick={onClose} disabled={submitting}>
            {tCommon('cancel')}
          </BaseButton>
          <BaseButton variant="destructive" onClick={onConfirm} disabled={submitting}>
            {submitting ? tAdmin('cancelling') : tAdmin('confirmCancel')}
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  );
}
