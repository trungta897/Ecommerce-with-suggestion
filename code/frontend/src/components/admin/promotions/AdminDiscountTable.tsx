'use client';

import React from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ProductDiscount } from '@/types/promotion';
import { Edit, Trash2, Loader2, Package } from '@/components/base/icons';
import { AdminPagination } from '@/components/admin/AdminPagination';

interface AdminDiscountTableProps {
  discounts: ProductDiscount[];
  loading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onToggleActive: (discount: ProductDiscount) => void;
  onEdit: (discount: ProductDiscount) => void;
  onDeleteRequest: (discount: ProductDiscount) => void;
}

export function AdminDiscountTable({
  discounts,
  loading,
  page,
  totalPages,
  onPageChange,
  onToggleActive,
  onEdit,
  onDeleteRequest,
}: AdminDiscountTableProps) {
  const t = useTranslations('admin.promotions');

  return (
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
                const pct = orig > 0 && sale < orig ? Math.round(((orig - sale) / orig) * 100) : 0;
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
                            {t('discount_badge', { percent: pct })}
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
                        onClick={() => onToggleActive(discount)}
                        title={t('toggle_active')}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer hover:opacity-80 ${statusInfo.cls}`}
                      >
                        {statusInfo.label}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onEdit(discount)}
                          className="p-1.5 hover:bg-paper-2 rounded-lg text-ink-2 hover:text-primary"
                          title={t('edit')}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteRequest(discount)}
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
      <AdminPagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
    </div>
  );
}
