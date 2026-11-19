import { test, expect } from '@playwright/test';
import { PATHS, PUBLIC_ROUTES, ADMIN_ROUTES } from '../../constants';

test.describe('Visual E2E: Các mốc giao diện quan trọng trong vòng đời TMĐT', () => {
  test('1. Giao diện Trang chủ (kèm khối gợi ý sản phẩm)', async ({ page }) => {
    await page.goto(PUBLIC_ROUTES.home);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();

    await page.screenshot({
      path: 'test-results/visual-home-recommendations.png',
      fullPage: false,
    });
  });

  test('2. Giao diện Giỏ hàng & Form thanh toán Checkout', async ({ page }) => {
    await page.goto(PUBLIC_ROUTES.cart);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/visual-cart.png', fullPage: false });

    await page.goto(PUBLIC_ROUTES.checkout);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/visual-checkout.png', fullPage: false });
  });

  test.describe('Admin Visuals', () => {
    test.use({ storageState: PATHS.adminStorageState });

    test('3. Giao diện Quản trị viên (Dashboard, Orders, Products)', async ({ page }) => {
      // Dashboard
      await page.goto(ADMIN_ROUTES.dashboard);
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'test-results/visual-admin-dashboard.png', fullPage: false });

      // Orders
      await page.goto(ADMIN_ROUTES.orders);
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'test-results/visual-admin-orders.png', fullPage: false });

      // Products
      await page.goto(ADMIN_ROUTES.products);
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'test-results/visual-admin-products.png', fullPage: false });
    });
  });
});
