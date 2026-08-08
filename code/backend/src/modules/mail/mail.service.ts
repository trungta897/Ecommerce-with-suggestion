import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { I18nService, I18nContext } from 'nestjs-i18n';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(private i18n: I18nService) {
    // For development, you can use ethereal.email or your own Gmail credentials in .env
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendOtpEmail(
    to: string,
    otp: string,
    purpose: 'register' | 'forgot_password',
  ): Promise<void> {
    const lang = I18nContext.current()?.lang || 'vi';
    const subject =
      purpose === 'register'
        ? this.i18n.t('mail.OTP_SUBJECT_REGISTER', { lang })
        : this.i18n.t('mail.OTP_SUBJECT_FORGOT', { lang });
    const text = `Mã xác thực của bạn là: ${otp}. Mã này sẽ hết hạn sau 5 phút. Vui lòng không chia sẻ cho bất kỳ ai.`;
    const html = `<div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #333;">Xác thực tài khoản</h2>
        <p>Mã xác thực của bạn là: <strong style="font-size: 24px; color: #4F46E5;">${otp}</strong></p>
        <p>Mã này sẽ hết hạn sau 5 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
      </div>`;

    try {
      await this.transporter.sendMail({
        from: `"E-Commerce App" <${process.env.SMTP_USER}>`,
        to,
        subject,
        text,
        html,
      });
      this.logger.log(`OTP email sent to ${to} for ${purpose}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${to}:`, error);
      throw new InternalServerErrorException(
        this.i18n.t('mail.SEND_FAILED', { lang }),
      );
    }
  }
}
