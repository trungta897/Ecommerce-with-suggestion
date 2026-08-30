'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { ShoppingCart } from '@/components/base/icons';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/providers/toast-provider';
import { formatPrice } from '@/utils/format';
import { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  isFlashSale?: boolean;
  flashSaleData?: {
    sold: number;
    total: number;
  };
}

export default function ProductCard({ product, isFlashSale, flashSaleData }: ProductCardProps) {
  const locale = useLocale();
  const t = useTranslations('product');
  const tCommon = useTranslations('common');
  const { addItem } = useCart();
  const toast = useToast();

  const router = useRouter();

  const hasDiscount = !!(
    product.discountPrice && Number(product.discountPrice) < Number(product.price)
  );
  const currentPrice = hasDiscount ? Number(product.discountPrice) : Number(product.price);
  const originalPrice = hasDiscount ? Number(product.price) : undefined;
  const discountPercentage =
    hasDiscount && originalPrice
      ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
      : undefined;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      addItem({
        id: product.id,
        userId: '',
        productId: product.id,
        quantity: 1,
        product,
      });
      toast.success(t('addedToCartSuccess'), undefined, undefined, {
        label: tCommon('viewCart'),
        onClick: () => router.push('/cart'),
      });
    } catch {
      toast.error(t('addedToCartFailed'));
    }
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
          {/* Price & Add to cart */}
          <div className="flex items-end justify-between gap-2">
            <div>
              <span className="block text-lg font-bold text-primary">
                {formatPrice(currentPrice, locale)}
              </span>
              {originalPrice && (
                <span className="block text-sm text-muted line-through">
                  {formatPrice(originalPrice, locale)}
                </span>
              )}
            </div>
            <button
              onClick={handleAddToCart}
              className="p-2 bg-primary/10 text-primary rounded-full hover:bg-primary hover:text-white transition-colors"
              aria-label={t('addToCart')}
            >
              <ShoppingCart size={20} />
            </button>
          </div>

          {isFlashSale && flashSaleData && (
            <div className="mt-3 relative w-full h-5 bg-red-100 rounded-full overflow-hidden flex items-center justify-center">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full"
                style={{ width: `${(flashSaleData.sold / flashSaleData.total) * 100}%` }}
              ></div>
              <span className="relative z-10 text-[10px] font-bold text-white shadow-sm flex items-center gap-1">
                {t('flashSaleLeft', {
                  left: flashSaleData.total - flashSaleData.sold,
                  total: flashSaleData.total,
                })}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
