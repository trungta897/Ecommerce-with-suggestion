# UI/UX Style Guideline

Tài liệu này định hình phong cách thiết kế, trải nghiệm người dùng (UX) và giao diện (UI) cho Frontend của dự án. Mục tiêu là tạo ra một sản phẩm Web có tính thẩm mỹ cao ("Premium Design"), hiện đại, mang lại cảm giác mượt mà và tương tác tốt cho người dùng.

## 1. Thiết kế Thẩm mỹ & Hiện đại (Aesthetics)

Dự án yêu cầu giao diện không được "sơ sài" hay mang cảm giác "MVP cơ bản". Bắt buộc phải áp dụng các tiêu chuẩn thiết kế web hiện đại nhất:
- **Prioritize Visual Excellence**: Giao diện cần thu hút ngay từ ánh nhìn đầu tiên ("WOW the user"). Không sử dụng các màu sắc nguyên bản (như đỏ thuần `red`, xanh dương thuần `blue`). Hãy dùng các bảng màu được phối tỉ mỉ (ví dụ: HSL tailored colors).
- **Dark Mode / Glassmorphism**: Ưu tiên hỗ trợ Dark Mode tinh tế hoặc sử dụng các hiệu ứng Glassmorphism (làm mờ kính, độ trong suốt) để tăng độ sang trọng.
- **Micro-animations**: Áp dụng các hình thức vi tương tác (micro-animations) khi người dùng hover vào button, card, hoặc khi chuyển trang để tạo cảm giác trang web "sống động" và phản hồi nhanh.

## 2. Typography (Kiểu chữ)

- Không sử dụng font mặc định của trình duyệt. Bắt buộc sử dụng các font chữ hiện đại từ Google Fonts (như **Inter**, **Roboto**, hoặc **Outfit**).
- Phân cấp hệ thống chữ rõ ràng: `h1` (Tiêu đề chính lớn), `h2`, `h3`, `body`, `caption`.
- Đảm bảo độ tương phản (contrast) của chữ so với nền luôn đạt chuẩn trợ năng (Accessibility).

## 3. Quản lý Đa ngôn ngữ (i18n) trên Giao diện

- Tuyệt đối **KHÔNG HARDCODE** (viết cứng) bất kỳ text nào (kể cả Tiếng Việt) trên các thành phần UI như Header, Footer, Buttons, Tooltips, Modals.
- **Bắt buộc** gọi text qua thư viện i18n (ví dụ sử dụng `next-intl`).
- Giao diện phải tính toán trước không gian hiển thị (padding, margin, flex) để chữ không bị tràn hoặc vỡ layout khi nội dung văn bản dài hơn do thay đổi ngôn ngữ.

## 4. Component Driven Design & Tailwind CSS

- **Sử dụng Tailwind CSS**: Khai thác tối đa utility classes của Tailwind để xây dựng giao diện. Tránh viết CSS thuần vào file rời ngoại trừ cấu hình global tại `index.css`.
- **Hệ thống Base Component**:
  - Mọi Button, Input, Modal, Table đều phải được xây dựng thành các **Base Component** tái sử dụng trong `src/components/base/`.
  - Không viết đi viết lại cùng một cụm Tailwind class cho một button ở nhiều trang khác nhau.
- **Hiệu ứng & Chuyển động (Transitions)**:
  - Bổ sung `transition-all duration-300 ease-in-out` (hoặc tương tự) vào các thẻ tương tác để có hiệu ứng hover mượt mà.
  - Sử dụng Framer Motion hoặc thư viện tương đương nếu cần xây dựng hoạt ảnh phức tạp (ví dụ luồng Checkout 5 bước cần mượt mà).

## 5. Trải nghiệm UX (User Experience)

- **Trạng thái Loading (Loading States)**: Bất kỳ API request nào cũng phải có Skeleton loading hoặc Spinner tinh tế, không để màn hình bị đơ hoặc trống.
- **Trạng thái Trống & Lỗi (Empty & Error States)**: Thiết kế sẵn các illustration (hình minh họa) và text phù hợp (qua i18n) cho màn hình Giỏ hàng trống, Không tìm thấy sản phẩm, Lỗi kết nối.
- **Responsive (Tương thích thiết bị)**: Giao diện phải hoạt động hoàn hảo trên mọi kích thước màn hình (Mobile, Tablet, Desktop). Sử dụng hệ thống Grid và Flexbox linh hoạt, nguyên tắc "Mobile First".
- **Thông báo phản hồi (Feedback/Toasts)**: Mỗi hành động thành công (thêm vào giỏ) hay thất bại (nhập sai OTP) đều phải có Toast Notification hoặc Alert rõ ràng, hiện đại ở góc màn hình.

## 6. SEO Best Practices

Để ứng dụng dễ dàng tối ưu hóa công cụ tìm kiếm:
- Đảm bảo mỗi page chỉ có duy nhất một thẻ `<h1>`.
- Sử dụng các Semantic HTML (thẻ HTML5 mang ngữ nghĩa như `<article>`, `<section>`, `<nav>`, `<aside>`).
- Hỗ trợ Dynamic Metadata (Title, Description) cho Next.js ở mỗi route tương ứng.
