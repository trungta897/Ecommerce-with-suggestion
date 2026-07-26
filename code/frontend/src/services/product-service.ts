import { Product, Category, ProductImage } from '@/types';
import { apiClient } from './api-client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapProduct = (p: any): Product => {
  const images: ProductImage[] = Array.isArray(p.images) ? p.images : [];
  const mainImage = images.find((img) => img.isPrimary || img.variant === 'MAIN') || images[0];

  return {
    ...p,
    price: Number(p.price),
    discountPrice: p.discountPrice ? Number(p.discountPrice) : undefined,
    thumbnailUrl: mainImage?.url || '/placeholder.png',
    images,
  };
};

export const productService = {
  getAll: async (all?: boolean): Promise<Product[]> => {
    const url = all ? '/products?all=true' : '/products';
    const { data } = await apiClient.get(url);
    return Array.isArray(data) ? data.map(mapProduct) : [];
  },

  getById: async (id: string): Promise<Product | undefined> => {
    try {
      const { data } = await apiClient.get(`/products/${id}`);
      return data ? mapProduct(data) : undefined;
    } catch {
      return undefined;
    }
  },

  getByCategory: async (slug: string): Promise<Product[]> => {
    const { data } = await apiClient.get('/products');
    const products = Array.isArray(data) ? data : [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return products.filter((p: any) => p.category?.slug === slug).map(mapProduct);
  },

  getCategories: async (): Promise<Category[]> => {
    const { data } = await apiClient.get('/categories');
    return data;
  },
};
