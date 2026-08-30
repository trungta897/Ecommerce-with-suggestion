'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { BaseModal, BaseButton, BaseInput } from '@/components/base';
import { Ticket, X, Check, AlertCircle, Percent, Truck } from '@/components/base/icons';
import { voucherService } from '@/services/voucher-service';
import { VoucherItem, ValidateVoucherCartItem } from '@/types/voucher';
import { VOUCHER_SCOPES } from '@/constants/voucher';

interface CheckoutVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVoucher: (code: string) => void;
  selectedCode?: string | null;
  subtotal: number;
  cartItems?: ValidateVoucherCartItem[];
}

export function CheckoutVoucherModal({
  isOpen,
  onClose,
  onSelectVoucher,
  selectedCode,
  subtotal,
  cartItems = [],
}: CheckoutVoucherModalProps) {
  const t = useTranslations('voucher');
  const [publicVouchers, setPublicVouchers] = useState<VoucherItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [manualError, setManualError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchPublicVouchers();
      setManualError('');
    }
  }, [isOpen]);

  const fetchPublicVouchers = async () => {
    try {
      setLoading(true);
      const res = await voucherService.getPublicVouchers(1, 30);
      setPublicVouchers(res.data || []);
    } catch (err) {
      console.error('Failed to load public vouchers', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;

    try {
      setValidating(true);
      setManualError('');
      const res = await voucherService.validateVoucher({
        code: manualCode.trim().toUpperCase(),
        subtotal,
        items: cartItems,
      });

      if (res.valid) {
        onSelectVoucher(res.code);
        onClose();
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        t('noVouchers');
      setManualError(msg);
    } finally {
      setValidating(false);
    }
  };

  const checkEligibility = (voucher: VoucherItem) => {
    // 1. Min order value check
    if (voucher.minOrderValue && subtotal < Number(voucher.minOrderValue)) {
      return {
        eligible: false,
        reason: t('ineligibleHint'),
      };
    }

    // 2. Scope check
    if (voucher.scope === 'CATEGORY' && voucher.categoryId) {
      const hasCategory = cartItems.some((item) => item.categoryId === voucher.categoryId);
      if (!hasCategory) {
        return {
          eligible: false,
          reason: t('applyToCategory', {
            name: voucher.category?.name || t('specifiedProduct'),
          }),
        };
      }
    }

    if (voucher.scope === 'PRODUCT' && voucher.productId) {
      const hasProduct = cartItems.some((item) => item.productId === voucher.productId);
      if (!hasProduct) {
        return {
          eligible: false,
          reason: t('productSpecificOnly', {
            product: voucher.product?.name || t('specifiedProduct'),
          }),
        };
      }
    }

    return { eligible: true, reason: '' };
  };

  if (!isOpen) return null;

  return (
    <BaseModal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 max-w-lg w-full max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-rule mb-4">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-ink">{t('selectVoucher')}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-ink-2 hover:text-ink hover:bg-paper-2 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Manual code input */}
        <form onSubmit={handleApplyManual} className="mb-5">
          <div className="flex gap-2">
            <BaseInput
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              placeholder={t('enterCode')}
              className="font-mono uppercase"
            />
            <BaseButton
              type="submit"
              disabled={validating || !manualCode.trim()}
              className="shrink-0"
            >
              {validating ? t('checking') : t('apply')}
            </BaseButton>
          </div>
          {manualError && (
            <div className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{manualError}</span>
            </div>
          )}
        </form>

        {/* Voucher List */}
        <div className="text-sm font-semibold text-ink mb-2">{t('availableVouchers')}</div>

        <div className="overflow-y-auto flex-1 space-y-3 pr-1">
          {loading ? (
            <div className="text-center py-10 text-ink-2 text-sm">{t('loadingVouchers')}</div>
          ) : publicVouchers.length === 0 ? (
            <div className="text-center py-10 text-ink-2 text-sm">{t('noVouchers')}</div>
          ) : (
            publicVouchers.map((voucher) => {
              const { eligible, reason } = checkEligibility(voucher);
              const isSelected = selectedCode === voucher.code;
              const scopeMeta = VOUCHER_SCOPES[voucher.scope] || VOUCHER_SCOPES.CART;

              return (
                <div
                  key={voucher.id}
                  className={`border rounded-xl p-3.5 flex items-center justify-between transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : eligible
                        ? 'border-rule bg-white hover:border-primary/40'
                        : 'border-rule/60 bg-gray-50/70 opacity-70'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0 pr-3">
                    <div
                      className={`p-2.5 rounded-lg shrink-0 mt-0.5 ${
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

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-ink text-sm">{voucher.code}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${scopeMeta.color}`}
                        >
                          {scopeMeta.labelVi}
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-primary mt-0.5">
                        {voucher.type === 'FREE_SHIPPING'
                          ? t('freeShippingLabel')
                          : voucher.type === 'PERCENTAGE'
                            ? voucher.maxDiscount
                              ? t('discountPercentageMaxText', {
                                  value: voucher.value,
                                  max: Number(voucher.maxDiscount).toLocaleString('vi-VN'),
                                })
                              : t('discountPercentageText', { value: voucher.value })
                            : t('discountFixedText', {
                                value: Number(voucher.value).toLocaleString('vi-VN'),
                              })}
                      </div>

                      {voucher.minOrderValue && Number(voucher.minOrderValue) > 0 && (
                        <div className="text-[11px] text-ink-2 mt-0.5">
                          {t('minOrderValueLabel', {
                            min: Number(voucher.minOrderValue).toLocaleString('vi-VN'),
                          })}
                        </div>
                      )}

                      {!eligible && reason && (
                        <div className="text-[11px] text-amber-700 mt-1 font-medium flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span className="truncate">{reason}</span>
                        </div>
                      )}

                      <div className="text-[10px] text-ink-2 mt-1">
                        {t('expiryDate', {
                          date: new Date(voucher.endDate).toLocaleDateString('vi-VN'),
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isSelected ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-lg">
                        <Check className="w-3.5 h-3.5" />
                        {t('applied')}
                      </span>
                    ) : (
                      <BaseButton
                        size="sm"
                        variant={eligible ? 'default' : 'outline'}
                        disabled={!eligible}
                        onClick={() => {
                          onSelectVoucher(voucher.code);
                          onClose();
                        }}
                      >
                        {t('apply')}
                      </BaseButton>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </BaseModal>
  );
}
