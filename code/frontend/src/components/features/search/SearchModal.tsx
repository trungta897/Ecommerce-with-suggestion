'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import {
  Search,
  X,
  Clock,
  TrendingUp,
  Loader2,
  ArrowRight,
  AlertCircle,
} from '@/components/base/icons';
import {
  POPULAR_SEARCH_KEYWORDS,
  SEARCH_MIN_QUERY_LENGTH,
  SEARCH_MAX_QUERY_LENGTH,
  SEARCH_DEBOUNCE_MS,
} from '@/constants/search';
import { useSearchHistory } from '@/hooks/use-search-history';
import { useProducts } from '@/hooks/use-products';
import { formatPrice } from '@/utils/format';
import { Product } from '@/types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

const getProductThumbnail = (prod: Product): string => {
  if (prod.thumbnailUrl && prod.thumbnailUrl !== '/placeholder.png') {
    return prod.thumbnailUrl;
  }
  if (Array.isArray(prod.images) && prod.images.length > 0) {
    const main = prod.images.find(
      (img) =>
        typeof img === 'object' &&
        img &&
        (img.isPrimary || img.variant === 'MAIN')
    );
    if (main && typeof main === 'object' && 'url' in main && main.url)
      return main.url;
    const first = prod.images[0];
    if (typeof first === 'string') return first;
    if (typeof first === 'object' && first && 'url' in first && first.url)
      return first.url;
  }
  return '/placeholder.svg';
};

export default function SearchModal({
  isOpen,
  onClose,
  initialQuery = '',
}: SearchModalProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('common.search');
  const inputRef = useRef<HTMLInputElement>(null);

  const [rawQuery, setRawQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  const { history, addSearch, removeSearch, clearHistory } = useSearchHistory();

  // Debounce input query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(rawQuery.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [rawQuery]);

  // Autofocus when modal opens & reset state
  useEffect(() => {
    if (isOpen) {
      setRawQuery(initialQuery);
      setDebouncedQuery(initialQuery.trim());
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialQuery]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Query live search suggestions when query is at least min length
  const isSearchActive = debouncedQuery.length >= SEARCH_MIN_QUERY_LENGTH;
  const { data: searchResponse, isLoading } = useProducts(
    isSearchActive
      ? {
          q: debouncedQuery,
          limit: 5,
        }
      : undefined
  );

  const products = isSearchActive ? searchResponse?.data || [] : [];
  const totalResults = searchResponse?.metadata?.total || 0;

  const handleNavigateToSearch = useCallback(
    (targetQuery: string) => {
      const trimmed = targetQuery.trim();
      if (trimmed.length < SEARCH_MIN_QUERY_LENGTH) return;
      addSearch(trimmed);
      onClose();
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    },
    [addSearch, onClose, router]
  );

  const handleSelectProduct = (product: Product) => {
    const trimmed = rawQuery.trim();
    if (trimmed.length >= SEARCH_MIN_QUERY_LENGTH) {
      addSearch(trimmed);
    }
    onClose();
    router.push(`/products/${product.slug}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleNavigateToSearch(rawQuery);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 md:pt-20 bg-black/60 backdrop-blur-md transition-all duration-200"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        className="relative w-full max-w-2xl bg-paper-1 border border-rule rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header / Input Bar */}
        <form
          onSubmit={handleSubmit}
          className="relative flex items-center border-b border-rule px-4 py-3 bg-paper-1"
        >
          <div className="absolute left-4 flex items-center pointer-events-none text-primary">
            <Search className="h-5 w-5" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={rawQuery}
            onChange={(e) => setRawQuery(e.target.value)}
            maxLength={SEARCH_MAX_QUERY_LENGTH}
            placeholder={t('placeholder')}
            className="w-full pl-8 pr-20 py-1.5 text-base bg-transparent text-ink placeholder:text-ink-2/60 focus:outline-none"
          />

          <div className="absolute right-4 flex items-center gap-2">
            {isLoading && isSearchActive ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : rawQuery ? (
              <button
                type="button"
                onClick={() => {
                  setRawQuery('');
                  setDebouncedQuery('');
                  inputRef.current?.focus();
                }}
                className="p-1 rounded-full text-ink-2 hover:text-ink hover:bg-paper-2 transition-colors"
                title={t('clear_query')}
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}

            <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 text-[11px] font-mono font-semibold text-ink-2 bg-paper-2 border border-rule rounded">
              ESC
            </kbd>
          </div>
        </form>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Validation Warning when 1 character entered */}
          {rawQuery.trim().length > 0 &&
            rawQuery.trim().length < SEARCH_MIN_QUERY_LENGTH && (
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium animate-in fade-in slide-in-from-top-1 duration-150">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>
                  {t('min_length_warning', { min: SEARCH_MIN_QUERY_LENGTH })}
                </span>
              </div>
            )}

          {/* STATE 1: Query < 2 chars -> Show Recent & Popular Searches */}
          {!isSearchActive ? (
            <div className="space-y-6">
              {/* Recent Searches */}
              {history.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-ink-2 uppercase tracking-wider">
                      <Clock className="h-3.5 w-3.5" />
                      {t('recent_searches')}
                    </span>
                    <button
                      type="button"
                      onClick={clearHistory}
                      className="text-xs text-ink-2 hover:text-red-500 transition-colors"
                    >
                      {t('clear_all')}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {history.map((item) => (
                      <div
                        key={item}
                        className="group flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-xl bg-paper-2 border border-rule hover:border-primary/50 text-xs font-medium text-ink transition-all cursor-pointer"
                        onClick={() => handleNavigateToSearch(item)}
                      >
                        <span>{item}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSearch(item);
                          }}
                          className="p-1 rounded-full text-ink-2 hover:text-red-500 hover:bg-paper-1 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Searches */}
              <div>
                <div className="flex items-center gap-1.5 mb-2.5 text-xs font-semibold text-ink-2 uppercase tracking-wider">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
                  {t('popular_searches')}
                </div>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_SEARCH_KEYWORDS.map((kw) => (
                    <button
                      key={kw}
                      type="button"
                      onClick={() => handleNavigateToSearch(kw)}
                      className="px-3 py-1.5 rounded-xl bg-paper-2 border border-rule hover:border-primary hover:text-primary text-xs font-medium text-ink transition-all"
                    >
                      {kw}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : /* STATE 2: Query >= 2 chars -> Live search loading / results / empty */
          isLoading ? (
            /* Loading Skeleton */
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
          ) : products.length > 0 ? (
            /* Search Results Found */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-ink-2 uppercase tracking-wider">
                <span>{t('products_found')}</span>
                <span>
                  {totalResults > 5
                    ? `5 / ${totalResults}`
                    : `${products.length}`}
                </span>
              </div>

              <div className="space-y-1.5">
                {products.map((product) => {
                  const hasDiscount =
                    product.discountPrice &&
                    Number(product.discountPrice) < Number(product.price);
                  const displayPrice = hasDiscount
                    ? Number(product.discountPrice)
                    : Number(product.price);

                  return (
                    <div
                      key={product.id}
                      onClick={() => handleSelectProduct(product)}
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

              {/* View All Results Footer Link */}
              <button
                type="button"
                onClick={() => handleNavigateToSearch(rawQuery)}
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
          ) : (
            /* Empty State */
            <div className="py-6 text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-paper-2 flex items-center justify-center text-ink-2">
                <Search className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-ink">
                  {t('no_results_for', { query: debouncedQuery })}
                </h4>
                <p className="text-xs text-ink-2 max-w-sm mx-auto">
                  {t('no_results_hint')}
                </p>
              </div>

              <div className="pt-2">
                <div className="text-xs font-semibold text-ink-2 uppercase tracking-wider mb-2">
                  {t('popular_searches')}
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {POPULAR_SEARCH_KEYWORDS.slice(0, 5).map((kw) => (
                    <button
                      key={kw}
                      type="button"
                      onClick={() => handleNavigateToSearch(kw)}
                      className="px-3 py-1.5 rounded-xl bg-paper-2 border border-rule hover:border-primary hover:text-primary text-xs font-medium text-ink transition-all"
                    >
                      {kw}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-rule bg-paper-2/40 text-[11px] text-ink-2">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="font-mono font-semibold px-1 py-0.5 rounded bg-paper-1 border border-rule text-ink mr-1">
                ↵
              </kbd>
              {t('enter_to_search')}
            </span>
            <span>
              <kbd className="font-mono font-semibold px-1 py-0.5 rounded bg-paper-1 border border-rule text-ink mr-1">
                ESC
              </kbd>
              {t('esc_to_close')}
            </span>
          </div>
          <span className="text-[10px] text-ink-2/80">
            {t('min_length_hint', { min: SEARCH_MIN_QUERY_LENGTH })}
          </span>
        </div>
      </div>
    </div>
  );
}
