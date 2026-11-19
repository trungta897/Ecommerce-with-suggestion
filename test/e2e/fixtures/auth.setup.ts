import fs from 'fs';
import path from 'path';
import { test as setup, expect } from '@playwright/test';
import { ENV, PATHS, URL_PATTERNS } from '../constants';
import { AdminLoginPage } from '../pages/admin-login.page';
import { CustomerLoginPage } from '../pages/customer-login.page';
import { getPhoneOtpFromRedis, closeRedisClient } from '../utils/redis';

/**
 * 1. Đăng nhập Super Admin và lưu storageState
 */
setup('authenticate as super admin', async ({ page }) => {
  fs.mkdirSync(path.dirname(PATHS.adminStorageState), { recursive: true });

  const loginPage = new AdminLoginPage(page);
  await loginPage.goto();
  await loginPage.login(ENV.adminEmail, ENV.adminPassword);

  await expect(page).not.toHaveURL(URL_PATTERNS.adminLogin);
  await expect(page).toHaveURL(URL_PATTERNS.adminArea);

  await page.context().storageState({ path: PATHS.adminStorageState });
});

/**
 * 2. Đăng nhập Employee (Nhân viên vận hành) và lưu storageState
 */
setup('authenticate as employee', async ({ page }) => {
  fs.mkdirSync(path.dirname(PATHS.employeeStorageState), { recursive: true });

  const loginPage = new AdminLoginPage(page);
  await loginPage.goto();
  await loginPage.login(ENV.employeeEmail, ENV.employeePassword);

  await expect(page).not.toHaveURL(URL_PATTERNS.adminLogin);
  await expect(page).toHaveURL(URL_PATTERNS.adminArea);

  await page.context().storageState({ path: PATHS.employeeStorageState });
});

/**
 * 3. Đăng nhập Customer bằng SĐT 0912345678 + OTP từ Redis và lưu storageState
 */
setup('authenticate as customer via phone and OTP', async ({ page }) => {
  fs.mkdirSync(path.dirname(PATHS.customerStorageState), { recursive: true });

  const customerLogin = new CustomerLoginPage(page);
  await customerLogin.goto();
  await customerLogin.requestOtp(ENV.customerPhone);

  const otp = await getPhoneOtpFromRedis(ENV.customerPhone);
  expect(otp, 'Mã OTP từ Redis cho SĐT khách hàng').toBeTruthy();

  await customerLogin.submitOtp(otp!);
  await expect(page).not.toHaveURL(URL_PATTERNS.login);

  await page.context().storageState({ path: PATHS.customerStorageState });
  await closeRedisClient();
});
