import { apiClient } from '../lib/api-client';
import {
  ProductDiscount,
  CreateDiscountInput,
  UpdateDiscountInput,
  DiscountsResponse,
} from '@/types/promotion';
import { mapProduct, RawProductResponse } from './product-service';

const mapDiscount = (discount: ProductDiscount): ProductDiscount => ({
  ...discount,
  discountPrice: Number(discount.discountPrice),
  product: discount.product
    ? mapProduct(discount.product as unknown as RawProductResponse)
    : undefined,
});

export const promotionService = {
  async getActiveFlashSales(): Promise<ProductDiscount[]> {
    const { data } = await apiClient.get<ProductDiscount[]>('/promotions/flash-sale/active');
    return Array.isArray(data) ? data.map(mapDiscount) : [];
  },

  async getAdminDiscounts(
    page = 1,
    limit = 10,
    productId?: string,
    isActive?: boolean
  ): Promise<DiscountsResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (productId) params.append('productId', productId);
    if (isActive !== undefined) params.append('isActive', isActive.toString());

    const { data } = await apiClient.get<DiscountsResponse>(
      `/promotions/discounts?${params.toString()}`
    );
    return {
      ...data,
      data: Array.isArray(data.data) ? data.data.map(mapDiscount) : [],
    };
  },

  async getDiscountById(id: string): Promise<ProductDiscount> {
    const { data } = await apiClient.get<ProductDiscount>(`/promotions/discounts/${id}`);
    return mapDiscount(data);
  },

  async createDiscount(dto: CreateDiscountInput): Promise<ProductDiscount> {
    const { data } = await apiClient.post<ProductDiscount>('/promotions/discounts', dto);
    return mapDiscount(data);
  },

  async updateDiscount(id: string, dto: UpdateDiscountInput): Promise<ProductDiscount> {
    const { data } = await apiClient.patch<ProductDiscount>(`/promotions/discounts/${id}`, dto);
    return mapDiscount(data);
  },

  async deleteDiscount(id: string): Promise<ProductDiscount> {
    const { data } = await apiClient.delete<ProductDiscount>(`/promotions/discounts/${id}`);
    return mapDiscount(data);
  },
};
