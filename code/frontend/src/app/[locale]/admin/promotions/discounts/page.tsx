'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { promotionService } from '@/services/promotion-service';
import { productService } from '@/services/product-service';
import { ProductDiscount, CreateDiscountInput } from '@/types/promotion';
import { Product } from '@/types/product';
import { Zap, Plus, Loader2, AlertCircle, CheckCircle2 } from '@/components/base/icons';
import { BaseModal } from '@/components/base/BaseModal';
import { BaseButton } from '@/components/base';
import { DiscountFormModal } from '@/components/admin/promotions/DiscountFormModal';
import { AdminDiscountTable } from '@/components/admin/promotions/AdminDiscountTable';
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
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<ProductDiscount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductDiscount | null>(null);
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

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await promotionService.deleteDiscount(deleteTarget.id);
      setSuccessMsg(t('delete_success'));
      setDeleteTarget(null);
      fetchDiscounts();
    } catch (err: unknown) {
      setErrorMsg(getApiErrorMessage(err) || t('delete_error'));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
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

      <AdminDiscountTable
        discounts={discounts}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onToggleActive={handleToggleActive}
        onEdit={openEditModal}
        onDeleteRequest={setDeleteTarget}
      />

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

      <BaseModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => !deleting && setDeleteTarget(null)}
        title={t('confirm_delete_title')}
      >
        <div className="space-y-4 py-2">
          <p className="text-sm text-ink-2">{t('confirm_delete')}</p>
          {deleteTarget && (
            <div className="p-3 bg-paper-2 rounded-xl text-xs font-medium text-ink">
              {deleteTarget.product?.name || deleteTarget.productId}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4 border-t border-rule">
            <BaseButton
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              {t('cancel')}
            </BaseButton>
            <BaseButton
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('deleting')}
                </>
              ) : (
                t('confirm_delete_btn')
              )}
            </BaseButton>
          </div>
        </div>
      </BaseModal>
    </div>
  );
}
