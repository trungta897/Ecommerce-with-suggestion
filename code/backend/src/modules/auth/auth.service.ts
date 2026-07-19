import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { BcryptHelper } from '../../common/utils/bcrypt.util';
import { JwtService } from '@nestjs/jwt';
import { I18nContext, I18nService } from 'nestjs-i18n';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private i18n: I18nService,
  ) {}

  async register(dto: RegisterDto) {
    const lang = I18nContext.current()?.lang;

    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      const msg = this.i18n.t('auth.USER_EXISTS', { lang });
      throw new BadRequestException(msg);
    }

    // Hash password
    const passwordHash = await BcryptHelper.hashPassword(dto.password);

    // Create user
    const newUser = await this.prisma.user.create({
      data: {
        email: dto.email,
        fullName: dto.fullName,
        passwordHash,
      },
    });

    return {
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
    };
  }

  async login(dto: LoginDto) {
    const lang = I18nContext.current()?.lang;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      const msg = this.i18n.t('auth.USER_NOT_FOUND', { lang });
      throw new BadRequestException(msg);
    }

    // Compare password
    const isPasswordValid = await BcryptHelper.comparePassword(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      const msg = this.i18n.t('auth.INVALID_PASSWORD', { lang });
      throw new BadRequestException(msg);
    }

    // Generate JWT
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }
}
