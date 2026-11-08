import { test, expect, expectHealthyPage } from '../../fixtures/test-fixtures';
import { PATHS, ADMIN_ROUTES } from '../../constants';

test.describe('Role: EMPLOYEE (Nhân viên vận hành nội bộ)', () => {
  test.use({ storageState: PATHS.employeeStorageState });

  test('1. Nhân viên truy cập Bảng điều khiển quản trị (/admin/dashboard)', async ({
    page,
    pageHealth,
  }) => {
    await page.goto(ADMIN_ROUTES.dashboard);
    await expect(page.locator('body')).toBeVisible();
    await page.waitForLoadState('networkidle');
    expectHealthyPage(pageHealth);
  });

  test('2. Nhân viên quản lý danh sách đơn hàng (/admin/orders)', async ({ page, pageHealth }) => {
    await page.goto(ADMIN_ROUTES.orders);
    await expect(page.locator('body')).toBeVisible();
    await page.waitForLoadState('networkidle');
    expectHealthyPage(pageHealth);
  });

  test('3. Nhân viên kiểm duyệt và quản lý đánh giá (/admin/reviews)', async ({
    page,
    pageHealth,
  }) => {
    await page.goto(ADMIN_ROUTES.reviews);
    await expect(page.locator('body')).toBeVisible();
    await page.waitForLoadState('networkidle');
    expectHealthyPage(pageHealth);
  });

  test('4. Bảo mật phân quyền: Nhân viên cố tình vào Quản lý người dùng (/admin/users) bị chuyển hướng về Dashboard', async ({
    page,
  }) => {
    await page.goto(ADMIN_ROUTES.users);
    // Bị middleware chặn và đẩy về /admin/dashboard
    await expect(page).toHaveURL(new RegExp(`${ADMIN_ROUTES.dashboard}$`));
  });

  test('5. Bảo mật phân quyền: Nhân viên cố tình vào Tạo danh mục mới bị chuyển hướng về Dashboard', async ({
    page,
  }) => {
    await page.goto(ADMIN_ROUTES.categoryNew);
    await expect(page).toHaveURL(new RegExp(`${ADMIN_ROUTES.dashboard}$`));
  });
});
