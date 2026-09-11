# Kế hoạch Triển khai Dự án TMĐT & Hệ thống Gợi ý

Dựa trên tài liệu Đặc tả phần mềm (SRS), dưới đây là mốc thời gian (Timeline) và chi tiết các công việc cần làm được chia thành các Giai đoạn (Phases) và Tuần (Weeks). Kế hoạch này ước tính kéo dài 16 tuần.

## Giai đoạn 1: Khởi tạo & Cấu hình (Tuần 1 - 2)

**Mục tiêu:** Hoàn thiện kiến trúc, database và CI/CD.

- [x] **Task 1.1:** Setup Monorepo với cấu trúc thư mục quy chuẩn (`frontend`, `backend`, `ml`).
- [x] **Task 1.2:** Khởi tạo Next.js App Router cho Frontend, cấu hình TailwindCSS, ESLint, Prettier, Husky.
- [x] **Task 1.3:** Khởi tạo NestJS cho Backend, cấu hình Prisma, ESLint, Prettier.
- [x] **Task 1.4:** Thiết kế và migrate Database (MySQL) bằng Prisma (đã hoàn thành cơ bản).
- [x] **Task 1.5:** Khởi tạo môi trường FastAPI cho ML Service (Python).
- [ ] **Task 1.6:** Triển khai luồng CI/CD cơ bản và deploy server trống lên Railway.

## Giai đoạn 2: Auth, Core & Products (Tuần 3 - 5)

**Mục tiêu:** Xây dựng hệ thống tài khoản, bảo mật và quản lý sản phẩm.

- [x] **Task 2.1:** Code module Authentication (Login, Register JWT & HttpOnly Cookies Route Protection).
- [ ] **Task 2.2:** Tích hợp Google reCAPTCHA v3 vào các form nhạy cảm. *(Đang pending)*
- [x] **Task 2.3:** Tích hợp Nodemailer + Gmail SMTP để gửi OTP qua email.
- [x] **Task 2.4:** Xử lý luồng Verify OTP, cấp lại mật khẩu (Forget Password).
- [x] **Task 2.5:** Quản lý User (Admin dashboard).
- [x] **Task 2.6:** Xây dựng module Category & Product (CRUD API).
- [x] **Task 2.7:** Tích hợp Cloudinary để upload hình ảnh sản phẩm.
- [x] **Task 2.8:** Xây dựng giao diện Frontend (Home page, Product list, Product detail).

## Giai đoạn 3: Giỏ hàng, Đặt hàng & Thanh toán (Tuần 6 - 8)

**Mục tiêu:** Hoàn thiện luồng mua hàng E-commerce cốt lõi. *(Frontend đang đi trước Backend, cần bổ sung API cho Cart/Order)*

- [ ] **Task 3.1:** Phát triển tính năng Giỏ hàng (Frontend UI đã xong, đang đợi Backend Redis/DB).
- [ ] **Task 3.2:** Luồng Guest Checkout (Tự động sinh User, mật khẩu ngẫu nhiên đạt chuẩn, verify OTP).
- [ ] **Task 3.3:** Tính năng áp dụng Voucher giảm giá lúc Checkout.
- [ ] **Task 3.4:** Xây dựng tính năng tạo Đơn hàng (Order creation) với locking `stock`.
- [ ] **Task 3.5:** Tích hợp VNPay Sandbox (Tạo Payment URL).
- [ ] **Task 3.6:** Xử lý IPN Callback từ VNPay để cập nhật `payment_status`.
- [ ] **Task 3.7:** Giao diện trang Thanh toán & Xác nhận đơn hàng thành công (Frontend checkout UI đã scaffold một phần).

## Giai đoạn 4: AI & ML Service (Tuần 9 - 11)

**Mục tiêu:** Phát triển, train mô hình, cung cấp API dự đoán gợi ý sản phẩm và thiết lập luồng học liên tục (Continuous Learning).

- [x] **Task 4.1:** Data preprocessing (Xử lý tập Amazon Electronics 500K reviews) - *(Đã hoàn thành sớm trong Tuần 1, xem báo cáo `eda_report.md`)*
- [ ] **Task 4.2:** Train mô hình Popular Items (Baseline/Cold-start).
- [ ] **Task 4.3:** Train mô hình Content-Based (Dùng TF-IDF cosine similarity).
- [ ] **Task 4.4:** Train mô hình Collaborative Filtering (SVD).
- [ ] **Task 4.5:** Xây dựng mô hình Hybrid kết hợp CB & CF.
- [ ] **Task 4.6:** Đóng gói mô hình (.pkl) và code FastAPI endpoint (`GET /recommend/hybrid/{user_id}`).
- [ ] **Task 4.7:** Tích hợp Backend gọi ML API và Cache kết quả vào Redis.
- [ ] **Task 4.8:** Hiển thị section "Gợi ý cho bạn" trên Frontend.
- [ ] **Task 4.9:** Xây dựng API Event Tracking (Thu thập log hành vi): Ghi nhận sự kiện click vào sản phẩm gợi ý, thêm vào giỏ hàng, và mua hàng.
- [ ] **Task 4.10:** Cấu hình CRON Job chạy script tự động retrain (cập nhật lại) ma trận SVD và TF-IDF định kỳ vào cuối tuần dựa trên dữ liệu log mới.
- **Checkpoint 1 (Cuối Tuần 10):** Đảm bảo API ML chạy ổn định, nếu chậm/fail phải có fallback về Popular. Đảm bảo tracking log ghi nhận chính xác.

## Giai đoạn 5: Nâng cao & Admin Nghiệp vụ (Tuần 12 - 14)

**Mục tiêu:** Realtime, Đánh giá và Xử lý nghiệp vụ sau bán hàng.

- [ ] **Task 5.1:** Giao diện Dashboard Admin (Thống kê doanh thu, đơn hàng, người dùng).
- [ ] **Task 5.2:** Tính năng quản lý, duyệt đơn hàng và cập nhật thông tin vận chuyển (Tracking ID).
- [ ] **Task 5.3:** Triển khai Server-Sent Events (SSE) báo trạng thái đơn hàng realtime cho Frontend.
- [ ] **Task 5.4:** Luồng người dùng Yêu cầu Trả hàng & Admin hoàn tiền VNPay (Refund API).
- [ ] **Task 5.5:** Xây dựng tính năng Đánh giá sản phẩm (Review & Rating) cho đơn `Completed`.
- [ ] **Task 5.6:** Tính năng xem lịch sử đơn hàng và Tra cứu đơn (Guest tra cứu qua Mã đơn + Email).
- **Checkpoint 2 (Đầu Tuần 13):** Đảm bảo luồng Order chạy đúng trước khi test luồng Return.

## Giai đoạn 6: Đóng gói, Test & Viết Báo cáo (Tuần 15 - 16)

**Mục tiêu:** Đảm bảo chất lượng hệ thống và hoàn thiện luận văn/báo cáo.

- [ ] **Task 6.1:** Viết Unit Test cho Core Modules (Auth, Order, Payment Mock).
- [ ] **Task 6.2:** Code scripts `evaluate.py` chạy Offline Evaluation cho 4 mô hình ML (RMSE, Precision@10, NDCG@10).
- [ ] **Task 6.3:** Dọn dẹp code, rà soát lại bảo mật (XSS, SQL Injection).
- [ ] **Task 6.4:** Clean up Database rác từ quá trình dev.
- [ ] **Task 6.5:** Chuẩn bị slide thuyết trình và hoàn thiện Quyển báo cáo tốt nghiệp.
- [ ] **Task 6.6:** Báo cáo / Bảo vệ đồ án.
