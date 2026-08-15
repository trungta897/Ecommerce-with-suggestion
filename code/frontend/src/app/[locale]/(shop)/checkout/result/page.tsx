'use client';

import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { BaseButton } from '@/components/base';
import { useCartStore } from '@/store';
import { useEffect } from 'react';

export default function CheckoutResultPage() {
  const t = useTranslations('checkout');
  const searchParams = useSearchParams();
  const status = searchParams.get('status');
  const appTransId = searchParams.get('apptransid');
  const { clearCart } = useCartStore();

  const isSuccess = status === '1';

  useEffect(() => {
    if (isSuccess) {
      clearCart();
    }
  }, [isSuccess, clearCart]);

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      {isSuccess ? (
        <>
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center animate-in zoom-in duration-300">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-ink mb-2">{t('orderSuccess')}</h2>
          <p className="text-ink-2 mb-8">{t('orderSuccessDesc')}</p>
          <div className="flex gap-4 justify-center">
            <Link href="/products">
              <BaseButton variant="outline">{t('continueShopping')}</BaseButton>
            </Link>
            <Link href="/orders">
              <BaseButton>{t('viewOrder')}</BaseButton>
            </Link>
          </div>
        </>
      ) : (
        <>
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center animate-in zoom-in duration-300">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-ink mb-2">{t('paymentFailed')}</h2>
          <p className="text-ink-2 mb-8">
            {t('paymentFailedDesc') || 'Thanh toán không thành công hoặc đã bị huỷ.'}
          </p>
          <div className="bg-gray-50 p-4 rounded-lg mb-8 text-sm text-left inline-block">
            <p><span className="font-semibold">Mã giao dịch:</span> {appTransId || 'Không xác định'}</p>
          </div>
          <div className="flex gap-4 justify-center">
            <Link href="/orders">
              <BaseButton variant="primary" className="flex items-center gap-2">
                Pay Again <ArrowRight className="w-4 h-4" />
              </BaseButton>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
