# Sprint 1: Nền tảng Khám phá & Quản lý Danh mục

- [x] **1. Khởi tạo Backend Module: Users / Profile (US-AUTH-06)**
  - [x] Tạo `UserController` và `UserService`
  - [x] Viết API `GET /users/profile` lấy thông tin cá nhân
  - [x] Viết API `PATCH /users/profile` cập nhật thông tin cá nhân (Tên, SDT, Địa chỉ)
  - [x] Tích hợp Frontend UI (`profile/page.tsx`) gọi API thật
  - [x] Tích hợp Custom Toast Notifications và Hệ thống chọn địa chỉ hành chính VN (`AddressSelector`, `LocationsModule`, `nestjs-i18n`)

- [x] **2. Khởi tạo Backend Module: Categories (US-ADM-02)**
  - [x] Tạo `CategoryController`, `CategoryService`
  - [x] Viết CRUD API: Lấy danh sách, Tạo mới, Cập nhật, Ẩn/Hiện (Soft delete)
  - [x] Tích hợp Frontend Admin (`admin/categories` - cần tạo UI nếu chưa có)

- [x] **3. Khởi tạo Backend Module: Products (US-ADM-03)**
  - [x] Tạo `ProductController`, `ProductService`
  - [x] Cấu hình luồng Upload ảnh (tích hợp module Storage có sẵn)
  - [x] Viết CRUD API: Tạo, Cập nhật, Ẩn/Hiện sản phẩm
  - [x] Tích hợp Frontend Admin (`admin/products/new`, `admin/products`)

- [x] **4. Tích hợp Khám phá Sản phẩm (Client) (US-CAT-01, US-CAT-02)**
  - [x] Viết API public: `GET /products` (Có phân trang, lọc, tìm kiếm theo tên/danh mục)
  - [x] Viết API public: `GET /products/:slug` (Lấy chi tiết)
  - [x] Thay thế Mock Data trong `product-service.ts` ở Frontend bằng `fetch/axios` gọi API thật.
  - [x] Kiểm tra hiển thị Frontend ở trang chủ, trang danh mục và trang chi tiết.
  - [x] Quy hoạch trang chủ và trang danh mục thành 11 chuyên mục E-commerce. Áp dụng thuật toán **Pure Amazon Tag Matching** (`product.tags`) — loại bỏ hoàn toàn regex trên tên sản phẩm. Chuẩn hóa cấu trúc theo đúng Project Structure Mandate: các hằng số phân loại (`SMART_SLUGS`, `TAG_TO_SLUG`, `DEFAULT_SMART_SLUG`) đặt tại `src/constants/product.ts`, còn logic phân loại tại `src/utils/classify-product.ts` được refactor để vận hành hoàn toàn động (dynamic reduce), loại bỏ triệt để magic strings. Thiết lập **Constants Separation Mandate** trong `.agents/AGENTS.md` để đảm bảo vĩnh viễn không lặp lại lỗi để hằng số trong utils hay quên thư mục constants. Đảm bảo 100% Zero Overlap.

- [x] **5. Đăng nhập & Đăng ký Khách hàng (US-AUTH-01, US-AUTH-02)**
  - [x] Đăng nhập bằng SMS OTP (Twilio/ZNS hoặc giả lập Dev)
  - [x] Xử lý giới hạn spam (Rate Limit & Google reCAPTCHA)

- [x] **6. Đăng nhập Nội bộ & Đặt lại mật khẩu (US-AUTH-03, US-AUTH-04)**
  - [x] Đăng nhập Admin/Nhân viên bằng Email và Mật khẩu
  - [x] Khôi phục mật khẩu qua Email (Nodemailer)
  - [x] Tích hợp mô hình Hybrid Auth (HttpOnly Cookies + Bearer Token)
  - [x] Next.js Edge Middleware bảo vệ Protected Routes
