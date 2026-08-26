# Sprint 4: Hậu mãi, Khuyến mãi & Dashboard

- [x] **1. Đánh giá (Reviews) (US-ORD-05, US-ADM-07)**
  - [x] Khách hàng Đánh giá sản phẩm sau khi đơn hoàn thành
  - [x] Admin/Nhân viên Kiểm duyệt ẩn/hiện đánh giá
  - [x] Chuẩn hóa đa ngôn ngữ i18n & hằng số thông báo khóa lỗi

- [x] **2. Khuyến mãi - Voucher (US-VOU-01, US-VOU-02)**
  - [x] Mở rộng Backend: Scope (CART/CATEGORY/PRODUCT), perUserLimit, API public list & Usage Logs, Atomic Claim & rollback
  - [x] Frontend Admin: Bảng quản lý Voucher & Modal xem lịch sử sử dụng, phân quyền RBAC
  - [x] Frontend Client: Modal / Danh sách Voucher công khai tại trang Checkout & Profile (/profile/vouchers)

- [x] **3. Admin Dashboard (US-ADM-01)**
  - [x] Backend Module Dashboard độc lập (`DashboardModule`, `GET /admin/dashboard/stats`)
  - [x] Thống kê doanh thu, đơn hàng, khách hàng, sản phẩm và biểu đồ trạng thái đơn thực tế
  - [x] Cache Redis dữ liệu thô (TTL 120s) và phân quyền 2 tầng dữ liệu (Admin vs Nhân viên)
  - [x] Frontend kết nối API thực tế, hiển thị động và hỗ trợ nút Làm mới (Force Refresh)
