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

- [x] **6. Home Sections API, Database Indexing, ProductCard Redesign & Data Sanitization**
  - [x] Database Indexing: Thêm B-Tree index cho `soldCount`, `viewCount`, compound index `[categoryId, isActive, soldCount]`
  - [x] Backend `GET /products/home-sections`: Tải song song 8 sản phẩm bán chạy cho từng danh mục kèm Redis cache 120s
  - [x] Non-blocking Redis Invalidation: Sử dụng `scanStream` xóa an toàn các key `products:home-sections:*`
  - [x] Redesign UX/UI `ProductCard`: Khung ảnh nền trắng seamless `object-contain`, Brand subtitle, sao đánh giá, lượt bán
  - [x] Phân trang `/category/[slug]`: Nâng lên 20 sản phẩm/trang kèm bộ điều khiển Pagination chuyển trang
  - [x] Data Sanitization: Rà soát 1,000 sản phẩm và sửa 10 sản phẩm bị gán nhầm danh mục gốc

- [x] **7. Redesign Thanh "Sản phẩm vừa xem" (Recently Viewed) & Comprehensive Search Modal**
  - [x] Tái thiết kế `RecentlyViewedSlider` dạng Compact Poster đứng (`aspect-[3/4]`), hiển thị từ 8–12+ sản phẩm cùng lúc, chỉ hiển thị ảnh và tên.
  - [x] Icon thùng rác `Trash2` xóa lịch sử kèm tooltip alt text và cụm mũi tên cuộn chỉ hiển thị khi `displayedItems.length > 6`.
  - [x] Di chuyển thanh Sản phẩm vừa xem lên vị trí đắc địa ngay dưới Hero Banner và trên block Flash Sale.
  - [x] Cơ chế Empty State Zero-Footprint: Tự động `return null` khi danh sách rỗng, không sinh DOM thừa hay khoảng cách ảo (phantom gap).
  - [x] Comprehensive Search Modal: Tích hợp popup tìm kiếm toàn diện với lịch sử tìm kiếm (`useSearchHistory`), danh mục nhanh, gợi ý sản phẩm hot và điều hướng mượt mà.

- [x] **8. Chuẩn Hóa i18n Zero Hardcode & Type Safety Admin Portal**
  - [x] Quét sạch 100% hardcode text cả tiếng Việt lẫn tiếng Anh trên toàn bộ các trang và component Admin (categories, products, discounts, reviews, users, AdminGuard, layout).
  - [x] Đồng bộ scope namespace `useTranslations`, ngăn chặn triệt để lỗi runtime `Could not resolve message`.
  - [x] Chuẩn hóa phân trang thống nhất qua component `<AdminPagination />` tại `reviews` và `promotions/discounts`.
  - [x] Trích xuất helper tái sử dụng `getApiErrorMessage(err)` loại bỏ 9+ đoạn type casting Axios lặp lại.
  - [x] Chuẩn hóa typing `UserRole` enum và gom logic xác thực tại `AdminGuard.tsx`.

- [x] **9. Chuẩn Hóa Single Source of Truth Tiền Tệ (VNĐ), Bộ Lọc Admin Đa Chiều & Bảo Mật Route RBAC**
  - [x] Migration Data Clean Slate: Dọn dẹp sạch dữ liệu đơn hàng demo cũ (`orders`, `order_items`, `user_voucher_usage`), quy đổi 1,000 sản phẩm và flash sale trong DB từ USD sang VNĐ.
  - [x] Cập nhật `seed.ts` tự động nhân tỷ giá `USD_TO_VND_RATE` từ Amazon dataset.
  - [x] Backend Checkout & Payments: Chuẩn hóa toàn bộ `orders.service.ts` và `payment.controller.ts`/`payment.service.ts` sang VNĐ thuần túy (ngưỡng cọc 200k/50k, tích điểm VIP 1.000 VNĐ = 1 điểm, gửi thẳng VNĐ sang VNPay không nhân kép).
  - [x] Frontend Form & Format: Chuẩn hóa `formatPrice` base VNĐ (trên `/en` quy đổi sang USD hiển thị), `ProductForm.tsx` hiển thị/lưu VNĐ trên `/vi` và USD trên `/en`.
  - [x] Giao diện Admin: Xóa bỏ hoàn toàn placeholder `IMG` tại `/admin/categories`. Bổ sung bộ lọc đa chiều (trạng thái, danh mục cha, tình trạng tồn kho) kèm nút Reset trên cả 2 màn hình Categories và Products.
  - [x] Bảo mật Backend: Tách route `GET /products/admin` được bảo vệ bằng `@UseGuards(AuthGuard('jwt'), RolesGuard)` và khóa chặt `GET /products` công khai (luôn ép `isActive = true`).
