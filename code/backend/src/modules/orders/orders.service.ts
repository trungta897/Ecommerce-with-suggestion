import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import {
  PaymentMethod,
  OrderStatus,
  Prisma,
  ActivityType,
} from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrdersShippingService } from './orders-shipping.service';
import { OrdersCheckoutService } from './orders-checkout.service';
import { OrdersQueryService } from './orders-query.service';
import { OrdersStatusService } from './orders-status.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly shippingService: OrdersShippingService,
    private readonly checkoutService: OrdersCheckoutService,
    private readonly queryService: OrdersQueryService,
    private readonly statusService: OrdersStatusService,
  ) {}

  async calculateShipping(
    deliveryMethod?: string,
    provinceId?: string,
    lang?: string,
  ): Promise<number> {
    return this.shippingService.calculateShipping(
      deliveryMethod,
      provinceId,
      lang,
    );
  }

  async createOrder(
    userId: string | null,
    createOrderDto: CreateOrderDto,
    lang?: string,
  ) {
    const now = new Date();

    // 1. Resolve cart items (User DB or Guest DTO)
    const cartItems = await this.checkoutService.resolveCartItems(
      userId,
      createOrderDto,
      lang,
    );

    // 2. Resolve active Flash Sale discounts & calculate effective prices
    const itemsWithDiscount =
      await this.checkoutService.resolveFlashSaleDiscounts(cartItems, lang);

    let subtotal = 0;
    for (const item of itemsWithDiscount) {
      subtotal += item.effectivePrice * item.quantity;
    }

    // 3. Calculate Shipping Fee
    const shippingFee = await this.shippingService.calculateShipping(
      createOrderDto.deliveryMethod,
      createOrderDto.provinceId,
      lang,
    );

    // 4. Calculate VIP points discount
    let vipDiscountAmount = 0;
    let usedVipPoints = 0;
    if (createOrderDto.useVipPoints && userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user && user.vipPoints > 0) {
        usedVipPoints = user.vipPoints;
        vipDiscountAmount = usedVipPoints * 10;
        if (vipDiscountAmount > subtotal) {
          vipDiscountAmount = subtotal;
          usedVipPoints = Math.ceil(subtotal / 10);
        }
      }
    }

    // 5. Validate and calculate Voucher
    const { discountAmount, appliedVoucherId, voucher } =
      await this.checkoutService.validateAndCalculateVoucher(
        createOrderDto.voucherId,
        itemsWithDiscount,
        subtotal,
        shippingFee,
        lang,
      );

    const totalAmount = Math.max(
      0,
      subtotal + shippingFee - discountAmount - vipDiscountAmount,
    );

    let isDepositPayment = false;
    let depositAmount: number | null = null;
    if (createOrderDto.deliveryMethod !== 'PICKUP' && subtotal < 8) {
      isDepositPayment = true;
      depositAmount = 2;
    }

    // 6. Validate Pickup Time
    if (createOrderDto.deliveryMethod === 'PICKUP') {
      this.checkoutService.validatePickupTime(createOrderDto.pickupTime, lang);
    }

    let paymentExpiresAt: Date | null = null;
    if (
      createOrderDto.paymentMethod !== PaymentMethod.COD ||
      isDepositPayment
    ) {
      paymentExpiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 mins
    }

    const earnedVipPoints = Math.floor(totalAmount / 1000);

    // 7. Atomic Claims and Order Creation Transaction
    const order = await this.prisma.$transaction(async (tx) => {
      // 7a. Claim Inventory
      await this.checkoutService.claimInventory(tx, itemsWithDiscount, lang);

      // 7b. Claim Flash Sale Quotas
      await this.checkoutService.claimFlashSaleQuota(
        tx,
        itemsWithDiscount,
        now,
        lang,
      );

      // 7c. Claim VIP Points
      if (usedVipPoints > 0 && userId) {
        await this.checkoutService.claimVipPoints(
          tx,
          userId,
          usedVipPoints,
          lang,
        );
      }

      // 7d. Claim Voucher & Check Per-User Limit
      if (appliedVoucherId && voucher) {
        await this.checkoutService.claimVoucher(
          tx,
          appliedVoucherId,
          userId,
          createOrderDto.shippingPhone,
          voucher.perUserLimit,
          lang,
        );
      }

      const orderData: Prisma.OrderUncheckedCreateInput = {
        status: OrderStatus.PENDING_PAYMENT,
        subtotal,
        shippingFee,
        discountAmount,
        totalAmount,
        paymentMethod: createOrderDto.paymentMethod,
        paymentExpiresAt,
        shippingName: createOrderDto.shippingName,
        shippingAddress: createOrderDto.shippingAddress,
        shippingPhone: createOrderDto.shippingPhone,
        deliveryMethod: createOrderDto.deliveryMethod,
        userId: userId || undefined,
        voucherId: appliedVoucherId || undefined,
        depositAmount,
        isDepositPayment,
        pickupTime: createOrderDto.pickupTime,
        earnedVipPoints,
        usedVipPoints,
        vipDiscountAmount,
        items: {
          create: itemsWithDiscount.map((item) => ({
            productId: item.productId,
            productDiscountId: item.productDiscountId || undefined,
            quantity: item.quantity,
            unitPrice: item.effectivePrice,
            subtotal: item.effectivePrice * item.quantity,
          })),
        },
      };

      const newOrder = await tx.order.create({
        data: orderData,
      });

      if (appliedVoucherId) {
        await tx.userVoucherUsage.create({
          data: {
            voucherId: appliedVoucherId,
            userId: userId || undefined,
            orderId: newOrder.id,
          },
        });
      }

      if (userId) {
        await tx.cartItem.deleteMany({
          where: { userId },
        });
      }

      return newOrder;
    });

    // 8. Post-Transaction: Log PURCHASE activity
    if (cartItems.length > 0) {
      try {
        await this.prisma.userActivityLog.createMany({
          data: cartItems.map((item) => ({
            userId: userId || undefined,
            sessionId: createOrderDto.sessionId || undefined,
            productId: item.productId,
            action: ActivityType.PURCHASE,
          })),
        });
      } catch (err) {
        console.error('Failed to log purchase activity:', err);
      }
    }

    return order;
  }

  // ==================== QUERY DELEGATION ====================

  async getGuestOrderById(orderId: string, phone: string, lang?: string) {
    return this.queryService.getGuestOrderById(orderId, phone, lang);
  }

  verifyGuestTrackingToken(orderId: string, token: string, lang?: string) {
    return this.queryService.verifyGuestTrackingToken(orderId, token, lang);
  }

  getEventEmitter() {
    return this.eventEmitter;
  }

  async getOrderById(
    orderId: string,
    user: { id: string; role: string },
    lang?: string,
  ) {
    return this.queryService.getOrderById(orderId, user, lang);
  }

  async verifyOrderOwnership(orderId: string, userId: string, lang?: string) {
    return this.queryService.verifyOrderOwnership(orderId, userId, lang);
  }

  async getUserOrders(userId: string, page: number = 1, limit: number = 10) {
    return this.queryService.getUserOrders(userId, page, limit);
  }

  async getAdminOrders(page: number = 1, limit: number = 10, status?: string) {
    return this.queryService.getAdminOrders(page, limit, status);
  }

  // ==================== STATUS DELEGATION ====================

  async cancelOrder(
    orderId: string,
    userId?: string,
    isStaff: boolean = false,
    lang?: string,
  ) {
    return this.statusService.cancelOrder(orderId, userId, isStaff, lang);
  }

  async updateOrderStatus(
    orderId: string,
    dto: UpdateOrderStatusDto,
    lang?: string,
  ) {
    return this.statusService.updateOrderStatus(orderId, dto, lang);
  }
}
