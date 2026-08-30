'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { BaseModal, BaseButton } from '@/components/base';
import { History, X } from '@/components/base/icons';
import { voucherService } from '@/services/voucher-service';
import { VoucherItem, VoucherUsageLog } from '@/types/voucher';

interface VoucherUsageModalProps {
  isOpen: boolean;
  onClose: () => void;
  voucher: VoucherItem | null;
}

export function VoucherUsageModal({ isOpen, onClose, voucher }: VoucherUsageModalProps) {
  const t = useTranslations('voucher');
  const [usages, setUsages] = useState<VoucherUsageLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (isOpen && voucher) {
      fetchUsages(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, voucher]);

  const fetchUsages = async (p: number) => {
    if (!voucher) return;
    try {
      setLoading(true);
      const res = await voucherService.getVoucherUsages(voucher.id, p, 10);
      setUsages(res.data || []);
      setTotalPages(res.meta?.totalPages || 1);
      setTotal(res.meta?.total || 0);
      setPage(p);
    } catch (err: unknown) {
      console.error('Failed to load voucher usages', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !voucher) return null;

  return (
    <BaseModal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 max-w-4xl w-full">
        <div className="flex items-center justify-between pb-4 border-b border-rule mb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-ink">
              {t('usageHistory')}: <span className="text-primary font-mono">{voucher.code}</span>
            </h2>
            <span className="text-xs bg-paper-2 text-ink-2 px-2 py-0.5 rounded-full border border-rule">
              {total} lượt
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-ink-2 hover:text-ink hover:bg-paper-2 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-x-auto min-h-[250px]">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-2 border-b border-rule bg-paper-2">
                <th className="px-4 py-2.5 font-medium">{t('userName')}</th>
                <th className="px-4 py-2.5 font-medium">SĐT / Email</th>
                <th className="px-4 py-2.5 font-medium">{t('orderCode')}</th>
                <th className="px-4 py-2.5 font-medium">Giá trị đơn</th>
                <th className="px-4 py-2.5 font-medium">{t('status')}</th>
                <th className="px-4 py-2.5 font-medium">{t('usedAt')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-ink-2">
                    Đang tải lịch sử...
                  </td>
                </tr>
              ) : usages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-ink-2">
                    {t('noUsages')}
                  </td>
                </tr>
              ) : (
                usages.map((item) => (
                  <tr key={item.id} className="border-b border-rule hover:bg-paper-2">
                    <td className="px-4 py-3 font-medium text-ink">
                      {item.user?.fullName || item.order?.shippingName || 'Khách vãng lai'}
                    </td>
                    <td className="px-4 py-3 text-ink-2 text-xs">
                      <div>{item.user?.phone || item.order?.shippingPhone}</div>
                      {item.user?.email && <div>{item.user.email}</div>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-primary">
                      {item.order?.id?.slice(0, 8)}...
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {Number(item.order?.totalAmount || 0).toLocaleString('vi-VN')}đ
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {item.order?.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-2 text-xs">
                      {new Date(item.usedAt).toLocaleString('vi-VN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4 pt-3 border-t border-rule">
            <span className="text-xs text-ink-2">
              Trang {page} / {totalPages}
            </span>
            <div className="flex gap-2">
              <BaseButton
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => fetchUsages(page - 1)}
              >
                Trước
              </BaseButton>
              <BaseButton
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => fetchUsages(page + 1)}
              >
                Sau
              </BaseButton>
            </div>
          </div>
        )}
      </div>
    </BaseModal>
  );
}
