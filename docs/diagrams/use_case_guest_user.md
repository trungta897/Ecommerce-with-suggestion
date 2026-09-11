# Use Case - Khách vãng lai (Guest) & Khách hàng (Customer)

Sơ đồ Use Case thể hiện các chức năng mà Guest (Khách vãng lai) và Customer (Khách hàng đã đăng nhập bằng SĐT) có thể thực hiện trên hệ thống TMĐT.

```mermaid
flowchart TD
    Guest(("Khách vãng lai (Guest)"))
    Customer(("Khách hàng (Customer)"))

    Guest -. "Đăng nhập SĐT / OTP" .-> Customer

    UC1(["Đăng nhập / Đăng ký qua SĐT (OTP)"])
    UC2(["Duyệt, Tìm kiếm & Lọc sản phẩm"])
    UC3(["Xem chi tiết & Đánh giá sản phẩm"])
    UC4(["Quản lý Giỏ hàng (Local / Online Cart)"])
    UC5(["Đặt hàng & Guest Checkout"])
    UC6(["Thanh toán đơn hàng (COD / VNPay Sandbox)"])
    UC7(["Tra cứu đơn hàng ẩn danh (SĐT + Mã đơn)"])
    UC8(["Theo dõi trạng thái đơn hàng Realtime (SSE)"])
    UC9(["Quản lý Hồ sơ cá nhân (Profile)"])
    UC10(["Danh sách sản phẩm Yêu thích (Wishlist)"])
    UC11(["Áp dụng Mã giảm giá (Voucher Wallet)"])
    UC12(["Đánh giá sản phẩm (Đơn Completed)"])
    UC13(["Yêu cầu Trả hàng & Theo dõi"])
    UC14(["Nhận gợi ý cá nhân hóa (Hybrid RecSys)"])

    Guest --> UC1
    Guest --> UC2
    Guest --> UC3
    Guest --> UC4
    Guest --> UC5
    Guest --> UC6
    Guest --> UC7
    Guest --> UC8

    Customer --> UC2
    Customer --> UC3
    Customer --> UC4
    Customer --> UC5
    Customer --> UC6
    Customer --> UC8
    Customer --> UC9
    Customer --> UC10
    Customer --> UC11
    Customer --> UC12
    Customer --> UC13
    Customer --> UC14
```
