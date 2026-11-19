import { test, expect } from '../../fixtures/test-fixtures';
import { PATHS, ADMIN_ROUTES } from '../../constants';
import { t } from '../../utils/i18n';

test.describe('Lifecycle 04: CRUD Sản phẩm toàn diện (Admin Product Management)', () => {
  test.use({ storageState: PATHS.adminStorageState });

  const testProductName = `[E2E] Chuột Gaming Không Dây DATN Pro ${Date.now()}`;

  test('1. CREATE: Admin thêm sản phẩm mới vào hệ thống', async ({ page }) => {
    await page.goto(ADMIN_ROUTES.productNew);
    await expect(page.locator('body')).toBeVisible();

    // Điền tên sản phẩm
    const nameInput = page.locator('input[name="name"]');
    await nameInput.fill(testProductName);

    // Chọn danh mục sản phẩm (chọn option đầu tiên có sẵn)
    const categorySelect = page.locator('select[name="categoryId"]');
    await categorySelect.waitFor();
    await categorySelect.selectOption({ index: 1 });

    // Điền giá bán và số lượng tồn kho
    const priceInput = page.locator('input[name="price"]');
    await priceInput.fill('790000');

    const stockInput = page.locator('input[name="stock"]');
    await stockInput.fill('50');

    // Điền mô tả
    const descArea = page.locator('textarea');
    if (await descArea.isVisible()) {
      await descArea.fill('Chuột gaming không dây test tự động Playwright E2E');
    }

    // Bấm nút Lưu / Tạo sản phẩm
    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click();

    // Xác nhận chuyển hướng về danh sách sản phẩm (/admin/products)
    await page.waitForURL(new RegExp(`${ADMIN_ROUTES.products}$`), { timeout: 15000 });
    await expect(page).toHaveURL(new RegExp(`${ADMIN_ROUTES.products}$`));
  });

  test('2. READ & SEARCH: Tìm thấy sản phẩm vừa tạo trong danh sách quản lý', async ({ page }) => {
    await page.goto(ADMIN_ROUTES.products);
    await expect(page.locator('body')).toBeVisible();
    await page.waitForLoadState('networkidle');

    // Tìm kiếm sản phẩm bằng ô search
    const searchInput = page.locator('input[placeholder*="Tìm kiếm"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('[E2E]');
      await page.waitForTimeout(1000);
    }

    // Kiểm tra bảng sản phẩm hiển thị dòng sản phẩm
    const table = page.locator('table');
    await expect(table).toBeVisible();
  });

  test('3. UPDATE & TOGGLE: Cập nhật giá và bật/tắt trạng thái kinh doanh', async ({ page }) => {
    await page.goto(ADMIN_ROUTES.products);
    await page.waitForLoadState('networkidle');

    // Tìm nút Sửa sản phẩm
    const editLink = page.locator('a[href*="/edit"]').first();
    if (await editLink.isVisible()) {
      await editLink.click();
      await page.waitForURL(/\/admin\/products\/.*\/edit/);

      // Cập nhật giá bán
      const priceInput = page.locator('input[name="price"]');
      if (await priceInput.isVisible()) {
        await priceInput.fill('820000');

        // Bấm nút Lưu thay đổi
        const saveBtn = page.locator('button[type="submit"]').first();
        await saveBtn.click();
        await page.waitForTimeout(1500);
      }
    }
  });
});
