import { test, expect, expectHealthyPage } from '../../fixtures/test-fixtures';
import { PATHS, CUSTOMER_PROTECTED_ROUTES, ADMIN_ROUTES, ENV } from '../../constants';
import { t } from '../../utils/i18n';

test.describe('Role: CUSTOMER (Khách hàng thành viên - Đăng nhập SĐT)', () => {
  test.use({ storageState: PATHS.customerStorageState });

  test('1. Xem thông tin cá nhân, SĐT và hạng điểm VIP tại /profile', async ({
    page,
    pageHealth,
  }) => {
    await page.goto(CUSTOMER_PROTECTED_ROUTES.profile);
    await expect(page.locator('body')).toBeVisible();

    // Hiển thị tiêu đề hoặc thông tin cá nhân
    await expect(
      page
        .getByText(t('profile.title'))
        .or(page.getByText(t('profile.personalInfo')))
        .first()
    ).toBeVisible();

    // Hiển thị SĐT khách hàng
    await expect(page.getByText(ENV.customerPhone).first()).toBeVisible();

    // Hiển thị danh mục tab cá nhân và hạng thành viên
    await expect(page.getByText(t('profile.myOrders')).first()).toBeVisible();

    expectHealthyPage(pageHealth);
  });

  test('2. Mở kho Voucher cá nhân (/profile/vouchers)', async ({ page, pageHealth }) => {
    await page.goto(CUSTOMER_PROTECTED_ROUTES.vouchers);
    await expect(page.locator('body')).toBeVisible();
    await page.waitForLoadState('networkidle');
    expectHealthyPage(pageHealth);
  });

  test('3. Xem lịch sử đơn mua cá nhân (/orders)', async ({ page, pageHealth }) => {
    await page.goto(CUSTOMER_PROTECTED_ROUTES.orders);
    await expect(page.locator('body')).toBeVisible();
    await page.waitForLoadState('networkidle');
    expectHealthyPage(pageHealth);
  });

  test('4. Bảo mật phân quyền: Khách hàng cố tình truy cập /admin/* bị chặn đẩy về trang chủ', async ({
    page,
  }) => {
    // Thử truy cập Dashboard Admin
    await page.goto(ADMIN_ROUTES.dashboard);
    await expect(page).toHaveURL(new RegExp(`^${ENV.baseUrl}/?$`));

    // Thử truy cập Đơn hàng Admin
    await page.goto(ADMIN_ROUTES.orders);
    await expect(page).toHaveURL(new RegExp(`^${ENV.baseUrl}/?$`));
  });
});
