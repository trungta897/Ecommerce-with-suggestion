import { Product } from './product';
import { User } from './user';

export enum OrderStatus {
  PENDING = 'pending',
  PENDING_PAYMENT = 'pending_payment',
  CONFIRMED = 'confirmed',
  HANDED_OVER = 'handed_over',
  DELIVERING = 'delivering',
  COMPLETED = 'completed',
  RETURN_REQUESTED = 'return_requested',
  RETURNED = 'returned',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  VNPAY = 'vnpay',
  COD = 'cod',
  ZALOPAY = 'zalopay',
  STRIPE = 'stripe',
  BANK_TRANSFER = 'bank_transfer',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
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
}

export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  product?: Product;
}
