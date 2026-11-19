# Sprint 2: Giỏ hàng, Đặt hàng & Quản lý Đơn hàng

- [x] **1. Khởi tạo Backend Module: Cart (Giỏ hàng) (US-CART-01, US-CART-02)**
  - [x] Tạo `CartController`, `CartService`
  - [x] Viết API Thêm/Sửa/Xóa sản phẩm trong giỏ hàng (lưu DB thông qua Prisma)
  - [x] Tích hợp Frontend UI (`cart/page.tsx`, tối ưu responsive grid layout, đa ngôn ngữ i18n & thông báo Toast)

- [x] **2. Khởi tạo Backend Module: Orders (Đơn hàng) (US-ORD-01, US-ORD-02)**
  - [x] Tạo `OrderController`, `OrderService`
  - [x] Viết API tạo đơn hàng mới từ giỏ hàng (Checkout)
  - [x] Tích hợp Frontend UI (`checkout/page.tsx`)

- [x] **3. Khởi tạo Backend Module: Quản lý đơn hàng (Admin) (US-ADM-04)**
  - [x] API lấy danh sách đơn hàng cho Admin, cập nhật trạng thái đơn hàng (Pending -> Shipping -> Delivered)
  - [x] Tích hợp Frontend Admin (`admin/orders`)

- [x] **4. Quản lý đơn hàng (User) (US-ORD-03)**
  - [x] API lấy danh sách lịch sử đơn hàng của người dùng
  - [x] Tích hợp Frontend UI (`profile/orders`)

- [x] **5. Tính năng Trả hàng (Self-Service Return) (US-ORD-03, US-ADM-06, FR-09)**
  - [x] Khởi tạo DB Schema cho tính năng trả hàng (`completedAt`, enum reasons, audit trail)
  - [x] Xây dựng Backend Logic (Eligibility check, Request Return, Supplement Evidence)
  - [x] Xây dựng Backend Admin Logic (Approve Return, Reject Return)
  - [x] Xây dựng UI Frontend (ReturnModal, Admin Orders, i18n, Services)
