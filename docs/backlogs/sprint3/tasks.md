# Sprint 3: Vận hành Đơn hàng & Quản trị Nhân sự

- [ ] **1. Theo dõi và Tra cứu Đơn hàng (US-ORD-01, US-ORD-04)**
  - [ ] Xem lịch sử, trạng thái đơn (SSE Realtime)
  - [ ] API Tra cứu đơn cho Guest

- [ ] **2. Quản lý Đơn hàng cho Khách hàng (US-ORD-02)**
  - [ ] API Khách hàng hủy đơn (khi đơn hàng đang ở trạng thái Pending)

- [ ] **3. Vận hành Đơn hàng (Admin) (US-ADM-04, US-ADM-05)**
  - [ ] Admin/Nhân viên duyệt đơn
  - [ ] Ghi nhận giao hàng thủ công (Fallback)

- [ ] **4. Quản lý Phân quyền (US-ADM-08)**
  - [ ] Quản lý tài khoản Admin và Nhân viên (Phân quyền Role-based)

- [x] **5. Tác vụ nền (Cron Jobs) (TS-CRON-01)**
  - [x] Tác vụ nền dọn dẹp hệ thống (Xóa Guest quá hạn, nhả tồn kho - thông qua `orders-cron.service.ts`)
