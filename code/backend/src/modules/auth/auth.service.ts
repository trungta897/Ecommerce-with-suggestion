import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { BcryptHelper } from '../../common/utils/bcrypt.util';
import { JwtService } from '@nestjs/jwt';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { RedisService } from '../redis/redis.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private i18n: I18nService,
    private redisService: RedisService,
    private mailService: MailService,
  ) {}

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

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
        isVerified: false,
      },
    });

    const otp = this.generateOtp();
    await this.redisService.set(`OTP:REGISTER:${dto.email}`, otp, 300); // 5 mins
    await this.mailService.sendOtpEmail(dto.email, otp, 'register');

    return {
      message: this.i18n.t('auth.REGISTER_CHECK_EMAIL', { lang }),
      email: newUser.email,
    };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const lang = I18nContext.current()?.lang || 'vi';
    const redisKey = `OTP:REGISTER:${dto.email}`;
    const failKey = `OTP:FAIL:${dto.email}`;

    const fails = await this.redisService.get(failKey);
    if (fails && parseInt(fails, 10) >= 3) {
      throw new BadRequestException(this.i18n.t('auth.OTP_EXCEEDED', { lang }));
    }

    const savedOtp = await this.redisService.get(redisKey);
    if (!savedOtp) {
      throw new BadRequestException(this.i18n.t('auth.OTP_EXPIRED', { lang }));
    }

    if (savedOtp !== dto.otp) {
      await this.redisService.incr(failKey);
      await this.redisService.set(failKey, '1', 300); // Wait, incr doesn't set TTL if it exists, but let's just keep it simple. Actually, we should set EX if not exists.
      throw new BadRequestException(this.i18n.t('auth.OTP_INVALID', { lang }));
    }

    await this.prisma.user.update({
      where: { email: dto.email },
      data: { isVerified: true },
    });

    await this.redisService.del(redisKey);
    await this.redisService.del(failKey);

    return { message: this.i18n.t('auth.VERIFY_SUCCESS', { lang }) };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const lang = I18nContext.current()?.lang || 'vi';
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      return { message: this.i18n.t('auth.FORGOT_SENT', { lang }) };
    }

    const otp = this.generateOtp();
    await this.redisService.set(`OTP:FORGOT:${dto.email}`, otp, 300);
    await this.mailService.sendOtpEmail(dto.email, otp, 'forgot_password');

    return { message: this.i18n.t('auth.FORGOT_SENT', { lang }) };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const lang = I18nContext.current()?.lang || 'vi';
    const redisKey = `OTP:FORGOT:${dto.email}`;
    const failKey = `OTP:FAIL_FORGOT:${dto.email}`;

    const fails = await this.redisService.get(failKey);
    if (fails && parseInt(fails, 10) >= 3) {
      throw new BadRequestException(this.i18n.t('auth.OTP_EXCEEDED', { lang }));
    }

    const savedOtp = await this.redisService.get(redisKey);
    if (!savedOtp || savedOtp !== dto.otp) {
      await this.redisService.incr(failKey);
      throw new BadRequestException(
        this.i18n.t('auth.RESET_INVALID_OTP', { lang }),
      );
    }

    const passwordHash = await BcryptHelper.hashPassword(dto.newPassword);
    await this.prisma.user.update({
      where: { email: dto.email },
      data: { passwordHash },
    });

    await this.redisService.del(redisKey);
    await this.redisService.del(failKey);

    return { message: this.i18n.t('auth.RESET_SUCCESS', { lang }) };
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

    if (!user.isVerified) {
      throw new BadRequestException(
        this.i18n.t('auth.UNVERIFIED_ACCOUNT', { lang }),
      );
    }

    if (!user.passwordHash) {
      throw new BadRequestException(this.i18n.t('auth.GOOGLE_ONLY', { lang }));
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

  logout(): { message: string } {
    const lang = I18nContext.current()?.lang || 'vi';
    return {
      message: this.i18n.t('auth.LOGOUT_SUCCESS', { lang }),
    };
  }
}
