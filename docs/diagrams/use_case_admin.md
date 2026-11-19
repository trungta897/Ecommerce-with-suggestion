# Use Case - Quản trị Hệ thống (Admin, Employee & Super Admin)

Sơ đồ Use Case thể hiện phân quyền các chức năng quản trị hệ thống dành cho Nhân viên (Employee), Quản trị viên (Admin) và Quản trị cấp cao (Super Admin).

```mermaid
flowchart TD
    Employee(("Nhân viên (Employee)"))
    Admin(("Admin"))
    SAdmin(("Super Admin"))

    Employee -.-> Admin
    Admin -.-> SAdmin

    UC1(["Dashboard thống kê & AI Insights"])
    UC2(["Quản lý Sản phẩm & Danh mục"])
    UC3(["Quản lý Đơn hàng & Ghi nhận vận chuyển"])
    UC4(["Xử lý Yêu cầu Trả hàng"])
    UC5(["Kiểm duyệt Đánh giá sản phẩm"])
    UC6(["Quản lý Khuyến mãi & Flash Sale"])
    UC7(["Quản lý Mã giảm giá (Vouchers)"])
    UC8(["Quản lý Người dùng & Mời Nhân viên"])
    UC9(["Phân quyền & Quản lý Tài khoản Admin"])

    Employee --> UC3
    Employee --> UC4
    Employee --> UC5

    Admin --> UC1
    Admin --> UC2
    Admin --> UC3
    Admin --> UC4
    Admin --> UC5
    Admin --> UC6
    Admin --> UC7
    Admin --> UC8

    SAdmin --> UC9
```
