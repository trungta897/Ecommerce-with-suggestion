'use client';

import React, { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ProductDiscount, CreateDiscountInput } from '@/types/promotion';
import { Product } from '@/types/product';
import { Zap, X, Loader2, Search } from '@/components/base/icons';
import { FLASH_SALE_QUICK_DISCOUNT_RATES, FLASH_SALE_QUICK_DURATION_HOURS } from '@/constants';
import { DiscountBatchPreview } from './DiscountBatchPreview';

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

const toLocalInput = (date: Date) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

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
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  const selectedProduct = useMemo(
    () =>
      products.find((p) => p.id === formData.productId) || editingDiscount?.product || undefined,
    [products, formData.productId, editingDiscount]
  );

  if (!isOpen) return null;

  const originalPrice = Number(selectedProduct?.price || 0);
  const currentDiscountPrice = Number(formData.discountPrice || 0);
  const discountPercent =
    originalPrice > 0 && currentDiscountPrice > 0 && currentDiscountPrice < originalPrice
      ? Math.round(((originalPrice - currentDiscountPrice) / originalPrice) * 100)
      : 0;
  const isPriceInvalid =
    originalPrice > 0 && (currentDiscountPrice <= 0 || currentDiscountPrice >= originalPrice);

  const handleProductChange = (productId: string) => {
    const basePrice = Number(products.find((p) => p.id === productId)?.price || 0);
    const suggestedPrice = basePrice > 0 ? Math.round((basePrice * 0.8) / 1000) * 1000 : 0;
    onFormDataChange((prev) => ({
      ...prev,
      productId,
      discountPrice: suggestedPrice || prev.discountPrice,
    }));
  };

  const applyDiscountPercent = (percent: number) => {
    if (originalPrice <= 0) return;
    const nextPrice = Math.max(
      1000,
      Math.round((originalPrice * (1 - percent / 100)) / 1000) * 1000
    );
    onFormDataChange((prev) => ({ ...prev, discountPrice: nextPrice }));
  };

  const applyQuickDuration = (hours: number) => {
    const baseStart = formData.startDate ? new Date(formData.startDate) : new Date();
    const start = isNaN(baseStart.getTime()) ? new Date() : baseStart;
    onFormDataChange((prev) => ({
      ...prev,
      startDate: toLocalInput(start),
      endDate: toLocalInput(new Date(start.getTime() + hours * 3600000)),
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-rule overflow-hidden max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-rule shrink-0">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-red-500" />
            <h3 className="font-bold text-lg text-ink">
              {editingDiscount ? t('edit') : t('add_new')}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-ink-3 hover:text-ink rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-ink">{t('product')}</label>
            <div className="relative">
              <Search className="w-4 h-4 text-ink-3 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('search_product_placeholder')}
                className="w-full pl-9 pr-3 py-2 border border-rule rounded-xl text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <select
              required
              value={formData.productId}
              onChange={(e) => handleProductChange(e.target.value)}
              className="w-full px-3 py-2 border border-rule rounded-xl text-sm focus:outline-none focus:border-primary bg-white"
            >
              <option value="" disabled>
                {t('select_product')}
              </option>
              {filteredProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {Number(p.price).toLocaleString('vi-VN')}đ
                </option>
              ))}
            </select>
          </div>

          {selectedProduct && (
            <DiscountBatchPreview
              product={selectedProduct}
              originalPrice={originalPrice}
              discountPercent={discountPercent}
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                {t('discount_price')}
              </label>
              <input
                type="number"
                min="1000"
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
              {originalPrice > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[11px] text-ink-3">{t('quick_discount')}</span>
                  {FLASH_SALE_QUICK_DISCOUNT_RATES.map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => applyDiscountPercent(pct)}
                      className="px-2 py-0.5 text-[11px] font-semibold rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                    >
                      -{pct}%
                    </button>
                  ))}
                </div>
              )}
              {isPriceInvalid && (
                <p className="text-xs text-red-600 mt-1">{t('invalid_price_error')}</p>
              )}
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

          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  {t('start_date')}
                </label>
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
                  onChange={(e) =>
                    onFormDataChange((prev) => ({ ...prev, endDate: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-rule rounded-xl text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-ink-3">{t('quick_duration')}</span>
              {FLASH_SALE_QUICK_DURATION_HOURS.map((item) => (
                <button
                  key={item.hours}
                  type="button"
                  onClick={() => applyQuickDuration(item.hours)}
                  className="px-2 py-0.5 text-[11px] font-semibold rounded-lg bg-paper-2 text-ink-2 hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
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
              disabled={saving || isPriceInvalid}
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
