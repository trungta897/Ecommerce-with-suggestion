'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
} from '@/components/base/icons';
import { DiscountFormModal } from '@/components/admin/promotions/DiscountFormModal';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { getApiErrorMessage } from '@/utils/get-api-error-message';

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

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<ProductDiscount | null>(null);
  const [formData, setFormData] = useState<CreateDiscountInput>({
    productId: '',
    discountPrice: 0,
    flashSaleQty: 10,
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
      const message = getApiErrorMessage(err) || t('fetch_error');
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  }, [page, t]);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await productService.getAll({ limit: 100 });
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
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    setFormData({
      productId: products[0]?.id || '',
      discountPrice: 0,
      flashSaleQty: 20,
      startDate: now.toISOString().slice(0, 16),
      endDate: tomorrow.toISOString().slice(0, 16),
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
      startDate: new Date(discount.startDate).toISOString().slice(0, 16),
      endDate: new Date(discount.endDate).toISOString().slice(0, 16),
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
      const msg = getApiErrorMessage(err) || t('save_error');
      setErrorMsg(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('confirm_delete'))) return;
    try {
      await promotionService.deleteDiscount(id);
      setSuccessMsg(t('delete_success'));
      fetchDiscounts();
    } catch (err: unknown) {
      const message = getApiErrorMessage(err) || t('delete_error');
      setErrorMsg(message);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
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

      {/* Alerts */}
      {errorMsg && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-2 p-4 bg-green-50 text-green-700 border border-green-200 rounded-xl text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-rule rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-paper-2 border-b border-rule text-ink-2 font-semibold">
              <tr>
                <th className="p-4">{t('product')}</th>
                <th className="p-4">{t('original_price')}</th>
                <th className="p-4 text-red-600">{t('discount_price')}</th>
                <th className="p-4">{t('quota')}</th>
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
                  <td colSpan={9} className="p-8 text-center text-ink-3">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    {t('loadingList')}
                  </td>
                </tr>
              ) : discounts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-ink-3">
                    {t('no_data')}
                  </td>
                </tr>
              ) : (
                discounts.map((discount) => {
                  const now = new Date();
                  const isOngoing =
                    discount.isActive &&
                    new Date(discount.startDate) <= now &&
                    new Date(discount.endDate) >= now;

                  return (
                    <tr key={discount.id} className="hover:bg-paper-1/50 transition-colors">
                      <td className="p-4 font-medium max-w-xs truncate">
                        {discount.product?.name || discount.productId}
                      </td>
                      <td className="p-4 text-ink-3">
                        {discount.product?.price
                          ? Number(discount.product.price).toLocaleString('vi-VN') + 'đ'
                          : '-'}
                      </td>
                      <td className="p-4 font-bold text-red-600">
                        {Number(discount.discountPrice).toLocaleString('vi-VN')}đ
                      </td>
                      <td className="p-4 font-semibold">{discount.flashSaleQty}</td>
                      <td className="p-4">
                        <span className="font-semibold text-orange-600">
                          {discount.flashSaleSold}
                        </span>{' '}
                        / {discount.flashSaleQty}
                      </td>
                      <td className="p-4 text-xs text-ink-2">
                        {new Date(discount.startDate).toLocaleString('vi-VN')}
                      </td>
                      <td className="p-4 text-xs text-ink-2">
                        {new Date(discount.endDate).toLocaleString('vi-VN')}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            isOngoing
                              ? 'bg-green-100 text-green-700 border border-green-200'
                              : discount.isActive
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {isOngoing
                            ? t('ongoing')
                            : discount.isActive
                              ? t('scheduled')
                              : t('inactive')}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(discount)}
                            className="p-1.5 hover:bg-paper-2 rounded-lg text-ink-2 hover:text-primary transition-colors"
                            title={t('edit')}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(discount.id)}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
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

        {/* Pagination */}
        <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {/* Extracted Form Modal */}
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
