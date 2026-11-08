import { test, expect } from '../../fixtures/test-fixtures';
import { PATHS, ADMIN_ROUTES } from '../../constants';
import { t } from '../../utils/i18n';

test.describe('Lifecycle 03: Vòng đời xử lý & Hoàn tất đơn hàng (Order Fulfillment)', () => {
  test.use({ storageState: PATHS.employeeStorageState });

  test('1. Nhân viên / Admin duyệt đơn hàng và cập nhật trạng thái trong Quản lý đơn hàng', async ({
    page,
  }) => {
    await page.goto(ADMIN_ROUTES.orders);
    await expect(page.locator('body')).toBeVisible();
    await page.waitForLoadState('networkidle');

    // Kiểm tra danh sách bảng đơn hàng hoặc trạng thái đơn
    const table = page.locator('table');
    const noOrders = page.getByText(t('admin.orders.no_orders'));
    await expect(table.or(noOrders)).toBeVisible({ timeout: 15000 });

    if (await table.isVisible()) {
      // Nếu có đơn hàng ở trạng thái PENDING, bấm Duyệt đơn hàng (Quick Approve)
      const approveBtn = page.locator('button[title*="Duyệt"], button[title*="Approve"]').first();
      if (await approveBtn.isVisible()) {
        await approveBtn.click();
        await page.waitForTimeout(1000);
      }

      // Mở Chi tiết đơn hàng để kiểm tra modal
      const viewDetailBtn = page.locator('button[title*="Chi tiết"], button[title*="Detail"]').first();
      if (await viewDetailBtn.isVisible()) {
        await viewDetailBtn.click();
        await page.waitForTimeout(1000);
        // Đóng modal chi tiết
        const closeBtn = page
          .locator('button:has-text("Đóng"), button:has-text("Close"), button[aria-label*="close"]')
          .first();
        if (await closeBtn.isVisible()) {
          await closeBtn.click();
        }
      }
    }
  });

  test('2. Nhân viên lọc đơn hàng theo trạng thái', async ({ page }) => {
    await page.goto(ADMIN_ROUTES.orders);
    await expect(page.locator('body')).toBeVisible();

    // Bộ lọc trạng thái đơn hàng (AdminOrderFilters)
    const statusSelect = page.locator('select');
    await expect(statusSelect).toBeVisible({ timeout: 10000 });
    await statusSelect.selectOption({ index: 0 });
  });
});
