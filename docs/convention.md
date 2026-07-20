# Coding Conventions & Best Practices

Tài liệu này định nghĩa các quy tắc viết code (Coding Conventions) chuẩn mực cho toàn bộ dự án, áp dụng cho cả Frontend (Next.js) và Backend (NestJS). Tuân thủ nghiêm ngặt các quy tắc này để đảm bảo chất lượng mã nguồn, khả năng bảo trì và làm việc nhóm hiệu quả.

## 1. Quy tắc đặt tên (Naming Conventions)

- **Thư mục & File (Folder & File names)**: Sử dụng `kebab-case` cho tất cả các file và thư mục (VD: `user-profile.tsx`, `auth.controller.ts`). Ngoại trừ một số file cấu hình chuẩn như `Dockerfile`, `README.md`.
- **Class, Interface, Type**: Sử dụng `PascalCase` (VD: `UserController`, `UserDto`, `UserProfile`).
- **Biến, Hàm, Phương thức**: Sử dụng `camelCase` (VD: `getUserProfile`, `isLoggedIn`, `totalAmount`).
- **Hằng số (Constants)**: Sử dụng `UPPER_SNAKE_CASE` (VD: `MAX_UPLOAD_SIZE`, `DEFAULT_PAGE_SIZE`). Không sử dụng *magic numbers* hoặc *magic strings* trực tiếp trong code, thay vào đó hãy khai báo hằng số.

## 2. Quản lý Đa ngôn ngữ (i18n) - **BẮT BUỘC**

Để tránh tình trạng "hardcode text" (viết cứng văn bản) trong source code và dễ dàng mở rộng đa ngôn ngữ sau này, dự án bắt buộc áp dụng i18n cho toàn bộ text giao diện và message thông báo:

### 2.1. Đối với Frontend (Next.js)
- **Thư viện đề xuất**: `next-intl` hoặc `react-i18next`.
- **Quy tắc**: Mọi text hiển thị cho người dùng (Label, Placeholder, Button text, Error message validation, v.v.) đều phải sử dụng hàm dịch của i18n.
- **Ví dụ**: Không viết `<button>Đăng nhập</button>`, mà phải viết `<button>{t('auth.login')}</button>`.
- **Quy tắc chia nhỏ (Modularization)**: BẮT BUỘC phải chia nhỏ các file từ điển (JSON) thành nhiều module độc lập theo tính năng (ví dụ: `common.json`, `auth.json`, `product.json`). Tuyệt đối không nhồi nhét tất cả vào một file duy nhất để đảm bảo dễ bảo trì. Các file này đặt trong `src/messages/`.
- **Đồng bộ hóa & Định dạng (Sync & Lowercase)**: Tất cả các namespace (khóa module) phải được viết bằng chữ thường (lowercase). Khi tạo một file JSON mới trong `src/messages/`, BẮT BUỘC phải đăng ký file đó vào cấu hình của `next-intl` (thường nằm tại `src/i18n/request.ts`) với khóa (key) in thường tương ứng TRƯỚC KHI sử dụng nó ở Component để tránh lỗi runtime.

### 2.2. Đối với Backend (NestJS)
- **Thư viện đề xuất**: `nestjs-i18n`.
- **Quy tắc**: Mọi thông báo lỗi (Exceptions), tin nhắn trả về (Response messages), nội dung email gửi đi đều phải được khai báo qua hệ thống i18n, tuyệt đối không hardcode text tiếng Việt hoặc tiếng Anh trực tiếp trong code logic.
- **Quy tắc chia nhỏ (Modularization)**: Tương tự như Frontend, bắt buộc chia nhỏ file từ điển theo module tính năng (ví dụ: `auth.json`, `order.json`) và đặt tại `src/common/i18n/`.
## 3. Kiến trúc RESTful API (API Design Architecture)

Để đảm bảo frontend và backend giao tiếp chuẩn mực, toàn bộ API phải tuân thủ nghiêm ngặt các quy chuẩn thiết kế RESTful sau:

- **Đường dẫn (Route Naming)**: Bắt buộc dùng danh từ số nhiều, chữ thường (kebab-case), có version prefix. Ví dụ: `GET /api/v1/users`, `POST /api/v1/orders`. Tuyệt đối không dùng động từ trong URL (Không dùng `/api/v1/createUser`).
- **HTTP Methods**: Sử dụng chuẩn phương thức để diễn đạt hành động:
  - `GET`: Lấy dữ liệu (Không chứa body).
  - `POST`: Tạo mới dữ liệu.
  - `PUT`/`PATCH`: Cập nhật dữ liệu (PUT ghi đè toàn bộ, PATCH cập nhật một phần).
  - `DELETE`: Xóa dữ liệu.
- **Cấu trúc JSON Trả về (Standardized Response Wrapper)**: Mọi API trả về thành công đều phải gói gọn trong một format chung:
  ```json
  {
    "statusCode": 200,
    "message": "User fetched successfully",
    "data": { ... }
  }
  ```
- **Xử lý mã lỗi (HTTP Status Codes)**: 
  - `200 OK` (Thành công), `201 Created` (Tạo mới thành công).
  - `400 Bad Request` (Dữ liệu gửi lên sai - Validation lỗi).
  - `401 Unauthorized` (Chưa đăng nhập / Token hết hạn).
  - `403 Forbidden` (Không có quyền truy cập).
  - `404 Not Found` (Không tìm thấy dữ liệu).

## 4. Quy tắc Backend (NestJS)

- **Kiến trúc**: Tuân thủ triệt để cấu trúc thư mục được định nghĩa, phân tách logic theo tầng (Controller -> Service -> Repository/Prisma).
- **Validation**: Sử dụng `class-validator` và `class-transformer` tại các file DTO.
- **Error Handling**: Bắt lỗi tập trung (Global Exception Filter) trong `src/common/filters/`. Sử dụng các Custom Business Exceptions đã được định nghĩa.
- **No `any`**: Hạn chế tối đa việc sử dụng kiểu `any`. Phải định nghĩa Type/Interface rõ ràng hoặc DTO cho request/response.
- **Hiệu năng Database (Eager Loading)**: Bắt buộc áp dụng Eager Loading (thông qua `include` của Prisma) khi thực hiện truy vấn các thực thể có quan hệ với nhau để tránh lỗi N+1 Query. Phải chỉ định rõ ràng các quan hệ cần thiết tại từng hàm truy vấn, tránh lạm dụng Eager Loading dư thừa (ví dụ: query quá sâu hoặc dữ liệu không dùng tới).
- **Bảo mật (SQL Injection)**: Ưu tiên sử dụng các hàm Query mặc định của Prisma. Trong trường hợp đặc biệt phải sử dụng `$queryRaw` (Raw SQL), **tuyệt đối không được nối chuỗi (string concatenation)** các giá trị người dùng nhập vào câu SQL. Bắt buộc phải sử dụng tham số hóa (Parameterized Queries) để phòng chống SQL Injection.
- **Bất đồng bộ & Decoupling (Pub/Sub)**: Đối với các tác vụ phụ chạy ngầm sau một hành động chính (như gửi email sau khi đặt hàng, bắn thông báo, cập nhật thống kê), bắt buộc sử dụng kiến trúc Pub/Sub (sử dụng `@nestjs/event-emitter` hoặc message broker). Tuyệt đối không gọi trực tiếp nhiều service chồng chéo lên nhau trong cùng một luồng để đảm bảo API phản hồi nhanh (performance) và các module không bị dính chặt vào nhau (loose coupling).
## 5. Quy tắc Frontend (Next.js)

- **Component**: Tách nhỏ các component. Component sử dụng chung đặt tại `src/components/base/`, component theo nghiệp vụ đặt tại `src/components/features/`.
- **Quản lý Tài nguyên (Assets & Icons)**: Bắt buộc phân tách rõ ràng tài nguyên UI. File icon tĩnh (.svg, .png) phải được đặt trong thư mục riêng `src/assets/icons/`. Các icon được viết dưới dạng React Component bắt buộc phải đặt tập trung tại thư mục `src/components/base/icons/`, tuyệt đối không để rải rác ở các thư mục module khác.
- **State Management**: Sử dụng Zustand hoặc Redux Toolkit cho Global State (theo chuẩn thư mục `src/store/`). Không lạm dụng Global State cho những state có thể quản lý cục bộ.
- **Data Fetching & HTTP Client**: BẮT BUỘC sử dụng thư viện `axios` làm HTTP Client chính cho toàn bộ ứng dụng để đồng bộ hóa cơ chế gọi API và dễ dàng áp dụng interceptor (như Idempotency Key). Đối với Client-side fetching, kết hợp Axios với SWR hoặc React Query (đặt tại `src/services/`).
- **Styling**: Sử dụng Tailwind CSS qua file `index.css`. Không sử dụng inline styles trừ những trường hợp tính toán động.
- **Validation Form**: Bắt buộc sử dụng `zod` kết hợp với `react-hook-form` (chuẩn thư mục `src/schemas/`).

## 6. Quy tắc Linting & Formatting

- Code phải pass qua toàn bộ rules của ESLint (được cấu hình khắt khe không có cảnh báo) và Prettier trước khi được commit.
- Hỗ trợ Git Hooks (Husky + lint-staged) được thiết lập tự động trong thư mục `.husky/` để chặn commit nếu code lỗi convention.

## 7. Git Workflow & Commit Messages

- Sử dụng **Conventional Commits** cho tất cả các commit messages.
- Cú pháp: `<type>[optional scope]: <description>`
- Các types thường dùng:
  - `feat`: Thêm tính năng mới.
  - `fix`: Sửa lỗi.
  - `refactor`: Viết lại code nhưng không làm thay đổi logic hoạt động.
  - `style`: Định dạng code (khoảng trắng, dấu chấm phẩy, v.v.), không ảnh hưởng đến logic.
  - `chore`: Cập nhật tool, cấu hình build, v.v.
- **Branching**: `main` (Production), `develop` (Staging), tính năng tạo nhánh từ develop `feature/ten-tinh-nang`.

## 8. Quy tắc làm việc của AI Agent (Planning Mandate)

- **BẮT BUỘC TẠO PLAN**: Trước khi bắt đầu xây dựng một tính năng mới (feature) hoặc thay đổi một logic phức tạp nào đó, Agent **BẮT BUỘC** phải tạo một Kế hoạch triển khai (Implementation Plan) để xin ý kiến và sự xác nhận (Approve) từ User.
- **CHỜ APPROVE CUỐI CÙNG**: Nếu User có feedback chỉnh sửa Plan, Agent phải cập nhật lại Plan và **tiếp tục chờ User duyệt bản Plan cuối cùng** chứ không được phép tự động chuyển sang bước thực thi (code).
- Không được phép tự ý sửa file code khi chưa thống nhất kế hoạch hoàn chỉnh.
