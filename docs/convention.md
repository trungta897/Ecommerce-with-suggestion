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

### 2.2. Đối với Backend (NestJS)
- **Thư viện đề xuất**: `nestjs-i18n`.
- **Quy tắc**: Mọi thông báo lỗi (Exceptions), tin nhắn trả về (Response messages), nội dung email gửi đi đều phải được khai báo qua hệ thống i18n, tuyệt đối không hardcode text tiếng Việt hoặc tiếng Anh trực tiếp trong code logic.
- **Quy tắc chia nhỏ (Modularization)**: Tương tự như Frontend, bắt buộc chia nhỏ file từ điển theo module tính năng (ví dụ: `auth.json`, `order.json`) và đặt tại `src/common/i18n/`.

## 3. Quy tắc Backend (NestJS)

- **Kiến trúc**: Tuân thủ triệt để cấu trúc thư mục được định nghĩa, phân tách logic theo tầng (Controller -> Service -> Repository/Prisma).
- **Validation**: Sử dụng `class-validator` và `class-transformer` tại các file DTO.
- **Error Handling**: Bắt lỗi tập trung (Global Exception Filter) trong `src/common/filters/`. Sử dụng các Custom Business Exceptions đã được định nghĩa.
- **No `any`**: Hạn chế tối đa việc sử dụng kiểu `any`. Phải định nghĩa Type/Interface rõ ràng hoặc DTO cho request/response.

## 4. Quy tắc Frontend (Next.js)

- **Component**: Tách nhỏ các component. Component sử dụng chung đặt tại `src/components/base/`, component theo nghiệp vụ đặt tại `src/components/features/`.
- **State Management**: Sử dụng Zustand hoặc Redux Toolkit cho Global State (theo chuẩn thư mục `src/store/`). Không lạm dụng Global State cho những state có thể quản lý cục bộ.
- **Data Fetching**: Khuyến khích sử dụng Server Components của Next.js để fetch data khi có thể. Đối với Client-side fetching, sử dụng các thư viện quản lý state server như SWR hoặc React Query/Axios Client (đặt tại `src/services/`).
- **Styling**: Sử dụng Tailwind CSS qua file `index.css`. Không sử dụng inline styles trừ những trường hợp tính toán động.
- **Validation Form**: Bắt buộc sử dụng `zod` kết hợp với `react-hook-form` (chuẩn thư mục `src/schemas/`).

## 5. Quy tắc Linting & Formatting

- Code phải pass qua toàn bộ rules của ESLint (được cấu hình khắt khe không có cảnh báo) và Prettier trước khi được commit.
- Hỗ trợ Git Hooks (Husky + lint-staged) được thiết lập tự động trong thư mục `.husky/` để chặn commit nếu code lỗi convention.

## 6. Git Workflow & Commit Messages

- Sử dụng **Conventional Commits** cho tất cả các commit messages.
- Cú pháp: `<type>[optional scope]: <description>`
- Các types thường dùng:
  - `feat`: Thêm tính năng mới.
  - `fix`: Sửa lỗi.
  - `refactor`: Viết lại code nhưng không làm thay đổi logic hoạt động.
  - `style`: Định dạng code (khoảng trắng, dấu chấm phẩy, v.v.), không ảnh hưởng đến logic.
  - `chore`: Cập nhật tool, cấu hình build, v.v.
- **Branching**: `main` (Production), `develop` (Staging), tính năng tạo nhánh từ develop `feature/ten-tinh-nang`.

## 7. Quy tắc làm việc của AI Agent (Planning Mandate)

- **BẮT BUỘC TẠO PLAN**: Trước khi bắt đầu xây dựng một tính năng mới (feature) hoặc thay đổi một logic phức tạp nào đó, Agent **BẮT BUỘC** phải tạo một Kế hoạch triển khai (Implementation Plan) để xin ý kiến và sự xác nhận (Approve) từ User.
- **CHỜ APPROVE CUỐI CÙNG**: Nếu User có feedback chỉnh sửa Plan, Agent phải cập nhật lại Plan và **tiếp tục chờ User duyệt bản Plan cuối cùng** chứ không được phép tự động chuyển sang bước thực thi (code).
- Không được phép tự ý sửa file code khi chưa thống nhất kế hoạch hoàn chỉnh.
