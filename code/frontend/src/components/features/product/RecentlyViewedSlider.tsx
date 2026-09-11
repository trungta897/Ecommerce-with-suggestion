'use client';

import React, { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { useRecentlyViewedStore } from '@/store/useRecentlyViewedStore';
import { ChevronLeft, ChevronRight, Eye, Trash2 } from '@/components/base/icons';

interface RecentlyViewedSliderProps {
  className?: string;
  excludeProductId?: string;
}

export const RecentlyViewedSlider: React.FC<RecentlyViewedSliderProps> = ({
  className = '',
  excludeProductId,
}) => {
  const t = useTranslations('home.sections');
  const scrollRef = useRef<HTMLDivElement>(null);

  const { items, fetchRecentlyViewed, clearAll } = useRecentlyViewedStore();

  useEffect(() => {
    fetchRecentlyViewed();
  }, [fetchRecentlyViewed]);

  const displayedItems = excludeProductId ? items.filter((p) => p.id !== excludeProductId) : items;

  if (displayedItems.length === 0) {
    return null;
  }

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 280;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <section className={`w-full ${className}`}>
      <div className="bg-paper-1 border border-rule/60 rounded-2xl p-4 sm:p-5 shadow-sm backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-3.5">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" />
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-ink/80">
              {t('recently_viewed_title')}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => clearAll()}
              className="p-1.5 rounded-lg text-ink-3 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all active:scale-90 flex items-center justify-center"
              title={t('clear_history')}
              aria-label={t('clear_history')}
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {displayedItems.length > 6 && (
              <div className="hidden sm:flex items-center gap-1 border-l border-rule/60 pl-2">
                <button
                  onClick={() => handleScroll('left')}
                  className="w-7 h-7 rounded-lg border border-rule flex items-center justify-center text-ink-2 hover:text-ink hover:bg-paper-2 transition-all active:scale-95"
                  aria-label="Previous"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleScroll('right')}
                  className="w-7 h-7 rounded-lg border border-rule flex items-center justify-center text-ink-2 hover:text-ink hover:bg-paper-2 transition-all active:scale-95"
                  aria-label="Next"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Container (Compact Posters) */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-1 scrollbar-none scroll-smooth snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {displayedItems.map((product) => {
            const firstImage =
              Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null;
            const imageUrl: string =
              product.thumbnailUrl ||
              (typeof firstImage === 'string'
                ? firstImage
                : (firstImage as { url?: string } | null)?.url) ||
              '/placeholder.png';

            return (
              <Link
                key={product.id}
                href={`/products/${product.slug || product.id}`}
                className="flex-shrink-0 w-24 sm:w-28 md:w-32 group snap-start block"
                title={product.name}
              >
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-white border border-rule/70 group-hover:border-primary/60 group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
                  <Image
                    src={imageUrl}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 96px, 128px"
                    className="object-contain p-2 transition-transform duration-200"
                  />
                </div>
                <p className="text-xs font-medium text-ink-2 group-hover:text-primary transition-colors truncate mt-1.5 text-center">
                  {product.name}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};
