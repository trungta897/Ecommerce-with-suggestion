# Cấu trúc thư mục dự án (Project Structure)

Dự án này sử dụng cấu trúc thư mục quy chuẩn sau đây. Agent khi thao tác tạo file, đọc file hoặc tìm kiếm code **BẮT BUỘC** phải tuân theo cấu trúc này:

```text
├── docs/                      # Thư mục chứa toàn bộ tài liệu dự án
│   ├── srs.md                 # Tài liệu đặc tả phần mềm (SRS)
│   ├── convention.md          # Quy tắc code (Coding conventions)
│   ├── backlogs/              # Chứa các backlog, quản lý task
│   │   ├── sprint1/           # Chứa các user story, task của Sprint 1
│   │   └── sprint2/           # Chứa các user story, task của Sprint 2
│   ├── DB-erd/                # Chứa thiết kế Database, ERD
│   └── UI/UX style guideline/ # Style guideline cho Frontend
│
├── code/                      # Thư mục chứa toàn bộ source code của dự án
│   ├── front end/             # Source code Frontend (Next.js, UI...)
│   └── backend/               # Source code Backend (NestJS, API...)
│
├── .agents/                   # Thư mục chứa các Rule, Workflow và Skill của AI
│
├── test/                      # Thư mục chứa các file Test case
│
├── ml/                        # Thư mục chứa code Machine Learning (FastAPI, Jupyter, scripts)
│   ├── scripts/               # Scripts phục vụ download data, training, seed database
│   └── data/                  # Dữ liệu train/test và models
```

**Lưu ý:**
- Bất kỳ tài liệu phân tích, đặc tả, hay yêu cầu nào đều phải được lưu trong `docs/`.
- Code chỉ được viết vào `code/front end/` hoặc `code/backend/`.
- Test case luôn được đặt trong `test/`.
- Nếu có cấu hình AI mới, lưu vào `.agents/`.

---

## Cấu trúc chi tiết Frontend (`code/front end/`)

Thư mục Frontend sử dụng Next.js App Router với cấu trúc nghiêm ngặt như sau:

```text
├── .husky/                 # Thư mục chứa các script chặn commit (pre-commit hook) để đảm bảo code đã chuẩn convention, đáp ứng đúng lint, build không lỗi,... trước khi được đẩy lên
│   └── pre-commit          # Script chạy tsc và eslint trước khi cho phép git commit
│
├── public/                 # Tài nguyên tĩnh không qua build (favicon, robots.txt, ảnh landing page)
│
├── src/
│   ├── assets/             # Tài nguyên tĩnh đi qua build (images, svg, local fonts)
│   ├── app/                # Next.js App Router (Định nghĩa routing gồm layout, page,... Theo Next)
│   ├── components/         # Chứa các component giao diện
│   │   ├── base/           # Các component base tự custom (BaseButton, BaseTable...)
│   │   └── features/       # Component theo nghiệp vụ
│   ├── lib/                # Cấu hình thư viện (Axios client, utils)
│   ├── hooks/              # Custom React Hooks
│   ├── store/              # Global State (Zustand/Redux)
│   ├── types/              # Định nghĩa TypeScript
│   ├── index.css           # Global CSS (Cấu hình Tailwind)
│   ├── providers/          # Các provider của react
│   ├── schemas/            # Các validator trên front end (Sử dụng zod)
│   ├── services/           # Các hàm gọi api đến backend
│   ├── utils/              # Chứa các hàm sử dụng chung
│   └── constants/          # Định nghĩa các hằng số
│
├── eslint.config.mjs       # Cấu hình linter khắt khe: eslint-plugin-boundaries, kebab-case, no magic numbers, no any, etc.
├── .prettierrc             # Cấu hình format code chuẩn chung
├── tailwind.config.ts      # Cấu hình TailwindCSS
├── tsconfig.json           # Cấu hình TypeScript (Strict Mode)
├── package.json            
├── Dockerfile, .dockerignore, docker-compose.yml  # Cấu hình Docker
├── Sentry                  # Cấu hình ghi nhận bug (Product)
├── .gitignore              
└── .env                    # Biến môi trường (.env.local, .env.development,...)
```

---

## Cấu trúc chi tiết Backend (`code/backend/`)

Thư mục Backend sử dụng NestJS với cấu trúc phân tầng rõ ràng như sau:

```text
├── .husky/                 # Thư mục chứa các script chặn commit (pre-commit hook) để đảm bảo code đã chuẩn convention, đáp ứng đúng lint, build không lỗi,... trước khi được đẩy lên
├── src/
│   ├── main.ts                       # Entry point (Khởi tạo app, setup Global Pipes/Filters/Swagger)
│   ├── app.module.ts                 # Root Module (Gắn kết mọi thứ lại với nhau)
│   │
│   ├── common/                       # [TẦNG DÙNG CHUNG] (Cross-cutting concerns)
│   │   ├── base/                     # [LỰA CHỌN NÂNG CAO] Các class chung để tái sử dụng
│   │   │   ├── base.dto.ts           # PaginationDto, ApiResponseDto
│   │   │   ├── base.service.ts       # Abstract Class định nghĩa sẵn CRUD bằng Generics
│   │   │   └── base.controller.ts    # Abstract Controller định nghĩa sẵn GET, POST, PUT, DELETE
│   │   ├── constants/                # Hằng số (Messages, ErrorCodes)
│   │   ├── decorators/               # Custom Decorators (VD: @CurrentUser(), @Roles())
│   │   ├── exceptions/               # Custom Exceptions (Business exceptions)
│   │   ├── filters/                  # Bắt lỗi toàn cục (AllExceptionsFilter)
│   │   ├── guards/                   # Chắn cổng bảo mật (JwtAuthGuard, RolesGuard)
│   │   ├── interceptors/             # Ghi log request, biến đổi Response cho đồng nhất
│   │   ├── i18n/                     # Chứa các text đa ngôn ngữ
│   │   └── utils/                    # Các hàm tiện ích (BcryptHelper, DateHelper)
│   │
│   ├── config/                       # Cấu hình môi trường (Load từ .env)
│   │   └── app.config.ts
│   │
│   ├── database/                     # Cấu hình kết nối DB
│   │   └── prisma.service.ts         # Khởi tạo Prisma Client để chọc xuống DB
│   │
│   └── modules/                      # 📦 [TẦNG NGHIỆP VỤ LÕI] - Gói theo Feature
│       │
│       ├── auth/                     # Module Đăng nhập / Phân quyền
│       │   ├── dto/                  # login.dto.ts, register.dto.ts
│       │   ├── strategies/           # jwt.strategy.ts (Xác thực token)
│       │   ├── auth.controller.ts    
│       │   ├── auth.service.ts       
│       │   └── auth.module.ts        # Định nghĩa các Provider và Controller của Auth
│       │
│       ├── students/                 # Module mẫu (Quản lý Sinh viên)
│       │   ├── dto/                  # create-student.dto.ts, update-student.dto.ts
│       │   ├── student.controller.ts # [Kế thừa BaseController]
│       │   ├── student.service.ts    # [Kế thừa BaseService]
│       │   └── student.module.ts     
│       │
│       ├── storage/                  # Module Storage tích hợp MinIO/S3
│       │   ├── storage.service.ts    # Gọi AWS SDK upload file
│       │   ├── storage.config.ts     # Cấu hình MinIO
│       │   └── storage.module.ts     
│       │
│       └── projects/                 # Module Quản lý Dự án (Cấu trúc tương tự)
│
├── prisma/                           # TẦNG DATABASE (Prisma ORM)
│   ├── schema.prisma                 # Khai báo cấu trúc bảng CSDL (Entities)
│   └── migrations/                   # Chứa lịch sử thay đổi DB 
│
├── .env                              # Biến môi trường
├── nest-cli.json                     # Cấu hình của Nest CLI
├── package.json
├── eslint.config.mjs                 # Khuyên dùng bộ ESLint chặt chẽ như Frontend
├── .prettierrc
├── Dockerfile, .dockerignore, docker-compose.yml  # Nếu sử dụng Docker để build
├── .gitignore                        # Cấu hình những thứ không push lên git
└── tsconfig.json                     # (Bật strict mode)
```
