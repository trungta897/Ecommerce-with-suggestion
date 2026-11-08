import { test, expect, expectHealthyPage } from '../../fixtures/test-fixtures';
import { PUBLIC_ROUTES, CUSTOMER_PROTECTED_ROUTES, URL_PATTERNS } from '../../constants';

const HTTP_ERROR_THRESHOLD = 400;

test.describe('Smoke: public pages', () => {
  for (const [name, route] of Object.entries(PUBLIC_ROUTES)) {
    test(`"${name}" (${route}) loads without errors`, async ({ page, pageHealth }) => {
      const response = await page.goto(route);

      expect(response?.status() ?? 0).toBeLessThan(HTTP_ERROR_THRESHOLD);
      await expect(page.locator('body')).toBeVisible();
      await page.waitForLoadState('networkidle');

      expectHealthyPage(pageHealth);
    });
  }
});

test.describe('Smoke: protected customer routes redirect guests to login', () => {
  for (const [name, route] of Object.entries(CUSTOMER_PROTECTED_ROUTES)) {
    test(`"${name}" (${route}) redirects to /login`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(URL_PATTERNS.login);
    });
  }
});
