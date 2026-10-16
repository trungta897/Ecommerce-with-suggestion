'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle, ArrowRight, CreditCard } from '@/components/base/icons';
import Link from 'next/link';
import { BaseButton } from '@/components/base';
import { useCart } from '@/hooks/use-cart';
import { useEffect, Suspense } from 'react';
import { formatPrice } from '@/utils/format';
import { USD_TO_VND_RATE } from '@/constants/currency';

function CallbackContent() {
  const t = useTranslations('checkout');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const { clearCart } = useCart();

  const responseCode = searchParams.get('vnp_ResponseCode');
  const transactionStatus = searchParams.get('vnp_TransactionStatus');
  const rawAmount = searchParams.get('vnp_Amount');
  const bankCode = searchParams.get('vnp_BankCode');
  const txnRef = searchParams.get('vnp_TxnRef');
  const orderInfo = searchParams.get('vnp_OrderInfo');

  // '00' is success code for VNPay
  const isSuccess =
    responseCode === '00' && (!transactionStatus || transactionStatus === '00') && Boolean(txnRef);

  // Amount in VNPay is multiplied by 100 in VND
  const amountVnd = rawAmount ? Number(rawAmount) / 100 : 0;
  const amountUsd = amountVnd / USD_TO_VND_RATE;

  useEffect(() => {
    if (isSuccess) {
      clearCart();
    }
  }, [isSuccess, clearCart]);

  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      {isSuccess ? (
        <div className="bg-white border border-rule rounded-2xl p-8 shadow-sm">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center animate-in zoom-in duration-300">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-ink mb-2">{t('orderSuccess')}</h2>
          <p className="text-sm text-ink-2 mb-6">{t('orderSuccessDesc')}</p>

          {/* Transaction Summary Box */}
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 mb-8 text-sm text-left space-y-3">
            <div className="flex justify-between items-center text-xs text-ink-2 border-b border-gray-200 pb-2">
              <span className="font-semibold">{t('transactionDetails')}</span>
              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" /> Thành công
              </span>
            </div>

            {amountVnd > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-ink-2">{t('amountPaid')}:</span>
                <span className="font-bold text-base text-primary">
                  {formatPrice(amountUsd, locale)}
                </span>
              </div>
            )}

            {txnRef && (
              <div className="flex justify-between items-center">
                <span className="text-ink-2">{t('transactionCode')}:</span>
                <span className="font-semibold text-ink font-mono">{txnRef}</span>
              </div>
            )}

            {bankCode && (
              <div className="flex justify-between items-center">
                <span className="text-ink-2">{t('bankCode')}:</span>
                <span className="font-medium text-ink flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-primary" /> {bankCode}
                </span>
              </div>
            )}

            {orderInfo && (
              <div className="flex justify-between items-center text-xs text-gray-500 pt-1 border-t border-gray-100">
                <span>{t('orderInfo')}:</span>
                <span className="truncate max-w-[220px]">{orderInfo}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/products">
              <BaseButton variant="outline">{t('continueShopping')}</BaseButton>
            </Link>
            <Link href="/orders">
              <BaseButton>{t('viewOrder')}</BaseButton>
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-rule rounded-2xl p-8 shadow-sm">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center animate-in zoom-in duration-300">
            <XCircle className="w-10 h-10 text-rose-600" />
          </div>
          <h2 className="text-2xl font-bold text-ink mb-2">{t('paymentFailed')}</h2>
          <p className="text-sm text-ink-2 mb-6">{t('paymentFailedDesc')}</p>

          <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 mb-8 text-sm text-left space-y-2">
            {txnRef && (
              <div className="flex justify-between items-center">
                <span className="text-ink-2">{t('transactionCode')}:</span>
                <span className="font-semibold text-ink font-mono">{txnRef}</span>
              </div>
            )}
            {responseCode && (
              <div className="flex justify-between items-center text-xs text-rose-600">
                <span>{t('errorCode')}:</span>
                <span className="font-mono font-bold">{responseCode}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/cart">
              <BaseButton variant="outline">{t('backToCart')}</BaseButton>
            </Link>
            <Link href="/checkout">
              <BaseButton className="flex items-center gap-2">
                {t('retryPayment')} <ArrowRight className="w-4 h-4" />
              </BaseButton>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutCallbackPage() {
  const t = useTranslations('checkout');

  return (
    <Suspense
      fallback={
        <div className="max-w-lg mx-auto px-4 py-24 text-center">
          <div className="w-8 h-8 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm text-ink-2">{t('processingPayment')}</p>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
