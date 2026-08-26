import { Product } from './product';

export interface ProductDiscount {
  id: string;
  productId: string;
  discountPrice: number | string;
  flashSaleQty: number;
  flashSaleSold: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  product?: Product;
}

export interface CreateDiscountInput {
  productId: string;
  discountPrice: number;
  flashSaleQty: number;
  startDate: string;
  endDate: string;
  isActive?: boolean;
}

export type UpdateDiscountInput = Partial<CreateDiscountInput>;

export interface DiscountsResponse {
  data: ProductDiscount[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
