# Sprint 5 Backlog: Hệ thống Gợi ý (Recommendation) & Background Jobs

Danh sách các User Stories được rút ra từ `user-stories.md` và đưa vào Sprint 5, tập trung hoàn toàn vào tích hợp Trí tuệ Nhân tạo (Machine Learning) và các tác vụ chạy ngầm.

## 1. Epic REC (Gợi ý Sản phẩm)
- **US-REC-01**: Khách hàng nhận gợi ý sản phẩm phù hợp trên trang chủ và trang chi tiết (Popular, Content-Based, Hybrid).
- **US-REC-02**: Hệ thống duy trì Cache và Fallback sang Popular khi dịch vụ ML chậm hoặc gặp sự cố.
- **TS-ML-01**: Kỹ sư dữ liệu đánh giá chất lượng mô hình (Offline testing) trước khi triển khai.

## 2. Technical Stories (Cronjobs)
- **TS-CRON-01**: Hệ thống chạy ngầm Cronjob tự động dọn dẹp các tài khoản Guest rác sau 7 ngày và giỏ hàng tạm sau 24 giờ.
