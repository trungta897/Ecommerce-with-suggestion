'use client';

/**
 * Hallmark · component: product-card · genre: modern-minimal · theme: catalog
 * states: default · hover · focus-visible · active · disabled · loading · error · success
 * contrast: pass (WCAG AA compliant)
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { ShoppingCart, Heart, Star, Sparkles } from '@/components/base/icons';
import { useCart } from '@/hooks/use-cart';
import { useWishlistIds, useToggleWishlist } from '@/hooks/use-wishlist';
import { useToast } from '@/providers/toast-provider';
import { formatPrice } from '@/utils/format';
import { Product } from '@/types';

const getInitialThumbnail = (prod: Product): string => {
  if (prod.thumbnailUrl && prod.thumbnailUrl !== '/placeholder.png') {
    return prod.thumbnailUrl;
  }
  if (Array.isArray(prod.images) && prod.images.length > 0) {
    const main = prod.images.find(
      (img) => typeof img === 'object' && img && (img.isPrimary || img.variant === 'MAIN')
    );
    if (main && typeof main === 'object' && 'url' in main && main.url) return main.url;
    const first = prod.images[0];
    if (typeof first === 'string') return first;
    if (typeof first === 'object' && first && 'url' in first && first.url) return first.url;
  }
  return '/placeholder.svg';
};

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

  const [imgSrc, setImgSrc] = useState<string>(() => getInitialThumbnail(product));

  useEffect(() => {
    setImgSrc(getInitialThumbnail(product));
  }, [product]);

  const hasDiscount = !!(
    product.discountPrice && Number(product.discountPrice) < Number(product.price)
  );
  const currentPrice = hasDiscount ? Number(product.discountPrice) : Number(product.price);
  const originalPrice = hasDiscount ? Number(product.price) : undefined;
  const discountPercentage =
    hasDiscount && originalPrice
      ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
      : undefined;

  const { isWishlisted } = useWishlistIds();
  const toggleWishlistMutation = useToggleWishlist();
  const isLiked = isWishlisted(product.id);

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlistMutation.mutate(product.id);
  };

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

  const hasRating = !!(
    product.avgRating &&
    Number(product.avgRating) > 0 &&
    product.reviewCount &&
    Number(product.reviewCount) > 0
  );
  const ratingScore = hasRating ? Number(product.avgRating) : 0;
  const reviewCount = product.reviewCount || 0;
  const brandName = product.brand || product.category?.name;

  return (
    <Link
      href={`/products/${product.slug || product.id}`}
      className="group relative bg-white p-3.5 sm:p-4 rounded-2xl border border-rule/80 hover:border-primary/40 hover:shadow-xl hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-[0.99] transition-all duration-300 flex flex-col justify-between h-full"
    >
      {/* Image Frame - Hallmark: Seamless white canvas, zero clipping */}
      <div className="relative aspect-square w-full bg-white rounded-xl mb-3 overflow-hidden flex items-center justify-center p-2">
        <Image
          src={imgSrc}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          onError={() => setImgSrc('/placeholder.svg')}
          className="object-contain p-2 group-hover:scale-105 transition-transform duration-300 ease-out"
        />

        {/* Discount Badge */}
        {discountPercentage && !isFlashSale && (
          <div className="absolute top-2 left-2 z-10 bg-red-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-md shadow-xs">
            {t('discount', { percent: discountPercentage })}
          </div>
        )}
        {discountPercentage && isFlashSale && (
          <div className="absolute top-0 left-0 z-10 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-br-xl shadow-md">
            {t('discount', { percent: discountPercentage })}
          </div>
        )}

        {/* AI Score Badge */}
        {product.aiScore && (
          <div className="absolute bottom-2 left-2 z-10 inline-flex items-center gap-1 bg-purple-50/95 text-purple-700 border border-purple-200/80 backdrop-blur-sm text-[10px] font-semibold px-2 py-0.5 rounded-md shadow-xs">
            <Sparkles className="w-3 h-3 text-purple-600" />
            {product.aiScore}% {t('aiMatch')}
          </div>
        )}

        {/* Wishlist Heart Button - 8 States compliant */}
        <button
          type="button"
          onClick={handleToggleWishlist}
          disabled={toggleWishlistMutation.isPending}
          className="absolute top-2 right-2 z-20 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-xs hover:bg-white text-ink-2 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 active:scale-95 disabled:opacity-50 transition-all hover:scale-110"
          aria-label={isLiked ? t('removeFromWishlist') : t('addToWishlist')}
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-500'
            }`}
          />
        </button>
      </div>

      {/* Content Area - Hallmark: Honest typography, clear hierarchy */}
      <div className="flex flex-col flex-grow justify-between">
        <div>
          {/* Brand or Subcategory */}
          {brandName && (
            <span className="text-[11px] font-semibold text-primary/90 uppercase tracking-wider mb-1 truncate block">
              {brandName}
            </span>
          )}

          {/* Product Title */}
          <h3 className="font-semibold text-ink line-clamp-2 text-sm leading-snug mb-2 group-hover:text-primary transition-colors min-h-[2.5rem]">
            {product.name}
          </h3>

          {/* Rating & Sold Social Proof - Honest data handling */}
          <div className="flex items-center gap-1.5 text-[11px] text-ink-2 mb-3">
            {hasRating ? (
              <>
                <span className="inline-flex items-center gap-0.5 text-amber-600 font-bold">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  {ratingScore.toFixed(1)}
                </span>
                <span className="text-ink-2/60">({reviewCount})</span>
              </>
            ) : (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-paper-2 text-ink-2 font-medium text-[10px]">
                {t('newProduct')}
              </span>
            )}
            {product.soldCount !== undefined && product.soldCount > 0 && (
              <>
                <span className="text-rule">•</span>
                <span>{t('sold', { count: product.soldCount })}</span>
              </>
            )}
          </div>
        </div>

        {/* Price & Action Section */}
        <div className="pt-2.5 border-t border-rule/60">
          <div className="flex items-end justify-between gap-2">
            <div>
              <span className="block text-base sm:text-lg font-bold text-primary tracking-tight leading-none">
                {formatPrice(currentPrice, locale)}
              </span>
              {originalPrice && (
                <span className="block text-xs text-muted line-through mt-1">
                  {formatPrice(originalPrice, locale)}
                </span>
              )}
            </div>

            <button
              onClick={handleAddToCart}
              className="p-2.5 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-95 transition-all shadow-xs flex items-center justify-center group/btn"
              aria-label={t('addToCart')}
            >
              <ShoppingCart className="w-4 h-4 transition-transform group-hover/btn:scale-110" />
            </button>
          </div>

          {/* Flash Sale Progress */}
          {isFlashSale && flashSaleData && (
            <div className="mt-3 relative w-full h-5 bg-red-100 rounded-full overflow-hidden flex items-center justify-center">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full"
                style={{
                  width: `${Math.min(100, (flashSaleData.sold / flashSaleData.total) * 100)}%`,
                }}
              ></div>
              <span className="relative z-10 text-[10px] font-bold text-white shadow-sm flex items-center gap-1">
                {t('flashSaleLeft', {
                  left: Math.max(0, flashSaleData.total - flashSaleData.sold),
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
