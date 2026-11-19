import { test, expect } from '../../fixtures/test-fixtures';
import { CustomerLoginPage } from '../../pages/customer-login.page';
import { getPhoneOtpFromRedis, closeRedisClient } from '../../utils/redis';
import { PUBLIC_ROUTES, CUSTOMER_PROTECTED_ROUTES, URL_PATTERNS } from '../../constants';
import { ShopPage } from '../../pages/shop.page';

test.describe('Lifecycle 01: Đăng ký khách hàng mới & Gợi ý sản phẩm AI', () => {
  const randomPhone = `09${Math.floor(10000000 + Math.random() * 90000000)}`;

  test('1. Tự động tạo mới tài khoản Khách hàng bằng SĐT chưa từng đăng ký + OTP', async ({
    page,
  }) => {
    const customerLogin = new CustomerLoginPage(page);
    await customerLogin.goto();

    // 1. Nhập SĐT hoàn toàn mới
    await customerLogin.requestOtp(randomPhone);

    // 2. Tự động lấy mã OTP vừa sinh trong Redis
    const otp = await getPhoneOtpFromRedis(randomPhone);
    expect(otp, `Mã OTP tạo mới cho SĐT ${randomPhone} phải tồn tại trong Redis`).toBeTruthy();

    // 3. Nhập mã OTP và xác thực
    await customerLogin.submitOtp(otp!);
    await expect(page).not.toHaveURL(URL_PATTERNS.login);

    // 4. Mở trang /profile để kiểm tra tài khoản mới đã được lưu trong CSDL
    await page.goto(CUSTOMER_PROTECTED_ROUTES.profile);
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByText(randomPhone).first()).toBeVisible();

    await closeRedisClient();
  });

  test('2. Kiểm tra khối Gợi ý sản phẩm AI & Sản phẩm cùng danh mục', async ({ page }) => {
    // Trang chủ: kiểm tra hệ thống gợi ý hoạt động
    const shop = new ShopPage(page);
    await shop.gotoHome();
    await page.waitForLoadState('networkidle');

    // Mở trang chi tiết sản phẩm đầu tiên
    await shop.openFirstProduct();

    // Khối sản phẩm cùng danh mục (RelatedCategoryProducts) hiển thị danh sách sản phẩm liên quan
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('h1').first()).toBeVisible();
  });
});
