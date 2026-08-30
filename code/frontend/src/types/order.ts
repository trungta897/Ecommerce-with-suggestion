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
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  product?: Product;
}

export interface Order {
  id: string;
  userId?: string | null;
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
  vnpTxnRef?: string | null;
  vnpTransactionNo?: string | null;
  vnpPayDate?: string | null;
  items?: OrderItem[];
  user?: User; // Depending on eager loading
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
