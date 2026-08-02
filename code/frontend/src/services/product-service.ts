import { Product, Category, ProductImage } from '@/types';
import { apiClient } from './api-client';
import { CATEGORY_TREE, CategoryNode } from '@/constants/product';

const getDescendantSlugs = (slug: string): string[] => {
  const slugs = new Set<string>([slug]);

  const findNode = (nodes: CategoryNode[], targetSlug: string): CategoryNode | null => {
    for (const node of nodes) {
      if (node.slug === targetSlug) return node;
      if (node.children) {
        const found = findNode(node.children, targetSlug);
        if (found) return found;
      }
    }
    return null;
  };

  const collectSlugs = (node: CategoryNode) => {
    slugs.add(node.slug);
    if (node.children) {
      node.children.forEach(collectSlugs);
    }
  };

  const node = findNode(CATEGORY_TREE, slug);
  if (node) {
    collectSlugs(node);
  }

  return Array.from(slugs);
};

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
    const products: Product[] = Array.isArray(data) ? data.map(mapProduct) : [];

    const allowedSlugs = getDescendantSlugs(slug);
    return products.filter((p) => p.category?.slug && allowedSlugs.includes(p.category.slug));
  },

  getCategories: async (): Promise<Category[]> => {
    const { data } = await apiClient.get('/categories');
    return data;
  },
};
