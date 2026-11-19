'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Search, Loader2, ArrowRight } from '@/components/base/icons';
import { POPULAR_SEARCH_KEYWORDS } from '@/constants/search';
import { formatPrice } from '@/utils/format';
import { Product } from '@/types';
import { PopularSearchChips } from './SearchHistorySection';

interface SearchResultsSectionProps {
  isLoading: boolean;
  products: Product[];
  totalResults: number;
  debouncedQuery: string;
  rawQuery: string;
  locale: string;
  onSelectProduct: (product: Product) => void;
  onNavigateToSearch: (query: string) => void;
}

const getProductThumbnail = (prod: Product): string => {
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

export function SearchResultsSection({
  isLoading,
  products,
  totalResults,
  debouncedQuery,
  rawQuery,
  locale,
  onSelectProduct,
  onNavigateToSearch,
}: SearchResultsSectionProps) {
  const t = useTranslations('common.search');

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-ink-2 uppercase tracking-wider">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          {t('searching')}
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-2.5 rounded-xl bg-paper-2/60 animate-pulse"
            >
              <div className="w-12 h-12 rounded-lg bg-paper-2 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-paper-2 rounded w-3/4" />
                <div className="h-3 bg-paper-2 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length > 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-ink-2 uppercase tracking-wider">
          <span>{t('products_found')}</span>
          <span>{totalResults > 5 ? `5 / ${totalResults}` : `${products.length}`}</span>
        </div>

        <div className="space-y-1.5">
          {products.map((product) => {
            const hasDiscount =
              product.discountPrice && Number(product.discountPrice) < Number(product.price);
            const displayPrice = hasDiscount
              ? Number(product.discountPrice)
              : Number(product.price);

            return (
              <div
                key={product.id}
                onClick={() => onSelectProduct(product)}
                className="group flex items-center gap-3 p-2.5 rounded-xl hover:bg-paper-2 border border-transparent hover:border-rule transition-all cursor-pointer"
              >
                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-white border border-rule shrink-0 flex items-center justify-center">
                  <Image
                    src={getProductThumbnail(product)}
                    alt={product.name}
                    fill
                    sizes="48px"
                    className="object-contain p-1 group-hover:scale-105 transition-transform"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {product.category?.name && (
                      <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-paper-2 text-ink-2 shrink-0">
                        {product.category.name}
                      </span>
                    )}
                    {product.brand && (
                      <span className="text-[11px] font-semibold text-primary shrink-0">
                        {product.brand}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-medium text-ink truncate group-hover:text-primary transition-colors">
                    {product.name}
                  </h4>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-ink group-hover:text-primary transition-colors">
                    {formatPrice(displayPrice, locale)}
                  </div>
                  {hasDiscount && (
                    <div className="text-xs text-ink-2/70 line-through">
                      {formatPrice(Number(product.price), locale)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onNavigateToSearch(rawQuery)}
          className="w-full mt-2 flex items-center justify-between px-4 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/15 text-primary border border-primary/20 text-xs font-semibold transition-all group"
        >
          <span>
            {t('view_all_results', {
              count: totalResults,
              query: debouncedQuery,
            })}
          </span>
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    );
  }

  return (
    <div className="py-6 text-center space-y-4">
      <div className="w-12 h-12 mx-auto rounded-full bg-paper-2 flex items-center justify-center text-ink-2">
        <Search className="h-6 w-6" />
      </div>
      <div className="space-y-1">
        <h4 className="text-sm font-bold text-ink">
          {t('no_results_for', { query: debouncedQuery })}
        </h4>
        <p className="text-xs text-ink-2 max-w-sm mx-auto">{t('no_results_hint')}</p>
      </div>

      <div className="pt-2">
        <div className="text-xs font-semibold text-ink-2 uppercase tracking-wider mb-2">
          {t('popular_searches')}
        </div>
        <div className="flex justify-center">
          <PopularSearchChips
            keywords={POPULAR_SEARCH_KEYWORDS.slice(0, 5)}
            onSelectQuery={onNavigateToSearch}
          />
        </div>
      </div>
    </div>
  );
}
