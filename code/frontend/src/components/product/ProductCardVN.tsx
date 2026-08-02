'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  isFlashSale?: boolean;
  flashSaleData?: {
    sold: number;
    total: number;
  };
}

export default function ProductCardVN({ product, isFlashSale, flashSaleData }: ProductCardProps) {
  const t = useTranslations('product');
  const hasDiscount = !!(
    product.discountPrice && Number(product.discountPrice) < Number(product.price)
  );
  const currentPrice = hasDiscount ? Number(product.discountPrice) : Number(product.price);
  const originalPrice = hasDiscount ? Number(product.price) : undefined;
  const discountPercentage =
    hasDiscount && originalPrice
      ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
      : undefined;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <Link
      href={`/products/${product.slug || product.id}`}
      className="group bg-white p-4 rounded-xl border border-rule hover:shadow-lg transition-all flex flex-col h-full"
    >
      {/* AI Score Badge */}
      {product.aiScore && (
        <div className="mb-3 inline-flex items-center gap-1 bg-purple-50 text-purple-700 text-xs font-semibold px-2 py-1 rounded-md border border-purple-100 self-start">
          ✨ {product.aiScore}% {t('aiMatch')}
        </div>
      )}

      {/* Image Area */}
      <div className="relative aspect-square w-full bg-paper-2 rounded-lg mb-4 overflow-hidden">
        <Image
          src={product.thumbnailUrl || '/placeholder.png'}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {discountPercentage && !isFlashSale && (
          <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded">
            {t('discount', { percent: discountPercentage })}
          </div>
        )}
        {discountPercentage && isFlashSale && (
          <div className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold px-2 py-1.5 rounded-bl-lg shadow-md z-10">
            {t('discount', { percent: discountPercentage })}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-grow justify-between">
        <div>
          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] bg-gray-100 text-ink-2 px-2 py-0.5 rounded border border-gray-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <h3 className="font-medium text-ink line-clamp-2 mb-2 text-sm md:text-base group-hover:text-primary transition-colors">
            {product.name}
          </h3>
        </div>

        <div className="mt-2">
          <div className="flex items-end gap-2 flex-wrap">
            <div
              className={
                isFlashSale
                  ? 'text-red-600 font-bold text-lg md:text-xl'
                  : 'text-primary font-bold text-lg md:text-xl'
              }
            >
              {formatPrice(currentPrice)}
            </div>
            {originalPrice && (
              <div className="text-muted text-sm line-through mb-0.5">
                {formatPrice(originalPrice)}
              </div>
            )}
          </div>

          {isFlashSale && flashSaleData && (
            <div className="mt-3 relative w-full h-5 bg-red-100 rounded-full overflow-hidden flex items-center justify-center">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full"
                style={{ width: `${(flashSaleData.sold / flashSaleData.total) * 100}%` }}
              ></div>
              <span className="relative z-10 text-[10px] font-bold text-white shadow-sm flex items-center gap-1">
                🔥 Còn {flashSaleData.total - flashSaleData.sold}/{flashSaleData.total} suất
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
