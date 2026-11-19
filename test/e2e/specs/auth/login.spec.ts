import { test, expect } from '../../fixtures/test-fixtures';
import { ENV, TEST_DATA, URL_PATTERNS } from '../../constants';
import { AdminLoginPage } from '../../pages/admin-login.page';
import { CustomerLoginPage } from '../../pages/customer-login.page';

test.describe('Auth: admin login', () => {
  test('shows error with wrong password', async ({ page }) => {
    const loginPage = new AdminLoginPage(page);
    await loginPage.goto();
    await loginPage.login(ENV.adminEmail, TEST_DATA.wrongAdminPassword);

    await expect(loginPage.errorMessage()).toBeVisible();
    await expect(page).toHaveURL(URL_PATTERNS.adminLogin);
  });

  test('does not submit when fields are empty', async ({ page }) => {
    const loginPage = new AdminLoginPage(page);
    await loginPage.goto();
    await loginPage.submitButton.click();

    await expect(page).toHaveURL(URL_PATTERNS.adminLogin);
  });

  test('logs in successfully with valid credentials', async ({ page }) => {
    const loginPage = new AdminLoginPage(page);
    await loginPage.goto();
    await loginPage.login(ENV.adminEmail, ENV.adminPassword);

    await expect(page).not.toHaveURL(URL_PATTERNS.adminLogin);
    await expect(page).toHaveURL(URL_PATTERNS.adminArea);
  });
});

test.describe('Auth: customer phone login (validation only, no real OTP sent)', () => {
  test('rejects invalid phone number and stays on phone step', async ({ page }) => {
    const loginPage = new CustomerLoginPage(page);
    await loginPage.goto();
    await loginPage.requestOtp(TEST_DATA.invalidPhone);

    await expect(loginPage.phoneInput).toBeVisible();
    await expect(loginPage.otpInput).toBeHidden();
  });
});
