export type VoucherType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';

export interface VoucherItem {
  id: string;
  code: string;
  type: VoucherType;
  value: number | string;
  minOrderValue: number | string;
  maxDiscount?: number | string | null;
  usageLimit?: number | null;
  usedCount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
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

export interface CreateVoucherInput {
  code: string;
  type: VoucherType;
  value: number;
  minOrderValue: number;
  maxDiscount?: number | null;
  usageLimit?: number | null;
  startDate: string;
  endDate: string;
}
