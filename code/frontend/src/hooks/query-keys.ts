export const queryKeys = {
  products: {
    all: ['products'] as const,
    detail: (id: string) => ['products', id] as const,
    byCategory: (slug: string) => ['products', 'category', slug] as const,
  },
  categories: {
    all: ['categories'] as const,
  },
  orders: {
    all: ['orders'] as const,
    detail: (id: string) => ['orders', id] as const,
  },
  cart: {
    all: ['cart'] as const,
  },
  promotions: {
    activeFlashSales: ['promotions', 'flash-sale', 'active'] as const,
    adminDiscounts: (params?: Record<string, unknown>) =>
      ['promotions', 'discounts', params] as const,
    detail: (id: string) => ['promotions', 'discounts', id] as const,
  },
};
