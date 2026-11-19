'use client';

import { useTranslations } from 'next-intl';
import { Clock, TrendingUp, X } from '@/components/base/icons';
import { POPULAR_SEARCH_KEYWORDS } from '@/constants/search';

interface PopularSearchChipsProps {
  keywords?: readonly string[] | string[];
  onSelectQuery: (query: string) => void;
}

export function PopularSearchChips({
  keywords = POPULAR_SEARCH_KEYWORDS,
  onSelectQuery,
}: PopularSearchChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {keywords.map((kw) => (
        <button
          key={kw}
          type="button"
          onClick={() => onSelectQuery(kw)}
          className="px-3 py-1.5 rounded-xl bg-paper-2 border border-rule hover:border-primary hover:text-primary text-xs font-medium text-ink transition-all"
        >
          {kw}
        </button>
      ))}
    </div>
  );
}

interface SearchHistorySectionProps {
  history: string[];
  onSelectQuery: (query: string) => void;
  onRemoveQuery: (query: string) => void;
  onClearHistory: () => void;
}

export function SearchHistorySection({
  history,
  onSelectQuery,
  onRemoveQuery,
  onClearHistory,
}: SearchHistorySectionProps) {
  const t = useTranslations('common.search');

  return (
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
              onClick={onClearHistory}
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
                onClick={() => onSelectQuery(item)}
              >
                <span>{item}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveQuery(item);
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
        <PopularSearchChips onSelectQuery={onSelectQuery} />
      </div>
    </div>
  );
}
