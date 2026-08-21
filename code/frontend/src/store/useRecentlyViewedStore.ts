import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/types';
import { getOrCreateSessionId } from '@/utils/session';

interface RecentlyViewedState {
  items: Product[];
  isLoading: boolean;
  addItem: (product: Product) => void;
  fetchRecentlyViewed: () => Promise<void>;
  clearAll: () => Promise<void>;
}

const MAX_ITEMS = 20;

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,

      addItem: (product: Product) => {
        if (!product || !product.id) return;
        const currentItems = get().items;
        const filtered = currentItems.filter((p) => p.id !== product.id);
        set({ items: [product, ...filtered].slice(0, MAX_ITEMS) });
      },

      fetchRecentlyViewed: async () => {
        if (typeof window === 'undefined') return;
        const sessionId = getOrCreateSessionId();
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

        set({ isLoading: true });
        try {
          const res = await fetch(
            `${apiUrl}/activities/recently-viewed?sessionId=${encodeURIComponent(sessionId)}&limit=15`,
            {
              credentials: 'include',
            }
          );
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
              set({ items: data });
            }
          }
        } catch (err) {
          console.error('Failed to fetch recently viewed products:', err);
        } finally {
          set({ isLoading: false });
        }
      },

      clearAll: async () => {
        set({ items: [] });
        if (typeof window === 'undefined') return;
        const sessionId = getOrCreateSessionId();
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

        try {
          await fetch(
            `${apiUrl}/activities/recently-viewed?sessionId=${encodeURIComponent(sessionId)}`,
            {
              method: 'DELETE',
              credentials: 'include',
            }
          );
        } catch (err) {
          console.error('Failed to clear recently viewed on server:', err);
        }
      },
    }),
    {
      name: 'recently-viewed-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
