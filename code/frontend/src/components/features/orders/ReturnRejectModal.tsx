import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { BaseModal, BaseButton } from '@/components/base';
import { orderService } from '@/services/order-service';
import { useToast } from '@/providers/toast-provider';

interface ReturnRejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  onSuccess: () => void;
}

export const ReturnRejectModal: React.FC<ReturnRejectModalProps> = ({
  isOpen,
  onClose,
  orderId,
  onSuccess,
}) => {
  const tOrder = useTranslations('order');
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error(tOrder('returnReasonRequired'));
      return;
    }

    try {
      setLoading(true);
      await orderService.rejectReturn(orderId, { rejectReason: reason });
      toast.success('Đã từ chối yêu cầu trả hàng');
      onSuccess();
      onClose();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi từ chối trả hàng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Từ chối yêu cầu trả hàng">
      <form onSubmit={handleSubmit} className="space-y-4 p-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {tOrder('returnRejectReason')}
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            rows={3}
            placeholder="Nhập lý do từ chối"
          />
        </div>
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <BaseButton type="button" variant="outline" onClick={onClose} disabled={loading}>
            Hủy
          </BaseButton>
          <BaseButton type="submit" variant="destructive" isLoading={loading}>
            Từ chối
          </BaseButton>
        </div>
      </form>
    </BaseModal>
  );
};
