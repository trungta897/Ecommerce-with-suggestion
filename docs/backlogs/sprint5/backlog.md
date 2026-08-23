# Sprint 5 Backlog: Hệ thống Gợi ý (Recommendation) & Background Jobs

Danh sách các User Stories được rút ra từ `user-stories.md` và đưa vào Sprint 5, tập trung hoàn toàn vào tích hợp Trí tuệ Nhân tạo (Machine Learning) và các tác vụ chạy ngầm.

## 1. Epic REC (Gợi ý Sản phẩm)
- **US-REC-01**: Khách hàng nhận gợi ý sản phẩm phù hợp trên trang chủ và trang chi tiết (Popular, Content-Based, Hybrid).
- **US-REC-02**: Hệ thống duy trì Cache và Fallback sang Popular khi dịch vụ ML chậm hoặc gặp sự cố.
- **TS-ML-01**: Kỹ sư dữ liệu đánh giá chất lượng mô hình (Offline testing) trước khi triển khai.

## 2. Epic FLASH SALE (Giảm giá theo thời gian)
- **US-SALE-01**: Admin thiết lập chương trình Flash Sale cho sản phẩm (thời gian, % giảm, số lượng suất sale `flashSaleQty`).
- **US-SALE-02**: Khách hàng xem danh sách Flash Sale với đồng hồ đếm ngược (Countdown timer) và giá giảm gạch ngang.
- **US-SALE-03**: Hệ thống xử lý Atomic Claim suất sale chống oversell và tự động nhả suất khi đơn quá hạn thanh toán 30 phút.

## 3. Technical Stories (Cronjobs)
- **TS-CRON-01**: Hệ thống chạy ngầm Cronjob tự động dọn dẹp các tài khoản Guest rác sau 7 ngày, giỏ hàng tạm sau 24 giờ và tự động nhả lại tồn kho + suất Flash Sale của các đơn hàng quá hạn thanh toán 30 phút.
