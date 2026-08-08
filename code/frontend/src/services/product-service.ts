import { Product, Category, ProductImage } from '@/types';
import { apiClient } from './api-client';
import { CATEGORY_TREE, CategoryNode } from '@/constants/product';

export interface ProductsResponse {
  data: Product[];
  metadata: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  categorySlug?: string;
  all?: boolean;
}

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

// Instead of any, we use a structural type that captures what we need from the API response
interface RawProductResponse extends Omit<Partial<Product>, 'price' | 'discountPrice' | 'images'> {
  price?: string | number;
  discountPrice?: string | number;
  images?: unknown;
}

const mapProduct = (p: RawProductResponse): Product => {
  const images: ProductImage[] = Array.isArray(p.images) ? (p.images as ProductImage[]) : [];
  const mainImage = images.find((img) => img.isPrimary || img.variant === 'MAIN') || images[0];

  return {
    ...(p as unknown as Product),
    price: Number(p.price),
    discountPrice: p.discountPrice ? Number(p.discountPrice) : undefined,
    thumbnailUrl: mainImage?.url || '/placeholder.png',
    images,
  };
};

export const productService = {
  getAll: async (params?: ProductQueryParams): Promise<ProductsResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.all) searchParams.append('all', 'true');
    if (params?.categorySlug) searchParams.append('categorySlug', params.categorySlug);

    const url = `/products?${searchParams.toString()}`;
    const { data } = await apiClient.get(url);

    return {
      data: Array.isArray(data.data) ? data.data.map(mapProduct) : [],
      metadata: data.metadata || { total: 0, page: 1, limit: 10, totalPages: 0 },
    };
  },

  getById: async (id: string): Promise<Product | undefined> => {
    try {
      const { data } = await apiClient.get(`/products/${id}`);
      return data ? mapProduct(data) : undefined;
    } catch {
      return undefined;
    }
  },

  getBySlug: async (slug: string): Promise<Product | undefined> => {
    try {
      const { data } = await apiClient.get(`/products/slug/${slug}`);
      return data ? mapProduct(data) : undefined;
    } catch {
      return undefined;
    }
  },

  getByCategory: async (slug: string, params?: ProductQueryParams): Promise<ProductsResponse> => {
    const allowedSlugs = getDescendantSlugs(slug);

    return productService.getAll({
      ...params,
      categorySlug: allowedSlugs.join(','),
    });
  },

  getCategories: async (): Promise<Category[]> => {
    const { data } = await apiClient.get('/categories');
    return data;
  },
};
