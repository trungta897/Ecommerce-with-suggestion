# E2E & Visual Tests (Playwright)

Bộ test tự động kiểm tra **giao diện**, **chức năng** và **phân quyền** của DATN trên trình duyệt thật theo từng nhóm vai trò (Roles).

## Cài đặt (1 lần)

```bash
cd test/e2e
npm install
npm run install:browsers     # tải Chromium
cp .env.example .env         # chỉnh URL / tài khoản nếu khác mặc định
```

## Khởi tạo tài khoản kiểm thử

```bash
cd code/backend
npm run db:seed-test-roles
```

Lệnh trên sẽ đảm bảo CSDL có đủ 3 tài khoản chuẩn:

- **SUPER_ADMIN**: `admin@datn.com` / `Admin@123456`
- **EMPLOYEE**: `employee@datn.com` / `Staff@123456`
- **CUSTOMER**: SĐT `0912345678` (xác thực qua OTP sinh ra trong Redis, không cần Email)

---

## Lệnh chạy kiểm thử Tự động E2E

### 1. Vòng đời TMĐT toàn diện (Lifecycle E2E)

| Lệnh                            | Chế độ                    | Mô tả                                                                                                                               |
| ------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `npm run test:lifecycle`        | Headless                  | Chạy tự động trọn vẹn 5 kịch bản vòng đời TMĐT (Tạo tài khoản SĐT, Gợi ý AI, Mua COD, Review, Duyệt đơn, CRUD Sản phẩm & Nhân viên) |
| `npm run test:lifecycle:headed` | **Headed (Có giao diện)** | **Tự động mở cửa sổ trình duyệt Chromium lên màn hình**, tự thao tác giỏ hàng, checkout COD, duyệt đơn, CRUD                        |

### 2. Kiểm thử bảo mật & phân quyền (Role RBAC)

| Lệnh                        | Chế độ                    | Mô tả                                                                                                   |
| --------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------- |
| `npm run test:roles`        | Headless                  | Chạy tự động kiểm thử toàn bộ 4 vai trò (Guest, Customer, Employee, Admin)                              |
| `npm run test:roles:headed` | **Headed (Có giao diện)** | **Tự động mở cửa sổ trình duyệt Chromium lên màn hình**, tự điền form, click chuột, duyệt qua 4 vai trò |
| `npm run test:guest`        | Headless                  | Chỉ chạy kịch bản Khách vãng lai (GUEST)                                                                |
| `npm run test:customer`     | Headless                  | Chỉ chạy kịch bản Khách hàng thành viên (CUSTOMER - SĐT + OTP)                                          |
| `npm run test:employee`     | Headless                  | Chỉ chạy kịch bản Nhân viên vận hành (EMPLOYEE)                                                         |
| `npm run test:admin`        | Headless                  | Chỉ chạy kịch bản Quản trị viên (SUPER_ADMIN)                                                           |

---

## Các lệnh kiểm thử khác

| Lệnh                            | Mô tả                                                         |
| ------------------------------- | ------------------------------------------------------------- |
| `npm test`                      | Toàn bộ test chức năng trên desktop + mobile                  |
| `npm run test:smoke`            | Mọi trang chính load được, không lỗi JS, không thiếu key i18n |
| `npm run test:functional`       | Luồng đăng nhập, giỏ hàng → checkout, đa ngôn ngữ             |
| `npm run test:mobile`           | Chạy trên viewport Pixel 5                                    |
| `npm run test:visual`           | So sánh ảnh chụp giao diện với baseline                       |
| `npm run test:update-snapshots` | Tạo / cập nhật ảnh baseline                                   |
| `npm run test:ui`               | Mở giao diện tương tác Playwright UI Mode                     |
| `npm run report`                | Mở báo cáo HTML kết quả kiểm thử                              |

---

## Cấu trúc

```text
test/e2e/
├── constants/      # ENV, routes, dữ liệu test
├── fixtures/       # auth.setup.ts (đăng nhập & lưu session cho 3 roles), test-fixtures
├── pages/          # Page Object Model (AdminLogin, CustomerLogin, Shop...)
├── specs/
│   ├── roles/      # Kịch bản kiểm thử theo từng vai trò (guest, customer, employee, admin)
│   ├── smoke/      # Kiểm tra nạp trang không lỗi JS/i18n
│   ├── auth/       # Đăng nhập admin & validate đăng nhập SĐT
│   ├── shop/       # Giỏ hàng → checkout, tìm kiếm
│   ├── i18n/       # Đa ngôn ngữ vi / en
│   └── visual/     # So sánh sai lệch giao diện
└── utils/
    ├── i18n.ts     # Đọc trực tiếp từ điển FE
    └── redis.ts    # Tự động đọc mã OTP từ Redis cho Customer login
```
