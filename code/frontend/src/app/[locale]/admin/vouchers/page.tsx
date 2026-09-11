'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import toast from 'react-hot-toast';
import { BaseInput, BaseButton } from '@/components/base';
import { Search, Plus, Edit, Eye, EyeOff, History, Loader2 } from '@/components/base/icons';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { voucherService } from '@/services/voucher-service';
import { VoucherItem, CreateVoucherInput } from '@/types/voucher';
import { VoucherFormModal } from '@/components/admin/vouchers/VoucherFormModal';
import { VoucherUsageModal } from '@/components/admin/vouchers/VoucherUsageModal';
import { VOUCHER_SCOPES, VOUCHER_TYPES } from '@/constants/voucher';
import { formatPrice } from '@/utils/format';

export default function AdminVouchersPage() {
  const locale = useLocale();
  const t = useTranslations('voucher');
  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<VoucherItem | null>(null);
  const [historyVoucher, setHistoryVoucher] = useState<VoucherItem | null>(null);

  useEffect(() => {
    fetchVouchers(1, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchVouchers = async (p: number, searchTerm?: string) => {
    try {
      setLoading(true);
      const res = await voucherService.getAdminVouchers(p, 10, searchTerm);
      setVouchers(res.data || []);
      setTotalPages(res.meta?.totalPages || 1);
      setPage(p);
    } catch (err: unknown) {
      console.error('Failed to load vouchers', err);
      toast.error(t('loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVouchers(1, search);
  };

  const handleToggle = async (id: string) => {
    try {
      await voucherService.toggleVoucherStatus(id);
      toast.success(t('toggleSuccess'));
      fetchVouchers(page, search);
    } catch (err: unknown) {
      console.error('Failed to toggle voucher status', err);
      toast.error(t('saveError'));
    }
  };

  const openEditModal = (voucher: VoucherItem) => {
    setEditingVoucher(voucher);
    setShowModal(true);
  };

  const handleSaveVoucher = async (data: CreateVoucherInput) => {
    try {
      if (editingVoucher) {
        await voucherService.updateVoucher(editingVoucher.id, data);
      } else {
        await voucherService.createVoucher(data);
      }
      toast.success(t('saveSuccess'));
      setShowModal(false);
      fetchVouchers(page, search);
    } catch (err: unknown) {
      console.error('Failed to save voucher', err);
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        t('saveError');
      toast.error(msg);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-ink">{t('manageTitle')}</h1>
          <p className="text-sm text-ink-2 mt-1">{t('manageSubtitle')}</p>
        </div>
        <BaseButton
          onClick={() => {
            setEditingVoucher(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {t('createVoucher')}
        </BaseButton>
      </div>

      <form onSubmit={handleSearchSubmit} className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-2" />
          <BaseInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="pl-10"
          />
        </div>
        <BaseButton type="submit" variant="outline">
          {t('search')}
        </BaseButton>
      </form>

      <div className="bg-white rounded-xl border border-rule overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-2 border-b border-rule bg-paper-2">
                <th className="px-5 py-3.5 font-medium">{t('voucherCode')}</th>
                <th className="px-5 py-3.5 font-medium">{t('type')}</th>
                <th className="px-5 py-3.5 font-medium">{t('scope')}</th>
                <th className="px-5 py-3.5 font-medium">{t('value')}</th>
                <th className="px-5 py-3.5 font-medium">{t('endDate')}</th>
                <th className="px-5 py-3.5 font-medium">{t('usedCount')}</th>
                <th className="px-5 py-3.5 font-medium">{t('limitPerUser')}</th>
                <th className="px-5 py-3.5 font-medium">{t('status')}</th>
                <th className="px-5 py-3.5 font-medium text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-ink-2">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
                    <span>{t('loadingList')}</span>
                  </td>
                </tr>
              ) : vouchers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-ink-2">
                    {t('noVouchers')}
                  </td>
                </tr>
              ) : (
                vouchers.map((voucher) => {
                  const scopeMeta = VOUCHER_SCOPES[voucher.scope] || VOUCHER_SCOPES.CART;
                  const typeMeta = VOUCHER_TYPES[voucher.type] || VOUCHER_TYPES.PERCENTAGE;

                  return (
                    <tr
                      key={voucher.id}
                      className="border-b border-rule hover:bg-paper-2 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-primary font-mono text-base">
                          {voucher.code}
                        </div>
                        <div className="text-xs text-ink-2 mt-0.5">
                          {voucher.isPublic ? (
                            <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              {t('publicBadge')}
                            </span>
                          ) : (
                            <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              {t('privateBadge')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2 py-1 rounded-md text-xs font-semibold ${typeMeta.color}`}
                        >
                          {typeMeta.labelVi}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2 py-1 rounded-md text-xs font-medium ${scopeMeta.color}`}
                        >
                          {scopeMeta.labelVi}
                        </span>
                        {voucher.category && (
                          <div
                            className="text-xs text-ink-2 mt-1 truncate max-w-[120px]"
                            title={voucher.category.name}
                          >
                            DM: {voucher.category.name}
                          </div>
                        )}
                        {voucher.product && (
                          <div
                            className="text-xs text-ink-2 mt-1 truncate max-w-[120px]"
                            title={voucher.product.name}
                          >
                            SP: {voucher.product.name}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-ink">
                          {voucher.type === 'PERCENTAGE'
                            ? `${voucher.value}%`
                            : formatPrice(Number(voucher.value), locale)}
                        </div>
                        {voucher.minOrderValue && Number(voucher.minOrderValue) > 0 && (
                          <div className="text-xs text-ink-2 mt-0.5">
                            Min: {formatPrice(Number(voucher.minOrderValue), locale)}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-ink-2">
                        {voucher.endDate
                          ? new Date(voucher.endDate).toLocaleDateString(
                              locale === 'vi' ? 'vi-VN' : 'en-US'
                            )
                          : t('unlimited')}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-medium text-ink">{voucher.usedCount}</span>
                        <span className="text-ink-2"> / {voucher.usageLimit || '∞'}</span>
                      </td>
                      <td className="px-5 py-3.5 text-ink-2 font-medium">
                        {t('times', { count: voucher.perUserLimit || 1 })}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            voucher.isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {voucher.isActive ? t('active') : t('disabled')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setHistoryVoucher(voucher)}
                            className="p-1.5 hover:bg-gray-100 text-ink-2 hover:text-primary rounded-lg transition-colors"
                            title={t('usageHistory')}
                          >
                            <History className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(voucher)}
                            className="p-1.5 hover:bg-gray-100 text-ink-2 hover:text-blue-600 rounded-lg transition-colors"
                            title={t('editVoucher')}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggle(voucher.id)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                            title={voucher.isActive ? t('disabled') : t('active')}
                          >
                            {voucher.isActive ? (
                              <EyeOff className="w-4 h-4 text-orange-500" />
                            ) : (
                              <Eye className="w-4 h-4 text-emerald-600" />
                            )}
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
        <AdminPagination
          page={page}
          totalPages={totalPages}
          onPageChange={(p) => fetchVouchers(p, search)}
        />
      </div>

      <VoucherFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSaveVoucher}
        editingVoucher={editingVoucher}
      />

      <VoucherUsageModal
        isOpen={!!historyVoucher}
        onClose={() => setHistoryVoucher(null)}
        voucher={historyVoucher}
      />
    </div>
  );
}
