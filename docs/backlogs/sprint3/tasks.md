# Sprint 3: Vận hành Đơn hàng & Quản trị Nhân sự

- [x] **1. Theo dõi và Tra cứu Đơn hàng (US-ORD-01, US-ORD-04)**
  - [x] Xem lịch sử, trạng thái đơn (SSE Realtime)
  - [x] API Tra cứu đơn cho Guest & GuestTrackingToken SSE

- [x] **2. Quản lý Đơn hàng cho Khách hàng (US-ORD-02)**
  - [x] API Khách hàng hủy đơn (Atomic Claim, hoàn tồn kho & bảo vệ Late IPN)

- [x] **3. Vận hành Đơn hàng (Admin & Nhân viên) (US-ADM-04, US-ADM-05)**
  - [x] Admin/Nhân viên duyệt đơn (`confirmed`)
  - [x] Ghi nhận giao hàng thủ công (Fallback: `deliveryPartner`, `trackingId`, chuyển `handed_over`/`delivering`/`completed`)

- [x] **4. Quản lý Phân quyền (US-ADM-08)**
  - [x] Quản lý tài khoản Admin và Nhân viên (Phân quyền Role-based & Invite link onboarding)

- [x] **5. Tác vụ nền (Cron Jobs) (TS-CRON-01)**
  - [x] Tác vụ nền dọn dẹp hệ thống (Xóa Guest quá hạn, nhả tồn kho - thông qua `orders-cron.service.ts`)

