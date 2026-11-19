import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import { I18nService } from 'nestjs-i18n';
import type { ReturnQueryFromVNPay } from 'vnpay';
import { PaymentService } from './payment.service';
import { VnPayService } from './vnpay.service';
import { PrismaService } from '../../database/prisma.service';

describe('PaymentService', () => {
  let service: PaymentService;

  const orderId = '11111111-2222-3333-4444-555555555555';
  const orderIdHex = '11111111222233334444555555555555';
  const txnRef1 = `${orderIdHex}1700000000001`;
  const txnRef2 = `${orderIdHex}1700000000002`;

  const mockOrderBase = {
    id: orderId,
    userId: 'user-1',
    shippingPhone: '0901234567',
    status: OrderStatus.PENDING_PAYMENT,
    paymentStatus: PaymentStatus.PENDING,
    paymentMethod: PaymentMethod.VNPAY,
    isDepositPayment: false,
    depositAmount: null,
    totalAmount: 250000,
    paymentExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
    paymentGatewayTxnId: txnRef2,
    paymentGatewayTransNo: null,
    auditTrail: [],
  };

  const mockPrisma = {
    order: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
    },
    $executeRaw: jest.fn().mockResolvedValue(1),
    $transaction: jest.fn(),
  };

  const mockVnPayService = {
    verifyIpn: jest.fn(),
    createPaymentUrl: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  const mockI18n = {
    t: jest.fn((key: string) => key),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockPrisma.$transaction.mockImplementation(
      async (cb: (tx: typeof mockPrisma) => Promise<unknown>) => cb(mockPrisma),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: VnPayService, useValue: mockVnPayService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: I18nService, useValue: mockI18n },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  describe('createVnPayOrderForUser & createVnPayOrderForGuest', () => {
    it('throws NotFoundException when user does not own the order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        ...mockOrderBase,
        userId: 'other-user',
      });

      await expect(
        service.createVnPayOrderForUser(orderId, 'user-1', '127.0.0.1', 'vi'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when payment window is expired', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        ...mockOrderBase,
        paymentExpiresAt: new Date(Date.now() - 1000),
      });

      await expect(
        service.createVnPayOrderForUser(orderId, 'user-1', '127.0.0.1', 'vi'),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates VNPay link with 45-char appTransId for valid guest order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        ...mockOrderBase,
        userId: null,
        isDepositPayment: true,
        depositAmount: 50000,
      });
      mockPrisma.order.updateMany.mockResolvedValue({ count: 1 });
      mockVnPayService.createPaymentUrl.mockReturnValue('https://vnpay.vn/pay');

      const result = await service.createVnPayOrderForGuest(
        orderId,
        '0901234567',
        '127.0.0.1',
        'vi',
      );

      expect(result).toEqual({ orderUrl: 'https://vnpay.vn/pay' });
      expect(mockVnPayService.createPaymentUrl).toHaveBeenCalledWith(
        orderId,
        50000,
        '127.0.0.1',
        expect.stringMatching(/^[0-9a-f]{32}\d{13}$/),
      );
    });
  });

  describe('handleVnPayWebhook (2-Step Lookup & Bidirectional Duplicate Detection)', () => {
    const baseQuery = {
      vnp_TxnRef: txnRef2,
      vnp_Amount: '25000000',
      vnp_ResponseCode: '00',
      vnp_TransactionNo: 'VNP_TX_002',
      vnp_PayDate: '20261028170000',
    } as unknown as ReturnQueryFromVNPay;

    it('returns RspCode 97 when signature is invalid', async () => {
      mockVnPayService.verifyIpn.mockReturnValue({ isSuccess: false });
      const res = await service.handleVnPayWebhook(baseQuery);
      expect(res).toEqual({ RspCode: '97', Message: 'Invalid signature' });
    });

    it('returns RspCode 02 on idempotent retry of the same vnp_TransactionNo', async () => {
      mockVnPayService.verifyIpn.mockReturnValue({ isSuccess: true });
      mockPrisma.order.findFirst.mockResolvedValue({
        ...mockOrderBase,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.COMPLETED,
        paymentGatewayTransNo: 'VNP_TX_002',
      });

      const res = await service.handleVnPayWebhook(baseQuery);
      expect(res).toEqual({
        RspCode: '02',
        Message: 'Order already confirmed',
      });
    });

    it('resolves superseded txnRef via Step 2 (UUID prefix) and marks order paid if still PENDING_PAYMENT', async () => {
      mockVnPayService.verifyIpn.mockReturnValue({ isSuccess: true });
      mockPrisma.order.findFirst.mockResolvedValue(null); // Step 1 misses because paymentGatewayTxnId is txnRef2
      mockPrisma.order.findUnique.mockResolvedValue(mockOrderBase); // Step 2 hits by UUID
      mockPrisma.order.updateMany.mockResolvedValue({ count: 1 });

      const res = await service.handleVnPayWebhook({
        ...baseQuery,
        vnp_TxnRef: txnRef1,
        vnp_TransactionNo: 'VNP_TX_001',
      });

      expect(res).toEqual({ RspCode: '00', Message: 'Confirm Success' });
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('order.paid', {
        orderId,
      });
    });

    it('flags duplicate payment when a second distinct vnp_TransactionNo arrives after order is already paid (B2 -> B1 or B1 -> B2)', async () => {
      mockVnPayService.verifyIpn.mockReturnValue({ isSuccess: true });
      const alreadyPaidOrder = {
        ...mockOrderBase,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.COMPLETED,
        paymentGatewayTxnId: txnRef1,
        paymentGatewayTransNo: 'VNP_TX_001',
        auditTrail: [],
      };
      mockPrisma.order.findFirst.mockResolvedValue(alreadyPaidOrder);
      mockPrisma.order.findUnique.mockResolvedValue(alreadyPaidOrder);
      mockPrisma.order.update.mockResolvedValue(alreadyPaidOrder);

      const res = await service.handleVnPayWebhook(baseQuery);

      expect(res).toEqual({ RspCode: '00', Message: 'Confirm Success' });
      expect(mockPrisma.order.update).toHaveBeenCalledWith({
        where: { id: orderId },
        data: { isOrphanedPayment: true },
      });
      expect(mockPrisma.$executeRaw).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('payment.orphaned', {
        orderId,
      });
    });
  });
});
