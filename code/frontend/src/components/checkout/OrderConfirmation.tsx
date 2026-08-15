'use client';

import { useLocale, useTranslations } from 'next-intl';
import { User, Phone, MapPin } from '@/components/base/icons';
import Image from 'next/image';
import { formatPrice } from '@/utils/format';

interface CartProduct {
  product_id: string;
  quantity: number;
  product?: {
    name: string;
    price: number;
    discountPrice?: number;
    thumbnailUrl?: string;
  };
}

interface ShippingData {
  fullName: string;
  phone: string;
  address: string;
}

interface OrderConfirmationProps {
  shippingData: ShippingData;
  cartProducts: CartProduct[];
  getProductPrice: (product?: { price: number; discountPrice?: number }) => number;
}

export function OrderConfirmation({
  shippingData,
  cartProducts,
  getProductPrice,
}: OrderConfirmationProps) {
  const locale = useLocale();
  const t = useTranslations('checkout');

  return (
    <div className="bg-white border border-rule rounded-xl p-6 space-y-6 shadow-sm">
      <h2 className="text-lg font-bold text-ink mb-2 border-b border-rule pb-3">{t('step3')}</h2>

      {/* Summary Box of Recipient Info */}
      <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-2 text-xs text-ink-2">
        <h3 className="font-bold text-sm text-indigo-900 mb-2 flex items-center gap-2">
          <User className="w-4 h-4 text-indigo-500" />
          {t('shippingInfo')}
        </h3>
        <div className="flex items-center gap-2 text-ink">
          <User className="w-3.5 h-3.5 text-gray-400" />
          <span className="font-semibold">{shippingData.fullName}</span>
        </div>
        <div className="flex items-center gap-2 text-ink">
          <Phone className="w-3.5 h-3.5 text-gray-400" />
          <span>{shippingData.phone}</span>
        </div>
        <div className="flex items-start gap-2 text-ink pt-1 border-t border-indigo-100">
          <MapPin className="w-3.5 h-3.5 text-indigo-500 mt-0.5 flex-shrink-0" />
          <span className="font-medium text-indigo-950">{shippingData.address}</span>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <h3 className="font-bold text-sm text-ink mb-2">{t('orderSummary')}</h3>
        {cartProducts.map((item) => (
          <div
            key={item.product_id}
            className="flex items-center gap-3 py-2 border-b border-rule last:border-0"
          >
            <div className="w-12 h-12 bg-paper-2 rounded-lg flex-shrink-0 relative overflow-hidden flex items-center justify-center">
              <Image
                src={item.product?.thumbnailUrl || ''}
                alt={item.product?.name || ''}
                fill
                className="object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink truncate">{item.product?.name}</p>
              <p className="text-xs text-ink-2">x{item.quantity}</p>
            </div>
            <div className="text-right">
              <span className="font-semibold text-primary">
                {formatPrice(getProductPrice(item.product) * item.quantity, locale)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
