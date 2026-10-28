# Kế hoạch Triển khai Dự án TMĐT & Hệ thống Gợi ý

Dựa trên tài liệu Đặc tả phần mềm (SRS), dưới đây là mốc thời gian (Timeline) và chi tiết các công việc cần làm được chia thành các Giai đoạn (Phases) và Tuần (Weeks). Kế hoạch này ước tính kéo dài 16 tuần.

## Giai đoạn 1: Khởi tạo & Cấu hình (Tuần 1 - 2)

**Mục tiêu:** Hoàn thiện kiến trúc, database và CI/CD.

- [x] **Task 1.1:** Setup Monorepo với cấu trúc thư mục quy chuẩn (`frontend`, `backend`, `ml`).
- [x] **Task 1.2:** Khởi tạo Next.js App Router cho Frontend, cấu hình TailwindCSS, ESLint, Prettier, Husky.
- [x] **Task 1.3:** Khởi tạo NestJS cho Backend, cấu hình Prisma, ESLint, Prettier.
- [x] **Task 1.4:** Thiết kế và migrate Database (MySQL) bằng Prisma (đã hoàn thành cơ bản).
- [x] **Task 1.5:** Khởi tạo môi trường FastAPI cho ML Service (Python).
- [x] **Task 1.6:** Triển khai luồng CI/CD cơ bản (`.github/workflows/ci.yml`) và cấu hình deploy lên Railway.

## Giai đoạn 2: Auth, Core & Products (Tuần 3 - 5)

**Mục tiêu:** Xây dựng hệ thống tài khoản, bảo mật và quản lý sản phẩm.

- [x] **Task 2.1:** Code module Authentication (Login, Register JWT & HttpOnly Cookies Route Protection).
- [x] **Task 2.2:** Tích hợp bảo mật 2 tầng chống Spam/Brute-force (Throttler Rate Limit + Redis Fail Counter).
- [x] **Task 2.3:** Tích hợp Nodemailer + Gmail SMTP để gửi OTP qua email.
- [x] **Task 2.4:** Xử lý luồng Verify OTP, cấp lại mật khẩu (Forget Password).
- [x] **Task 2.5:** Quản lý User (Admin dashboard).
- [x] **Task 2.6:** Xây dựng module Category & Product (CRUD API).
- [x] **Task 2.7:** Tích hợp Cloudinary để upload hình ảnh sản phẩm.
- [x] **Task 2.8:** Xây dựng giao diện Frontend (Home page, Product list, Product detail).

## Giai đoạn 3: Giỏ hàng, Đặt hàng & Thanh toán (Tuần 6 - 8)

**Mục tiêu:** Hoàn thiện luồng mua hàng E-commerce cốt lõi.

- [x] **Task 3.1:** Phát triển tính năng Giỏ hàng (Đồng bộ Local & DB qua Prisma).
- [x] **Task 3.2:** Luồng Guest Checkout & Tra cứu đơn hàng cho Guest (chống Enumeration, Rate Limit).
- [x] **Task 3.3:** Tính năng áp dụng Voucher giảm giá và Flash Sale lúc Checkout (Atomic Claim & Anti-Stacking).
- [x] **Task 3.4:** Xây dựng tính năng tạo Đơn hàng (Order creation) với atomic locking `stock` và chính sách đặt cọc 50.000 VNĐ cho đơn dưới 200.000 VNĐ.
- [x] **Task 3.5:** Tích hợp VNPay Sandbox (Tạo Payment URL tách riêng cho User & Guest, hỗ trợ Thanh toán lại `pay-again`).
- [x] **Task 3.6:** Xử lý IPN Callback từ VNPay 4 lớp bảo vệ, tra cứu `vnp_TxnRef` 2 bước và bắt Duplicate Payment 2 chiều.
- [x] **Task 3.7:** Giao diện trang Thanh toán & Callback xác nhận đơn hàng thành công/thất bại.

## Giai đoạn 4: AI & ML Service (Tuần 9 - 11)

**Mục tiêu:** Phát triển, train mô hình, cung cấp API dự đoán gợi ý sản phẩm và thiết lập luồng học liên tục (Continuous Learning).

- [x] **Task 4.1:** Data preprocessing (Xử lý tập Amazon Electronics 500K reviews) - *(Xem báo cáo `eda_report.md`)*
- [x] **Task 4.2:** Train mô hình Popular Items (Baseline/Cold-start).
- [x] **Task 4.3:** Train mô hình Content-Based (Dùng TF-IDF cosine similarity).
- [x] **Task 4.4:** Train mô hình Collaborative Filtering (SVD).
- [x] **Task 4.5:** Xây dựng mô hình Hybrid kết hợp CB & CF.
- [x] **Task 4.6:** Đóng gói mô hình (.pkl) và code FastAPI endpoint (`GET /recommend/hybrid/{user_id}`).
- [x] **Task 4.7:** Tích hợp Backend gọi ML API (timeout 500ms) và Cache kết quả vào Redis (TTL 3600s, fallback 120s).
- [x] **Task 4.8:** Hiển thị section "Gợi ý cho bạn" và "Sản phẩm vừa xem" trên Frontend.
- [x] **Task 4.9:** Xây dựng API Event Tracking (`POST /activities/log` + Pub/Sub `order.created`): Ghi nhận sự kiện xem, click, tìm kiếm, thêm vào giỏ và mua hàng.
- [ ] **Task 4.10:** Cấu hình CRON Job chạy script tự động retrain định kỳ vào cuối tuần dựa trên dữ liệu log mới.
- **Checkpoint 1 (Cuối Tuần 10):** Đảm bảo API ML chạy ổn định, nếu chậm/fail phải có fallback về Popular. Đảm bảo tracking log ghi nhận chính xác.

## Giai đoạn 5: Nâng cao & Admin Nghiệp vụ (Tuần 12 - 14)

**Mục tiêu:** Realtime, Đánh giá và Xử lý nghiệp vụ sau bán hàng.

- [x] **Task 5.1:** Giao diện Dashboard Admin (Thống kê doanh thu, đơn hàng, người dùng, Redis cache 120s).
- [x] **Task 5.2:** Tính năng quản lý, duyệt đơn hàng và cập nhật thông tin vận chuyển (Tracking ID).
- [x] **Task 5.3:** Triển khai Server-Sent Events (SSE) báo trạng thái đơn hàng realtime cho Frontend (cả User & Guest Tracking Token).
- [x] **Task 5.4:** Luồng người dùng Yêu cầu Trả hàng & Admin duyệt/từ chối trả hàng, hoàn tiền VNPay.
- [x] **Task 5.5:** Xây dựng tính năng Đánh giá sản phẩm (Review & Rating) cho đơn `Completed` & Admin kiểm duyệt.
- [x] **Task 5.6:** Tính năng xem lịch sử đơn hàng và Tra cứu đơn (Guest tra cứu qua Mã đơn + SĐT).
- **Checkpoint 2 (Đầu Tuần 13):** Đảm bảo luồng Order chạy đúng trước khi test luồng Return.

## Giai đoạn 6: Đóng gói, Test & Viết Báo cáo (Tuần 15 - 16)

**Mục tiêu:** Đảm bảo chất lượng hệ thống và hoàn thiện luận văn/báo cáo.

- [x] **Task 6.1:** Viết Unit Test cho Core Modules (`order-payment.policy.spec.ts`, `payment.service.spec.ts`, `mail`, `redis`, `storage`).
- [x] **Task 6.2:** Code scripts `03_evaluate_metrics.py` chạy Offline Evaluation cho mô hình ML (RMSE, Precision@10, NDCG@10).
- [x] **Task 6.3:** Dọn dẹp code, chuẩn hóa `< 300` dòng/file, Zero Hardcode i18n, rà soát bảo mật (HTTP Security Headers, Rate Limit, RBAC, chống SQL Injection).
- [ ] **Task 6.4:** Clean up Database rác / chuẩn hóa đơn hàng legacy từ quá trình dev.
- [ ] **Task 6.5:** Chuẩn bị slide thuyết trình và hoàn thiện Quyển báo cáo tốt nghiệp.
- [ ] **Task 6.6:** Báo cáo / Bảo vệ đồ án.
