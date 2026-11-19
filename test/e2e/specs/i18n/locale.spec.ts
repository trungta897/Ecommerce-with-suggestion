import { test, expect, expectHealthyPage } from '../../fixtures/test-fixtures';
import { LOCALES, PUBLIC_ROUTES } from '../../constants';
import { localizedPath, t } from '../../utils/i18n';

test.describe('i18n: pages render in every locale', () => {
  for (const locale of LOCALES) {
    test(`login page renders in "${locale}"`, async ({ page, pageHealth }) => {
      await page.goto(localizedPath(PUBLIC_ROUTES.login, locale));

      await expect(
        page.getByRole('button', { name: t('auth.send_otp', {}, locale) })
      ).toBeVisible();
      expectHealthyPage(pageHealth);
    });

    test(`cart page renders in "${locale}"`, async ({ page, pageHealth }) => {
      await page.goto(localizedPath(PUBLIC_ROUTES.cart, locale));

      await expect(page.getByText(t('cart.empty', {}, locale))).toBeVisible();
      expectHealthyPage(pageHealth);
    });
  }
});
