# Brainstorm Summary — Trước khi viết SRS

## Thông tin đã làm rõ qua phỏng vấn 7 nhóm

### 1. Tổng quan

- **Dự án**: Website TMĐT Đồ Điện Tử + Hybrid Recommender System
- **Stack**: Next.js 14 + NestJS + FastAPI + MySQL + Redis
- **Quy mô**: 1 người, 16 tuần, Đồ án Tốt nghiệp

### 2. Người dùng và quyền (CẬP NHẬT)

| Vai trò                | Quyền                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------ |
| **Guest**              | Xem sản phẩm, tìm kiếm, xem đánh giá, đăng ký, đăng nhập                             |
| **User (chưa verify)** | Như Guest + đăng xuất, xem profile. **KHÔNG mua hàng được**                          |
| **User (đã verify)**   | Mua hàng, giỏ hàng, đánh giá (chỉ sản phẩm đã mua & completed), nhận gợi ý, trả hàng |
| **Admin**              | Quản lý sản phẩm, đơn hàng, đánh giá, dashboard thống kê                             |
| **Super Admin**        | Như Admin + tạo tài khoản Admin mới                                                  |

### 3. Luồng chính (CẬP NHẬT)

**Luồng đăng ký + xác thực:**

```
Đăng ký (tên, email, mật khẩu) → Gửi OTP 6 số qua email → User nhập OTP → Verify thành công → Nâng quyền tự động (không cần đăng nhập lại)
```

**Luồng checkout:**

```
Bước 1: Nhập thông tin giao hàng (tên, sđt, địa chỉ)
Bước 2: Chọn phương thức thanh toán (VNPay / COD)
Bước 2.5: Xem lại toàn bộ đơn hàng (review order)
Bước 3: Xác nhận đặt hàng
Bước 4: VNPay redirect / Tạo đơn COD
```

**Trạng thái đơn hàng (CẬP NHẬT):**

```
Pending → Confirmed → Shipping → Completed → Return_Requested → Returned → Refunded
     ↓
  Cancelled (chỉ từ Pending)
```

**Luồng trả hàng:**

```
User yêu cầu trả hàng (trong 7 ngày sau Completed) → Admin duyệt → Returned → Hoàn tiền → Refunded
```

- **Đơn thanh toán VNPay**: hoàn tiền tự động qua VNPay Refund API.
- **Đơn thanh toán COD**: không có giao dịch VNPay để hoàn tự động → Admin xác nhận hoàn tiền thủ công (nhập thông tin chuyển khoản của khách) và đánh dấu "Refunded" trong hệ thống. _(Cần ghi rõ trong SRS đây là quy trình bán tự động, không qua cổng thanh toán.)_

**Trigger chuyển trạng thái `Pending → Confirmed`:**

- Đơn **VNPay**: tự động khi cổng thanh toán callback báo thành công (IPN).
- Đơn **COD**: Admin xác nhận thủ công sau khi kiểm tra đơn (vì chưa có xác nhận thanh toán).

**Hủy đơn (Cancelled)**: hiện chỉ cho phép hủy khi đơn ở trạng thái `Pending` (đơn giản hóa cho phạm vi đồ án). Nếu đơn đã `Confirmed` nhưng chưa `Shipping`, người dùng cần liên hệ Admin để xử lý ngoài hệ thống — ghi rõ giới hạn này trong SRS để tránh hiểu nhầm là thiếu sót.

### 4. Tích hợp Email (MỚI)

| Loại email              | Khi nào gửi                   | Nội dung                          |
| ----------------------- | ----------------------------- | --------------------------------- |
| **OTP xác thực email**  | Sau đăng ký                   | Mã OTP 6 số, hết hạn 15 phút      |
| **Xác nhận đơn hàng**   | Sau đặt hàng thành công       | Mã đơn, sản phẩm, tổng tiền       |
| **Đơn hàng hoàn thành** | Khi đơn chuyển sang Completed | Thông tin đơn hàng, link đánh giá |
| **Reset password**      | Khi user yêu cầu              | Link/OTP reset                    |

- **Dịch vụ**: Nodemailer + Gmail SMTP
- **Template**: Text đơn giản cho demo

### 5. Realtime Tracking (MỚI)

- **Công nghệ**: Server-Sent Events (SSE)
- **Mục đích**: Push cập nhật trạng thái đơn hàng realtime (giống Shopee)
- Không gửi email cho mỗi lần đổi trạng thái — chỉ push SSE

### 6. Giới hạn và ràng buộc

| Giới hạn                   | Giá trị                                                  |
| -------------------------- | -------------------------------------------------------- |
| OTP gửi lại tối đa         | **5 lần**, chờ **60 giây** giữa mỗi lần gửi              |
| OTP nhập sai tối đa        | **5 lần nhập sai liên tiếp** → khóa xác thực **15 phút** |
| Thời hạn trả hàng          | **7 ngày** sau Completed                                 |
| Giỏ hàng                   | Không giới hạn items, chỉ giới hạn bởi stock             |
| Rate limiting auth         | Max 5 request/phút/IP                                    |
| JWT Access Token           | 15 phút                                                  |
| JWT Refresh Token          | 7 ngày                                                   |
| Redis recommendation cache | TTL 1 giờ                                                |

### 7. Dịch vụ bên ngoài

| Dịch vụ                     | Mục đích                                                                                        |
| --------------------------- | ----------------------------------------------------------------------------------------------- |
| **VNPay**                   | Thanh toán + hoàn tiền (sandbox)                                                                |
| **Gmail SMTP (Nodemailer)** | Gửi email                                                                                       |
| **Google reCAPTCHA v3**     | Chống bot/spam (invisible). Ngưỡng score < **0.5** → yêu cầu xác minh bổ sung hoặc chặn request |
| **Cloudinary**              | Lưu trữ hình ảnh sản phẩm (free tier 25GB/tháng)                                                |
| **ML Service (FastAPI)**    | Recommendation inference (internal REST)                                                        |

### 8. Bổ sung khác

- **Ngôn ngữ UI**: Tiếng Việt mặc định, toggle Anh nếu kịp (Priority Low)
- **Đánh giá**: Chỉ khi đơn Completed (đã nhận hàng)
- **Sau verify email**: Tự động nâng quyền, không cần đăng nhập lại
  - **Cơ chế**: sau khi verify OTP thành công, backend phát hành lại cặp Access/Refresh Token mới (đã encode quyền "đã verify") và trả trực tiếp trong response của API verify — client tự động lưu token mới, không cần chờ access token cũ (15 phút) hết hạn.

### 9. Dữ liệu cho Hybrid Recommender System (BỔ SUNG)

| Mục                  | Nội dung                                                                                             |
| -------------------- | ---------------------------------------------------------------------------------------------------- |
| **Nguồn dữ liệu**    | Lịch sử xem sản phẩm, lịch sử mua hàng, đánh giá (rating + review text) của user đã verify           |
| **Loại hybrid**      | Kết hợp Collaborative Filtering + Content-based (cần chốt cụ thể thuật toán khi viết SRS phần Model) |
| **Cập nhật mô hình** | Batch retrain định kỳ (offline) — không realtime; kết quả inference cache vào Redis (TTL 1 giờ)      |
| **Cold-start**       | User mới/chưa có lịch sử → fallback sang gợi ý theo sản phẩm phổ biến (best-seller/trending)         |

---

## Open Questions (chưa chốt)

> [!WARNING]
> Các câu hỏi này sẽ được ghi vào SRS phần "Câu hỏi mở" để xử lý sau:

1. **Deploy platform**: Supabase vs Railway — chưa chốt, cần đánh giá chi phí và tính năng. --> Chốt railway
2. **Hoàn tiền bổ sung**: Ngoài VNPay refund, có cần thêm cơ chế credit/điểm thưởng không? --> Chỉ sử dụng VNPay Refund tự động và COD Refund thủ công
3. **Đa ngôn ngữ**: Toggle Anh/Việt có được triển khai hay bỏ qua do hạn chế thời gian? --> "Nice-to-have" (chỉ làm khi đã hoàn thiện 100% các tính năng khác).
4. **Phương án dự phòng khi trễ tiến độ**: Với phạm vi hiện tại (TMĐT đầy đủ + hybrid recommender + 4 dịch vụ ngoài + SSE + return flow) trong 16 tuần/1 người, cần xác định trước tính năng nào có thể cắt giảm/hoãn nếu tiến độ trễ (ví dụ: đa ngôn ngữ, SSE realtime, return flow) để không ảnh hưởng các phần lõi (Auth, Order, Recommender). -->
   Rủi ro,Mức độ,Phương án xử lý (Mitigation / Fallback)
   Trễ tiến độ do cấu hình SSE phức tạp,Trung bình,"Tạm hoãn SSE, sử dụng thao tác Refresh (F5) thủ công để cập nhật trạng thái đơn hàng."
   Quá tải công việc thiết kế Email,Thấp,Chỉ thiết kế và gửi Email OTP phục vụ Auth; bỏ qua Email thông báo hóa đơn/đánh giá.
   Thuật toán ML phức tạp ảnh hưởng thời gian code Backend,Cao,"Thu hẹp quy trình quản lý đơn hàng: loại bỏ luồng Trả hàng (Return flow), chỉ giữ lại chức năng Hủy đơn (Cancel) ở trạng thái Pending."

---

## SRS sẽ bao gồm những gì?

Dựa trên brainstorm + SRS hiện tại + template Vivutoday, SRS mới sẽ có:

1. ✅ Giới thiệu (Purpose, Scope, Objectives)
2. ✅ Kiến trúc hệ thống + Mermaid diagram
3. ✅ Yếu tố bên ngoài tác động
4. ✅ **Sơ đồ Use Case** (Guest, User, Admin) — Mermaid ← MỚI
5. ✅ **Sơ đồ luồng mức đỉnh** (DFD Level 0) — Mermaid ← MỚI
6. ✅ Yêu cầu chức năng (cập nhật: email, return, SSE, OTP verify, reCAPTCHA)
7. ✅ Database (cập nhật: thêm bảng email_logs, cập nhật order status ENUM)
8. ✅ Tích hợp: VNPay, ML Service, **Email** ← MỚI, **reCAPTCHA** ← MỚI, **Cloudinary** ← MỚI
9. ✅ Yêu cầu phi chức năng
10. ✅ Model Evaluation (giữ nguyên)
11. ✅ Unit Tests (cập nhật thêm test email, SSE, return flow)
12. ✅ Phụ lục (monorepo structure, lịch trình)
13. ✅ **Open Questions** ← MỚI

Dưới đây là bản phác thảo **Kế hoạch Phân rã Công việc (WBS - Work Breakdown Structure)** chi tiết cho 16 tuần. Lộ trình này được thiết kế theo phương pháp Agile/Scrum linh hoạt, ưu tiên hoàn thiện các core feature (tính năng lõi) trước và đặt ra các **Điểm kiểm soát (Checkpoints)** rõ ràng để bạn kích hoạt phương án dự phòng.

### Giai đoạn 1: Khởi tạo & Nền tảng (Tuần 1 - 2)

_Mục tiêu: Chốt kiến trúc, thiết kế cơ sở dữ liệu và dựng khung dự án cơ bản._

- **Tuần 1:**
- Hoàn thiện toàn bộ tài liệu SRS, chốt luồng nghiệp vụ.
- Thiết kế Database Schema (MySQL) và cấu trúc Cache (Redis).

- Khởi tạo Repository (Monorepo hoặc chia 3 repo riêng biệt cho Next.js, NestJS, FastAPI).

- **Tuần 2:**
- Setup các framework (Next.js 14, NestJS, FastAPI).

- Khởi tạo dự án trên Railway, thiết lập CI/CD cơ bản (push code tự động deploy) để đảm bảo môi trường live luôn sẵn sàng.

### Giai đoạn 2: Lõi Thương mại điện tử & Xác thực (Tuần 3 - 5)

_Mục tiêu: Người dùng có thể đăng ký, đăng nhập và xem/quản lý sản phẩm._

- **Tuần 3:**
- Xây dựng luồng Auth trên NestJS (JWT Access/Refresh token).

- Tích hợp Google reCAPTCHA v3.

- **Tuần 4:**
- Tích hợp Nodemailer & Gmail SMTP gửi mã OTP.

- Hoàn thiện luồng nâng quyền User tự động sau khi nhập đúng OTP.

- **Tuần 5:**
- Xây dựng API và UI Quản lý Sản phẩm, Danh mục (Admin).
- Tích hợp Cloudinary để upload/quản lý hình ảnh sản phẩm.

### Giai đoạn 3: Giỏ hàng, Đặt hàng & Thanh toán (Tuần 6 - 8)

_Mục tiêu: Khách hàng có thể mua hàng và thanh toán thành công._

- **Tuần 6:** Xây dựng logic Giỏ hàng (lưu Redis để truy xuất nhanh hoặc MySQL) và trang Checkout bước 1, 2.

- **Tuần 7:** Tích hợp cổng thanh toán VNPay Sandbox. Xử lý callback (IPN) để tự động cập nhật trạng thái đơn hàng (Pending → Confirmed).

- **Tuần 8:** Hoàn thiện luồng thanh toán COD (Admin xác nhận thủ công). Hoàn thiện lịch sử đơn hàng cho User.

---

### Giai đoạn 4: Trọng tâm Học thuật - Recommender System (Tuần 9 - 11)

_Mục tiêu: Đưa FastAPI vào hoạt động, huấn luyện và trả về kết quả gợi ý._

- **Tuần 9:** Tạo script sinh dữ liệu giả (Mock Data) về User, Product và Rating để có data train mô hình. Tiền xử lý dữ liệu trên FastAPI.

- **Tuần 10:** Huấn luyện mô hình Collaborative Filtering và Content-based. Viết API trả về danh sách gợi ý.

> 🚨 **CHECKPOINT 1 (Cuối Tuần 10): Đánh giá tiến độ AI**
>
> - _Tình trạng:_ Mô hình AI chạy ổn định, API trả kết quả dưới 1s? -> **Tiếp tục theo kế hoạch chuẩn.**
> - _Tình trạng:_ Kẹt bug, kết quả dự đoán sai lệch nhiều, tốn quá nhiều thời gian debug? -> **Kéo cần gạt Dự phòng Cấp 1:** Tạm dừng làm Realtime SSE và cắt bỏ toàn bộ các Template Email phụ (chỉ giữ lại Email OTP). Dồn toàn lực fix AI.

- **Tuần 11:** Hoàn thiện Hybrid Recommender, lưu cache kết quả vào Redis (TTL 1 giờ). Tích hợp API này vào màn hình Home/Product Detail của Next.js.

---

### Giai đoạn 5: Tính năng Nâng cao & Hoàn thiện luồng (Tuần 12 - 14)

_Mục tiêu: Lắp ghép các mảnh vỡ cuối cùng và tinh chỉnh UI/UX._

- **Tuần 12:** Tính năng Đánh giá sản phẩm (chỉ mở khi đơn Completed). Xây dựng Admin Dashboard thống kê doanh thu.

- **Tuần 13:**

  > 🚨 **CHECKPOINT 2 (Đầu Tuần 13): Đánh giá luồng cốt lõi**
  >
  > - _Tình trạng:_ Checkout mượt mà, AI gợi ý tốt? -> **Phát triển luồng Trả hàng (Return flow)** và **Realtime SSE**.
  > - _Tình trạng:_ Luồng đặt hàng VNPay/COD còn lỗi, báo cáo chưa xong? -> **Kéo cần gạt Dự phòng Cấp 2:** Hủy bỏ hoàn toàn luồng Trả hàng (chỉ cho phép Cancel lúc Pending). Frontend tự động dùng hàm `setInterval` gọi lại API check trạng thái đơn hàng thay vì dùng SSE.

- **Tuần 14:** Xử lý các task còn lại từ quyết định của Checkpoint 2. Ghép nối hoàn chỉnh Frontend và Backend.

### Giai đoạn 6: Kiểm thử, Đánh giá & Viết Báo cáo (Tuần 15 - 16)

_Mục tiêu: Đóng gói dự án, chứng minh tính hiệu quả của mô hình._

- **Tuần 15:**
- Chạy các script kiểm thử tự động (Unit Tests).

- Trích xuất các chỉ số đánh giá mô hình ML (Model Evaluation: Precision, Recall, RMSE) để đưa vào báo cáo.

- **Tuần 16:**
- Kiểm tra toàn diện trên môi trường production (Railway).

- Hoàn thiện báo cáo Đồ án Tốt nghiệp (Word/PDF).
- Chuẩn bị slide thuyết trình và kịch bản Demo hệ thống trước Hội đồng.
