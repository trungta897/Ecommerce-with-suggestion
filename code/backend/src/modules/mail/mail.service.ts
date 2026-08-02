import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor() {
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
    const subject =
      purpose === 'register'
        ? 'Mã xác thực đăng ký tài khoản'
        : 'Mã xác thực đặt lại mật khẩu';
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
      throw new Error('Không thể gửi email xác thực');
    }
  }
}
