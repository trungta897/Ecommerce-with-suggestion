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
  async sendReturnApprovedEmail(to: string, orderId: string): Promise<void> {
    const lang = I18nContext.current()?.lang || 'vi';
    const subject = this.i18n.t('orders.RETURN_APPROVED_EMAIL_SUBJECT', {
      lang,
    });

    // Fallback if translations are missing
    const finalSubject =
      subject || `Yêu cầu trả hàng cho đơn ${orderId} đã được duyệt`;

    const text = `Yêu cầu trả hàng cho đơn ${orderId} của bạn đã được duyệt. Vui lòng đóng gói sản phẩm và gửi về kho.`;
    const html = `<div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #333;">Yêu cầu trả hàng đã được duyệt</h2>
        <p>Yêu cầu trả hàng cho đơn <strong>${orderId}</strong> của bạn đã được duyệt.</p>
        <p>Vui lòng đóng gói sản phẩm và gửi về kho theo hướng dẫn trên ứng dụng.</p>
      </div>`;

    try {
      await this.transporter.sendMail({
        from: `"E-Commerce App" <${process.env.SMTP_USER}>`,
        to,
        subject: finalSubject,
        text,
        html,
      });
      this.logger.log(
        `Return approved email sent to ${to} for order ${orderId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send return approved email to ${to}:`,
        error,
      );
    }
  }

  async sendReturnRejectedEmail(
    to: string,
    orderId: string,
    reason: string,
  ): Promise<void> {
    const lang = I18nContext.current()?.lang || 'vi';
    const subject = this.i18n.t('orders.RETURN_REJECTED_EMAIL_SUBJECT', {
      lang,
    });

    const finalSubject =
      subject || `Yêu cầu trả hàng cho đơn ${orderId} bị từ chối`;

    const text = `Yêu cầu trả hàng cho đơn ${orderId} của bạn đã bị từ chối. Lý do: ${reason}`;
    const html = `<div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #333;">Yêu cầu trả hàng bị từ chối</h2>
        <p>Rất tiếc, yêu cầu trả hàng cho đơn <strong>${orderId}</strong> của bạn đã bị từ chối.</p>
        <p><strong>Lý do:</strong> ${reason}</p>
        <p>Nếu bạn có thắc mắc, vui lòng liên hệ bộ phận hỗ trợ khách hàng.</p>
      </div>`;

    try {
      await this.transporter.sendMail({
        from: `"E-Commerce App" <${process.env.SMTP_USER}>`,
        to,
        subject: finalSubject,
        text,
        html,
      });
      this.logger.log(
        `Return rejected email sent to ${to} for order ${orderId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send return rejected email to ${to}:`,
        error,
      );
    }
  }

  async sendStaffInvitationEmail(
    to: string,
    fullName: string,
    role: string,
    inviteLink: string,
  ): Promise<void> {
    const roleLabel =
      role === 'ADMIN' ? 'Quản trị viên (Admin)' : 'Nhân viên (Employee)';
    const subject = `Lời mời tham gia hệ thống quản trị - ${fullName}`;
    const text = `Xin chào ${fullName},\n\nBạn đã được mời tham gia hệ thống quản trị với vai trò ${roleLabel}.\nVui lòng truy cập liên kết sau để thiết lập mật khẩu tài khoản (liên kết có hiệu lực trong 24 giờ):\n${inviteLink}\n\nTrân trọng.`;
    const html = `<div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
        <h2 style="color: #4F46E5;">Lời mời tham gia quản trị hệ thống</h2>
        <p>Xin chào <strong>${fullName}</strong>,</p>
        <p>Bạn đã được mời tham gia hệ thống quản trị với vai trò <strong>${roleLabel}</strong>.</p>
        <p>Vui lòng bấm vào nút bên dưới để thiết lập mật khẩu cho tài khoản của bạn (liên kết có hiệu lực trong 24 giờ):</p>
        <div style="margin: 24px 0;">
          <a href="${inviteLink}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Thiết lập mật khẩu</a>
        </div>
        <p style="color: #666; font-size: 13px;">Hoặc copy đường link sau vào trình duyệt: <br><a href="${inviteLink}">${inviteLink}</a></p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">Nếu bạn không nhận ra lời mời này, vui lòng bỏ qua email.</p>
      </div>`;

    try {
      await this.transporter.sendMail({
        from: `"E-Commerce App" <${process.env.SMTP_USER}>`,
        to,
        subject,
        text,
        html,
      });
      this.logger.log(`Staff invitation email sent to ${to} for role ${role}`);
    } catch (error) {
      this.logger.error(
        `Failed to send staff invitation email to ${to}:`,
        error,
      );
    }
  }
}
