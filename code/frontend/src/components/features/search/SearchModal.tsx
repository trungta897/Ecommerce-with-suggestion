'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Search, X, Loader2, AlertCircle } from '@/components/base/icons';
import {
  SEARCH_MIN_QUERY_LENGTH,
  SEARCH_MAX_QUERY_LENGTH,
  SEARCH_DEBOUNCE_MS,
} from '@/constants/search';
import { useSearchHistory } from '@/hooks/use-search-history';
import { useProducts } from '@/hooks/use-products';
import { Product } from '@/types';
import { SearchHistorySection } from './SearchHistorySection';
import { SearchResultsSection } from './SearchResultsSection';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export default function SearchModal({ isOpen, onClose, initialQuery = '' }: SearchModalProps) {
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
          {rawQuery.trim().length > 0 && rawQuery.trim().length < SEARCH_MIN_QUERY_LENGTH && (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium animate-in fade-in slide-in-from-top-1 duration-150">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{t('min_length_warning', { min: SEARCH_MIN_QUERY_LENGTH })}</span>
            </div>
          )}

          {!isSearchActive ? (
            <SearchHistorySection
              history={history}
              onSelectQuery={handleNavigateToSearch}
              onRemoveQuery={removeSearch}
              onClearHistory={clearHistory}
            />
          ) : (
            <SearchResultsSection
              isLoading={isLoading}
              products={products}
              totalResults={totalResults}
              debouncedQuery={debouncedQuery}
              rawQuery={rawQuery}
              locale={locale}
              onSelectProduct={handleSelectProduct}
              onNavigateToSearch={handleNavigateToSearch}
            />
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
