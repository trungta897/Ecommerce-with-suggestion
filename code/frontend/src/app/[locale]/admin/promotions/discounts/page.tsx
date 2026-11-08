'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { promotionService } from '@/services/promotion-service';
import { productService } from '@/services/product-service';
import { ProductDiscount, CreateDiscountInput } from '@/types/promotion';
import { Product } from '@/types/product';
import {
  Zap,
  Plus,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Package,
} from '@/components/base/icons';
import { DiscountFormModal } from '@/components/admin/promotions/DiscountFormModal';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { getApiErrorMessage } from '@/utils/get-api-error-message';

const toLocalDateTimeInput = (d: Date | string) => {
  const date = typeof d === 'string' ? new Date(d) : d;
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

export default function AdminDiscountsPage() {
  const t = useTranslations('admin.promotions');
  const [discounts, setDiscounts] = useState<ProductDiscount[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<ProductDiscount | null>(null);
  const [formData, setFormData] = useState<CreateDiscountInput>({
    productId: '',
    discountPrice: 0,
    flashSaleQty: 20,
    startDate: '',
    endDate: '',
    isActive: true,
  });

  const fetchDiscounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await promotionService.getAdminDiscounts(page, 10);
      setDiscounts(res.data);
      setTotalPages(res.totalPages || 1);
    } catch (err: unknown) {
      setErrorMsg(getApiErrorMessage(err) || t('fetch_error'));
    } finally {
      setLoading(false);
    }
  }, [page, t]);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await productService.getAll({ limit: 500 });
      setProducts(res.data || []);
    } catch (err) {
      console.error('Failed to fetch products', err);
    }
  }, []);

  useEffect(() => {
    fetchDiscounts();
    fetchProducts();
  }, [fetchDiscounts, fetchProducts]);

  const openCreateModal = () => {
    setEditingDiscount(null);
    const now = new Date();
    const basePrice = Number(products[0]?.price || 0);
    setFormData({
      productId: products[0]?.id || '',
      discountPrice: basePrice > 0 ? Math.round((basePrice * 0.8) / 1000) * 1000 : 0,
      flashSaleQty: 20,
      startDate: toLocalDateTimeInput(now),
      endDate: toLocalDateTimeInput(new Date(now.getTime() + 24 * 3600000)),
      isActive: true,
    });
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (discount: ProductDiscount) => {
    setEditingDiscount(discount);
    setFormData({
      productId: discount.productId,
      discountPrice: Number(discount.discountPrice),
      flashSaleQty: discount.flashSaleQty,
      startDate: toLocalDateTimeInput(discount.startDate),
      endDate: toLocalDateTimeInput(discount.endDate),
      isActive: discount.isActive,
    });
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const payload: CreateDiscountInput = {
        ...formData,
        discountPrice: Number(formData.discountPrice),
        flashSaleQty: Number(formData.flashSaleQty),
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
      };
      if (editingDiscount) {
        await promotionService.updateDiscount(editingDiscount.id, payload);
        setSuccessMsg(t('update_success'));
      } else {
        await promotionService.createDiscount(payload);
        setSuccessMsg(t('create_success'));
      }
      setIsModalOpen(false);
      fetchDiscounts();
    } catch (err: unknown) {
      setErrorMsg(getApiErrorMessage(err) || t('save_error'));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (discount: ProductDiscount) => {
    try {
      await promotionService.updateDiscount(discount.id, { isActive: !discount.isActive });
      setSuccessMsg(t('update_success'));
      fetchDiscounts();
    } catch (err: unknown) {
      setErrorMsg(getApiErrorMessage(err) || t('save_error'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('confirm_delete'))) return;
    try {
      await promotionService.deleteDiscount(id);
      setSuccessMsg(t('delete_success'));
      fetchDiscounts();
    } catch (err: unknown) {
      setErrorMsg(getApiErrorMessage(err) || t('delete_error'));
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-rule shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-ink">{t('title')}</h1>
            <p className="text-sm text-ink-3">{t('subtitle')}</p>
          </div>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-600 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          {t('add_new')}
        </button>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-2 p-4 bg-green-50 text-green-700 border border-green-200 rounded-xl text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="bg-white border border-rule rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-paper-2 border-b border-rule text-ink-2 font-semibold">
              <tr>
                <th className="p-4">{t('product')}</th>
                <th className="p-4">{t('original_price')}</th>
                <th className="p-4 text-red-600">{t('discount_price')}</th>
                <th className="p-4">{t('sold')}</th>
                <th className="p-4">{t('start_date')}</th>
                <th className="p-4">{t('end_date')}</th>
                <th className="p-4">{t('status')}</th>
                <th className="p-4 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule text-ink">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-ink-3">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    {t('loadingList')}
                  </td>
                </tr>
              ) : discounts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-ink-3">
                    {t('no_data')}
                  </td>
                </tr>
              ) : (
                discounts.map((discount) => {
                  const now = new Date();
                  const start = new Date(discount.startDate);
                  const end = new Date(discount.endDate);
                  const isOngoing = discount.isActive && start <= now && end >= now;
                  const orig = Number(discount.product?.price || 0);
                  const sale = Number(discount.discountPrice);
                  const pct =
                    orig > 0 && sale < orig ? Math.round(((orig - sale) / orig) * 100) : 0;
                  const thumb =
                    discount.product?.thumbnailUrl || discount.product?.images?.[0]?.url || '';
                  const statusInfo = !discount.isActive
                    ? { cls: 'bg-gray-100 text-gray-500', label: t('inactive') }
                    : isOngoing
                      ? {
                          cls: 'bg-green-100 text-green-700 border border-green-200',
                          label: t('ongoing'),
                        }
                      : end < now
                        ? { cls: 'bg-amber-50 text-amber-700', label: t('ended') }
                        : { cls: 'bg-blue-50 text-blue-700', label: t('scheduled') };
                  return (
                    <tr key={discount.id} className="hover:bg-paper-1/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3 max-w-xs">
                          <div className="relative w-10 h-10 rounded-xl bg-paper-2 border border-rule overflow-hidden shrink-0 flex items-center justify-center">
                            {thumb ? (
                              <Image
                                src={thumb}
                                alt={discount.product?.name || ''}
                                fill
                                sizes="40px"
                                className="object-contain p-1"
                              />
                            ) : (
                              <Package className="w-5 h-5 text-ink-3" />
                            )}
                          </div>
                          <span className="font-medium truncate">
                            {discount.product?.name || discount.productId}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-ink-3 line-through">
                        {orig > 0 ? `${orig.toLocaleString('vi-VN')}đ` : '-'}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-red-600">
                            {sale.toLocaleString('vi-VN')}đ
                          </span>
                          {pct > 0 && (
                            <span className="px-1.5 py-0.5 rounded-md bg-red-100 text-red-700 text-xs font-bold">
                              -{pct}%
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-orange-600">
                          {discount.flashSaleSold}
                        </span>{' '}
                        / {discount.flashSaleQty}
                      </td>
                      <td className="p-4 text-xs text-ink-2">{start.toLocaleString('vi-VN')}</td>
                      <td className="p-4 text-xs text-ink-2">{end.toLocaleString('vi-VN')}</td>
                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(discount)}
                          title={t('toggle_active')}
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer hover:opacity-80 ${statusInfo.cls}`}
                        >
                          {statusInfo.label}
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(discount)}
                            className="p-1.5 hover:bg-paper-2 rounded-lg text-ink-2 hover:text-primary"
                            title={t('edit')}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(discount.id)}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"
                            title={t('delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <DiscountFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingDiscount={editingDiscount}
        products={products}
        formData={formData}
        onFormDataChange={setFormData}
        onSubmit={handleSubmit}
        saving={saving}
      />
    </div>
  );
}
