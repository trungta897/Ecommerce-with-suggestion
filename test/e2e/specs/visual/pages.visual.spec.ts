import { test, expect } from '@playwright/test';
import { PUBLIC_ROUTES, VISUAL } from '../../constants';

/**
 * Visual regression: chụp ảnh các trang và so sánh với ảnh baseline.
 * Tạo / cập nhật baseline: `npm run test:update-snapshots`.
 */
const VISUAL_PAGES = {
  home: PUBLIC_ROUTES.home,
  login: PUBLIC_ROUTES.login,
  register: PUBLIC_ROUTES.register,
  cartEmpty: PUBLIC_ROUTES.cart,
  orderLookup: PUBLIC_ROUTES.orderLookup,
  adminLogin: PUBLIC_ROUTES.adminLogin,
} as const;

test.describe('Visual regression', () => {
  for (const [name, route] of Object.entries(VISUAL_PAGES)) {
    test(`${name} matches baseline`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot(`${name}.png`, {
        fullPage: true,
        animations: 'disabled',
        maxDiffPixelRatio: VISUAL.maxDiffPixelRatio,
      });
    });
  }
});
