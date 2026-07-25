import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { I18nService, I18nContext } from 'nestjs-i18n';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        address: true,
        avatarUrl: true,
        role: true,
        isVerified: true,
        provider: true,
        createdAt: true,
      },
    });

    if (!user) {
      const lang = I18nContext.current()?.lang || 'vi';
      throw new NotFoundException(
        this.i18n.t('users.USER_NOT_FOUND', { lang }),
      );
    }
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      const lang = I18nContext.current()?.lang || 'vi';
      throw new NotFoundException(
        this.i18n.t('users.USER_NOT_FOUND', { lang }),
      );
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        address: true,
        avatarUrl: true,
        role: true,
        isVerified: true,
        provider: true,
        createdAt: true,
      },
    });

    return updatedUser;
  }
}
