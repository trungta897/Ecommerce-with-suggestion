import {
  Order,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
} from '@prisma/client';

export type OrderPaymentCheckTarget = Pick<
  Order,
  'paymentMethod' | 'isDepositPayment'
>;

export type OrderPayableNowTarget = Pick<
  Order,
  | 'status'
  | 'paymentStatus'
  | 'paymentMethod'
  | 'isDepositPayment'
  | 'paymentExpiresAt'
>;

export function requiresOnlinePayment(order: OrderPaymentCheckTarget): boolean {
  return (
    order.paymentMethod === PaymentMethod.VNPAY ||
    Boolean(order.isDepositPayment)
  );
}

export function isPayableNow(
  order: OrderPayableNowTarget,
  now: Date = new Date(),
): boolean {
  return (
    order.status === OrderStatus.PENDING_PAYMENT &&
    order.paymentStatus === PaymentStatus.PENDING &&
    requiresOnlinePayment(order) &&
    Boolean(order.paymentExpiresAt && order.paymentExpiresAt > now)
  );
}

export function buildPayableWhere(
  id: string,
  now: Date = new Date(),
): Prisma.OrderWhereInput {
  return {
    id,
    status: OrderStatus.PENDING_PAYMENT,
    paymentStatus: PaymentStatus.PENDING,
    paymentExpiresAt: { gt: now },
    OR: [{ paymentMethod: PaymentMethod.VNPAY }, { isDepositPayment: true }],
  };
}

export type OrderReopenCheckTarget = Pick<
  Order,
  | 'status'
  | 'paymentExpiresAt'
  | 'paymentStatus'
  | 'voucherId'
  | 'paymentMethod'
  | 'isDepositPayment'
> & {
  vipDiscountAmount: Prisma.Decimal | number;
};

export function canReopenCancelledOrder(
  order: OrderReopenCheckTarget,
): boolean {
  return (
    order.status === OrderStatus.CANCELLED &&
    Boolean(order.paymentExpiresAt) &&
    order.paymentStatus === PaymentStatus.PENDING &&
    order.voucherId === null &&
    Number(order.vipDiscountAmount) === 0 &&
    requiresOnlinePayment(order)
  );
}

export function buildReopenCancelledWhere(id: string): Prisma.OrderWhereInput {
  return {
    id,
    status: OrderStatus.CANCELLED,
    paymentExpiresAt: { not: null },
    paymentStatus: PaymentStatus.PENDING,
    voucherId: null,
    vipDiscountAmount: 0,
    OR: [{ paymentMethod: PaymentMethod.VNPAY }, { isDepositPayment: true }],
  };
}
