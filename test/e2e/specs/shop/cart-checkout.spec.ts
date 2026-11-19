import { test, expect } from '../../fixtures/test-fixtures';
import { PUBLIC_ROUTES, URL_PATTERNS } from '../../constants';
import { CartPage, CheckoutPage, ShopPage } from '../../pages/shop.page';
import { t } from '../../utils/i18n';

test.describe('Shop: cart & checkout flow (guest)', () => {
  test('empty cart shows empty state', async ({ page }) => {
    const cart = new CartPage(page);
    await cart.goto();
    await expect(cart.emptyMessage()).toBeVisible();
  });

  test('add product to cart → go to checkout → validate shipping step', async ({ page }) => {
    const shop = new ShopPage(page);
    const cart = new CartPage(page);
    const checkout = new CheckoutPage(page);

    await shop.openFirstProduct();

    const addToCart = shop.addToCartButton();
    await expect(addToCart).toBeVisible();
    test.skip(await addToCart.isDisabled(), 'First product is out of stock');
    await addToCart.click();

    await cart.goto();
    await expect(cart.emptyMessage()).toBeHidden();
    await cart.checkoutButton().click();

    await expect(page).toHaveURL(URL_PATTERNS.checkout);
    await expect(checkout.shippingHeading()).toBeVisible();

    // Bấm "Tiếp tục" khi chưa nhập gì → phải ở lại bước giao hàng
    await checkout.nextButton.click();
    await expect(checkout.shippingHeading()).toBeVisible();
    await expect(checkout.paymentMethodText()).toBeHidden();
  });

  test('search page shows results header', async ({ page }) => {
    await page.goto(PUBLIC_ROUTES.search);
    await expect(page.getByText(t('product.searchAllProducts')).first()).toBeVisible();
  });
});
