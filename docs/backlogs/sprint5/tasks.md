# Sprint 5: Hệ thống Gợi ý & Cronjobs

- [x] **1. Tích hợp Mô hình Gợi ý (Machine Learning) (US-REC-01, TS-ML-01)**
  - [x] Đánh giá Offline Testing cho mô hình (02_train_models.py, 03_evaluate_metrics.py, evaluation_report.json)
  - [x] Khởi chạy FastAPI Server bảo mật X-API-Key (ML Service)
  - [x] Gọi API gợi ý từ Backend NestJS theo `userId` hoặc hành vi Guest (timeout 500ms)

- [x] **2. Khuyến mãi - Flash Sale (US-SALE-01, US-SALE-02, US-SALE-03)**
  - [x] Prisma Migration: Thêm bảng `ProductDiscount`, liên kết `OrderItem.productDiscountId`
  - [x] Module Backend `promotions`: CRUD Flash Sale, getActiveDiscount, validate chống chồng lấn thời gian
  - [x] Tích hợp vào `orders.service.ts`: Atomic Claim suất sale `$executeRaw` & nhả suất sale trong `cancelOrder`
  - [x] Tích hợp vào `vouchers.service.ts`: Chống cộng dồn voucher PERCENTAGE trên sản phẩm Flash Sale
  - [x] Frontend: Banner Flash Sale, `FlashSaleSection` trang chủ, `CountdownTimer`
  - [x] Frontend Admin: Quản lý chương trình Flash Sale (`/admin/promotions/discounts`)

- [x] **3. Cache và Fallback (US-REC-02)**
  - [x] Tích hợp Redis cache kết quả gợi ý trong 1 giờ (Hybrid 3600s)
  - [x] Fallback về thuật toán Popular (bán chạy) khi API ML timeout/down (Cache 120s)

- [x] **4. Cronjob Dọn dẹp Dữ liệu rác (TS-CRON-01)**
  - [x] Xóa tài khoản Guest và giỏ hàng rỗng sau 7 ngày
  - [x] Giải phóng tồn kho và suất Flash Sale bị kẹt từ các đơn `pending_payment` quá hạn 30 phút

- [x] **5. Full-stack Wishlist, Profile AI Recommendations & UI Polish**
  - [x] Backend Module Wishlist (`WishlistModule`, `GET /wishlist`, `GET /wishlist/ids`, `POST /wishlist/:productId`, `DELETE /wishlist/:productId`)
  - [x] Frontend Wishlist Hook & State: `useWishlist`, `useWishlistIds`, `useToggleWishlist` tối ưu O(1) query cache
  - [x] Nút Heart trên `ProductCard` tích hợp toggle Wishlist với optimistic update
  - [x] Tab Yêu thích và Gợi ý AI trang Profile (`/profile`) render danh sách sản phẩm thật kèm fallback DB
  - [x] Form Newsletter client-side validation và chuẩn hóa đa ngôn ngữ i18n toàn diện


