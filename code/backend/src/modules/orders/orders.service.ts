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

    const shippingFee = 0; // Simplified for now
    const discountAmount = 0; // Simplified for now
    const totalAmount = subtotal + shippingFee - discountAmount;

    // 3. Determine Payment Expiry
    let paymentExpiresAt: Date | null = null;
    if (createOrderDto.paymentMethod !== PaymentMethod.COD) {
      paymentExpiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 mins
    }

    // 4. Atomic Transaction
    const order = await this.prisma.$transaction(async (tx) => {
      // a. Reduce stock first using condition
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

      // c. Clear Cart only for logged in user
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

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: status as OrderStatus },
    });

    this.eventEmitter.emit(`order.updated.${orderId}`, { status });

    return updated;
  }
}
