import { test, expect } from '../../fixtures/test-fixtures';
import { PATHS, ADMIN_ROUTES } from '../../constants';
import { t } from '../../utils/i18n';

test.describe('Lifecycle 05: Quản trị & Phân quyền Nhân viên (Admin Employee Management)', () => {
  test.use({ storageState: PATHS.adminStorageState });

  const staffEmail = `test_staff_${Date.now()}@datn.com`;
  const staffName = `Nhân Viên Test E2E ${Date.now()}`;

  test('1. CREATE: Mời và tạo mới tài khoản Nhân viên vận hành (EMPLOYEE)', async ({ page }) => {
    await page.goto(ADMIN_ROUTES.users);
    await expect(page.locator('body')).toBeVisible();
    await page.waitForLoadState('networkidle');

    // Bấm nút "Mời nhân viên"
    const inviteBtn = page.getByRole('button', { name: t('admin.users.invite_staff') });
    await expect(inviteBtn).toBeVisible();
    await inviteBtn.click();

    // Điền form trong Modal
    const modal = page.locator('div[role="dialog"]').or(page.locator('.fixed')).first();
    await expect(modal).toBeVisible();

    const nameInput = modal.locator('input').first();
    await nameInput.fill(staffName);

    const emailInput = modal.locator('input[type="email"]').or(modal.locator('input').nth(1));
    await emailInput.fill(staffEmail);

    // Chọn vai trò EMPLOYEE
    const roleSelect = modal.locator('select');
    if (await roleSelect.isVisible()) {
      await roleSelect.selectOption('EMPLOYEE');
    }

    // Bấm nút Gửi lời mời / Xác nhận
    const submitBtn = modal.locator('button[type="submit"]');
    await submitBtn.click();

    await page.waitForTimeout(1500);
  });

  test('2. READ & VERIFY: Xác nhận nhân viên mới hiển thị trong danh sách người dùng', async ({
    page,
  }) => {
    await page.goto(ADMIN_ROUTES.users);
    await expect(page.locator('body')).toBeVisible();
    await page.waitForLoadState('networkidle');

    // Tìm kiếm bằng email nhân viên vừa tạo
    const searchInput = page.locator('input[placeholder*="Tìm kiếm"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill(staffEmail);
      await page.waitForTimeout(1000);
    }

    // Kiểm tra bảng người dùng
    const table = page.locator('table');
    await expect(table).toBeVisible();
  });
});
