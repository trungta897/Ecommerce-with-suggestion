import { test, expect, expectHealthyPage } from '../../fixtures/test-fixtures';
import { PATHS, ADMIN_ROUTES } from '../../constants';

test.describe('Role: SUPER_ADMIN (Quản trị viên toàn quyền)', () => {
  test.use({ storageState: PATHS.adminStorageState });

  test('1. Toàn quyền truy cập Bảng điều khiển quản trị (/admin/dashboard)', async ({
    page,
    pageHealth,
  }) => {
    await page.goto(ADMIN_ROUTES.dashboard);
    await expect(page.locator('body')).toBeVisible();
    await page.waitForLoadState('networkidle');
    expectHealthyPage(pageHealth);
  });

  test('2. Toàn quyền quản lý Sản phẩm (Danh sách & Tạo mới)', async ({ page, pageHealth }) => {
    await page.goto(ADMIN_ROUTES.products);
    await expect(page.locator('body')).toBeVisible();
    await page.waitForLoadState('networkidle');
    expectHealthyPage(pageHealth);

    await page.goto(ADMIN_ROUTES.productNew);
    await expect(page.locator('body')).toBeVisible();
    expectHealthyPage(pageHealth);
  });

  test('3. Toàn quyền quản lý Danh mục sản phẩm (/admin/categories)', async ({
    page,
    pageHealth,
  }) => {
    await page.goto(ADMIN_ROUTES.categories);
    await expect(page.locator('body')).toBeVisible();
    await page.waitForLoadState('networkidle');
    expectHealthyPage(pageHealth);
  });

  test('4. Toàn quyền quản lý Đơn hàng (/admin/orders)', async ({ page, pageHealth }) => {
    await page.goto(ADMIN_ROUTES.orders);
    await expect(page.locator('body')).toBeVisible();
    await page.waitForLoadState('networkidle');
    expectHealthyPage(pageHealth);
  });

  test('5. Toàn quyền quản lý Người dùng & Phân quyền (/admin/users)', async ({
    page,
    pageHealth,
  }) => {
    await page.goto(ADMIN_ROUTES.users);
    await expect(page.locator('body')).toBeVisible();
    await page.waitForLoadState('networkidle');
    expectHealthyPage(pageHealth);
  });

  test('6. Toàn quyền quản lý Khuyến mãi, Flash Sale, Voucher', async ({ page, pageHealth }) => {
    // Vouchers
    await page.goto(ADMIN_ROUTES.vouchers);
    await expect(page.locator('body')).toBeVisible();

    // Flash Sale
    await page.goto(ADMIN_ROUTES.discounts);
    await expect(page.locator('body')).toBeVisible();
    expectHealthyPage(pageHealth);
  });

  test('7. Toàn quyền quản lý Đánh giá & Yêu cầu trả hàng', async ({ page, pageHealth }) => {
    // Đánh giá
    await page.goto(ADMIN_ROUTES.reviews);
    await expect(page.locator('body')).toBeVisible();

    // Trả hàng
    await page.goto(ADMIN_ROUTES.returns);
    await expect(page.locator('body')).toBeVisible();
    expectHealthyPage(pageHealth);
  });
});
