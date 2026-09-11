# Sprint 1: Nền tảng Khám phá & Quản lý Danh mục

- [x] **1. Khởi tạo Backend Module: Users / Profile (US-AUTH-06)**
  - [x] Tạo `UserController` và `UserService`
  - [x] Viết API `GET /users/profile` lấy thông tin cá nhân
  - [x] Viết API `PATCH /users/profile` cập nhật thông tin cá nhân (Tên, SDT, Địa chỉ)
  - [x] Tích hợp Frontend UI (`profile/page.tsx`) gọi API thật
  - [x] Tối ưu Thẻ địa chỉ gọn gàng (`Clean Address Card`), `AddressModal` popup (Search-Modal style), Honest Copy & Smart Street Prefill cho địa chỉ phi cấu trúc, `isDirty` dynamic save button, và tùy biến ngữ cảnh thông minh theo loại tài khoản SĐT (OTP) vs Email.
  - [x] Tái cấu trúc phân rã `profile/page.tsx` từ 595 dòng xuống còn 158 dòng (tuân thủ Code Length Mandate < 300 dòng) thành 4 sub-components chuyên biệt (`ProfileInfoSection`, `ProfileSettingsSection`, `ProfileWishlistSection`, `ProfileRecommendationsSection`). Chuẩn hóa 100% i18n không hardcode text cho thông báo bảo mật và tiêu đề.

- [x] **2. Khởi tạo Backend Module: Categories (US-ADM-02)**
  - [x] Tạo `CategoryController`, `CategoryService`
  - [x] Viết CRUD API: Lấy danh sách, Tạo mới, Cập nhật, Ẩn/Hiện (Soft delete)
  - [x] Tích hợp Frontend Admin (`admin/categories`): Tìm kiếm danh mục động, hiển thị tên danh mục cha thay vì UUID, tích hợp `CategoryEditModal` chỉnh sửa nhanh tại chỗ, nút chuyển đổi trạng thái ẩn/hiện an toàn kèm toast.

- [x] **3. Khởi tạo Backend Module: Products (US-ADM-03)**
  - [x] Tạo `ProductController`, `ProductService`
  - [x] Cấu hình luồng Upload ảnh (`POST /products/upload-image` qua Multer Storage)
  - [x] Viết CRUD API: Tạo, Cập nhật, Ẩn/Hiện sản phẩm
  - [x] Tích hợp Frontend Admin (`admin/products/new`, `admin/products`, `admin/products/[id]/edit`):
    - Xây dựng component `ProductForm.tsx` chuẩn hóa schema Zod + React Hook Form.
    - Single source of truth cho giá niêm yết (bỏ trường giá khuyến mãi, chuyển quản lý giảm giá sang Flash Sale).
    - Tự động sinh mô tả sản phẩm chuẩn kỹ thuật với nút "Tạo mô tả tự động" (Honest Copy).
    - Quản lý thông số kỹ thuật động (Dynamic Key-Value Specifications).
    - Tải ảnh sản phẩm thực tế với preview và xóa ảnh.
    - Bảng sản phẩm (`admin/products/page.tsx`): Debounced search, chuyển trang phân trang `AdminPagination`, điều hướng Sửa sản phẩm và toggle trạng thái kinh doanh.

- [x] **4. Tích hợp Khám phá Sản phẩm (Client) (US-CAT-01, US-CAT-02)**
  - [x] Viết API public: `GET /products` (Có phân trang, lọc, tìm kiếm theo tên/danh mục)
  - [x] Viết API public: `GET /products/:slug` (Lấy chi tiết)
  - [x] Thay thế Mock Data trong `product-service.ts` ở Frontend bằng `fetch/axios` gọi API thật.
  - [x] Kiểm tra hiển thị Frontend ở trang chủ, trang danh mục và trang chi tiết.
  - [x] Quy hoạch trang chủ và trang danh mục thành 11 chuyên mục E-commerce. Áp dụng thuật toán **Pure Amazon Tag Matching** (`product.tags`) — loại bỏ hoàn toàn regex trên tên sản phẩm. Chuẩn hóa cấu trúc theo đúng Project Structure Mandate: các hằng số phân loại (`SMART_SLUGS`, `TAG_TO_SLUG`, `DEFAULT_SMART_SLUG`) đặt tại `src/constants/product.ts`, còn logic phân loại tại `src/utils/classify-product.ts` được refactor để vận hành hoàn toàn động (dynamic reduce), loại bỏ triệt để magic strings. Thiết lập **Constants Separation Mandate** trong `.agents/AGENTS.md` để đảm bảo vĩnh viễn không lặp lại lỗi để hằng số trong utils hay quên thư mục constants. Đảm bảo 100% Zero Overlap.

- [x] **5. Đăng nhập & Đăng ký Khách hàng (US-AUTH-01, US-AUTH-02)**
  - [x] Đăng nhập bằng SMS OTP (Twilio/ZNS hoặc giả lập Dev)
  - [x] Nâng cấp nút "Gửi lại mã OTP" (Resend OTP) kèm đếm ngược 60s và xử lý mã lỗi HTTP 429
  - [x] Phân lập 2 tầng chống spam & brute-force: Tầng 1 Throttler Rate Limit (5 req/min) + Tầng 2 Redis Key Fail Counter (khóa 3 lần sai / 15 phút) tự động reset khi cấp mã mới.
  - [x] Chuẩn hóa 100% text đa ngôn ngữ i18n cho toàn bộ luồng Auth (Login, Register, Header Account)

- [x] **6. Đăng nhập Nội bộ & Đặt lại mật khẩu (US-AUTH-03, US-AUTH-04)**
  - [x] Đăng nhập Admin/Nhân viên bằng Email và Mật khẩu: Chặn truy cập đối với tài khoản `CUSTOMER` tại form đăng nhập Admin kèm thông báo lỗi đa ngôn ngữ.
  - [x] Khôi phục mật khẩu qua Email (Nodemailer).
  - [x] Tích hợp mô hình Hybrid Auth (HttpOnly Cookies + Bearer Token).
  - [x] Vá lỗ hổng bảo mật RolesGuard Backend: Chuyển `@Roles('ADMIN')` chuỗi cứng sang chuẩn Enum `@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)`.
  - [x] Next.js Edge Middleware bảo vệ Protected Routes (/admin/*) theo RBAC 3 cấp (EMPLOYEE, ADMIN, SUPER_ADMIN) với comment rõ ràng đây là UX gate.
  - [x] `AdminGuard` Client-side Navigation Guard kiểm tra quyền hạn và render Skeleton Hydration chống visual flash.
  - [x] Quản trị người dùng & Phân quyền Action-level (`admin/users`): Admin chỉ được mời/đổi vai trò Employee và không được phép khóa/sửa tài khoản Admin/Super Admin khác; thay thế `window.confirm` bằng `BaseModal` an toàn; phân tách sub-components `UserInviteModal`, `UserConfirmModal` tuân thủ nghiêm ngặt Code Length Mandate (< 300 dòng).
