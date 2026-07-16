# Entity-Relationship Diagram (ERD)

Sơ đồ ERD thể hiện cấu trúc cơ sở dữ liệu của hệ thống, bao gồm các bảng chính và mối quan hệ giữa chúng, được thiết kế cho hệ thống Thương mại điện tử và lưu trữ dữ liệu để phục vụ cho hệ thống Gợi ý (Recommender System).

```mermaid
erDiagram
    users {
        int id PK
        varchar email "Unique, Not Null"
        varchar password "Hash"
        enum role "user, admin, super_admin"
        boolean is_verified "Default FALSE"
        timestamp created_at
        timestamp updated_at
    }

    categories {
        int id PK
        varchar name_vi
        text description_vi
        varchar slug "Unique"
    }

    products {
        int id PK
        varchar title_vi
        text description_vi
        decimal price
        int stock
        varchar image_url
        int category_id FK
        boolean is_active "Default TRUE"
    }

    cart_items {
        int id PK
        int user_id FK
        int product_id FK
        int quantity
    }

    orders {
        int id PK
        int user_id FK
        decimal total_amount
        varchar shipping_name
        varchar shipping_phone
        varchar shipping_address
        enum status "pending, confirmed, shipping, completed, return_requested, returned, refunded, cancelled"
        enum payment_method "vnpay, cod"
        enum payment_status "pending, completed, failed, refunded"
        varchar vnp_txn_ref
        varchar vnp_transaction_no
        varchar vnp_pay_date
    }

    order_items {
        int id PK
        int order_id FK
        int product_id FK
        int quantity
        decimal unit_price
    }

    reviews {
        int id PK
        int user_id FK
        int product_id FK
        int order_id FK
        tinyint rating "1-5"
        text comment
        enum status "visible, hidden"
    }

    email_logs {
        int id PK
        varchar email
        enum type "otp, order_confirm, order_complete, reset_pass"
        enum status "success, failed"
        timestamp sent_at
    }

    users ||--o{ orders : "places"
    users ||--o{ reviews : "writes"
    users ||--o{ cart_items : "has"
    categories ||--|{ products : "contains"
    products ||--o{ order_items : "included in"
    products ||--o{ cart_items : "added to"
    products ||--o{ reviews : "receives"
    orders ||--|{ order_items : "contains"
    orders ||--o{ reviews : "has"
```
