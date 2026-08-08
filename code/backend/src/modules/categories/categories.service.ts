import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { I18nService } from 'nestjs-i18n';
import { RedisService } from '../redis/redis.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private i18n: I18nService,
  ) {}

  async findAll(includeInactive = false) {
    const cacheKey = `categories:all:inactive=${includeInactive}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as Prisma.CategoryGetPayload<{
        include: { children: true };
      }>[];
    }

    const where = includeInactive ? {} : { isActive: true };
    const data = await this.prisma.category.findMany({
      where,
      include: {
        children: true,
      },
    });

    await this.redis.set(cacheKey, JSON.stringify(data), 300); // 5 minutes
    return data;
  }

  async findOne(id: string, lang: string = 'vi') {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { children: true },
    });
    if (!category)
      throw new NotFoundException(
        this.i18n.t('categories.NOT_FOUND', { lang }),
      );
    return category;
  }

  async create(dto: CreateCategoryDto, lang: string = 'vi') {
    const existing = await this.prisma.category.findUnique({
      where: { slug: dto.slug },
    });
    if (existing)
      throw new ConflictException(
        this.i18n.t('categories.SLUG_EXISTS', { lang }),
      );

    const result = await this.prisma.category.create({ data: dto });
    await this.clearCategoryCache();
    return result;
  }

  async update(id: string, dto: UpdateCategoryDto, lang: string = 'vi') {
    await this.findOne(id, lang);
    if (dto.slug) {
      const existing = await this.prisma.category.findUnique({
        where: { slug: dto.slug },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          this.i18n.t('categories.SLUG_EXISTS', { lang }),
        );
      }
    }
    const result = await this.prisma.category.update({
      where: { id },
      data: dto,
    });
    await this.clearCategoryCache();
    return result;
  }

  async remove(id: string, lang: string = 'vi') {
    await this.findOne(id, lang);
    const result = await this.prisma.category.update({
      where: { id },
      data: { isActive: false },
    });
    await this.clearCategoryCache();
    return result;
  }

  private async clearCategoryCache() {
    await this.redis.del('categories:all:inactive=false');
    await this.redis.del('categories:all:inactive=true');
  }
}
