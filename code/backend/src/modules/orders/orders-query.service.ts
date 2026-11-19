import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { OrderStatus, UserRole } from '@prisma/client';
import { ORDER_MESSAGES } from '../../common/constants/order-message.constant';
import { I18nService } from 'nestjs-i18n';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class OrdersQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly jwtService: JwtService,
  ) {}

  async getGuestOrderById(orderId: string, phone: string, lang?: string) {
    if (!phone) {
      throw new NotFoundException(
        this.i18n.t(ORDER_MESSAGES.NOT_FOUND, { lang }),
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

    if (!order || order.userId !== null || order.shippingPhone !== phone) {
      throw new NotFoundException(
        this.i18n.t(ORDER_MESSAGES.NOT_FOUND, { lang }),
      );
    }

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
}
