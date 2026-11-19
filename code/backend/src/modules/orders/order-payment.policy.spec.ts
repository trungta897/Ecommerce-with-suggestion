import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import {
  buildPayableWhere,
  buildReopenCancelledWhere,
  canReopenCancelledOrder,
  isPayableNow,
  requiresOnlinePayment,
} from './order-payment.policy';

describe('OrderPaymentPolicy', () => {
  const now = new Date('2026-10-28T10:00:00.000Z');
  const futureDate = new Date('2026-10-28T10:15:00.000Z');
  const pastDate = new Date('2026-10-28T09:45:00.000Z');

  describe('requiresOnlinePayment', () => {
    it('returns false for pure COD orders without deposit', () => {
      expect(
        requiresOnlinePayment({
          paymentMethod: PaymentMethod.COD,
          isDepositPayment: false,
        }),
      ).toBe(false);
    });

    it('returns true for COD orders requiring deposit', () => {
      expect(
        requiresOnlinePayment({
          paymentMethod: PaymentMethod.COD,
          isDepositPayment: true,
        }),
      ).toBe(true);
    });

    it('returns true for VNPAY orders regardless of deposit flag', () => {
      expect(
        requiresOnlinePayment({
          paymentMethod: PaymentMethod.VNPAY,
          isDepositPayment: false,
        }),
      ).toBe(true);
    });
  });

  describe('isPayableNow', () => {
    it('returns true when PENDING_PAYMENT, PENDING paymentStatus, online payment required, and not expired', () => {
      expect(
        isPayableNow(
          {
            status: OrderStatus.PENDING_PAYMENT,
            paymentStatus: PaymentStatus.PENDING,
            paymentMethod: PaymentMethod.VNPAY,
            isDepositPayment: false,
            paymentExpiresAt: futureDate,
          },
          now,
        ),
      ).toBe(true);
    });

    it('returns false when payment window has expired', () => {
      expect(
        isPayableNow(
          {
            status: OrderStatus.PENDING_PAYMENT,
            paymentStatus: PaymentStatus.PENDING,
            paymentMethod: PaymentMethod.VNPAY,
            isDepositPayment: false,
            paymentExpiresAt: pastDate,
          },
          now,
        ),
      ).toBe(false);
    });

    it('returns false for pure COD orders', () => {
      expect(
        isPayableNow(
          {
            status: OrderStatus.PENDING,
            paymentStatus: PaymentStatus.PENDING,
            paymentMethod: PaymentMethod.COD,
            isDepositPayment: false,
            paymentExpiresAt: null,
          },
          now,
        ),
      ).toBe(false);
    });
  });

  describe('canReopenCancelledOrder', () => {
    it('returns true for expired online orders cancelled by Cron with no promotions', () => {
      expect(
        canReopenCancelledOrder({
          status: OrderStatus.CANCELLED,
          paymentStatus: PaymentStatus.PENDING,
          paymentMethod: PaymentMethod.VNPAY,
          isDepositPayment: false,
          paymentExpiresAt: pastDate,
          voucherId: null,
          vipDiscountAmount: 0,
        }),
      ).toBe(true);
    });

    it('returns false for manually cancelled orders (paymentExpiresAt is null)', () => {
      expect(
        canReopenCancelledOrder({
          status: OrderStatus.CANCELLED,
          paymentStatus: PaymentStatus.PENDING,
          paymentMethod: PaymentMethod.VNPAY,
          isDepositPayment: false,
          paymentExpiresAt: null,
          voucherId: null,
          vipDiscountAmount: 0,
        }),
      ).toBe(false);
    });

    it('returns false when order had a voucher or VIP discount returned on cancel', () => {
      expect(
        canReopenCancelledOrder({
          status: OrderStatus.CANCELLED,
          paymentStatus: PaymentStatus.PENDING,
          paymentMethod: PaymentMethod.VNPAY,
          isDepositPayment: false,
          paymentExpiresAt: pastDate,
          voucherId: 'voucher-1',
          vipDiscountAmount: 0,
        }),
      ).toBe(false);

      expect(
        canReopenCancelledOrder({
          status: OrderStatus.CANCELLED,
          paymentStatus: PaymentStatus.PENDING,
          paymentMethod: PaymentMethod.VNPAY,
          isDepositPayment: false,
          paymentExpiresAt: pastDate,
          voucherId: null,
          vipDiscountAmount: 10000,
        }),
      ).toBe(false);
    });
  });

  describe('where builders', () => {
    it('builds atomic payable and reopen cancelled where clauses', () => {
      expect(buildPayableWhere('order-1', now)).toMatchObject({
        id: 'order-1',
        status: OrderStatus.PENDING_PAYMENT,
        paymentStatus: PaymentStatus.PENDING,
      });

      expect(buildReopenCancelledWhere('order-1')).toMatchObject({
        id: 'order-1',
        status: OrderStatus.CANCELLED,
        paymentStatus: PaymentStatus.PENDING,
        voucherId: null,
        vipDiscountAmount: 0,
      });
    });
  });
});
