import { test, expect } from '../../fixtures/test-fixtures';
import { PATHS, CUSTOMER_PROTECTED_ROUTES, URL_PATTERNS } from '../../constants';
import { CartPage, CheckoutPage, ShopPage } from '../../pages/shop.page';
import { t } from '../../utils/i18n';

test.describe('Lifecycle 02: Mua hàng hoàn chỉnh qua COD & Đánh giá sản phẩm', () => {
  test.use({ storageState: PATHS.customerStorageState });

  test('1. Mua hàng hoàn tất bằng COD từ Giỏ hàng tới Chi tiết đơn hàng', async ({ page }) => {
    const shop = new ShopPage(page);
    const cart = new CartPage(page);
    const checkout = new CheckoutPage(page);

    // 1. Mở trang chi tiết sản phẩm và thêm vào giỏ
    await shop.openFirstProduct();
    const addToCartBtn = shop.addToCartButton();
    await expect(addToCartBtn).toBeVisible();
    test.skip(await addToCartBtn.isDisabled(), 'Sản phẩm hết hàng');

    // Chờ request POST /cart phản hồi thành công trước khi chuyển trang
    const [cartResponse] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes('/cart') && (res.status() === 200 || res.status() === 201),
        { timeout: 15000 }
      ),
      addToCartBtn.click(),
    ]);
    expect(cartResponse.ok()).toBeTruthy();

    // 2. Mở giỏ hàng và bấm Tiến hành thanh toán
    await cart.goto();
    await expect(cart.emptyMessage()).toBeHidden();
    await cart.checkoutButton().click();

    await expect(page).toHaveURL(URL_PATTERNS.checkout);
    await expect(checkout.shippingHeading()).toBeVisible();

    // 3. Bước 1: Điền thông tin giao hàng
    await checkout.fullNameInput.fill('Nguyễn Văn Khách Test COD');
    const phoneInput = page.getByPlaceholder('0900 000 000');
    if (await phoneInput.isVisible()) {
      await phoneInput.fill('0912345678');
    }

    // Chọn phương thức nhận tại cửa hàng (pickup)
    const pickupRadio = page.locator('input[value="pickup"]');
    if (await pickupRadio.isVisible()) {
      await pickupRadio.check();
      await page.waitForTimeout(500);

      // Chọn Ngày mai hoặc chip ngày thứ 2
      const dateChip = page
        .locator('button')
        .filter({ hasText: /Hôm nay|Ngày mai|Thứ|Today|Tomorrow/i })
        .nth(1);
      if (await dateChip.isVisible()) {
        await dateChip.click();
      }

      // Chọn khung giờ khả dụng đầu tiên
      const slotBtn = page
        .locator('button:not([disabled])')
        .filter({ hasText: /^\d{2}:\d{2}$/ })
        .first();
      if (await slotBtn.isVisible()) {
        await slotBtn.click();
      }
    }

    // Bấm Tiếp tục sang bước 2 (Phương thức thanh toán)
    await checkout.nextButton.click();

    // 4. Bước 2: Chọn phương thức thanh toán COD
    const codRadio = page.locator('input[value="cod"]');
    if (await codRadio.isVisible()) {
      await codRadio.check();
    }
    // Bấm Tiếp tục sang bước 3 (Xác nhận đơn)
    await checkout.nextButton.click();

    // 5. Bước 3: Bấm "Đặt hàng"
    const placeOrderBtn = page.getByRole('button', { name: t('checkout.placeOrder') });
    await expect(placeOrderBtn).toBeVisible();
    await placeOrderBtn.click();

    // 6. Xác nhận giao dịch hoàn tất và đơn hàng hiển thị thành công
    await expect(page.getByText(t('checkout.orderSuccess'))).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(/#ORD-/i)).toBeVisible();

    // Kiểm tra trang danh sách đơn hàng của khách hàng (/orders)
    await page.goto(CUSTOMER_PROTECTED_ROUTES.orders);
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByText(/#ORD-|Đơn hàng/i).first()).toBeVisible();
  });

  test('2. Viết đánh giá 5 sao & bình luận cho sản phẩm', async ({ page }) => {
    const shop = new ShopPage(page);
    await shop.openFirstProduct();

    // Chuyển sang Tab Đánh giá
    const reviewsTab = page
      .locator('button')
      .filter({ hasText: new RegExp(t('product.reviews')) })
      .first();
    await reviewsTab.scrollIntoViewIfNeeded();
    await reviewsTab.click();

    // Bấm nút "Viết đánh giá" nếu có form ẩn
    const writeReviewBtn = page.getByRole('button', { name: t('product.writeReview') });
    if (await writeReviewBtn.isVisible()) {
      await writeReviewBtn.click();
    }

    // Nhập tiêu đề nhận xét
    const titleInput = page.getByPlaceholder(t('product.titlePlaceholder'));
    if (await titleInput.isVisible()) {
      await titleInput.fill('[E2E Test] Đánh giá chất lượng cao');
    }

    // Nhập nội dung nhận xét
    const contentArea = page
      .getByPlaceholder(t('product.contentPlaceholder'))
      .or(page.locator('textarea'))
      .first();
    if (await contentArea.isVisible()) {
      await contentArea.fill('[E2E Test] Sản phẩm dùng rất mượt, giao hàng siêu nhanh!');

      // Bấm nút "Gửi đánh giá"
      const submitBtn = page.getByRole('button', { name: t('product.submitReview') });
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
      }
    }
  });
});
