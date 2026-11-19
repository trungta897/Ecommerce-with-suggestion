import { apiClient } from './api-client';
import { WishlistItem } from '@/types/product';
import { mapProduct, RawProductResponse } from './product-service';

export interface WishlistToggleResult {
  isWishlisted: boolean;
  message: string;
}

export interface WishlistActionResponse {
  success: boolean;
  message: string;
}

interface RawWishlistItemResponse extends Omit<WishlistItem, 'product'> {
  product: RawProductResponse;
}

export const wishlistService = {
  getWishlist: async (): Promise<WishlistItem[]> => {
    const { data } = await apiClient.get<RawWishlistItemResponse[]>('/wishlist');
    return Array.isArray(data)
      ? data.map((item) => ({
          ...item,
          product: mapProduct(item.product),
        }))
      : [];
  },

  getWishlistIds: async (): Promise<string[]> => {
    const { data } = await apiClient.get<string[]>('/wishlist/ids');
    return data;
  },

  toggleWishlist: async (productId: string): Promise<WishlistToggleResult> => {
    const { data } = await apiClient.post<WishlistToggleResult>(`/wishlist/${productId}`);
    return data;
  },

  removeFromWishlist: async (productId: string): Promise<WishlistActionResponse> => {
    const { data } = await apiClient.delete<WishlistActionResponse>(`/wishlist/${productId}`);
    return data;
  },
};
