import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem } from '@/types';

interface CartState {
  items: CartItem[];
  isMerging: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  setMerging: (isMerging: boolean) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isMerging: false,
      setMerging: (isMerging) => set({ isMerging }),
      addItem: (item) => {
        // Guard: reject invalid items missing required fields
        if (!item.product_id || !item.quantity || item.quantity <= 0) {
          console.warn('[CartStore] Rejected invalid item:', item);
          return;
        }
        set((state) => {
          const existingItem = state.items.find((i) => i.product_id === item.product_id);
          const stock = item.product?.stock || Number.MAX_SAFE_INTEGER;
          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.product_id === item.product_id
                  ? { ...i, quantity: Math.min(i.quantity + item.quantity, stock) }
                  : i
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity: Math.min(item.quantity, stock) }] };
        });
      },
      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.product_id !== productId),
        }));
      },
      updateQuantity: (productId, quantity) => {
        set((state) => ({
          items: state.items.map((i) => (i.product_id === productId ? { ...i, quantity } : i)),
        }));
      },
      clearCart: () => set({ items: [] }),
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);
