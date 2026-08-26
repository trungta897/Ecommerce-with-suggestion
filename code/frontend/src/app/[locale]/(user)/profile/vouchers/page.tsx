'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { BaseButton } from '@/components/base';
import {
  Ticket,
  Percent,
  Truck,
  Copy,
  Check,
  ChevronLeft,
  Calendar,
} from '@/components/base/icons';
import { voucherService } from '@/services/voucher-service';
import { VoucherItem, VoucherType } from '@/types/voucher';
import { VOUCHER_SCOPES } from '@/constants/voucher';
import { useToast } from '@/providers/toast-provider';
import Link from 'next/link';

export default function ProfileVouchersPage() {
  const t = useTranslations('voucher');
  const toast = useToast();
  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const res = await voucherService.getPublicVouchers(1, 50);
      setVouchers(res.data || []);
    } catch (err) {
      console.error('Failed to fetch public vouchers', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Đã sao chép mã ${code} vào bộ nhớ tạm!`, 'Thành công');
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const filteredVouchers = vouchers.filter((v) => {
    if (filterType === 'ALL') return true;
    return v.type === filterType;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/profile"
            className="inline-flex items-center gap-1.5 text-xs text-ink-2 hover:text-primary font-medium mb-2 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Quay lại trang cá nhân
          </Link>
          <div className="flex items-center gap-2.5">
            <Ticket className="w-7 h-7 text-primary" />
            <h1 className="text-2xl font-bold text-ink">{t('myVouchers')}</h1>
          </div>
          <p className="text-sm text-ink-2 mt-1">{t('myVouchersDesc')}</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'ALL', label: 'Tất cả' },
            { key: 'PERCENTAGE' as VoucherType, label: 'Giảm %' },
            { key: 'FIXED_AMOUNT' as VoucherType, label: 'Giảm tiền' },
            { key: 'FREE_SHIPPING' as VoucherType, label: 'Freeship' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterType(tab.key)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === tab.key
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-paper-2 text-ink-2 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Voucher Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-36 bg-paper-2 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredVouchers.length === 0 ? (
        <div className="bg-white border border-rule rounded-2xl p-12 text-center">
          <Ticket className="w-12 h-12 text-muted mx-auto mb-3" />
          <p className="text-ink font-semibold">{t('noVouchers')}</p>
          <p className="text-sm text-ink-2 mt-1">
            Các chương trình ưu đãi mới sẽ sớm được cập nhật!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredVouchers.map((voucher) => {
            const scopeMeta = VOUCHER_SCOPES[voucher.scope] || VOUCHER_SCOPES.CART;
            const isCopied = copiedCode === voucher.code;

            return (
              <div
                key={voucher.id}
                className="bg-white border border-rule hover:border-primary/40 rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between relative overflow-hidden group"
              >
                {/* Top Badge */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-2.5 rounded-xl ${
                        voucher.type === 'FREE_SHIPPING'
                          ? 'bg-emerald-100 text-emerald-700'
                          : voucher.type === 'PERCENTAGE'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {voucher.type === 'FREE_SHIPPING' ? (
                        <Truck className="w-5 h-5" />
                      ) : (
                        <Percent className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-ink text-base">
                        {voucher.type === 'FREE_SHIPPING'
                          ? 'Miễn phí vận chuyển'
                          : voucher.type === 'PERCENTAGE'
                            ? `Giảm ${voucher.value}%`
                            : `Giảm ${Number(voucher.value).toLocaleString('vi-VN')}đ`}
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${scopeMeta.color}`}
                      >
                        {scopeMeta.labelVi}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs bg-gray-100 text-ink-2 px-2.5 py-1 rounded-full font-medium">
                    Còn {voucher.usageLimit ? voucher.usageLimit - voucher.usedCount : 'Nhiều'} lượt
                  </span>
                </div>

                {/* Conditions / Scope specifics */}
                <div className="text-xs text-ink-2 space-y-1 mb-4">
                  {voucher.maxDiscount && (
                    <div>• Giảm tối đa: {Number(voucher.maxDiscount).toLocaleString('vi-VN')}đ</div>
                  )}
                  {voucher.minOrderValue && Number(voucher.minOrderValue) > 0 && (
                    <div>
                      • Đơn tối thiểu: {Number(voucher.minOrderValue).toLocaleString('vi-VN')}đ
                    </div>
                  )}
                  {voucher.category && <div>• Áp dụng cho: Danh mục {voucher.category.name}</div>}
                  {voucher.product && <div>• Áp dụng cho: Sản phẩm {voucher.product.name}</div>}
                  <div className="flex items-center gap-1 text-ink-2 pt-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>HSD: {new Date(voucher.endDate).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>

                {/* Code action footer */}
                <div className="pt-3 border-t border-dashed border-rule flex items-center justify-between">
                  <div className="font-mono font-bold text-sm bg-primary/10 text-primary px-3 py-1.5 rounded-lg border border-primary/20">
                    {voucher.code}
                  </div>
                  <BaseButton
                    size="sm"
                    variant={isCopied ? 'default' : 'outline'}
                    onClick={() => handleCopyCode(voucher.code)}
                    className="flex items-center gap-1 text-xs"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        {t('copied')}
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        {t('copyCode')}
                      </>
                    )}
                  </BaseButton>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
