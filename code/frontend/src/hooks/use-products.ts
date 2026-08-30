import { useQuery } from '@tanstack/react-query';
import { productService, ProductQueryParams } from '@/services/product-service';
import { queryKeys } from './query-keys';

export function useProducts(params?: ProductQueryParams) {
  return useQuery({
    queryKey: params ? [...queryKeys.products.all, params] : queryKeys.products.all,
    queryFn: () => productService.getAll(params),
  });
}

export function useProductBySlug(slug: string) {
  return useQuery({
    queryKey: ['products', 'slug', slug],
    queryFn: () => productService.getBySlug(slug),
    enabled: !!slug,
  });
}

export function useProductsByCategory(slug: string, params?: ProductQueryParams) {
  return useQuery({
    queryKey: [...queryKeys.products.byCategory(slug), params],
    queryFn: () => productService.getByCategory(slug, params),
    enabled: !!slug,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: productService.getCategories,
  });
}

export function useHomeSections(slugs?: string[], limit: number = 8) {
  return useQuery({
    queryKey: ['products', 'home-sections', slugs, limit],
    queryFn: () => productService.getHomeSections(slugs, limit),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
