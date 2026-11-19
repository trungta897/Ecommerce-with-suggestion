# Brainstorm Summary — Trước khi viết SRS

## Thông tin đã làm rõ qua phỏng vấn 7 nhóm

### 1. Tổng quan
- **Dự án**: Website TMĐT Đồ Điện Tử + Hybrid Recommender System
- **Stack**: Next.js 14 + NestJS + FastAPI + MySQL + Redis
- **Quy mô**: 1 người, 16 tuần, Đồ án Tốt nghiệp

### 2. Người dùng và quyền (CẬP NHẬT)

| Vai trò | Quyền |
|---|---|
| **Guest** | Xem sản phẩm, tìm kiếm, xem đánh giá, đăng ký, đăng nhập |
| **User (chưa verify)** | Như Guest + đăng xuất, xem profile. **KHÔNG mua hàng được** |
| **User (đã verify)** | Mua hàng, giỏ hàng, đánh giá (chỉ sản phẩm đã mua & completed), nhận gợi ý, trả hàng |
| **Admin** | Quản lý sản phẩm, đơn hàng, đánh giá, dashboard thống kê |
| **Super Admin** | Như Admin + tạo tài khoản Admin mới |

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
User yêu cầu trả hàng (trong 7 ngày sau Completed) → Admin duyệt → Returned → Hoàn tiền qua VNPay API → Refunded
```

### 4. Tích hợp Email (MỚI)

| Loại email | Khi nào gửi | Nội dung |
|---|---|---|
| **OTP xác thực email** | Sau đăng ký | Mã OTP 6 số, hết hạn 15 phút |
| **Xác nhận đơn hàng** | Sau đặt hàng thành công | Mã đơn, sản phẩm, tổng tiền |
| **Đơn hàng hoàn thành** | Khi đơn chuyển sang Completed | Thông tin đơn hàng, link đánh giá |
| **Reset password** | Khi user yêu cầu | Link/OTP reset |

- **Dịch vụ**: Nodemailer + Gmail SMTP
- **Template**: Text đơn giản cho demo

### 5. Realtime Tracking (MỚI)
- **Công nghệ**: Server-Sent Events (SSE)
- **Mục đích**: Push cập nhật trạng thái đơn hàng realtime (giống Shopee)
- Không gửi email cho mỗi lần đổi trạng thái — chỉ push SSE

### 6. Giới hạn và ràng buộc

| Giới hạn | Giá trị |
|---|---|
| OTP gửi lại tối đa | **5 lần**, chờ **60 giây** giữa mỗi lần |
| Khóa OTP sau thất bại | **15 phút** |
| Thời hạn trả hàng | **7 ngày** sau Completed |
| Giỏ hàng | Không giới hạn items, chỉ giới hạn bởi stock |
| Rate limiting auth | Max 5 request/phút/IP |
| JWT Access Token | 15 phút |
| JWT Refresh Token | 7 ngày |
| Redis recommendation cache | TTL 1 giờ |

### 7. Dịch vụ bên ngoài

| Dịch vụ | Mục đích |
|---|---|
| **VNPay** | Thanh toán + hoàn tiền (sandbox) |
| **Gmail SMTP (Nodemailer)** | Gửi email |
| **Google reCAPTCHA v3** | Chống bot/spam (invisible) |
| **Cloudinary** | Lưu trữ hình ảnh sản phẩm (free tier 25GB/tháng) |
| **ML Service (FastAPI)** | Recommendation inference (internal REST) |

### 8. Bổ sung khác

- **Ngôn ngữ UI**: Tiếng Việt mặc định, toggle Anh nếu kịp (Priority Low)
- **Đánh giá**: Chỉ khi đơn Completed (đã nhận hàng)
- **Sau verify email**: Tự động nâng quyền, không cần đăng nhập lại

---

## Open Questions (chưa chốt)

> [!WARNING]
> Các câu hỏi này sẽ được ghi vào SRS phần "Câu hỏi mở" để xử lý sau:

1. **Deploy platform**: Supabase vs Railway — chưa chốt, cần đánh giá chi phí và tính năng.
2. **Hoàn tiền bổ sung**: Ngoài VNPay refund, có cần thêm cơ chế credit/điểm thưởng không?
3. **Đa ngôn ngữ**: Toggle Anh/Việt có được triển khai hay bỏ qua do hạn chế thời gian?

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
