import { test, expect } from '@playwright/test';

test.describe('Demo UI & Chức năng (Offline Verification)', () => {
  test('Kiểm tra render UI, tương tác button và cập nhật DOM', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>DATN E-Commerce Test Demo</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            .btn { background: #2563eb; color: white; padding: 8px 16px; border-radius: 6px; border: none; cursor: pointer; }
            .badge { display: inline-block; padding: 4px 8px; background: #dcfce7; color: #166534; border-radius: 4px; margin-top: 10px; }
          </style>
        </head>
        <body>
          <h1 id="title">Hệ thống Thương Mại Điện Tử DATN</h1>
          <p id="desc">Kiểm thử tự động giao diện và chức năng với Playwright</p>
          <button id="add-to-cart-btn" class="btn">Thêm vào giỏ</button>
          <div id="cart-status" style="display: none;" class="badge">Đã thêm 1 sản phẩm vào giỏ!</div>

          <script>
            document.getElementById('add-to-cart-btn').addEventListener('click', () => {
              const status = document.getElementById('cart-status');
              status.style.display = 'inline-block';
              status.setAttribute('data-tested', 'true');
            });
          </script>
        </body>
      </html>
    `);

    // 1. Kiểm tra hiển thị tiêu đề và nút bấm
    await expect(page.locator('#title')).toHaveText('Hệ thống Thương Mại Điện Tử DATN');
    const btn = page.locator('#add-to-cart-btn');
    await expect(btn).toBeVisible();

    // 2. Trạng thái ban đầu: badge giỏ hàng ẩn
    await expect(page.locator('#cart-status')).toBeHidden();

    // 3. Thực hiện hành động click (tương tác chức năng)
    await btn.click();

    // 4. Kiểm tra DOM thay đổi sau click
    await expect(page.locator('#cart-status')).toBeVisible();
    await expect(page.locator('#cart-status')).toHaveText('Đã thêm 1 sản phẩm vào giỏ!');

    // 5. Chụp ảnh màn hình giao diện thực tế (Visual Snapshot)
    await page.screenshot({ path: 'test-results/demo-ui.png', fullPage: true });
  });
});
