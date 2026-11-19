'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { BaseButton, BaseInput } from '@/components/base';
import { CreditCard, Ticket, Check, X } from '@/components/base/icons';
import { useToast } from '@/providers/toast-provider';
import { voucherService } from '@/services/voucher-service';
import { formatPrice } from '@/utils/format';
import { getApiErrorMessage } from '@/utils/get-api-error-message';
import { useAuthStore } from '@/store';
import { ValidateVoucherCartItem } from '@/types/voucher';
import { CheckoutVoucherModal } from './CheckoutVoucherModal';

interface AppliedVoucher {
  id: string;
  code: string;
  type: string;
}

interface PaymentFormProps {
  paymentMethod: 'vnpay' | 'cod';
  voucherCode: string;
  discount: number;
  appliedVoucher: AppliedVoucher | null;
  subtotal: number;
  phone: string;
  cartItems?: ValidateVoucherCartItem[];
  onPaymentMethodChange: (method: 'vnpay' | 'cod') => void;
  onVoucherCodeChange: (code: string) => void;
  onDiscountChange: (discount: number) => void;
  onAppliedVoucherChange: (voucher: AppliedVoucher | null) => void;
  useVipPoints?: boolean;
  onUseVipPointsChange?: (use: boolean) => void;
}

export function PaymentForm({
  paymentMethod,
  voucherCode,
  discount,
  appliedVoucher,
  subtotal,
  phone,
  cartItems = [],
  onPaymentMethodChange,
  onVoucherCodeChange,
  onDiscountChange,
  onAppliedVoucherChange,
  useVipPoints,
  onUseVipPointsChange,
}: PaymentFormProps) {
  const locale = useLocale();
  const t = useTranslations('checkout');
  const tVoucher = useTranslations('voucher');
  const toast = useToast();
  const { user } = useAuthStore();

  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [validating, setValidating] = useState(false);

  const handleValidateAndApply = async (codeToApply: string) => {
    if (!codeToApply.trim()) {
      toast.error(t('toast.voucherErrorMessage'), t('toast.voucherErrorTitle'));
      return;
    }
    const code = codeToApply.trim().toUpperCase();

    try {
      setValidating(true);
      const response = await voucherService.validateVoucher({
        code,
        subtotal,
        phone,
        items: cartItems,
      });

      if (response.valid) {
        onVoucherCodeChange(response.code);
        onDiscountChange(response.discountAmount);
        onAppliedVoucherChange({
          id: response.voucherId,
          code: response.code,
          type: response.type,
        });
        toast.success(t('toast.voucherSuccessMessage'), t('toast.voucherSuccessTitle'));
      }
    } catch (err: unknown) {
      onDiscountChange(0);
      onAppliedVoucherChange(null);
      const errorMsg = getApiErrorMessage(err) ?? t('toast.voucherErrorMessage');
      toast.error(errorMsg, t('toast.voucherErrorTitle'));
    } finally {
      setValidating(false);
    }
  };

  const handleRemoveVoucher = () => {
    onDiscountChange(0);
    onAppliedVoucherChange(null);
    onVoucherCodeChange('');
  };

  return (
    <div className="bg-white border border-rule rounded-xl p-6 space-y-6 shadow-sm">
      <h2 className="text-lg font-bold text-ink mb-4 border-b border-rule pb-3">
        {t('paymentMethod')}
      </h2>
      <div className="space-y-3">
        {(['vnpay', 'cod'] as const).map((method) => (
          <label
            key={method}
            className={`flex items-center gap-3.5 p-4 rounded-xl border cursor-pointer transition-all ${
              paymentMethod === method
                ? 'border-primary bg-primary/5 font-semibold text-primary'
                : 'border-rule hover:border-ink-2 text-ink'
            }`}
          >
            <input
              type="radio"
              name="payment"
              value={method}
              checked={paymentMethod === method}
              onChange={(e) => onPaymentMethodChange(e.target.value as 'vnpay' | 'cod')}
              className="accent-primary w-4 h-4"
            />
            <CreditCard className="w-5 h-5 text-ink-2 flex-shrink-0" />
            <span className="text-sm">{t(method)}</span>
          </label>
        ))}
      </div>

      {/* Voucher */}
      <div className="pt-4 border-t border-rule space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-ink flex items-center gap-2">
            <Ticket className="w-4 h-4 text-primary" />
            {t('voucher')}
          </label>
          <button
            type="button"
            onClick={() => setIsVoucherModalOpen(true)}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            {tVoucher('selectVoucher')}
          </button>
        </div>

        <div className="flex gap-2.5">
          <BaseInput
            placeholder={t('voucherPlaceholder')}
            value={voucherCode}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onVoucherCodeChange(e.target.value)
            }
            className="flex-1 uppercase font-mono"
          />
          <BaseButton
            type="button"
            variant="outline"
            disabled={validating || !voucherCode.trim()}
            onClick={() => handleValidateAndApply(voucherCode)}
          >
            {validating ? tVoucher('checking') : t('applyVoucher')}
          </BaseButton>
        </div>

        {appliedVoucher && (
          <div className="flex justify-between items-center bg-emerald-50 text-emerald-800 p-3.5 rounded-xl border border-emerald-200 shadow-sm animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <span className="p-1 bg-emerald-200/60 rounded-full text-emerald-800">
                <Check className="w-3.5 h-3.5" />
              </span>
              <div>
                <span className="text-xs font-mono font-bold text-emerald-900 mr-2">
                  {appliedVoucher.code}
                </span>
                <span className="text-sm font-medium">- {formatPrice(discount, locale)}</span>
              </div>
            </div>
            <button
              onClick={handleRemoveVoucher}
              className="text-xs font-bold text-red-600 hover:text-red-700 underline flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              {t('remove')}
            </button>
          </div>
        )}
      </div>

      {/* VIP Points */}
      {user && user.vipPoints && user.vipPoints > 0 && onUseVipPointsChange && (
        <div className="pt-4 border-t border-rule space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-ink">{t('useVipPoints')}</span>
              <span className="text-xs text-ink-2">
                {t('vipPointsHint', {
                  points: user.vipPoints,
                  amount: formatPrice(user.vipPoints * 10, locale),
                })}
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={useVipPoints || false}
                onChange={(e) => onUseVipPointsChange(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      )}

      {/* Checkout Voucher Modal */}
      <CheckoutVoucherModal
        isOpen={isVoucherModalOpen}
        onClose={() => setIsVoucherModalOpen(false)}
        onSelectVoucher={handleValidateAndApply}
        selectedCode={appliedVoucher?.code}
        subtotal={subtotal}
        cartItems={cartItems}
      />
    </div>
  );
}
