'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { ProductDiscount, CreateDiscountInput } from '@/types/promotion';
import { Product } from '@/types/product';
import { Zap, X, Loader2 } from '@/components/base/icons';

interface DiscountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingDiscount: ProductDiscount | null;
  products: Product[];
  formData: CreateDiscountInput;
  onFormDataChange: React.Dispatch<React.SetStateAction<CreateDiscountInput>>;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  saving: boolean;
}

export function DiscountFormModal({
  isOpen,
  onClose,
  editingDiscount,
  products,
  formData,
  onFormDataChange,
  onSubmit,
  saving,
}: DiscountFormModalProps) {
  const t = useTranslations('admin.promotions');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-rule overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-rule">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-red-500" />
            <h3 className="font-bold text-lg text-ink">
              {editingDiscount ? t('edit') : t('add_new')}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-ink-3 hover:text-ink rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {/* Product selection */}
          <div>
            <label className="block text-xs font-semibold text-ink mb-1">{t('product')}</label>
            <select
              required
              value={formData.productId}
              onChange={(e) => onFormDataChange((prev) => ({ ...prev, productId: e.target.value }))}
              className="w-full px-3 py-2 border border-rule rounded-xl text-sm focus:outline-none focus:border-primary"
            >
              <option value="" disabled>
                {t('select_product')}
              </option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({Number(p.price).toLocaleString('vi-VN')}đ)
                </option>
              ))}
            </select>
          </div>

          {/* Price & Quota */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                {t('discount_price')} (VNĐ)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                required
                value={formData.discountPrice}
                onChange={(e) =>
                  onFormDataChange((prev) => ({
                    ...prev,
                    discountPrice: parseFloat(e.target.value) || 0,
                  }))
                }
                className="w-full px-3 py-2 border border-rule rounded-xl text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">{t('quota')}</label>
              <input
                type="number"
                min="1"
                required
                value={formData.flashSaleQty}
                onChange={(e) =>
                  onFormDataChange((prev) => ({
                    ...prev,
                    flashSaleQty: parseInt(e.target.value) || 1,
                  }))
                }
                className="w-full px-3 py-2 border border-rule rounded-xl text-sm focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Start & End Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">{t('start_date')}</label>
              <input
                type="datetime-local"
                required
                value={formData.startDate}
                onChange={(e) =>
                  onFormDataChange((prev) => ({ ...prev, startDate: e.target.value }))
                }
                className="w-full px-3 py-2 border border-rule rounded-xl text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">{t('end_date')}</label>
              <input
                type="datetime-local"
                required
                value={formData.endDate}
                onChange={(e) => onFormDataChange((prev) => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-rule rounded-xl text-sm focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) =>
                onFormDataChange((prev) => ({ ...prev, isActive: e.target.checked }))
              }
              className="w-4 h-4 text-primary rounded focus:ring-primary"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-ink cursor-pointer">
              {t('active')}
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-rule">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-ink-2 hover:bg-paper-2 rounded-xl transition-colors font-medium"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-primary text-white text-sm rounded-xl font-medium hover:bg-primary-600 transition-colors shadow-sm disabled:opacity-50"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? t('saving') : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
