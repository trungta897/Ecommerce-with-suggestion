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
  q?: string;
  minPrice?: number | string;
  maxPrice?: number | string;
  minRating?: number | string;
  sort?: string;
}

export interface AdminProductQueryParams {
  page?: number;
  limit?: number;
  categorySlug?: string;
  q?: string;
  status?: string;
  stockStatus?: string;
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

export interface RawProductResponse extends Omit<
  Partial<Product>,
  'price' | 'discountPrice' | 'images'
> {
  price?: string | number;
  discountPrice?: string | number;
  images?: unknown;
}

export const mapProduct = (p: RawProductResponse): Product => {
  let images: ProductImage[] = [];
  if (Array.isArray(p.images)) {
    images = p.images.map((img) => {
      if (typeof img === 'string') {
        return { url: img, variant: 'MAIN', isPrimary: true };
      }
      return img as ProductImage;
    });
  }
  const mainImage = images.find((img) => img.isPrimary || img.variant === 'MAIN') || images[0];

  return {
    ...(p as unknown as Product),
    price: Number(p.price || 0),
    discountPrice: p.discountPrice ? Number(p.discountPrice) : undefined,
    thumbnailUrl: mainImage?.url || p.thumbnailUrl || '/placeholder.svg',
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
    if (params?.q) searchParams.append('q', params.q);
    if (params?.minPrice !== undefined && params.minPrice !== '')
      searchParams.append('minPrice', params.minPrice.toString());
    if (params?.maxPrice !== undefined && params.maxPrice !== '')
      searchParams.append('maxPrice', params.maxPrice.toString());
    if (params?.minRating !== undefined && params.minRating !== '')
      searchParams.append('minRating', params.minRating.toString());
    if (params?.sort) searchParams.append('sort', params.sort);

    const url = `/products?${searchParams.toString()}`;
    const { data } = await apiClient.get(url);

    return {
      data: Array.isArray(data.data) ? data.data.map(mapProduct) : [],
      metadata: data.metadata || { total: 0, page: 1, limit: 10, totalPages: 0 },
    };
  },

  getAdminProducts: async (params?: AdminProductQueryParams): Promise<ProductsResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.categorySlug && params.categorySlug !== 'all') {
      searchParams.append('categorySlug', params.categorySlug);
    }
    if (params?.q) searchParams.append('q', params.q);
    if (params?.status && params.status !== 'all') {
      searchParams.append('status', params.status);
    }
    if (params?.stockStatus && params.stockStatus !== 'all') {
      searchParams.append('stockStatus', params.stockStatus);
    }

    const url = `/products/admin?${searchParams.toString()}`;
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

  getHomeSections: async (slugs?: string[], limit: number = 8): Promise<HomeSection[]> => {
    const params = new URLSearchParams();
    if (slugs && slugs.length > 0) {
      params.append('slugs', slugs.join(','));
    }
    params.append('limit', limit.toString());

    const { data } = await apiClient.get<RawHomeSection[]>(
      `/products/home-sections?${params.toString()}`
    );

    return Array.isArray(data)
      ? data.map((section) => ({
          slug: section.slug,
          name: section.name,
          products: Array.isArray(section.products) ? section.products.map(mapProduct) : [],
        }))
      : [];
  },

  create: async (payload: CreateProductInput): Promise<Product> => {
    const { data } = await apiClient.post('/products', payload);
    return mapProduct(data);
  },

  update: async (id: string, updates: UpdateProductInput): Promise<Product> => {
    const { data } = await apiClient.patch(`/products/${id}`, updates);
    return mapProduct(data);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
  },

  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post<{ url: string }>('/products/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.url;
  },
};

export interface CreateProductInput {
  categoryId: string;
  name: string;
  slug: string;
  brand?: string;
  description?: string;
  specifications?: Record<string, unknown>;
  tags?: string[];
  price: number;
  stock?: number;
  images?: string[];
  isActive?: boolean;
}

export type UpdateProductInput = Partial<CreateProductInput>;

export interface HomeSection {
  slug: string;
  name: string;
  products: Product[];
}

interface RawHomeSection {
  slug: string;
  name: string;
  products: RawProductResponse[];
}
