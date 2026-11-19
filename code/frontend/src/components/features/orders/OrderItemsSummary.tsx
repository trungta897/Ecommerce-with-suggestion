'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Package } from '@/components/base/icons';
import { formatPrice } from '@/utils/format';
import { OrderItem, OrderStatus } from '@/types/order';

interface OrderItemsSummaryProps {
  items?: OrderItem[];
  locale: string;
  canReview?: boolean;
  orderStatus?: OrderStatus | string;
  onReviewProduct?: (item: OrderItem) => void;
}

export function OrderItemsSummary({
  items,
  locale,
  canReview = false,
  orderStatus,
  onReviewProduct,
}: OrderItemsSummaryProps) {
  const t = useTranslations('order');

  const isCompleted =
    orderStatus === OrderStatus.COMPLETED || orderStatus === ('completed' as OrderStatus);

  return (
    <div className="bg-white border border-rule rounded-xl p-6 mb-6 shadow-sm">
      <h3 className="font-bold text-ink mb-4">{t('items')}</h3>
      <div className="divide-y divide-rule">
        {items?.map((item) => {
          const imageUrl = item.product?.thumbnailUrl || item.product?.images?.[0];
          const hasImage = typeof imageUrl === 'string' && imageUrl.length > 0;

          return (
            <div key={item.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
              <div className="relative w-16 h-16 bg-paper-2 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden border border-rule">
                {hasImage ? (
                  <Image
                    src={imageUrl}
                    alt={item.product?.name || t('productDefault')}
                    fill
                    sizes="64px"
                    className="object-contain p-1"
                  />
                ) : (
                  <Package className="w-6 h-6 text-ink-2" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-semibold text-ink truncate pr-2">
                    {item.product?.name || t('productDefault')}
                  </h4>
                  <span className="font-semibold text-ink whitespace-nowrap">
                    {formatPrice(item.unitPrice, locale)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-ink-2">
                    {t('quantity')}: x{item.quantity}
                  </p>
                  {canReview && isCompleted && onReviewProduct && (
                    <button
                      type="button"
                      onClick={() => onReviewProduct(item)}
                      className="text-xs text-primary font-medium hover:underline"
                    >
                      {t('writeReview')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
