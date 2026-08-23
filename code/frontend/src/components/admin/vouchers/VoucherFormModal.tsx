'use client';

import React, { useState, useEffect } from 'react';
import { BaseInput, BaseButton } from '@/components/base';
import { VoucherItem, VoucherType } from '@/types/voucher';

interface VoucherFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    code: string;
    type: VoucherType;
    value: number;
    maxDiscount: number | null;
    minOrderValue: number;
    usageLimit: number | null;
    startDate: string | null;
    endDate: string | null;
  }) => Promise<void>;
  editingVoucher: VoucherItem | null;
}

export function VoucherFormModal({
  isOpen,
  onClose,
  onSubmit,
  editingVoucher,
}: VoucherFormModalProps) {
  const [code, setCode] = useState('');
  const [type, setType] = useState<VoucherType>('PERCENTAGE');
  const [value, setValue] = useState<number>(0);
  const [maxDiscount, setMaxDiscount] = useState<number | ''>('');
  const [minOrderValue, setMinOrderValue] = useState<number>(0);
  const [usageLimit, setUsageLimit] = useState<number | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingVoucher) {
      setCode(editingVoucher.code);
      setType(editingVoucher.type);
      setValue(Number(editingVoucher.value));
      setMaxDiscount(editingVoucher.maxDiscount ? Number(editingVoucher.maxDiscount) : '');
      setMinOrderValue(Number(editingVoucher.minOrderValue) || 0);
      setUsageLimit(editingVoucher.usageLimit ? Number(editingVoucher.usageLimit) : '');
      setStartDate(
        editingVoucher.startDate
          ? new Date(editingVoucher.startDate).toISOString().slice(0, 16)
          : ''
      );
      setEndDate(
        editingVoucher.endDate ? new Date(editingVoucher.endDate).toISOString().slice(0, 16) : ''
      );
    } else {
      setCode('');
      setType('PERCENTAGE');
      setValue(0);
      setMaxDiscount('');
      setMinOrderValue(0);
      setUsageLimit('');
      setStartDate('');
      setEndDate('');
    }
  }, [editingVoucher, isOpen]);

  if (!isOpen) return null;

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await onSubmit({
        code,
        type,
        value: Number(value),
        maxDiscount: maxDiscount !== '' ? Number(maxDiscount) : null,
        minOrderValue: Number(minOrderValue),
        usageLimit: usageLimit !== '' ? Number(usageLimit) : null,
        startDate: startDate ? new Date(startDate).toISOString() : null,
        endDate: endDate ? new Date(endDate).toISOString() : null,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {editingVoucher ? 'Sửa Voucher' : 'Thêm Voucher Mới'}
        </h2>
        <form onSubmit={handleSubmitForm} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Mã Voucher</label>
              <BaseInput value={code} onChange={(e) => setCode(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Loại</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as VoucherType)}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option value="PERCENTAGE">Phần trăm</option>
                <option value="FIXED_AMOUNT">Số tiền</option>
                <option value="FREE_SHIPPING">Miễn phí VC</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {type === 'PERCENTAGE' ? 'Phần trăm giảm (%)' : 'Số tiền giảm (VNĐ)'}
              </label>
              <BaseInput
                type="number"
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Giảm tối đa (VNĐ)</label>
              <BaseInput
                type="number"
                value={maxDiscount}
                onChange={(e) => setMaxDiscount(e.target.value ? Number(e.target.value) : '')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Đơn tối thiểu (VNĐ)</label>
              <BaseInput
                type="number"
                value={minOrderValue}
                onChange={(e) => setMinOrderValue(Number(e.target.value))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Giới hạn lượt sử dụng</label>
              <BaseInput
                type="number"
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value ? Number(e.target.value) : '')}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Ngày bắt đầu</label>
              <BaseInput
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ngày kết thúc</label>
              <BaseInput
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <BaseButton type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Hủy
            </BaseButton>
            <BaseButton type="submit" disabled={submitting}>
              {submitting ? 'Đang lưu...' : 'Lưu'}
            </BaseButton>
          </div>
        </form>
      </div>
    </div>
  );
}
