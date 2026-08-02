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
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  product?: Product;
}

export interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  shipping_fee: number;
  discount_amount: number;
  voucher_id?: string | null;
  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
  delivery_method: string;
  delivery_partner?: string | null;
  tracking_id?: string | null;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  vnp_txn_ref?: string | null;
  vnp_transaction_no?: string | null;
  vnp_pay_date?: string | null;
  items?: OrderItem[];
  user?: User; // Depending on eager loading
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  product?: Product;
}
