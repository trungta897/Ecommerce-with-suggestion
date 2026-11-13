'use client';

import React from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Package } from '@/components/base/icons';

interface PreviewProduct {
  id: string;
  name: string;
  price: number | string;
  stock?: number;
  thumbnailUrl?: string | null;
  images?: Array<{ url: string }>;
}

interface DiscountBatchPreviewProps {
  product: PreviewProduct;
  originalPrice: number;
  discountPercent: number;
}

export function DiscountBatchPreview({
  product,
  originalPrice,
  discountPercent,
}: DiscountBatchPreviewProps) {
  const t = useTranslations('admin.promotions');
  const thumbUrl = product.thumbnailUrl || product.images?.[0]?.url || '';

  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl bg-paper-2/70 border border-rule">
      <div className="relative w-14 h-14 rounded-xl bg-white border border-rule overflow-hidden shrink-0 flex items-center justify-center">
        {thumbUrl ? (
          <Image
            src={thumbUrl}
            alt={product.name}
            fill
            sizes="56px"
            className="object-contain p-1"
          />
        ) : (
          <Package className="w-6 h-6 text-ink-3" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink truncate">{product.name}</p>
        <div className="flex flex-wrap items-center gap-3 text-xs text-ink-2 mt-1">
          <span>
            {t('original_price_label')}{' '}
            <strong className="text-ink">{originalPrice.toLocaleString('vi-VN')}đ</strong>
          </span>
          {product.stock !== undefined && (
            <span>
              {t('stock_label')} <strong className="text-ink">{product.stock}</strong>
            </span>
          )}
          {discountPercent > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">
              {t('discount_badge', { percent: discountPercent })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
