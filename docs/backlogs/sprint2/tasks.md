# Sprint 2: Giỏ hàng, Đặt hàng & Quản lý Đơn hàng

- [x] **1. Khởi tạo Backend Module: Cart (Giỏ hàng) (US-CART-01, US-CART-02)**
  - [x] Tạo `CartController`, `CartService`
  - [x] Viết API Thêm/Sửa/Xóa sản phẩm trong giỏ hàng (lưu DB thông qua Prisma)
  - [x] Tích hợp Frontend UI (`cart/page.tsx`, tối ưu responsive grid layout, đa ngôn ngữ i18n & thông báo Toast)

- [ ] **2. Khởi tạo Backend Module: Orders (Đơn hàng) (US-ORD-01, US-ORD-02)**
  - [ ] Tạo `OrderController`, `OrderService`
  - [ ] Viết API tạo đơn hàng mới từ giỏ hàng (Checkout)
  - [ ] Tích hợp Frontend UI (`checkout/page.tsx`)

- [ ] **3. Khởi tạo Backend Module: Quản lý đơn hàng (Admin) (US-ADM-04)**
  - [ ] API lấy danh sách đơn hàng cho Admin, cập nhật trạng thái đơn hàng (Pending -> Shipping -> Delivered)
  - [ ] Tích hợp Frontend Admin (`admin/orders`)

- [ ] **4. Quản lý đơn hàng (User) (US-ORD-03)**
  - [ ] API lấy danh sách lịch sử đơn hàng của người dùng
  - [ ] Tích hợp Frontend UI (`profile/orders`)
