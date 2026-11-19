import { test, expect, expectHealthyPage } from '../../fixtures/test-fixtures';
import {
  PUBLIC_ROUTES,
  CUSTOMER_PROTECTED_ROUTES,
  ADMIN_ROUTES,
  URL_PATTERNS,
} from '../../constants';
import { CartPage, CheckoutPage, ShopPage } from '../../pages/shop.page';
import { t } from '../../utils/i18n';

test.describe('Role: GUEST (Khách vãng lai)', () => {
  test('1. Lướt trang chủ, tìm kiếm sản phẩm và xem danh mục', async ({ page, pageHealth }) => {
    // Trang chủ
    await page.goto(PUBLIC_ROUTES.home);
    await expect(page.locator('body')).toBeVisible();
    await page.waitForLoadState('networkidle');
    expectHealthyPage(pageHealth);

    // Danh mục
    await page.goto(PUBLIC_ROUTES.category);
    await expect(page.locator('body')).toBeVisible();

    // Tìm kiếm
    await page.goto(PUBLIC_ROUTES.search);
    await expect(page.getByText(t('product.searchAllProducts')).first()).toBeVisible();
  });

  test('2. Xem chi tiết sản phẩm, thêm giỏ hàng và mở trang giỏ hàng', async ({ page }) => {
    const shop = new ShopPage(page);
    const cart = new CartPage(page);

    await shop.openFirstProduct();
    const addToCartBtn = shop.addToCartButton();
    await expect(addToCartBtn).toBeVisible();

    test.skip(await addToCartBtn.isDisabled(), 'Sản phẩm đầu tiên đã hết hàng');
    await addToCartBtn.click();

    // Vào giỏ hàng
    await cart.goto();
    await expect(cart.emptyMessage()).toBeHidden();
    await expect(cart.checkoutButton()).toBeVisible();
  });

  test('3. Tiến hành đặt hàng vãng lai (Guest Checkout) với phương thức COD', async ({ page }) => {
    const shop = new ShopPage(page);
    const cart = new CartPage(page);
    const checkout = new CheckoutPage(page);

    await shop.openFirstProduct();
    const addToCartBtn = shop.addToCartButton();
    test.skip(await addToCartBtn.isDisabled(), 'Sản phẩm hết hàng');
    await addToCartBtn.click();

    await cart.goto();
    await cart.checkoutButton().click();

    await expect(page).toHaveURL(URL_PATTERNS.checkout);
    await expect(checkout.shippingHeading()).toBeVisible();
    await expect(checkout.fullNameInput).toBeVisible();

    // Kiểm tra validate form giao hàng khi bấm Tiếp tục mà chưa nhập thông tin
    await checkout.nextButton.click();
    await expect(checkout.shippingHeading()).toBeVisible();
  });

  test('4. Tra cứu đơn hàng bằng Mã đơn hàng (/orders/lookup)', async ({ page, pageHealth }) => {
    await page.goto(PUBLIC_ROUTES.orderLookup);
    await expect(page.locator('body')).toBeVisible();
    expectHealthyPage(pageHealth);
  });

  test('5. Bảo mật phân quyền: Khách vãng lai bị chặn khi vào trang cá nhân', async ({ page }) => {
    for (const [name, route] of Object.entries(CUSTOMER_PROTECTED_ROUTES)) {
      await page.goto(route);
      await expect(page).toHaveURL(URL_PATTERNS.login);
    }
  });

  test('6. Bảo mật phân quyền: Khách vãng lai bị chặn khi vào trang quản trị', async ({ page }) => {
    await page.goto(ADMIN_ROUTES.dashboard);
    await expect(page).toHaveURL(URL_PATTERNS.adminLogin);
  });
});
