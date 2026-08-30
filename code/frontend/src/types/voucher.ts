export type VoucherType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
export type VoucherScope = 'CART' | 'CATEGORY' | 'PRODUCT';

export interface VoucherCategory {
  id: string;
  name: string;
  slug?: string;
}

export interface VoucherProduct {
  id: string;
  name: string;
  slug?: string;
  images?: string[] | unknown;
}

export interface VoucherItem {
  id: string;
  code: string;
  type: VoucherType;
  scope: VoucherScope;
  value: number | string;
  minOrderValue: number | string;
  maxDiscount?: number | string | null;
  usageLimit?: number | null;
  usedCount: number;
  perUserLimit: number;
  isPublic: boolean;
  startDate: string;
  endDate: string;
  isActive: boolean;
  categoryId?: string | null;
  productId?: string | null;
  category?: VoucherCategory | null;
  product?: VoucherProduct | null;
  _count?: {
    usages: number;
  };
  createdAt: string;
}

export interface VoucherUsageLog {
  id: string;
  userId?: string | null;
  voucherId: string;
  orderId: string;
  usedAt: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    phone?: string | null;
  } | null;
  order: {
    id: string;
    totalAmount: number | string;
    status: string;
    shippingPhone: string;
    shippingName: string;
    createdAt: string;
  };
}

export interface VouchersResponse {
  data: VoucherItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface VoucherUsagesResponse {
  data: VoucherUsageLog[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateVoucherInput {
  code: string;
  type: VoucherType;
  scope?: VoucherScope;
  value: number;
  minOrderValue: number;
  maxDiscount?: number | null;
  usageLimit?: number | null;
  perUserLimit?: number;
  isPublic?: boolean;
  startDate: string;
  endDate: string;
  categoryId?: string | null;
  productId?: string | null;
}

export interface ValidateVoucherCartItem {
  productId: string;
  quantity: number;
  price: number;
  categoryId?: string;
}

export interface ValidateVoucherInput {
  code: string;
  subtotal: number;
  phone?: string;
  items?: ValidateVoucherCartItem[];
}

export interface ValidateVoucherResult {
  valid: boolean;
  voucherId: string;
  code: string;
  type: VoucherType;
  scope: VoucherScope;
  discountAmount: number;
  minOrderValue: number;
  maxDiscount?: number | null;
  category?: VoucherCategory | null;
  product?: VoucherProduct | null;
}
