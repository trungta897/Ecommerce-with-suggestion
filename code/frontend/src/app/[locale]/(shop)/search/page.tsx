'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import ProductCard from '@/components/features/product/ProductCard';
import { useProducts } from '@/hooks/use-products';
import { activityService } from '@/services/activity-service';
import { getOrCreateSessionId } from '@/utils/session';
import {
  Star,
  Search,
  FilterIcon,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from '@/components/base/icons';
import { SEARCH_SORT_OPTIONS, SEARCH_RATING_OPTIONS } from '@/constants/search';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('product');

  const q = searchParams.get('q') || '';
  const minPriceParam = searchParams.get('minPrice') || '';
  const maxPriceParam = searchParams.get('maxPrice') || '';
  const minRatingParam = searchParams.get('minRating') || '';
  const sortParam = searchParams.get('sort') || 'newest';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  const [localMinPrice, setLocalMinPrice] = useState(minPriceParam);
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPriceParam);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    setLocalMinPrice(minPriceParam);
    setLocalMaxPrice(maxPriceParam);
  }, [minPriceParam, maxPriceParam]);

  const { data: response, isLoading } = useProducts({
    q: q || undefined,
    minPrice: minPriceParam || undefined,
    maxPrice: maxPriceParam || undefined,
    minRating: minRatingParam || undefined,
    sort: sortParam,
    page: pageParam,
    limit: 12,
  });

  const products = response?.data || [];
  const metadata = response?.metadata || { total: 0, page: 1, limit: 12, totalPages: 1 };
  const firstProductId = products[0]?.id;

  useEffect(() => {
    const trimmed = q.trim();
    if (!trimmed || !firstProductId) return;
    activityService
      .logActivity({
        action: 'SEARCH',
        productId: firstProductId,
        searchQuery: trimmed,
        sessionId: getOrCreateSessionId(),
      })
      .catch(() => {});
  }, [q, firstProductId]);

  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === '') params.delete(key);
      else params.set(key, val);
    });
    if (!('page' in updates)) params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleApplyPrice = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({
      minPrice: localMinPrice.trim() || null,
      maxPrice: localMaxPrice.trim() || null,
    });
  };

  const handleClearFilters = () => {
    setLocalMinPrice('');
    setLocalMaxPrice('');
    router.push(q ? `${pathname}?q=${encodeURIComponent(q)}` : pathname);
  };

  const hasActiveFilters = Boolean(
    minPriceParam || maxPriceParam || minRatingParam || (sortParam && sortParam !== 'newest')
  );

  const renderFilterContent = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-ink flex items-center gap-2">
          <FilterIcon className="w-4 h-4 text-primary" />
          {t('filters')}
        </h3>
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {t('clearFilter')}
          </button>
        )}
      </div>
      <hr className="border-rule" />
      <div>
        <h4 className="font-semibold text-sm text-ink mb-3">{t('filterPrice')}</h4>
        <form onSubmit={handleApplyPrice} className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              placeholder={t('minPrice')}
              value={localMinPrice}
              onChange={(e) => setLocalMinPrice(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-rule bg-paper-1 focus:outline-none focus:border-primary transition-all"
            />
            <span className="text-ink-2 text-xs font-bold">-</span>
            <input
              type="number"
              min="0"
              placeholder={t('maxPrice')}
              value={localMaxPrice}
              onChange={(e) => setLocalMaxPrice(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-rule bg-paper-1 focus:outline-none focus:border-primary transition-all"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-paper-2 hover:bg-primary hover:text-white text-ink text-xs font-semibold rounded-lg border border-rule transition-all shadow-sm cursor-pointer"
          >
            {t('applyFilter')}
          </button>
        </form>
      </div>
      <hr className="border-rule" />
      <div>
        <h4 className="font-semibold text-sm text-ink mb-3">{t('filterRating')}</h4>
        <div className="space-y-1.5">
          {SEARCH_RATING_OPTIONS.map((opt) => {
            const isSelected = minRatingParam === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() =>
                  updateFilters({ minRating: minRatingParam === opt.value ? null : opt.value })
                }
                className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-primary/10 text-primary border border-primary/30 font-semibold'
                    : 'text-ink-2 hover:bg-paper-2'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < opt.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span>{t('starsAndAbove', { rating: opt.rating })}</span>
                </div>
                {isSelected && <span className="w-2 h-2 rounded-full bg-primary" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Banner / Heading */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-ink">
            {q ? t('searchResults', { query: q }) : t('searchAllProducts')}
          </h1>
          <p className="text-ink-2 mt-1 text-sm">{t('showingCount', { count: metadata.total })}</p>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-3">
          <label
            htmlFor="search-sort"
            className="text-xs font-medium text-ink-2 whitespace-nowrap hidden sm:inline"
          >
            {t('sortBy')}:
          </label>
          <select
            id="search-sort"
            value={sortParam}
            onChange={(e) => updateFilters({ sort: e.target.value })}
            className="text-xs font-medium py-2 px-3 rounded-lg border border-rule bg-white text-ink focus:outline-none focus:border-primary shadow-sm cursor-pointer"
          >
            {SEARCH_SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {t(opt.labelKey as Parameters<typeof t>[0])}
              </option>
            ))}
          </select>
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="lg:hidden flex items-center gap-2 py-2 px-3 border border-rule rounded-lg text-xs font-medium text-ink bg-white shadow-sm cursor-pointer"
          >
            <FilterIcon className="w-4 h-4 text-primary" />
            {t('filterProducts')}
          </button>
        </div>
      </div>

      {mobileFilterOpen && (
        <div className="lg:hidden mb-6 p-4 bg-white rounded-xl border border-rule shadow-md">
          {renderFilterContent()}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="hidden lg:block w-full lg:w-1/4 shrink-0">
          <div className="p-5 bg-white rounded-2xl border border-rule shadow-sm sticky top-24">
            {renderFilterContent()}
          </div>
        </aside>

        <main className="w-full lg:w-3/4 flex-1">
          {isLoading && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 animate-pulse">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-72 bg-paper-2 rounded-2xl border border-rule" />
              ))}
            </div>
          )}
          {!isLoading && products.length === 0 && (
            <div className="py-16 text-center bg-white rounded-2xl border border-rule shadow-sm p-8">
              <div className="w-16 h-16 bg-paper-2 text-ink-2 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 opacity-40" />
              </div>
              <h3 className="text-lg font-bold text-ink mb-2">{t('notFound')}</h3>
              <p className="text-sm text-ink-2 max-w-md mx-auto mb-6">{t('noSearchResults')}</p>
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="px-5 py-2.5 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-sm cursor-pointer"
                >
                  {t('clearFilter')}
                </button>
              )}
            </div>
          )}
          {!isLoading && products.length > 0 && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              {metadata.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-6 border-t border-rule">
                  <button
                    disabled={metadata.page <= 1}
                    onClick={() => updateFilters({ page: (metadata.page - 1).toString() })}
                    className="p-2 rounded-lg border border-rule bg-white text-ink hover:bg-paper-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-medium text-ink-2 px-3">
                    {metadata.page} / {metadata.totalPages}
                  </span>
                  <button
                    disabled={metadata.page >= metadata.totalPages}
                    onClick={() => updateFilters({ page: (metadata.page + 1).toString() })}
                    className="p-2 rounded-lg border border-rule bg-white text-ink hover:bg-paper-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
