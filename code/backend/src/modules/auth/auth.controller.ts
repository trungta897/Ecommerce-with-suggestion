import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly i18n: I18nService,
  ) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('verify-email')
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);
    if (result?.accessToken) {
      this.setAuthCookie(res, result.accessToken);
    }
    return result;
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response): { message: string } {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    return this.authService.logout();
  }

  @Post('phone/login')
  async requestPhoneOtp(@Body('phone') phone: string) {
    const lang = I18nContext.current()?.lang || 'vi';
    if (!phone) {
      throw new BadRequestException(
        this.i18n.t('auth.PHONE_REQUIRED', { lang }),
      );
    }
    return this.authService.requestPhoneOtp(phone);
  }

  @Post('phone/verify')
  async verifyPhoneOtp(
    @Body('phone') phone: string,
    @Body('otp') otp: string,
    @Body('sessionId') sessionId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const lang = I18nContext.current()?.lang || 'vi';
    if (!phone || !otp) {
      throw new BadRequestException(
        this.i18n.t('auth.PHONE_AND_OTP_REQUIRED', { lang }),
      );
    }
    const result = await this.authService.verifyPhoneOtp(phone, otp, sessionId);
    if (result?.accessToken) {
      this.setAuthCookie(res, result.accessToken);
    }
    return result;
  }

  private setAuthCookie(res: Response, accessToken: string) {
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }
}
