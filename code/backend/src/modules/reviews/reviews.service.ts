import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { I18nService } from 'nestjs-i18n';
import { REVIEW_MESSAGES } from '../../common/constants/review-message.constant';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  async create(
    productId: string,
    dto: CreateReviewDto,
    userId: string,
    lang?: string,
  ) {
    // Check if review already exists
    const existing = await this.prisma.review.findUnique({
      where: {
        userId_productId: { userId, productId },
      },
    });

    if (existing) {
      throw new BadRequestException(
        this.i18n.t(REVIEW_MESSAGES.ALREADY_REVIEWED, { lang }),
      );
    }

    // Check if user has bought this product and order is COMPLETED
    const orderItem = await this.prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId,
          status: 'COMPLETED',
        },
      },
      include: {
        order: true,
      },
      orderBy: {
        order: {
          createdAt: 'desc',
        },
      },
    });

    if (!orderItem) {
      throw new BadRequestException(
        this.i18n.t(REVIEW_MESSAGES.MUST_BE_COMPLETED, { lang }),
      );
    }

    // Create review
    const review = await this.prisma.review.create({
      data: {
        userId,
        productId,
        orderId: orderItem.orderId,
        rating: dto.rating,
        title: dto.title,
        content: dto.content,
        isVerifiedPurchase: true,
        status: 'VISIBLE',
      },
    });

    // Update product average rating
    await this.updateProductRating(productId);

    return review;
  }

  async findAllByProduct(productId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { productId, status: 'VISIBLE' },
        include: {
          user: {
            select: { id: true, fullName: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.review.count({ where: { productId, status: 'VISIBLE' } }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findAllForAdmin(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.review.findMany({
        include: {
          user: {
            select: { id: true, fullName: true, email: true, phone: true },
          },
          product: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.review.count(),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findMyReviews(userId: string) {
    return this.prisma.review.findMany({
      where: { userId },
      include: {
        product: {
          select: { id: true, name: true, images: true, slug: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async toggleVisibility(id: string, lang?: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) {
      throw new NotFoundException(
        this.i18n.t(REVIEW_MESSAGES.NOT_FOUND, { lang }),
      );
    }

    const newStatus = review.status === 'VISIBLE' ? 'HIDDEN' : 'VISIBLE';

    const updated = await this.prisma.review.update({
      where: { id },
      data: { status: newStatus },
    });

    await this.updateProductRating(updated.productId);

    return updated;
  }

  private async updateProductRating(productId: string) {
    const agg = await this.prisma.review.aggregate({
      where: { productId, status: 'VISIBLE' },
      _avg: { rating: true },
      _count: { id: true },
    });

    await this.prisma.product.update({
      where: { id: productId },
      data: {
        avgRating: agg._avg.rating || 0,
        reviewCount: agg._count.id || 0,
      },
    });
  }
}
