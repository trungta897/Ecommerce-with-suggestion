import type { Locator, Page } from '@playwright/test';
import { PUBLIC_ROUTES, type Locale, DEFAULT_LOCALE } from '../constants';
import { localizedPath, t } from '../utils/i18n';

export class AdminLoginPage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(
    private readonly page: Page,
    private readonly locale: Locale = DEFAULT_LOCALE
  ) {
    this.emailInput = page.locator('#email');
    this.passwordInput = page.locator('#password');
    this.submitButton = page.getByRole('button', {
      name: t('auth.admin_login_button', {}, locale),
    });
  }

  async goto(): Promise<void> {
    await this.page.goto(localizedPath(PUBLIC_ROUTES.adminLogin, this.locale));
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  errorMessage(): Locator {
    return this.page.getByText(t('auth.login_error', {}, this.locale));
  }
}
