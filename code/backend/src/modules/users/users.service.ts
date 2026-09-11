import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UserRole } from '@prisma/client';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { I18nService, I18nContext } from 'nestjs-i18n';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
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

  async getAllUsers(page = 1, limit = 10, role?: string) {
    const skip = (page - 1) * limit;
    const where = role ? { role: role as UserRole } : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          role: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async inviteStaff(
    adminRole: string,
    email: string,
    fullName: string,
    role: 'ADMIN' | 'EMPLOYEE',
  ) {
    const lang = I18nContext.current()?.lang || 'vi';

    if (adminRole === 'ADMIN' && role === 'ADMIN') {
      throw new BadRequestException(
        this.i18n.t('users.ONLY_SUPER_ADMIN_CAN_INVITE_ADMIN', { lang }),
      );
    }

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new BadRequestException(
        this.i18n.t('users.EMAIL_ALREADY_EXISTS', { lang }),
      );
    }

    const newUser = await this.prisma.user.create({
      data: {
        email,
        fullName,
        role: role,
        passwordHash: '', // Set via invite link
        isVerified: true,
      },
    });

    const inviteToken = this.jwtService.sign(
      { email, role, sub: newUser.id, type: 'STAFF_INVITE' },
      { expiresIn: '24h' },
    );

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const inviteLink = `${frontendUrl}/auth/set-password?token=${inviteToken}`;

    await this.mailService.sendStaffInvitationEmail(
      email,
      fullName,
      role,
      inviteLink,
    );

    return {
      message: this.i18n.t('users.INVITE_STAFF_SUCCESS', { lang }),
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
      },
      inviteLink:
        process.env.NODE_ENV !== 'production' ? inviteLink : undefined,
    };
  }

  async changeRole(
    adminId: string,
    adminRole: string,
    targetUserId: string,
    newRole: UserRole,
  ) {
    const lang = I18nContext.current()?.lang || 'vi';

    if (adminId === targetUserId) {
      throw new BadRequestException(
        this.i18n.t('users.CANNOT_CHANGE_OWN_ROLE', { lang }),
      );
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!targetUser) {
      throw new NotFoundException(
        this.i18n.t('users.USER_NOT_FOUND', { lang }),
      );
    }

    // RBAC Rule:
    // ADMIN can only manage EMPLOYEE/CUSTOMER
    // SUPER_ADMIN can manage ADMIN/EMPLOYEE/CUSTOMER
    if (adminRole === 'ADMIN') {
      if (targetUser.role === 'SUPER_ADMIN' || targetUser.role === 'ADMIN') {
        throw new BadRequestException(
          this.i18n.t('users.NO_PERMISSION_CHANGE_ROLE', { lang }),
        );
      }
      if (newRole === 'SUPER_ADMIN' || newRole === 'ADMIN') {
        throw new BadRequestException(
          this.i18n.t('users.NO_PERMISSION_GRANT_ROLE', { lang }),
        );
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
    });

    return {
      message: this.i18n.t('users.CHANGE_ROLE_SUCCESS', { lang }),
      user: updatedUser,
    };
  }

  async toggleActive(adminId: string, adminRole: string, targetUserId: string) {
    const lang = I18nContext.current()?.lang || 'vi';

    if (adminId === targetUserId) {
      throw new BadRequestException(
        this.i18n.t('users.CANNOT_LOCK_OWN_ACCOUNT', { lang }),
      );
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!targetUser) {
      throw new NotFoundException(
        this.i18n.t('users.USER_NOT_FOUND', { lang }),
      );
    }

    if (
      adminRole === 'ADMIN' &&
      (targetUser.role === 'SUPER_ADMIN' || targetUser.role === 'ADMIN')
    ) {
      throw new BadRequestException(
        this.i18n.t('users.NO_PERMISSION_LOCK_USER', { lang }),
      );
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { isActive: !targetUser.isActive },
    });

    return {
      message: updatedUser.isActive
        ? this.i18n.t('users.UNLOCKED_ACCOUNT_SUCCESS', { lang })
        : this.i18n.t('users.LOCKED_ACCOUNT_SUCCESS', { lang }),
      user: updatedUser,
    };
  }
}
