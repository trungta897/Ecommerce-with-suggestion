import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import {
  PaymentMethod,
  OrderStatus,
  Product,
  Prisma,
  ActivityType,
  UserRole,
  VoucherScope,
} from '@prisma/client';
import { RedisService } from '../redis/redis.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ORDER_MESSAGES } from '../../common/constants/order-message.constant';
import { VOUCHER_MESSAGES } from '../../common/constants/voucher-message.constant';
import { PROMOTION_MESSAGES } from '../../common/constants/promotion-message.constant';
import { I18nService } from 'nestjs-i18n';

import { JwtService } from '@nestjs/jwt';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly eventEmitter: EventEmitter2,
    private readonly i18n: I18nService,
    private readonly jwtService: JwtService,
  ) {}

  async calculateShipping(
    deliveryMethod?: string,
    provinceId?: string,
  ): Promise<number> {
    if (deliveryMethod === 'PICKUP') return 0;
    if (!provinceId)
      throw new BadRequestException('Vui lòng chọn Tỉnh/Thành phố giao hàng');

    const province = await this.prisma.province.findUnique({
      where: { id: provinceId },
    });
    if (!province)
      throw new BadRequestException('Tỉnh/Thành phố không tồn tại');

    if (province.id === '01') {
      return deliveryMethod === 'EXPRESS' ? 40000 : 15000;
    }

    if (province.region === 'NORTH') return 30000;
    if (province.region === 'CENTRAL') return 40000;
    if (province.region === 'SOUTH') return 50000;

    return 30000;
  }

  async createOrder(
    userId: string | null,
    createOrderDto: CreateOrderDto,
    lang?: string,
  ) {
    // 1. Get cart items (from DB if user, or directly from DTO if guest)
    let cartItems: Array<{
      productId: string;
      quantity: number;
      product: Product;
    }> = [];
    if (userId) {
      const dbCartItems = await this.prisma.cartItem.findMany({
        where: { userId },
        include: { product: true },
      });
      cartItems = dbCartItems;
    } else {
      // Guest Checkout - items must be in DTO
      if (!createOrderDto.items || createOrderDto.items.length === 0) {
        throw new BadRequestException(
          this.i18n.t(ORDER_MESSAGES.CART_EMPTY, { lang }),
        );
      }
      // Fetch product details for guest items
      for (const item of createOrderDto.items) {
        const product = await this.prisma.product.findUnique({
          where: { id: item.productId },
        });
        if (!product)
          throw new BadRequestException(
            `Sản phẩm không tồn tại (ID: ${item.productId})`,
          );
        cartItems.push({
          productId: item.productId,
          quantity: item.quantity,
          product,
        });
      }
    }

    if (cartItems.length === 0) {
      throw new BadRequestException(
        this.i18n.t(ORDER_MESSAGES.CART_EMPTY, { lang }),
      );
    }

    // 2. Resolve active Flash Sale discounts & calculate totals and check stock
    const now = new Date();
    const itemsWithDiscount = await Promise.all(
      cartItems.map(async (item) => {
        if (item.product.stock < item.quantity) {
          throw new BadRequestException(
            `Sản phẩm ${item.product.name} không đủ tồn kho (Còn: ${item.product.stock})`,
          );
        }

        const activeDiscount = await this.prisma.productDiscount.findFirst({
          where: {
            productId: item.productId,
            isActive: true,
            startDate: { lte: now },
            endDate: { gte: now },
          },
          orderBy: { startDate: 'asc' },
        });

        let effectivePrice = item.product.discountPrice
          ? Number(item.product.discountPrice)
          : Number(item.product.price);
        let productDiscountId: string | null = null;

        if (activeDiscount) {
          const discountPriceNum = Number(activeDiscount.discountPrice);
          if (discountPriceNum < effectivePrice) {
            effectivePrice = discountPriceNum;
            productDiscountId = activeDiscount.id;
          }
        }

        return {
          ...item,
          effectivePrice,
          productDiscountId,
        };
      }),
    );

    let subtotal = 0;
    for (const item of itemsWithDiscount) {
      subtotal += item.effectivePrice * item.quantity;
    }

    const shippingFee = await this.calculateShipping(
      createOrderDto.deliveryMethod,
      createOrderDto.provinceId,
    );

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

    let discountAmount = 0;
    let appliedVoucherId: string | null = null;

    if (createOrderDto.voucherId) {
      const voucher = await this.prisma.voucher.findUnique({
        where: { id: createOrderDto.voucherId },
      });

      if (!voucher || !voucher.isActive) {
        throw new BadRequestException(
          this.i18n.t(VOUCHER_MESSAGES.NOT_FOUND, { lang }),
        );
      }

      if (voucher.startDate && now < voucher.startDate) {
        throw new BadRequestException(
          this.i18n.t(VOUCHER_MESSAGES.NOT_STARTED, { lang }),
        );
      }
      if (voucher.endDate && now > voucher.endDate) {
        throw new BadRequestException(
          this.i18n.t(VOUCHER_MESSAGES.EXPIRED, { lang }),
        );
      }

      if (voucher.minOrderValue && subtotal < Number(voucher.minOrderValue)) {
        throw new BadRequestException(
          this.i18n.t(VOUCHER_MESSAGES.MIN_ORDER_NOT_MET, {
            lang,
            args: {
              min: Number(voucher.minOrderValue).toLocaleString('vi-VN'),
            },
          }),
        );
      }

      let eligibleSubtotal = subtotal;
      if (voucher.scope === VoucherScope.CATEGORY && voucher.categoryId) {
        const eligibleItems = itemsWithDiscount.filter(
          (item) => item.product.categoryId === voucher.categoryId,
        );
        if (eligibleItems.length === 0) {
          throw new BadRequestException(
            this.i18n.t(VOUCHER_MESSAGES.CATEGORY_NOT_MATCHED, { lang }),
          );
        }

        // Anti-Stacking Rule: Chặn voucher PERCENTAGE trên sản phẩm đang Flash Sale
        if (voucher.type === 'PERCENTAGE') {
          const hasFlashSale = eligibleItems.some(
            (item) => item.productDiscountId !== null,
          );
          if (hasFlashSale) {
            throw new BadRequestException(
              this.i18n.t(VOUCHER_MESSAGES.FLASH_SALE_CONFLICT, { lang }),
            );
          }
        }

        eligibleSubtotal = eligibleItems.reduce(
          (sum, item) => sum + item.effectivePrice * item.quantity,
          0,
        );
      } else if (voucher.scope === VoucherScope.PRODUCT && voucher.productId) {
        const eligibleItems = itemsWithDiscount.filter(
          (item) => item.productId === voucher.productId,
        );
        if (eligibleItems.length === 0) {
          throw new BadRequestException(
            this.i18n.t(VOUCHER_MESSAGES.PRODUCT_NOT_MATCHED, { lang }),
          );
        }

        // Anti-Stacking Rule: Chặn voucher PERCENTAGE trên sản phẩm đang Flash Sale
        if (voucher.type === 'PERCENTAGE') {
          const hasFlashSale = eligibleItems.some(
            (item) => item.productDiscountId !== null,
          );
          if (hasFlashSale) {
            throw new BadRequestException(
              this.i18n.t(VOUCHER_MESSAGES.FLASH_SALE_CONFLICT, { lang }),
            );
          }
        }

        eligibleSubtotal = eligibleItems.reduce(
          (sum, item) => sum + item.effectivePrice * item.quantity,
          0,
        );
      }

      if (voucher.type === 'FREE_SHIPPING') {
        discountAmount = shippingFee;
      } else if (voucher.type === 'FIXED_AMOUNT') {
        discountAmount = Math.min(Number(voucher.value), eligibleSubtotal);
      } else if (voucher.type === 'PERCENTAGE') {
        discountAmount = Math.floor(
          (eligibleSubtotal * Number(voucher.value)) / 100,
        );
        if (
          voucher.maxDiscount &&
          discountAmount > Number(voucher.maxDiscount)
        ) {
          discountAmount = Number(voucher.maxDiscount);
        }
      }
      appliedVoucherId = voucher.id;
    }

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

    if (
      createOrderDto.deliveryMethod === 'PICKUP' &&
      createOrderDto.pickupTime
    ) {
      const pickupTime = new Date(createOrderDto.pickupTime);
      if (pickupTime < now) {
        throw new BadRequestException(
          'Thời gian lấy hàng không hợp lệ (trong quá khứ)',
        );
      }
      const maxTime = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
      if (pickupTime > maxTime) {
        throw new BadRequestException('Chỉ hỗ trợ đặt giữ hàng tối đa 5 ngày');
      }
      const hour = pickupTime.getHours();
      if (hour < 8 || hour >= 22) {
        throw new BadRequestException(
          'Thời gian lấy hàng phải trong giờ làm việc (08:00 - 22:00)',
        );
      }
    }

    let paymentExpiresAt: Date | null = null;
    if (
      createOrderDto.paymentMethod !== PaymentMethod.COD ||
      isDepositPayment
    ) {
      paymentExpiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 mins
    }

    const earnedVipPoints = Math.floor(totalAmount / 1000);

    const order = await this.prisma.$transaction(async (tx) => {
      // 1. Stock claim
      for (const item of itemsWithDiscount) {
        const updatedProduct = await tx.product.updateMany({
          where: {
            id: item.productId,
            stock: { gte: item.quantity },
          },
          data: {
            stock: { decrement: item.quantity },
          },
        });

        if (updatedProduct.count === 0) {
          throw new BadRequestException(
            `Sản phẩm ${item.product.name} đã hết hàng trong quá trình thanh toán`,
          );
        }

        // 1b. Atomic Claim Flash Sale Quotas
        if (item.productDiscountId) {
          const claimedDiscount = await tx.$executeRaw`
            UPDATE product_discounts
            SET flashSaleSold = flashSaleSold + ${item.quantity}
            WHERE id = ${item.productDiscountId}
              AND isActive = true
              AND startDate <= ${now}
              AND endDate >= ${now}
              AND flashSaleSold + ${item.quantity} <= flashSaleQty
          `;

          if (claimedDiscount === 0) {
            throw new BadRequestException(
              this.i18n.t(PROMOTION_MESSAGES.FLASH_SALE_INSUFFICIENT, { lang }),
            );
          }
        }
      }

      // 2. VIP Points claim
      if (usedVipPoints > 0 && userId) {
        const updatedUser = await tx.user.updateMany({
          where: {
            id: userId,
            vipPoints: { gte: usedVipPoints },
          },
          data: {
            vipPoints: { decrement: usedVipPoints },
          },
        });
        if (updatedUser.count === 0) {
          throw new BadRequestException('Số điểm VIP không đủ để thanh toán');
        }
      }

      // 3. Voucher claim (Atomic) & PerUserLimit check
      if (appliedVoucherId) {
        const claimed = await tx.$executeRaw`
          UPDATE vouchers
          SET usedCount = usedCount + 1
          WHERE id = ${appliedVoucherId}
            AND isActive = true
            AND startDate <= NOW()
            AND endDate >= NOW()
            AND (usageLimit IS NULL OR usedCount + 1 <= usageLimit)
        `;

        if (claimed === 0) {
          throw new BadRequestException(
            this.i18n.t(VOUCHER_MESSAGES.SYSTEM_LIMIT_REACHED, { lang }),
          );
        }

        const voucher = await tx.voucher.findUnique({
          where: { id: appliedVoucherId },
        });

        if (voucher) {
          const nonCancelledStatuses = {
            notIn: [
              OrderStatus.CANCELLED,
              OrderStatus.RETURN_REJECTED,
              OrderStatus.RETURNED,
              OrderStatus.REFUNDED,
            ],
          };

          let usedCountForUser = 0;
          if (userId) {
            usedCountForUser = await tx.userVoucherUsage.count({
              where: {
                voucherId: appliedVoucherId,
                userId,
                order: { status: nonCancelledStatuses },
              },
            });
          } else if (createOrderDto.shippingPhone) {
            usedCountForUser = await tx.userVoucherUsage.count({
              where: {
                voucherId: appliedVoucherId,
                order: {
                  shippingPhone: createOrderDto.shippingPhone,
                  status: nonCancelledStatuses,
                },
              },
            });
          }

          if (usedCountForUser >= voucher.perUserLimit) {
            throw new BadRequestException(
              this.i18n.t(VOUCHER_MESSAGES.USER_LIMIT_REACHED, { lang }),
            );
          }
        }
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

    // Log PURCHASE activity for all items in order
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

    if (order.paymentMethod === PaymentMethod.STRIPE) {
      // Logic for Stripe
    }

    return order;
  }

  async getGuestOrderById(orderId: string, phone: string, lang?: string) {
    if (!phone) {
      throw new BadRequestException(
        this.i18n.t(ORDER_MESSAGES.MISSING_PHONE, { lang }),
      );
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(
        this.i18n.t(ORDER_MESSAGES.NOT_FOUND, { lang }),
      );
    }

    if (order.shippingPhone !== phone) {
      throw new BadRequestException(
        this.i18n.t(ORDER_MESSAGES.AUTH_MISMATCH, { lang }),
      );
    }

    // Generate short-lived GuestTrackingToken (1 hour)
    const trackingToken = this.jwtService.sign(
      { orderId: order.id, phone, role: 'GUEST' },
      { expiresIn: '1h' },
    );

    return {
      ...order,
      trackingToken,
    };
  }

  verifyGuestTrackingToken(orderId: string, token: string, lang?: string) {
    if (!token) {
      throw new BadRequestException(
        this.i18n.t(ORDER_MESSAGES.INVALID_TRACKING_TOKEN, { lang }),
      );
    }

    try {
      const payload = this.jwtService.verify<{
        orderId?: string;
        phone?: string;
        role?: string;
      }>(token);
      if (payload.orderId !== orderId || payload.role !== 'GUEST') {
        throw new BadRequestException(
          this.i18n.t(ORDER_MESSAGES.INVALID_TRACKING_TOKEN, { lang }),
        );
      }
      return payload;
    } catch {
      throw new BadRequestException(
        this.i18n.t(ORDER_MESSAGES.INVALID_TRACKING_TOKEN, { lang }),
      );
    }
  }

  getEventEmitter() {
    return this.eventEmitter;
  }

  async getOrderById(
    orderId: string,
    user: { id: string; role: string },
    lang?: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(
        this.i18n.t(ORDER_MESSAGES.NOT_FOUND, { lang }),
      );
    }

    const staffRoles: UserRole[] = [
      UserRole.ADMIN,
      UserRole.SUPER_ADMIN,
      UserRole.EMPLOYEE,
    ];
    const isStaff = staffRoles.includes(user.role as UserRole);

    if (!isStaff && order.userId !== user.id) {
      throw new ForbiddenException(
        this.i18n.t(ORDER_MESSAGES.UNAUTHORIZED, { lang }),
      );
    }

    return order;
  }

  async verifyOrderOwnership(orderId: string, userId: string, lang?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true },
    });
    if (!order) {
      throw new NotFoundException(
        this.i18n.t(ORDER_MESSAGES.NOT_FOUND, { lang }),
      );
    }
    if (order.userId !== userId) {
      throw new BadRequestException(
        this.i18n.t(ORDER_MESSAGES.UNAUTHORIZED, { lang }),
      );
    }
  }

  async getUserOrders(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId },
        include: { items: { include: { product: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where: { userId } }),
    ]);

    return {
      data: orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getAdminOrders(page: number = 1, limit: number = 10, status?: string) {
    const skip = (page - 1) * limit;
    const whereCondition = status ? { status: status as OrderStatus } : {};

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: whereCondition,
        include: {
          user: { select: { id: true, fullName: true, email: true } },
          items: { include: { product: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where: whereCondition }),
    ]);

    return {
      data: orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async cancelOrder(
    orderId: string,
    userId?: string,
    isStaff: boolean = false,
    lang?: string,
  ) {
    const updated = await this.prisma.$transaction(async (tx) => {
      // 1. Atomic Claim with status condition
      const updateResult = await tx.order.updateMany({
        where: {
          id: orderId,
          status: { in: [OrderStatus.PENDING, OrderStatus.PENDING_PAYMENT] },
          ...(userId && !isStaff ? { userId } : {}),
        },
        data: {
          status: OrderStatus.CANCELLED,
        },
      });

      if (updateResult.count === 0) {
        throw new BadRequestException(
          this.i18n.t(ORDER_MESSAGES.CANNOT_CANCEL, { lang }),
        );
      }

      // 2. Safe idempotent stock increment and flash sale quota rollback
      const items = await tx.orderItem.findMany({ where: { orderId } });
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });

        if (item.productDiscountId) {
          await tx.$executeRaw`
            UPDATE product_discounts
            SET flashSaleSold = GREATEST(0, flashSaleSold - ${item.quantity})
            WHERE id = ${item.productDiscountId}
          `;
        }
      }

      // 3. Read-after-claim: restore VIP points if used
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (order?.userId && order.usedVipPoints > 0) {
        await tx.user.update({
          where: { id: order.userId },
          data: { vipPoints: { increment: order.usedVipPoints } },
        });
        await tx.order.update({
          where: { id: orderId },
          data: { usedVipPoints: 0 },
        });
      }

      // 4. Safe Voucher rollback
      if (order?.voucherId) {
        await tx.$executeRaw`
          UPDATE vouchers
          SET usedCount = GREATEST(0, usedCount - 1)
          WHERE id = ${order.voucherId}
        `;
        await tx.userVoucherUsage.deleteMany({
          where: { orderId, voucherId: order.voucherId },
        });
      }

      return tx.order.findUnique({
        where: { id: orderId },
        include: { items: { include: { product: true } } },
      });
    });

    this.eventEmitter.emit(`order.updated.${orderId}`, {
      status: OrderStatus.CANCELLED,
    });
    this.eventEmitter.emit(`order.status.changed`, {
      orderId,
      status: OrderStatus.CANCELLED,
    });

    return updated;
  }

  async updateOrderStatus(
    orderId: string,
    dto: UpdateOrderStatusDto,
    lang?: string,
  ) {
    const { status, deliveryPartner, trackingId } = dto;

    if (!Object.values(OrderStatus).includes(status)) {
      throw new BadRequestException(
        this.i18n.t(ORDER_MESSAGES.INVALID_STATUS, { lang }),
      );
    }

    if (status === OrderStatus.CANCELLED) {
      return this.cancelOrder(orderId, undefined, true, lang);
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      throw new NotFoundException(
        this.i18n.t(ORDER_MESSAGES.NOT_FOUND, { lang }),
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const updateData: Prisma.OrderUpdateInput = {
        status,
        ...(deliveryPartner ? { deliveryPartner } : {}),
        ...(trackingId ? { trackingId } : {}),
      };

      if (status === OrderStatus.COMPLETED && !order.pointsCreditedAt) {
        if (order.userId && order.earnedVipPoints > 0) {
          await tx.user.update({
            where: { id: order.userId },
            data: { vipPoints: { increment: order.earnedVipPoints } },
          });
        }
        updateData.pointsCreditedAt = new Date();
        updateData.completedAt = new Date();
      }

      if (status === OrderStatus.RETURNED) {
        if (
          order.userId &&
          order.pointsCreditedAt &&
          order.earnedVipPoints > 0
        ) {
          const user = await tx.user.findUnique({
            where: { id: order.userId },
          });
          if (user) {
            if (user.vipPoints >= order.earnedVipPoints) {
              await tx.user.update({
                where: { id: order.userId },
                data: { vipPoints: { decrement: order.earnedVipPoints } },
              });
            } else {
              const debt = order.earnedVipPoints - user.vipPoints;
              await tx.user.update({
                where: { id: order.userId },
                data: { vipPoints: 0, vipPointsDebt: { increment: debt } },
              });
            }
          }
          // Prevent double revoke
          updateData.pointsCreditedAt = null;
          updateData.earnedVipPoints = 0;
        }
      }

      return tx.order.update({
        where: { id: orderId },
        data: updateData,
      });
    });

    this.eventEmitter.emit(`order.updated.${orderId}`, {
      status,
      deliveryPartner,
      trackingId,
    });
    this.eventEmitter.emit(`order.status.changed`, {
      orderId,
      status,
      deliveryPartner,
      trackingId,
    });

    return updated;
  }
}
