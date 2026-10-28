import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { I18nService } from 'nestjs-i18n';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { MergeCartDto } from './dto/merge-cart.dto';
import { RedisService } from '../redis/redis.service';
import { Product } from '@prisma/client';

export interface CartItemWithProduct {
  userId: string;
  productId: string;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
  product: Product;
}

export interface SkippedCartItem {
  productId: string;
  reason: 'OUT_OF_STOCK' | 'INACTIVE';
}

@Injectable()
export class CartService {
  constructor(
    private prisma: PrismaService,
    private i18n: I18nService,
    private redisService: RedisService,
  ) {}

  private async warmupRedis(userId: string): Promise<Record<string, string>> {
    const cartKey = `cart:${userId}`;
    const cartData = await this.redisService.hgetall(cartKey);

    if (!cartData['_initialized']) {
      const dbItems = await this.prisma.cartItem.findMany({
        where: { userId },
      });

      await this.redisService.hset(cartKey, '_initialized', '1');
      cartData['_initialized'] = '1';

      for (const item of dbItems) {
        await this.redisService.hset(
          cartKey,
          item.productId,
          item.quantity.toString(),
        );
        cartData[item.productId] = item.quantity.toString();
      }
    }

    const result = { ...cartData };
    delete result['_initialized'];

    return result;
  }

  async getCart(userId: string): Promise<CartItemWithProduct[]> {
    const cartKey = `cart:${userId}`;
    const cartData = await this.warmupRedis(userId);

    if (Object.keys(cartData).length === 0) {
      return [];
    }

    // Redis has data, hydrate with Product details from PostgreSQL
    const productIds = Object.keys(cartData);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));
    const items: CartItemWithProduct[] = [];

    for (const [productId, qtyStr] of Object.entries(cartData)) {
      const quantity = parseInt(qtyStr, 10);
      const product = productMap.get(productId);

      if (product) {
        items.push({
          userId,
          productId,
          quantity,
          createdAt: new Date(),
          updatedAt: new Date(),
          product,
        });
      } else {
        // Product no longer exists in DB, clean up Redis
        await this.redisService.hdel(cartKey, productId);
        await this.redisService.sadd('cart_updates', userId);
      }
    }

    return items;
  }

  async addItem(
    userId: string,
    dto: AddToCartDto,
    lang: string,
  ): Promise<{ userId: string; productId: string; quantity: number }> {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException(
        this.i18n.t('cart.PRODUCT_NOT_FOUND', { lang }),
      );
    }

    if (!product.isActive) {
      throw new BadRequestException(
        this.i18n.t('cart.PRODUCT_INACTIVE', { lang }),
      );
    }

    const cartKey = `cart:${userId}`;
    const cartData = await this.warmupRedis(userId);

    const existingQtyStr = cartData[dto.productId];
    const existingQty = existingQtyStr ? parseInt(existingQtyStr, 10) : 0;

    const newQuantity = existingQty + dto.quantity;

    if (newQuantity > product.stock) {
      throw new BadRequestException(
        this.i18n.t('cart.EXCEED_STOCK', {
          lang,
          args: { stock: product.stock },
        }),
      );
    }

    await this.redisService.hset(
      cartKey,
      dto.productId,
      newQuantity.toString(),
    );
    await this.redisService.sadd('cart_updates', userId);

    return { userId, productId: dto.productId, quantity: newQuantity };
  }

  async updateItem(
    userId: string,
    productId: string,
    dto: UpdateCartDto,
    lang: string,
  ): Promise<{ userId: string; productId: string; quantity: number }> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || !product.isActive) {
      throw new NotFoundException(
        this.i18n.t('cart.PRODUCT_NOT_FOUND', { lang }),
      );
    }

    if (dto.quantity > product.stock) {
      throw new BadRequestException(
        this.i18n.t('cart.EXCEED_STOCK', {
          lang,
          args: { stock: product.stock },
        }),
      );
    }

    const cartKey = `cart:${userId}`;
    const existingQtyStr = await this.redisService.hget(cartKey, productId);

    if (!existingQtyStr) {
      // Check DB just in case
      const dbItem = await this.prisma.cartItem.findUnique({
        where: { userId_productId: { userId, productId } },
      });
      if (!dbItem) {
        throw new NotFoundException(
          this.i18n.t('cart.ITEM_NOT_FOUND', { lang }),
        );
      }
    }

    await this.redisService.hset(cartKey, productId, dto.quantity.toString());
    await this.redisService.sadd('cart_updates', userId);

    return { userId, productId, quantity: dto.quantity };
  }

  async removeItem(
    userId: string,
    productId: string,
  ): Promise<{ success: boolean }> {
    const cartKey = `cart:${userId}`;
    await this.redisService.hdel(cartKey, productId);
    await this.redisService.sadd('cart_updates', userId);
    return { success: true };
  }

  async clearCart(userId: string): Promise<{ success: boolean }> {
    const cartKey = `cart:${userId}`;
    await this.redisService.del(cartKey);
    await this.redisService.sadd('cart_updates', userId);
    return { success: true };
  }

  async mergeCart(
    userId: string,
    dto: MergeCartDto,
  ): Promise<{ success: boolean; skippedItems: SkippedCartItem[] }> {
    const skippedItems: SkippedCartItem[] = [];
    const productIds = dto.items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));
    const cartKey = `cart:${userId}`;

    // Warm up Redis
    const cartData = await this.warmupRedis(userId);

    for (const item of dto.items) {
      const product = productMap.get(item.productId);

      if (!product || !product.isActive) {
        skippedItems.push({ productId: item.productId, reason: 'INACTIVE' });
        continue;
      }
      if (product.stock <= 0) {
        skippedItems.push({
          productId: item.productId,
          reason: 'OUT_OF_STOCK',
        });
        continue;
      }

      const existingQtyStr = cartData[item.productId];
      const currentQty = existingQtyStr ? parseInt(existingQtyStr, 10) : 0;
      const newQty = Math.min(currentQty + item.quantity, product.stock);

      await this.redisService.hset(cartKey, item.productId, newQty.toString());
      // Update local cartData so subsequent loops for the same item are correct
      cartData[item.productId] = newQty.toString();
    }

    await this.redisService.sadd('cart_updates', userId);
    return { success: true, skippedItems };
  }
}
