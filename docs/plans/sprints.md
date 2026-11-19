# Lộ trình Phát triển (Sprints)

Dựa trên danh sách **User Stories** và tiến độ dự án, khối lượng công việc được chia thành 5 Sprints.

## Sprint 1: Nền tảng Khám phá & Quản lý Danh mục (Thay thế Mock Data)

**Mục tiêu:** Xây dựng module Sản phẩm/Danh mục ở Backend, kết nối Frontend với API thật (bỏ mock data), và chốt nốt tính năng Profile của Auth.

- **US-AUTH-06**: Quản lý Profile khách hàng (Tên, Ảnh, Địa chỉ mặc định).
- **US-ADM-02**: Admin quản lý Danh mục (Thêm, Sửa, Xóa mềm).
- **US-ADM-03**: Admin quản lý Sản phẩm (Upload ảnh Cloudinary, nhập kho, v.v.).
- **US-CAT-01**: Tìm kiếm và lọc sản phẩm (Frontend gọi API thật).
- **US-CAT-02**: Xem chi tiết sản phẩm (Mô tả, Gallery).

## Sprint 2: Luồng Đặt hàng, Giỏ hàng & Thanh toán cốt lõi

**Mục tiêu:** Khách hàng có thể bỏ sản phẩm vào giỏ, đặt hàng, xử lý tồn kho đồng thời (Concurrency) và thanh toán (COD/VNPay).

- **US-CART-01, US-CART-02**: Thêm/Cập nhật Giỏ hàng (Gộp giỏ hàng Local và Online).
- **US-CHK-01, US-CHK-02**: Guest Checkout & Khôi phục luồng đặt hàng sau khi verify email.
- **US-CHK-07**: Bảo toàn tồn kho khi checkout (Xử lý Concurrency).
- **US-CHK-04**: Đặt hàng COD & Tích hợp luồng Webhook vận chuyển.
- **US-CHK-05, US-CHK-06**: Tích hợp thanh toán VNPay qua IPN (Timeout 30 phút) và Thanh toán lại.

## Sprint 3: Vận hành Đơn hàng & Quản trị Nhân sự

**Mục tiêu:** Admin/Nhân viên có thể xử lý vòng đời của đơn hàng, Khách hàng theo dõi được trạng thái đơn.

- **US-ORD-01, US-ORD-04**: Xem lịch sử, trạng thái đơn (SSE Realtime) và Tra cứu đơn (Guest).
- **US-ORD-02**: Khách hàng hủy đơn (khi đang Pending).
- **US-ADM-04, US-ADM-05**: Admin/Nhân viên duyệt đơn và Ghi nhận giao hàng thủ công (Fallback).
- **US-ADM-08**: Quản lý tài khoản Admin và Nhân viên (Phân quyền).
- **TS-CRON-01**: Tác vụ nền dọn dẹp hệ thống (Xóa Guest quá hạn, nhả tồn kho).

## Sprint 4: Hậu mãi, Khuyến mãi & Dashboard

**Mục tiêu:** Xử lý luồng sau bán hàng (Đổi trả, Đánh giá), áp dụng Voucher và hoàn thiện Dashboard.

- **US-ADM-09, US-CHK-03**: Tạo mã Voucher nội bộ & Áp dụng Voucher khi đặt hàng.
- **US-ORD-05, US-ADM-07**: Khách hàng Đánh giá sản phẩm & Admin/Nhân viên Kiểm duyệt ẩn đánh giá.
- **US-ORD-03, US-ADM-06, US-ADM-06b**: Luồng Đổi trả hàng: Khách yêu cầu -> Nhân viên duyệt -> Admin hoàn tiền qua VNPay.
- **US-ADM-01**: Admin Dashboard (Thống kê doanh thu, đơn hàng).

## Sprint 5: Hệ thống Gợi ý (Hybrid Recommender)

**Mục tiêu:** Xây dựng riêng ML Service (FastAPI), huấn luyện mô hình và tích hợp gọi API Gợi ý lên nền tảng chính.

- **TS-ML-01**: Offline Testing các mô hình (Popular, Content-Based, SVD/CF) trên dataset Amazon.
- **US-REC-01**: Tích hợp thuật toán vào Frontend (Theo từng mức độ dữ liệu người dùng).
- **US-REC-02**: Áp dụng Cache (Redis) và Cơ chế Fallback dự phòng khi ML service gặp sự cố.
