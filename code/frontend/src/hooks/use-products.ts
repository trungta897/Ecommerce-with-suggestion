import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services/product-service';
import { queryKeys } from './query-keys';

export function useProducts() {
  return useQuery({
    queryKey: queryKeys.products.all,
    queryFn: productService.getAll,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => productService.getById(id),
    enabled: !!id,
  });
}

export function useProductsByCategory(slug: string) {
  return useQuery({
    queryKey: queryKeys.products.byCategory(slug),
    queryFn: () => productService.getByCategory(slug),
    enabled: !!slug,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: productService.getCategories,
  });
}
