import { VoucherScope, VoucherType } from '@/types/voucher';

export const VOUCHER_TYPES: Record<
  VoucherType,
  { labelVi: string; labelEn: string; color: string }
> = {
  PERCENTAGE: {
    labelVi: 'Giảm %',
    labelEn: 'Percentage',
    color: 'text-purple-700 bg-purple-100',
  },
  FIXED_AMOUNT: {
    labelVi: 'Giảm tiền mặt',
    labelEn: 'Fixed Amount',
    color: 'text-blue-700 bg-blue-100',
  },
  FREE_SHIPPING: {
    labelVi: 'Miễn phí vận chuyển',
    labelEn: 'Free Shipping',
    color: 'text-emerald-700 bg-emerald-100',
  },
};

export const VOUCHER_SCOPES: Record<
  VoucherScope,
  { labelVi: string; labelEn: string; color: string }
> = {
  CART: {
    labelVi: 'Toàn bộ đơn hàng',
    labelEn: 'Whole Cart',
    color: 'text-gray-700 bg-gray-100',
  },
  CATEGORY: {
    labelVi: 'Theo danh mục',
    labelEn: 'By Category',
    color: 'text-amber-700 bg-amber-100',
  },
  PRODUCT: {
    labelVi: 'Theo sản phẩm',
    labelEn: 'By Product',
    color: 'text-indigo-700 bg-indigo-100',
  },
};
