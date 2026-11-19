import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../redis/redis.service';
import { OrderStatus, UserRole } from '@prisma/client';

export interface RawDashboardStats {
  revenue: number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  orderStatusCounts: Record<string, number>;
  recentOrders: Array<{
    id: string;
    totalAmount: number;
    status: OrderStatus;
    createdAt: Date;
    user?: {
      fullName: string;
      email: string;
    } | null;
  }>;
}

export interface DashboardStatsResponse {
  revenue: number | null;
  totalOrders: number;
  totalUsers: number | null;
  totalProducts: number;
  orderStatusCounts: Record<string, number>;
  recentOrders: RawDashboardStats['recentOrders'];
}

const DASHBOARD_CACHE_KEY = 'admin:dashboard:stats:raw';
const DASHBOARD_CACHE_TTL = 120; // 2 minutes

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async getDashboardStats(
    role: UserRole,
    refresh?: boolean,
  ): Promise<DashboardStatsResponse> {
    let rawStats: RawDashboardStats | null = null;

    if (!refresh) {
      const cached = await this.redisService.get(DASHBOARD_CACHE_KEY);
      if (cached) {
        try {
          rawStats = JSON.parse(cached) as RawDashboardStats;
        } catch {
          this.logger.warn('Failed to parse cached dashboard stats');
        }
      }
    }

    if (!rawStats) {
      rawStats = await this.computeRawStats();
      await this.redisService.set(
        DASHBOARD_CACHE_KEY,
        JSON.stringify(rawStats),
        DASHBOARD_CACHE_TTL,
      );
    }

    return this.scopeStatsByRole(rawStats, role);
  }

  private async computeRawStats(): Promise<RawDashboardStats> {
    const [
      revenueResult,
      totalOrders,
      totalUsers,
      totalProducts,
      statusGroups,
      recentOrders,
    ] = await Promise.all([
      // 1. Total revenue of COMPLETED orders
      this.prisma.order.aggregate({
        where: { status: OrderStatus.COMPLETED },
        _sum: { totalAmount: true },
      }),
      // 2. Total orders
      this.prisma.order.count(),
      // 3. Total customers
      this.prisma.user.count({
        where: { role: UserRole.CUSTOMER },
      }),
      // 4. Total active products
      this.prisma.product.count({
        where: { isActive: true },
      }),
      // 5. Order counts grouped by status
      this.prisma.order.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      // 6. 5 most recent orders
      this.prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          totalAmount: true,
          status: true,
          createdAt: true,
          user: {
            select: {
              fullName: true,
              email: true,
            },
          },
        },
      }),
    ]);

    const orderStatusCounts: Record<string, number> = {};
    for (const group of statusGroups) {
      orderStatusCounts[group.status] = group._count.id;
    }

    const revenue = revenueResult._sum.totalAmount
      ? Number(revenueResult._sum.totalAmount)
      : 0;

    const formattedRecentOrders = recentOrders.map((order) => ({
      ...order,
      totalAmount: Number(order.totalAmount),
    }));

    return {
      revenue,
      totalOrders,
      totalUsers,
      totalProducts,
      orderStatusCounts,
      recentOrders: formattedRecentOrders,
    };
  }

  private scopeStatsByRole(
    rawStats: RawDashboardStats,
    role: UserRole,
  ): DashboardStatsResponse {
    // Only ADMIN and SUPER_ADMIN see sensitive financial and customer metrics
    const isExecutive =
      role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;

    return {
      revenue: isExecutive ? rawStats.revenue : null,
      totalOrders: rawStats.totalOrders,
      totalUsers: isExecutive ? rawStats.totalUsers : null,
      totalProducts: rawStats.totalProducts,
      orderStatusCounts: rawStats.orderStatusCounts,
      recentOrders: rawStats.recentOrders,
    };
  }
}
