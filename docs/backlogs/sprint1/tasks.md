# Sprint 1: Nền tảng Khám phá & Quản lý Danh mục

- [ ] **1. Khởi tạo Backend Module: Users / Profile (US-AUTH-06)**
  - [ ] Tạo `UserController` và `UserService`
  - [ ] Viết API `GET /users/profile` lấy thông tin cá nhân
  - [ ] Viết API `PATCH /users/profile` cập nhật thông tin cá nhân (Tên, SDT, Địa chỉ)
  - [ ] Tích hợp Frontend UI (`profile/page.tsx`) gọi API thật

- [ ] **2. Khởi tạo Backend Module: Categories (US-ADM-02)**
  - [ ] Tạo `CategoryController`, `CategoryService`
  - [ ] Viết CRUD API: Lấy danh sách, Tạo mới, Cập nhật, Ẩn/Hiện (Soft delete)
  - [ ] Tích hợp Frontend Admin (`admin/categories` - cần tạo UI nếu chưa có)

- [ ] **3. Khởi tạo Backend Module: Products (US-ADM-03)**
  - [ ] Tạo `ProductController`, `ProductService`
  - [ ] Cấu hình luồng Upload ảnh (tích hợp module Storage có sẵn)
  - [ ] Viết CRUD API: Tạo, Cập nhật, Ẩn/Hiện sản phẩm
  - [ ] Tích hợp Frontend Admin (`admin/products/new`, `admin/products`)

- [ ] **4. Tích hợp Khám phá Sản phẩm (Client) (US-CAT-01, US-CAT-02)**
  - [ ] Viết API public: `GET /products` (Có phân trang, lọc, tìm kiếm theo tên/danh mục)
  - [ ] Viết API public: `GET /products/:slug` (Lấy chi tiết)
  - [ ] Thay thế Mock Data trong `product-service.ts` ở Frontend bằng `fetch/axios` gọi API thật.
  - [ ] Kiểm tra hiển thị Frontend ở trang chủ, trang danh mục và trang chi tiết.
