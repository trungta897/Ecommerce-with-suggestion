import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { PaymentMethod, OrderStatus, Product, Prisma } from '@prisma/client';
import { RedisService } from '../redis/redis.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ORDER_MESSAGES } from '../../common/constants/order-message.constant';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly eventEmitter: EventEmitter2,
    private readonly i18n: I18nService,
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

    // 2. Calculate totals and check stock
    let subtotal = 0;
    for (const item of cartItems) {
      if (item.product.stock < item.quantity) {
        throw new BadRequestException(
          `Sản phẩm ${item.product.name} không đủ tồn kho (Còn: ${item.product.stock})`,
        );
      }
      const price = item.product.discountPrice
        ? Number(item.product.discountPrice)
        : Number(item.product.price);
      subtotal += price * item.quantity;
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
    // FREE_SHIPPING voucher logic mockup (we assume a 100% discount on shipping for now if voucherId is 'FREE_SHIP')
    if (createOrderDto.voucherId) {
      const voucher = await this.prisma.voucher.findUnique({
        where: { id: createOrderDto.voucherId },
      });
      if (voucher && voucher.isActive) {
        if (voucher.type === 'FREE_SHIPPING') {
          discountAmount = shippingFee;
        } else if (voucher.type === 'FIXED_AMOUNT') {
          discountAmount = Number(voucher.value);
        } else if (voucher.type === 'PERCENTAGE') {
          discountAmount = (subtotal * Number(voucher.value)) / 100;
        }
      }
    }

    const totalAmount = Math.max(
      0,
      subtotal + shippingFee - discountAmount - vipDiscountAmount,
    );

    let isDepositPayment = false;
    let depositAmount: number | null = null;

    if (createOrderDto.deliveryMethod !== 'PICKUP' && subtotal < 200000) {
      isDepositPayment = true;
      depositAmount = 50000;
    }

    if (
      createOrderDto.deliveryMethod === 'PICKUP' &&
      createOrderDto.pickupTime
    ) {
      const pickupTime = new Date(createOrderDto.pickupTime);
      const now = new Date();
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
      for (const item of cartItems) {
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
      }

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
        depositAmount,
        isDepositPayment,
        pickupTime: createOrderDto.pickupTime,
        earnedVipPoints,
        usedVipPoints,
        vipDiscountAmount,
        items: {
          create: cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.product.discountPrice || item.product.price,
            subtotal:
              Number(item.product.discountPrice || item.product.price) *
              item.quantity,
          })),
        },
      };

      const newOrder = await tx.order.create({
        data: orderData,
      });

      if (userId) {
        await tx.cartItem.deleteMany({
          where: { userId },
        });
      }

      return newOrder;
    });

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

    return order;
  }

  getEventEmitter() {
    return this.eventEmitter;
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

  async updateOrderStatus(orderId: string, status: string, lang?: string) {
    if (!Object.values(OrderStatus).includes(status as OrderStatus)) {
      throw new BadRequestException(
        this.i18n.t(ORDER_MESSAGES.INVALID_STATUS, { lang }),
      );
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
        status: status as OrderStatus,
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

      if (status === OrderStatus.CANCELLED) {
        if (order.userId && order.usedVipPoints > 0) {
          await tx.user.update({
            where: { id: order.userId },
            data: { vipPoints: { increment: order.usedVipPoints } },
          });
          updateData.usedVipPoints = 0;
        }
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

    this.eventEmitter.emit(`order.updated.${orderId}`, { status });
    this.eventEmitter.emit(`order.status.changed`, { orderId, status });

    return updated;
  }
}
