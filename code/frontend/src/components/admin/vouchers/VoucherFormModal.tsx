'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { BaseInput, BaseButton } from '@/components/base';
import { VoucherItem, VoucherType, VoucherScope, CreateVoucherInput } from '@/types/voucher';
import { categoryService } from '@/services/category-service';
import { productService } from '@/services/product-service';
import { Category, Product } from '@/types';

interface VoucherFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateVoucherInput) => Promise<void>;
  editingVoucher: VoucherItem | null;
}

export function VoucherFormModal({
  isOpen,
  onClose,
  onSubmit,
  editingVoucher,
}: VoucherFormModalProps) {
  const t = useTranslations('voucher');
  const tCommon = useTranslations('common');

  const [code, setCode] = useState('');
  const [type, setType] = useState<VoucherType>('PERCENTAGE');
  const [scope, setScope] = useState<VoucherScope>('CART');
  const [value, setValue] = useState<number>(0);
  const [maxDiscount, setMaxDiscount] = useState<number | ''>('');
  const [minOrderValue, setMinOrderValue] = useState<number>(0);
  const [usageLimit, setUsageLimit] = useState<number | ''>('');
  const [perUserLimit, setPerUserLimit] = useState<number>(1);
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [productId, setProductId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Load categories & popular products for selection
      categoryService
        .getAll()
        .then((data) => setCategories(data || []))
        .catch(console.error);
      productService
        .getAll({ limit: 50 })
        .then((res) => setProducts(res.data || []))
        .catch(console.error);
    }
  }, [isOpen]);

  useEffect(() => {
    if (editingVoucher) {
      setCode(editingVoucher.code);
      setType(editingVoucher.type);
      setScope(editingVoucher.scope || 'CART');
      setValue(Number(editingVoucher.value));
      setMaxDiscount(editingVoucher.maxDiscount ? Number(editingVoucher.maxDiscount) : '');
      setMinOrderValue(Number(editingVoucher.minOrderValue) || 0);
      setUsageLimit(editingVoucher.usageLimit ? Number(editingVoucher.usageLimit) : '');
      setPerUserLimit(editingVoucher.perUserLimit || 1);
      setIsPublic(editingVoucher.isPublic ?? true);
      setCategoryId(editingVoucher.categoryId || '');
      setProductId(editingVoucher.productId || '');
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
      setScope('CART');
      setValue(0);
      setMaxDiscount('');
      setMinOrderValue(0);
      setUsageLimit('');
      setPerUserLimit(1);
      setIsPublic(true);
      setCategoryId('');
      setProductId('');
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
        code: code.trim().toUpperCase(),
        type,
        scope,
        value: Number(value),
        maxDiscount: maxDiscount !== '' ? Number(maxDiscount) : null,
        minOrderValue: Number(minOrderValue),
        usageLimit: usageLimit !== '' ? Number(usageLimit) : null,
        perUserLimit: Number(perUserLimit) || 1,
        isPublic,
        startDate: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
        endDate: endDate
          ? new Date(endDate).toISOString()
          : new Date(Date.now() + 30 * 86400000).toISOString(),
        categoryId: scope === 'CATEGORY' && categoryId ? categoryId : null,
        productId: scope === 'PRODUCT' && productId ? productId : null,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <h2 className="text-xl font-bold mb-4 text-ink">
          {editingVoucher ? t('editVoucher') : t('createVoucher')}
        </h2>
        <form onSubmit={handleSubmitForm} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-ink">{t('voucherCode')}</label>
              <BaseInput
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="VD: SALE2026, FREESHIP"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-ink">{t('type')}</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as VoucherType)}
                className="w-full border border-rule rounded-lg px-3 py-2 text-sm bg-white text-ink"
              >
                <option value="PERCENTAGE">Phần trăm (%)</option>
                <option value="FIXED_AMOUNT">Số tiền cố định (VNĐ)</option>
                <option value="FREE_SHIPPING">Miễn phí vận chuyển</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-ink">{t('scope')}</label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as VoucherScope)}
                className="w-full border border-rule rounded-lg px-3 py-2 text-sm bg-white text-ink font-medium"
              >
                <option value="CART">{t('wholeCart')}</option>
                <option value="CATEGORY">{t('byCategory')}</option>
                <option value="PRODUCT">{t('byProduct')}</option>
              </select>
            </div>

            {scope === 'CATEGORY' && (
              <div>
                <label className="block text-sm font-medium mb-1 text-ink">
                  {t('targetCategory')}
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full border border-rule rounded-lg px-3 py-2 text-sm bg-white text-ink"
                  required
                >
                  <option value="">-- {t('selectCategory')} --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {scope === 'PRODUCT' && (
              <div>
                <label className="block text-sm font-medium mb-1 text-ink">
                  {t('targetProduct')}
                </label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full border border-rule rounded-lg px-3 py-2 text-sm bg-white text-ink"
                  required
                >
                  <option value="">-- {t('selectProduct')} --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1 text-ink">
                {type === 'PERCENTAGE' ? 'Phần trăm giảm (%)' : 'Số tiền giảm (VNĐ)'}
              </label>
              <BaseInput
                type="number"
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                required
                min={0}
              />
            </div>

            {type === 'PERCENTAGE' && (
              <div>
                <label className="block text-sm font-medium mb-1 text-ink">
                  {t('maxDiscount')} (VNĐ)
                </label>
                <BaseInput
                  type="number"
                  value={maxDiscount}
                  placeholder="Để trống nếu không giới hạn"
                  onChange={(e) => setMaxDiscount(e.target.value ? Number(e.target.value) : '')}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1 text-ink">
                {t('minOrderValue')} (VNĐ)
              </label>
              <BaseInput
                type="number"
                value={minOrderValue}
                onChange={(e) => setMinOrderValue(Number(e.target.value))}
                required
                min={0}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-ink">{t('usageLimit')}</label>
              <BaseInput
                type="number"
                value={usageLimit}
                placeholder="Để trống nếu không giới hạn"
                onChange={(e) => setUsageLimit(e.target.value ? Number(e.target.value) : '')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-ink">{t('perUserLimit')}</label>
              <BaseInput
                type="number"
                value={perUserLimit}
                onChange={(e) => setPerUserLimit(Number(e.target.value))}
                required
                min={1}
              />
            </div>

            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="isPublicCheck"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-4 h-4 text-primary rounded border-rule focus:ring-primary"
              />
              <label
                htmlFor="isPublicCheck"
                className="text-sm font-medium text-ink cursor-pointer"
              >
                {t('isPublic')}
                <span className="block text-xs font-normal text-ink-2">{t('isPublicHint')}</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-ink">{t('startDate')}</label>
              <BaseInput
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-ink">{t('endDate')}</label>
              <BaseInput
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-rule">
            <BaseButton type="button" variant="outline" onClick={onClose} disabled={submitting}>
              {tCommon('cancel') || 'Hủy'}
            </BaseButton>
            <BaseButton type="submit" disabled={submitting}>
              {submitting ? 'Đang lưu...' : tCommon('save') || 'Lưu'}
            </BaseButton>
          </div>
        </form>
      </div>
    </div>
  );
}
