import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { I18nService } from 'nestjs-i18n';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ActivityType } from '@prisma/client';

export interface WishlistToggleResponse {
  isWishlisted: boolean;
  message: string;
}

export interface WishlistActionResponse {
  success: boolean;
  message: string;
}

@Injectable()
export class WishlistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getUserWishlist(userId: string) {
    return this.prisma.wishlist.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getUserWishlistIds(userId: string): Promise<string[]> {
    const items = await this.prisma.wishlist.findMany({
      where: { userId },
      select: { productId: true },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return items.map((item) => item.productId);
  }

  async toggleWishlist(
    userId: string,
    productId: string,
    lang: string = 'vi',
  ): Promise<WishlistToggleResponse> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, isActive: true },
    });

    if (!product || !product.isActive) {
      throw new NotFoundException(
        this.i18n.translate('wishlist.PRODUCT_NOT_FOUND', { lang }),
      );
    }

    const existingWishlist = await this.prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existingWishlist) {
      await this.prisma.wishlist.delete({
        where: { id: existingWishlist.id },
      });

      return {
        isWishlisted: false,
        message: this.i18n.translate('wishlist.REMOVED_SUCCESS', { lang }),
      };
    }

    await this.prisma.wishlist.create({
      data: {
        userId,
        productId,
      },
    });

    // Decoupled Pub/Sub event for activity tracking / analytics
    this.eventEmitter.emit('activity.log', {
      userId,
      productId,
      action: ActivityType.WISHLIST_ADD,
    });

    return {
      isWishlisted: true,
      message: this.i18n.translate('wishlist.ADDED_SUCCESS', { lang }),
    };
  }

  async removeFromWishlist(
    userId: string,
    productId: string,
    lang: string = 'vi',
  ): Promise<WishlistActionResponse> {
    const existingWishlist = await this.prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (!existingWishlist) {
      throw new NotFoundException(
        this.i18n.translate('wishlist.ITEM_NOT_FOUND', { lang }),
      );
    }

    await this.prisma.wishlist.delete({
      where: { id: existingWishlist.id },
    });

    return {
      success: true,
      message: this.i18n.translate('wishlist.REMOVED_SUCCESS', { lang }),
    };
  }
}
