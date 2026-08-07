import { apiClient } from '@/lib/api-client';
import { CartItem } from '@/types/order';

export interface AddToCartDto {
  productId: string;
  quantity: number;
}

export interface UpdateCartDto {
  quantity: number;
}

export interface MergeCartDto {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
}

export interface MergeCartResponse {
  mergedCount: number;
  skippedItems: Array<{
    productId: string;
    reason: string;
  }>;
}

export const cartService = {
  getCart: async (): Promise<CartItem[]> => {
    const { data } = await apiClient.get<CartItem[]>('/cart');
    return data;
  },

  addItem: async (dto: AddToCartDto): Promise<CartItem> => {
    const { data } = await apiClient.post<CartItem>('/cart', dto);
    return data;
  },

  updateItem: async (productId: string, dto: UpdateCartDto): Promise<CartItem> => {
    const { data } = await apiClient.put<CartItem>(`/cart/${productId}`, dto);
    return data;
  },

  removeItem: async (productId: string): Promise<void> => {
    await apiClient.delete(`/cart/${productId}`);
  },

  mergeCart: async (dto: MergeCartDto): Promise<MergeCartResponse> => {
    const { data } = await apiClient.post<MergeCartResponse>('/cart/merge', dto);
    return data;
  },
};
