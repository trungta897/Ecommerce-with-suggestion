# Sprint 4: Hậu mãi, Khuyến mãi & Dashboard

- [x] **1. Đánh giá (Reviews) (US-ORD-05, US-ADM-07)**
  - [x] Khách hàng Đánh giá sản phẩm sau khi đơn hoàn thành
  - [x] Admin/Nhân viên Kiểm duyệt ẩn/hiện đánh giá
  - [x] Chuẩn hóa đa ngôn ngữ i18n & hằng số thông báo khóa lỗi

- [x] **2. Khuyến mãi - Voucher (US-VOU-01, US-VOU-02)**
  - [x] Mở rộng Backend: Scope (CART/CATEGORY/PRODUCT), perUserLimit, API public list & Usage Logs, Atomic Claim & rollback
  - [x] Frontend Admin: Bảng quản lý Voucher & Modal xem lịch sử sử dụng, phân quyền RBAC
  - [x] Frontend Client: Modal / Danh sách Voucher công khai tại trang Checkout & Profile (/profile/vouchers)
  - [x] Nâng cấp trải nghiệm & Chuẩn hóa: Thay thế hoàn toàn `alert()` bằng `toast`, tích hợp bộ phân trang tái sử dụng `AdminPagination`, chuẩn hóa 100% i18n không còn chuỗi cứng và rút gọn file < 300 dòng.

- [x] **3. Admin Dashboard (US-ADM-01)**
  - [x] Backend Module Dashboard độc lập (`DashboardModule`, `GET /admin/dashboard/stats`)
  - [x] Thống kê doanh thu, đơn hàng, khách hàng, sản phẩm và biểu đồ trạng thái đơn thực tế
  - [x] Cache Redis dữ liệu thô (TTL 120s) và phân quyền 2 tầng dữ liệu (Admin vs Nhân viên)
  - [x] Frontend kết nối API thực tế, hiển thị động và hỗ trợ nút Làm mới (Force Refresh)
  - [x] Tái cấu trúc loại bỏ hằng số cục bộ, sử dụng `ORDER_STATUS_COLORS` từ `src/constants/order.ts`, chuẩn hóa 100% text đa ngôn ngữ i18n.

- [x] **4. Quản lý Đơn hàng & Tái cấu trúc Luồng Hậu mãi Admin (US-ADM-04, US-ADM-05)**
  - [x] Xóa bỏ Mock Route `/admin/returns` thừa, tự động redirect sang `/admin/orders?status=RETURN_REQUESTED` đồng bộ với luồng xử lý hoàn tiền thực tế.
  - [x] Tự động đồng bộ bộ lọc trạng thái đơn từ Query Params `status`.
  - [x] Tái cấu trúc phân rã `admin/orders/page.tsx` từ 444 dòng xuống 275 dòng thông qua 2 sub-components chuyên biệt: `AdminOrderFilters.tsx` và `AdminOrderTable.tsx`, tuân thủ nghiêm ngặt Code Length Mandate (< 300 dòng).
  - [x] Chuẩn hóa toàn bộ thông báo Toast, nhãn trạng thái và hành động sang đa ngôn ngữ i18n không hardcode text.
