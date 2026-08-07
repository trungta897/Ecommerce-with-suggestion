import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private i18n: I18nService,
  ) {}

  async findAll(includeInactive = false) {
    const where = includeInactive ? {} : { isActive: true };
    return this.prisma.category.findMany({
      where,
      include: {
        children: true,
      },
    });
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

    return this.prisma.category.create({ data: dto });
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
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async remove(id: string, lang: string = 'vi') {
    await this.findOne(id, lang);
    return this.prisma.category.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
