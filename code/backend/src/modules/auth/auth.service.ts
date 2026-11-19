import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { randomInt } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SetStaffPasswordDto } from './dto/set-staff-password.dto';
import { BcryptHelper } from '../../common/utils/bcrypt.util';
import { JwtService } from '@nestjs/jwt';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { RedisService } from '../redis/redis.service';
import { MailService } from '../mail/mail.service';

const OTP_MAX_REQUESTS_PER_PHONE = 10; // số lần yêu cầu OTP tối đa trên mỗi SĐT trong 15 phút

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private i18n: I18nService,
    private redisService: RedisService,
    private mailService: MailService,
  ) {}

  private generateOtp(): string {
    // Dùng bộ sinh số ngẫu nhiên an toàn mật mã (CSPRNG) thay cho Math.random().
    return randomInt(100000, 1000000).toString();
  }

  private t(key: string, lang?: string): string {
    return this.i18n.t(key, {
      lang: lang || I18nContext.current()?.lang || 'vi',
    });
  }

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) throw new BadRequestException(this.t('auth.USER_EXISTS'));

    const passwordHash = await BcryptHelper.hashPassword(dto.password);
    const newUser = await this.prisma.user.create({
      data: {
        email: dto.email,
        fullName: dto.fullName,
        passwordHash,
        isVerified: false,
      },
    });

    const otp = this.generateOtp();
    await this.redisService.set(`OTP:REGISTER:${dto.email}`, otp, 300);
    await this.mailService.sendOtpEmail(dto.email, otp, 'register');

    return {
      message: this.t('auth.REGISTER_CHECK_EMAIL'),
      email: newUser.email,
    };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const redisKey = `OTP:REGISTER:${dto.email}`;
    const failKey = `OTP:FAIL:${dto.email}`;

    const fails = await this.redisService.get(failKey);
    if (fails && parseInt(fails, 10) >= 3) {
      throw new BadRequestException(this.t('auth.OTP_EXCEEDED'));
    }

    const savedOtp = await this.redisService.get(redisKey);
    if (!savedOtp) throw new BadRequestException(this.t('auth.OTP_EXPIRED'));

    if (savedOtp !== dto.otp) {
      await this.redisService.incr(failKey);
      await this.redisService.set(failKey, '1', 300);
      throw new BadRequestException(this.t('auth.OTP_INVALID'));
    }

    await this.prisma.user.update({
      where: { email: dto.email },
      data: { isVerified: true },
    });
    await this.redisService.del(redisKey);
    await this.redisService.del(failKey);

    return { message: this.t('auth.VERIFY_SUCCESS') };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) return { message: this.t('auth.FORGOT_SENT') };

    const otp = this.generateOtp();
    await this.redisService.set(`OTP:FORGOT:${dto.email}`, otp, 300);
    await this.mailService.sendOtpEmail(dto.email, otp, 'forgot_password');

    return { message: this.t('auth.FORGOT_SENT') };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const redisKey = `OTP:FORGOT:${dto.email}`;
    const failKey = `OTP:FAIL_FORGOT:${dto.email}`;

    const fails = await this.redisService.get(failKey);
    if (fails && parseInt(fails, 10) >= 3) {
      throw new BadRequestException(this.t('auth.OTP_EXCEEDED'));
    }

    const savedOtp = await this.redisService.get(redisKey);
    if (!savedOtp || savedOtp !== dto.otp) {
      await this.redisService.incr(failKey);
      throw new BadRequestException(this.t('auth.RESET_INVALID_OTP'));
    }

    const passwordHash = await BcryptHelper.hashPassword(dto.newPassword);
    await this.prisma.user.update({
      where: { email: dto.email },
      data: { passwordHash },
    });
    await this.redisService.del(redisKey);
    await this.redisService.del(failKey);

    return { message: this.t('auth.RESET_SUCCESS') };
  }

  private async mergeGuestActivities(
    sessionId: string | undefined,
    userId: string,
  ) {
    if (!sessionId) return;
    await this.prisma.userActivityLog
      .updateMany({ where: { sessionId, userId: null }, data: { userId } })
      .catch(() => {});
  }

  async setStaffPassword(dto: SetStaffPasswordDto) {
    let payload: { sub?: string; email?: string; type?: string };
    try {
      payload = this.jwtService.verify<{
        sub?: string;
        email?: string;
        type?: string;
      }>(dto.token);
    } catch {
      throw new BadRequestException(this.t('auth.SESSION_EXPIRED'));
    }

    if (!payload?.sub || payload.type !== 'STAFF_INVITE') {
      throw new BadRequestException(this.t('auth.SESSION_EXPIRED'));
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user || user.passwordSetAt || user.passwordHash) {
      throw new BadRequestException(this.t('auth.SESSION_EXPIRED'));
    }

    const passwordHash = await BcryptHelper.hashPassword(dto.newPassword);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordSetAt: new Date(),
        isVerified: true,
        isActive: true,
      },
    });

    return { message: this.t('auth.RESET_SUCCESS') };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new BadRequestException(this.t('auth.USER_NOT_FOUND'));
    if (user.isActive === false)
      throw new BadRequestException(this.t('auth.PHONE_LOCKED'));
    if (!user.isVerified)
      throw new BadRequestException(this.t('auth.UNVERIFIED_ACCOUNT'));
    if (!user.passwordHash)
      throw new BadRequestException(this.t('auth.GOOGLE_ONLY'));

    const isPasswordValid = await BcryptHelper.comparePassword(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid)
      throw new BadRequestException(this.t('auth.INVALID_PASSWORD'));

    await this.mergeGuestActivities(dto.sessionId, user.id);
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

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
    return { message: this.t('auth.LOGOUT_SUCCESS') };
  }

  async requestPhoneOtp(phone: string) {
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (user && !user.isActive)
      throw new BadRequestException(this.t('auth.PHONE_LOCKED'));

    // Giới hạn tần suất yêu cầu OTP theo SĐT (bổ sung cho giới hạn theo IP ở Controller).
    const reqKey = `OTP:REQ_PHONE:${phone}`;
    const isFirstRequest = await this.redisService.setNx(reqKey, '1', 900);
    if (!isFirstRequest) {
      const requests = await this.redisService.incr(reqKey);
      if (requests > OTP_MAX_REQUESTS_PER_PHONE) {
        throw new BadRequestException(this.t('auth.PHONE_OTP_EXCEEDED'));
      }
    }

    const otp = this.generateOtp();
    await this.redisService.set(`OTP:PHONE:${phone}`, otp, 300);
    // Không xóa bộ đếm nhập sai khi cấp OTP mới: tránh vô hiệu hóa cơ chế khóa 15 phút.
    if (process.env.NODE_ENV !== 'production') {
      this.logger.log(`📱 [DEV OTP] Phone: ${phone} -> OTP: ${otp}`);
    }

    return { message: this.t('auth.PHONE_OTP_SENT'), phone };
  }

  async verifyPhoneOtp(phone: string, otp: string, sessionId?: string) {
    const redisKey = `OTP:PHONE:${phone}`;
    const failKey = `OTP:FAIL_PHONE:${phone}`;

    const fails = await this.redisService.get(failKey);
    if (fails && parseInt(fails, 10) >= 3) {
      throw new BadRequestException(this.t('auth.PHONE_OTP_EXCEEDED'));
    }

    const savedOtp = await this.redisService.get(redisKey);
    if (!savedOtp)
      throw new BadRequestException(this.t('auth.PHONE_OTP_EXPIRED'));

    if (savedOtp !== otp) {
      const isNewKey = await this.redisService.setNx(failKey, '1', 900);
      if (!isNewKey) await this.redisService.incr(failKey);
      throw new BadRequestException(this.t('auth.PHONE_OTP_INVALID'));
    }

    let user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          phone,
          email: `${phone}@placeholder.local`,
          fullName: 'Customer',
          passwordHash: '',
          isVerified: true,
          role: 'CUSTOMER',
        },
      });
    } else if (user.isActive === false) {
      throw new BadRequestException(this.t('auth.PHONE_LOCKED'));
    }

    await this.redisService.del(redisKey);
    await this.redisService.del(failKey);
    await this.mergeGuestActivities(sessionId, user.id);

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }
}
