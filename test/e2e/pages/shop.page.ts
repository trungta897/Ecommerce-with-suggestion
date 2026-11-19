import type { Locator, Page } from '@playwright/test';
import { PUBLIC_ROUTES, URL_PATTERNS } from '../constants';
import { t } from '../utils/i18n';

export class ShopPage {
  constructor(private readonly page: Page) {}

  async gotoHome(): Promise<void> {
    await this.page.goto(PUBLIC_ROUTES.home);
  }

  firstProductLink(): Locator {
    return this.page.locator(URL_PATTERNS.productLink).first();
  }

  /** Mở trang chi tiết sản phẩm đầu tiên tìm thấy ở trang chủ */
  async openFirstProduct(): Promise<void> {
    await this.gotoHome();
    const link = this.firstProductLink();
    await link.waitFor();
    await link.click();
    await this.page.waitForURL(/\/products\//);
  }

  addToCartButton(): Locator {
    return this.page.getByRole('button', { name: t('product.addToCart') }).first();
  }
}

export class CartPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto(PUBLIC_ROUTES.cart);
  }

  emptyMessage(): Locator {
    return this.page.getByText(t('cart.empty'));
  }

  checkoutButton(): Locator {
    return this.page.getByText(t('cart.checkout')).first();
  }
}

export class CheckoutPage {
  readonly fullNameInput: Locator;
  readonly nextButton: Locator;

  constructor(private readonly page: Page) {
    this.fullNameInput = page.getByPlaceholder(t('checkout.fullName'));
    this.nextButton = page.getByRole('button', { name: t('checkout.next') });
  }

  shippingHeading(): Locator {
    return this.page.getByRole('heading', { name: t('checkout.shippingInfo') });
  }

  paymentMethodText(): Locator {
    return this.page.getByText(t('checkout.cod'));
  }
}
