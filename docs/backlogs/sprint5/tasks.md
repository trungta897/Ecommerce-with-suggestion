# Sprint 5: Hệ thống Gợi ý & Cronjobs

- [ ] **1. Tích hợp Mô hình Gợi ý (Machine Learning) (US-REC-01, TS-ML-01)**
  - [ ] Đánh giá Offline Testing cho mô hình
  - [ ] Khởi chạy FastAPI Server (ML Service)
  - [x] Gọi API gợi ý từ Backend NestJS theo `userId` hoặc hành vi Guest

- [ ] **2. Khuyến mãi - Flash Sale (US-SALE-01, US-SALE-02, US-SALE-03)**
  - [ ] Prisma Migration: Thêm bảng `ProductDiscount`, liên kết `OrderItem.productDiscountId`
  - [ ] Module Backend `promotions`: CRUD Flash Sale, getActiveDiscount, Atomic Claim `$executeRaw`
  - [ ] Tích hợp vào `orders.service.ts`: Atomic Claim suất sale & nhả suất sale trong `cancelOrder`
  - [ ] Frontend: Banner Flash Sale, `FlashSaleSection` trang chủ, `FlashSaleCountdown` timer
  - [ ] Frontend Admin: Quản lý chương trình Flash Sale

- [ ] **3. Cache và Fallback (US-REC-02)**
  - [ ] Tích hợp Redis cache kết quả gợi ý trong 1 giờ
  - [x] Fallback về thuật toán Popular (bán chạy) khi API ML timeout

- [ ] **4. Cronjob Dọn dẹp Dữ liệu rác (TS-CRON-01)**
  - [ ] Xóa tài khoản Guest và giỏ hàng rỗng sau 7 ngày
  - [ ] Giải phóng tồn kho và suất Flash Sale bị kẹt từ các đơn `pending_payment` quá hạn 30 phút

