'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  SEARCH_HISTORY_KEY,
  SEARCH_HISTORY_MAX_ITEMS,
  SEARCH_MIN_QUERY_LENGTH,
} from '@/constants/search';

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const validHistory = parsed
            .filter(
              (item): item is string =>
                typeof item === 'string' &&
                item.trim().length >= SEARCH_MIN_QUERY_LENGTH
            )
            .slice(0, SEARCH_HISTORY_MAX_ITEMS);
          setHistory(validHistory);
        }
      }
    } catch {
      // Ignore localStorage read errors
    }
  }, []);

  const saveHistory = useCallback((newHistory: string[]) => {
    setHistory(newHistory);
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
    } catch {
      // Ignore localStorage write errors
    }
  }, []);

  const addSearch = useCallback(
    (query: string) => {
      const trimmed = query.trim();
      if (trimmed.length < SEARCH_MIN_QUERY_LENGTH) return;

      const filtered = history.filter(
        (item) => item.toLowerCase() !== trimmed.toLowerCase()
      );
      const updated = [trimmed, ...filtered].slice(0, SEARCH_HISTORY_MAX_ITEMS);
      saveHistory(updated);
    },
    [history, saveHistory]
  );

  const removeSearch = useCallback(
    (queryToRemove: string) => {
      const updated = history.filter((item) => item !== queryToRemove);
      saveHistory(updated);
    },
    [history, saveHistory]
  );

  const clearHistory = useCallback(() => {
    saveHistory([]);
  }, [saveHistory]);

  return {
    history,
    addSearch,
    removeSearch,
    clearHistory,
  };
}
