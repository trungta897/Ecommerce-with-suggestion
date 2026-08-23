# Entity-Relationship Diagram (ERD)

Sơ đồ ERD thể hiện cấu trúc cơ sở dữ liệu của hệ thống, bao gồm các bảng chính và mối quan hệ giữa chúng, được thiết kế cho hệ thống Thương mại điện tử, Chương trình khuyến mãi (Vouchers & Flash Sales) và lưu trữ dữ liệu để phục vụ cho hệ thống Gợi ý (Recommender System).

```mermaid
erDiagram
    users {
        string id PK
        varchar email "Unique, Not Null"
        varchar password_hash
        varchar full_name
        varchar phone "Unique, Nullable"
        enum role "customer, employee, admin, super_admin"
        boolean is_active "Default TRUE"
        boolean is_verified "Default FALSE"
        int vip_points "Default 0"
        int vip_points_debt "Default 0"
        timestamp created_at
        timestamp updated_at
    }

    categories {
        string id PK
        varchar name
        varchar slug "Unique"
        text description
        varchar image_url
        string parent_id FK
        boolean is_active "Default TRUE"
    }

    products {
        string id PK
        string category_id FK
        varchar name
        varchar slug "Unique"
        varchar brand
        text description
        json specifications
        json tags
        decimal price
        decimal discount_price
        int stock "Default 0"
        json images
        int view_count "Default 0"
        int sold_count "Default 0"
        float avg_rating "Default 0"
        int review_count "Default 0"
        boolean is_active "Default TRUE"
    }

    product_discounts {
        string id PK
        string product_id FK
        decimal discount_percent "0-100"
        decimal discounted_price "Snapshot sale price"
        decimal original_price "Display snapshot price"
        timestamp start_date
        timestamp end_date
        int flash_sale_qty "Nullable: Giới hạn suất sale"
        int flash_sale_sold "Default 0 (Atomic Claim)"
        boolean is_active "Default TRUE"
    }

    vouchers {
        string id PK
        varchar code "Unique"
        enum type "percentage, fixed_amount, free_shipping"
        enum scope "cart, category, product"
        string category_id FK "Nullable"
        string product_id FK "Nullable"
        decimal value
        decimal min_order_value
        decimal max_discount "Nullable"
        int usage_limit "Nullable"
        int per_user_limit "Nullable"
        int used_count "Default 0"
        timestamp start_date
        timestamp end_date
        boolean is_active "Default TRUE"
    }

    user_voucher_usage {
        string id PK
        string user_id FK
        string voucher_id FK
        string order_id FK
        timestamp used_at
    }

    cart_items {
        string id PK
        string user_id FK
        string product_id FK
        int quantity
    }

    orders {
        string id PK
        string user_id FK "Nullable for Guest"
        string voucher_id FK "Nullable"
        enum status "pending_payment, pending, confirmed, handed_over, delivering, completed, return_requested, return_rejected, returned, cancelled, refunded"
        decimal subtotal
        decimal discount_amount
        decimal shipping_fee
        decimal total_amount
        varchar shipping_name
        varchar shipping_phone
        varchar shipping_address
        enum payment_method "vnpay, cod, stripe"
        enum payment_status "pending, partially_paid, completed, failed, refunded"
        timestamp payment_expires_at
        int earned_vip_points
        int used_vip_points
        decimal vip_discount_amount
    }

    order_items {
        string id PK
        string order_id FK
        string product_id FK
        string product_discount_id FK "Nullable"
        int quantity
        decimal unit_price
        decimal original_price "Audit trail"
        decimal subtotal
    }

    reviews {
        string id PK
        string user_id FK
        string product_id FK
        string order_id FK
        int rating "1-5"
        varchar title
        text content
        boolean is_verified_purchase
        enum status "visible, hidden"
    }

    wishlists {
        string id PK
        string user_id FK
        string product_id FK
        timestamp created_at
    }

    user_activity_logs {
        string id PK
        string user_id FK "Nullable"
        string session_id "Nullable"
        string product_id FK
        enum action "view, click, search, add_to_cart, remove_from_cart, wishlist_add, purchase"
        timestamp created_at
    }

    users ||--o{ orders : "places"
    users ||--o{ reviews : "writes"
    users ||--o{ cart_items : "has"
    users ||--o{ wishlists : "saves"
    users ||--o{ user_voucher_usage : "claims"
    categories ||--|{ products : "contains"
    categories ||--o{ categories : "sub-category"
    categories ||--o{ vouchers : "scoped in"
    products ||--o{ product_discounts : "has flash sales"
    products ||--o{ vouchers : "scoped in"
    products ||--o{ order_items : "included in"
    products ||--o{ cart_items : "added to"
    products ||--o{ reviews : "receives"
    products ||--o{ wishlists : "bookmarked in"
    orders ||--|{ order_items : "contains"
    orders ||--o{ reviews : "has"
    orders ||--o{ user_voucher_usage : "applied with"
    vouchers ||--o{ orders : "used on"
    vouchers ||--o{ user_voucher_usage : "tracked in"
    product_discounts ||--o{ order_items : "applied in"
```
