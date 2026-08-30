'use client';

import React from 'react';
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
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Xác nhận hủy đơn hàng (Admin)">
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-xs">
            Thao tác này sẽ hủy đơn hàng và hoàn trả lại số lượng tồn kho của các sản phẩm.
          </p>
        </div>
        <p className="text-sm text-ink-2">
          Bạn có chắc chắn muốn hủy đơn <strong>{orderId}</strong> không?
        </p>
        <div className="flex justify-end gap-3 pt-2">
          <BaseButton variant="outline" onClick={onClose} disabled={submitting}>
            Hủy bỏ
          </BaseButton>
          <BaseButton variant="destructive" onClick={onConfirm} disabled={submitting}>
            {submitting ? 'Đang hủy...' : 'Xác nhận hủy đơn'}
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  );
}
