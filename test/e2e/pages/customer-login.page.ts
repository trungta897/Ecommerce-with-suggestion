import type { Locator, Page } from '@playwright/test';
import { PUBLIC_ROUTES, type Locale, DEFAULT_LOCALE } from '../constants';
import { localizedPath, t } from '../utils/i18n';

/** Trang đăng nhập khách hàng bằng số điện thoại + OTP */
export class CustomerLoginPage {
  readonly phoneInput: Locator;
  readonly otpInput: Locator;
  readonly sendOtpButton: Locator;
  readonly confirmOtpButton: Locator;

  constructor(
    private readonly page: Page,
    private readonly locale: Locale = DEFAULT_LOCALE
  ) {
    this.phoneInput = page.locator('#phone');
    this.otpInput = page.locator('#otp');
    this.sendOtpButton = page.getByRole('button', { name: t('auth.send_otp', {}, locale) });
    this.confirmOtpButton = page.getByRole('button', { name: t('auth.otp_button', {}, locale) });
  }

  async goto(): Promise<void> {
    await this.page.goto(localizedPath(PUBLIC_ROUTES.login, this.locale));
  }

  async requestOtp(phone: string): Promise<void> {
    await this.phoneInput.waitFor({ state: 'visible' });
    await this.phoneInput.fill(phone);
    await this.sendOtpButton.click();
  }

  async submitOtp(otp: string): Promise<void> {
    await this.otpInput.waitFor({ state: 'visible' });
    await this.otpInput.fill(otp);
    await this.confirmOtpButton.click();
  }
}
