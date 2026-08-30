'use client';

import React, { useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { useRecentlyViewedStore } from '@/store/useRecentlyViewedStore';
import {
  ChevronLeft,
  ChevronRight,
  Trash2,
  Eye,
  ShoppingCart,
  Star,
} from '@/components/base/icons';
import { formatPrice } from '@/utils/format';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/providers/toast-provider';
import { Product } from '@/types';

interface RecentlyViewedSliderProps {
  className?: string;
  excludeProductId?: string;
}

export const RecentlyViewedSlider: React.FC<RecentlyViewedSliderProps> = ({
  className = '',
  excludeProductId,
}) => {
  const t = useTranslations('home.sections');
  const tProd = useTranslations('product');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { addItem } = useCart();
  const toast = useToast();

  const { items, isLoading, fetchRecentlyViewed, clearAll } = useRecentlyViewedStore();

  useEffect(() => {
    fetchRecentlyViewed();
  }, [fetchRecentlyViewed]);

  const displayedItems = excludeProductId ? items.filter((p) => p.id !== excludeProductId) : items;

  if (!isLoading && displayedItems.length === 0) {
    return null;
  }

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 320;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const handleAddToCart = async (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await addItem({
        id: `${Date.now()}`,
        userId: '',
        productId: product.id,
        quantity: 1,
        product,
      });
      toast.success(tProd('addedToCartSuccess'), tProd('addedToCartTitle'));
    } catch {
      toast.error(tProd('addedToCartFailed'));
    }
  };

  return (
    <section className={`w-full ${className}`}>
      <div className="bg-paper-1 border border-rule/60 rounded-3xl p-6 sm:p-8 shadow-sm backdrop-blur-sm">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
                {t('recently_viewed_title')}
              </h2>
              <p className="text-xs sm:text-sm text-ink-2">{t('recently_viewed_subtitle')}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => clearAll()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-ink-2 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              title={t('clear_history')}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t('clear_history')}</span>
            </button>

            <div className="hidden sm:flex items-center gap-1 border-l border-rule/60 pl-2">
              <button
                onClick={() => handleScroll('left')}
                className="w-8 h-8 rounded-xl border border-rule flex items-center justify-center text-ink-2 hover:text-ink hover:bg-paper-2 transition-all active:scale-95"
                aria-label="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleScroll('right')}
                className="w-8 h-8 rounded-xl border border-rule flex items-center justify-center text-ink-2 hover:text-ink hover:bg-paper-2 transition-all active:scale-95"
                aria-label="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Container */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-rule scrollbar-track-transparent scroll-smooth snap-x snap-mandatory"
          style={{ scrollbarWidth: 'thin' }}
        >
          {displayedItems.map((product) => {
            const hasDiscount = !!(
              product.discountPrice && Number(product.discountPrice) < Number(product.price)
            );
            const price = hasDiscount ? Number(product.discountPrice) : Number(product.price);
            const oldPrice = hasDiscount ? Number(product.price) : null;
            const discountPercent =
              hasDiscount && oldPrice ? Math.round(((oldPrice - price) / oldPrice) * 100) : null;

            const firstImage =
              Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null;
            const imageUrl: string =
              product.thumbnailUrl ||
              (typeof firstImage === 'string'
                ? firstImage
                : (firstImage as { url?: string } | null)?.url) ||
              '/placeholder.png';

            return (
              <div
                key={product.id}
                className="flex-shrink-0 w-56 sm:w-64 bg-paper-2/70 hover:bg-paper-2 border border-rule/80 hover:border-primary/40 rounded-2xl p-3.5 transition-all duration-300 hover:shadow-md group snap-start flex flex-col justify-between"
              >
                <Link
                  href={`/products/${product.slug || product.id}`}
                  className="block relative aspect-square rounded-xl overflow-hidden bg-white mb-3"
                >
                  <Image
                    src={imageUrl}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 224px, 256px"
                    className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                  />
                  {discountPercent && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-md shadow-sm">
                      -{discountPercent}%
                    </span>
                  )}
                </Link>

                <div className="flex flex-col flex-grow justify-between">
                  <div>
                    {product.brand && (
                      <span className="text-[11px] font-medium text-ink-2 uppercase tracking-wider block mb-0.5">
                        {product.brand}
                      </span>
                    )}
                    <Link
                      href={`/products/${product.slug || product.id}`}
                      className="text-sm font-semibold text-ink line-clamp-2 hover:text-primary transition-colors mb-2"
                      title={product.name}
                    >
                      {product.name}
                    </Link>
                  </div>

                  <div>
                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-2">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-semibold text-ink">
                        {Number(product.avgRating || 5).toFixed(1)}
                      </span>
                      {product.soldCount ? (
                        <span className="text-[11px] text-ink-2 ml-1">
                          • {product.soldCount} đã bán
                        </span>
                      ) : null}
                    </div>

                    {/* Price & Action */}
                    <div className="flex items-center justify-between pt-1 border-t border-rule/40">
                      <div>
                        <span className="text-base font-bold text-primary block leading-tight">
                          {formatPrice(price, locale)}
                        </span>
                        {oldPrice && (
                          <span className="text-xs text-ink-2 line-through block">
                            {formatPrice(oldPrice, locale)}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={(e) => handleAddToCart(e, product)}
                        className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary-600 active:scale-90 transition-all shadow-sm"
                        title={tCommon('addToCart')}
                        aria-label="Add to cart"
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
