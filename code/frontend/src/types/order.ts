import { Product } from './product';
import { User } from './user';

export enum OrderStatus {
  PENDING = 'PENDING',
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  CONFIRMED = 'CONFIRMED',
  HANDED_OVER = 'HANDED_OVER',
  DELIVERING = 'DELIVERING',
  COMPLETED = 'COMPLETED',
  RETURN_REQUESTED = 'RETURN_REQUESTED',
  RETURN_REJECTED = 'RETURN_REJECTED',
  RETURNED = 'RETURNED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  VNPAY = 'VNPAY',
  COD = 'COD',
  STRIPE = 'STRIPE',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productDiscountId?: string | null;
  quantity: number;
  unitPrice: number;
  product?: Product;
}

export interface CreateOrderItemPayload {
  productId: string;
  quantity: number;
}

export interface CreateOrderPayload {
  shippingName: string;
  shippingAddress: string;
  shippingPhone: string;
  deliveryMethod?: string;
  paymentMethod: string;
  voucherId?: string;
  pickupTime?: string;
  provinceId?: string;
  wardId?: string;
  useVipPoints?: boolean;
  email?: string;
  items?: CreateOrderItemPayload[];
  sessionId?: string;
}

export interface Order {
  id: string;
  userId?: string | null;
  subtotal?: number;
  totalAmount: number;
  shippingFee: number;
  discountAmount: number;
  voucherId?: string | null;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  deliveryMethod: string;
  deliveryPartner?: string | null;
  trackingId?: string | null;
  status: OrderStatus;
  paymentMethod: PaymentMethod | string;
  paymentStatus: PaymentStatus;
  isDepositPayment?: boolean;
  depositAmount?: number | null;
  paymentExpiresAt?: string | null;
  returnRejectReason?: string | null;
  vipDiscountAmount?: number;
  usedVipPoints?: number;
  earnedVipPoints?: number;
  vnpTxnRef?: string | null;
  vnpTransactionNo?: string | null;
  vnpPayDate?: string | null;
  items?: OrderItem[];
  user?: User;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  product?: Product;
}
