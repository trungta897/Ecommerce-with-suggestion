import { test, expect, expectHealthyPage } from '../../fixtures/test-fixtures';
import { ADMIN_ROUTES, PATHS, URL_PATTERNS } from '../../constants';

test.describe('Smoke: admin pages (logged in as admin)', () => {
  test.use({ storageState: PATHS.adminStorageState });

  for (const [name, route] of Object.entries(ADMIN_ROUTES)) {
    test(`"${name}" (${route}) loads for admin`, async ({ page, pageHealth }) => {
      await page.goto(route);

      await expect(page).not.toHaveURL(URL_PATTERNS.adminLogin);
      await expect(page).toHaveURL(URL_PATTERNS.adminArea);
      await page.waitForLoadState('networkidle');

      expectHealthyPage(pageHealth);
    });
  }
});

test.describe('Smoke: admin pages are protected for guests', () => {
  test(`${ADMIN_ROUTES.dashboard} redirects guest to admin login`, async ({ page }) => {
    await page.goto(ADMIN_ROUTES.dashboard);
    await expect(page).toHaveURL(URL_PATTERNS.adminLogin);
  });
});
