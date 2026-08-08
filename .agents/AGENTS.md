# Agent Rules & Behavioral Constraints

## Planning Mandate

**Rule**: Trước khi bắt đầu xây dựng một tính năng mới (feature) hoặc thay đổi một logic phức tạp nào đó, Agent **BẮT BUỘC** phải tạo một Kế hoạch triển khai (Implementation Plan) để xin ý kiến và sự xác nhận (Approve) từ User.

- Không được phép tự ý sửa file code khi chưa thống nhất kế hoạch.
- Áp dụng cho mọi yêu cầu có tính chất "xây dựng chức năng mới" hoặc "cập nhật logic cốt lõi".

## Project Structure Mandate

**Rule**: Dự án này có một cấu trúc thư mục quy chuẩn chặt chẽ (phân chia `docs/`, `code/`, `test/`...). Agent **BẮT BUỘC** phải tham khảo cấu trúc thư mục tại file `.agents/project-structure.md` trước khi tiến hành tạo file mới hoặc tìm kiếm source code, để đảm bảo lưu đúng thư mục.

## Documentation Sync Mandate

**Rule**: Nếu trong quá trình code hoặc thiết kế có bất kỳ sự thay đổi nào làm lệch đi so với các tài liệu đã chốt ban đầu, Agent **BẮT BUỘC** phải tự động cập nhật lại các file tài liệu liên quan trong thư mục `docs/` (ví dụ: `SRS.md`, `project_plan.md`, v.v.) để đảm bảo documentation luôn đồng bộ với code thực tế.

## No Hardcode Text & i18n Mandate

**Rule**: Tuyệt đối KHÔNG viết cứng (hardcode) text (Tiếng Việt/Tiếng Anh) trực tiếp vào trong các file source code (cả Frontend `.tsx` lẫn Backend `.ts`).
- **Frontend (Next.js)**: Mọi text hiển thị trên UI bắt buộc phải khai báo trong `src/messages/` và gọi qua `useTranslations()`.
- **Backend (NestJS)**: Mọi thông báo lỗi (Error messages, Validation) trả về qua API cũng bắt buộc phải sử dụng đa ngôn ngữ (ví dụ: `nestjs-i18n`) thay vì ném exception kèm chuỗi string cứng.

## i18n Synchronization & Lowercase Mandate

**Rule**: BẮT BUỘC sử dụng chữ thường (lowercase) cho tất cả các namespace (ví dụ: `common`, `home`, `product`) trong thư mục `messages/` cũng như khi khai báo cấu hình.
- Khi tạo mới một file JSON từ điển (ví dụ: `auth.json`), Agent **BẮT BUỘC** phải tự động đăng ký namespace đó vào file cấu hình (ví dụ: `src/i18n/request.ts` ở Frontend) bằng đúng khóa lowercase TRƯỚC KHI sử dụng nó trong các component để tránh lỗi "Could not resolve message".
## Modularization Mandate

**Rule**: Bắt buộc phải chia nhỏ code và các file tài nguyên dịch thuật thành nhiều modules nhỏ độc lập theo từng tính năng (ví dụ: `common`, `auth`, `product`) áp dụng cho CẢ Frontend và Backend.
- Không được nhồi nhét tất cả vào một file khổng lồ duy nhất, để đảm bảo hệ thống dễ dàng quản lý, mở rộng và bảo trì sau này.

## UI Assets & Icons Separation Mandate

**Rule**: Bắt buộc phải quản lý các tài nguyên đồ họa (Icons, Images) một cách tách biệt và rành mạch.
- Tuyệt đối không để file hình ảnh hoặc icon lộn xộn trong thư mục `components` hoặc các thư mục logic khác.
- File tĩnh (như `.svg`, `.png`) bắt buộc đặt tại thư mục riêng biệt như `src/assets/icons/`.
- Nếu chuyển đổi Icon thành React Component (`<IconName />`), hoặc trích xuất từ inline SVG, thì phải gom tập trung tất cả vào thư mục `src/components/base/icons/`.
- Kể cả các icon sử dụng từ thư viện bên thứ ba (như `lucide-react`), **BẮT BUỘC** phải được re-export (xuất lại) thông qua một file index duy nhất (`src/components/base/icons/index.ts`). Các component khác trong dự án chỉ được phép import icon từ thư mục base này (`@/components/base/icons`), tuyệt đối không import trực tiếp từ thư viện ngoài để dễ dàng thay thế/quản lý sau này.

## Eager Loading & Database Performance Mandate

**Rule**: Bắt buộc phải áp dụng **Eager Loading** (thông qua thuộc tính `include` của Prisma) khi thực hiện truy vấn các thực thể (entities) có quan hệ với nhau (ví dụ: truy vấn Product phải lấy kèm Category, truy vấn Order phải lấy kèm OrderItems và User) nhằm triệt để ngăn chặn lỗi **N+1 Query** ảnh hưởng đến hiệu năng hệ thống.
- Việc sử dụng `include` phải được khai báo rõ ràng, cụ thể tại từng hàm truy vấn trong tầng Service hoặc Repository.
- Tránh lạm dụng Eager Loading đối với những dữ liệu quan hệ không cần thiết cho mục đích của API hiện tại (chẳng hạn không lấy kèm danh sách Review khi chỉ cần hiển thị danh sách Product ở trang chủ).

## Security & SQL Injection Prevention Mandate

**Rule**: Tuyệt đối KHÔNG ĐƯỢC tự ý nối chuỗi (string concatenation) khi thực thi các câu truy vấn thô (Raw SQL) bằng Prisma (ví dụ: `prisma.$queryRaw`) để phòng chống lỗ hổng **SQL Injection**.
- Mặc định phải ưu tiên sử dụng các method API an toàn có sẵn của Prisma (`findMany`, `findUnique`, `create`...).
- Trong trường hợp bất khả kháng phải viết Raw SQL, **BẮT BUỘC** phải sử dụng Parameterized Queries (dùng Prepared Statements với biến số) thay vì chèn trực tiếp dữ liệu từ request của User vào câu lệnh.

## Pub/Sub & Decoupling Mandate

**Rule**: Bắt buộc sử dụng mô hình **Pub/Sub** (ví dụ thông qua `@nestjs/event-emitter`) cho các tác vụ bất đồng bộ hoặc các logic phụ chạy ngầm (như gửi email, thông báo, ghi log thống kê) nhằm giảm độ kết dính (decoupling) giữa các module.
- Tuyệt đối không gọi trực tiếp các service phụ từ service chính (ví dụ: cấm gọi `EmailService.send()` trực tiếp bên trong `OrderService.create()`). 
- Thay vào đó, service chính chỉ phát ra một sự kiện (ví dụ: `order.created`) để các Subscriber tương ứng tự động lắng nghe và xử lý độc lập.

## Sprint Backlogs Update Mandate

**Rule**: Bắt buộc phải tự động cập nhật tiến độ vào các file backlog của sprint tương ứng (ví dụ: \docs/backlogs/sprintX/tasks.md\) mỗi khi hoàn thành xong một task.
- Tìm kiếm đúng file backlog của sprint hiện tại và đánh dấu \[x]\ vào các công việc vừa được thực hiện xong.
- Việc này phải diễn ra tự động mà không cần User phải nhắc nhở thêm.

## Constants Separation & No Magic Strings Mandate

**Rule**: Tuyệt đối KHÔNG gộp các khai báo hằng số (constants), danh sách cố định (arrays, option lists), hay bản đồ cấu hình tĩnh (static maps/dictionaries/default strings) vào bên trong các thư mục hoặc file xử lý logic như `src/utils/`, `src/services/` hoặc `src/components/`.
- **Frontend (Next.js)**: Tất cả hằng số dùng chung bắt buộc phải được định nghĩa tại thư mục `src/constants/` (phân lập theo từng module riêng, ví dụ: `src/constants/product.ts`) và được quản lý/re-export thông qua file index (`src/constants/index.ts`).
- **Backend (NestJS)**: Mọi hằng số chung (Mã lỗi, giá trị cấu hình mặc định, regex...) bắt buộc lưu tại `src/common/constants/` hoặc các file `.constant.ts` thuộc từng module chuyên biệt.
- **Single Source of Truth & Dynamic Logic**: Các hàm tiện ích và service xử lý logic (tại `utils/` hay `services/`) chỉ được phép import hằng số từ thư mục `constants` để tính toán động (ví dụ: dùng `.reduce()` hay `.map()` từ mảng hằng số), tuyệt đối không định nghĩa lại hay hardcode các giá trị chuỗi/số (magic string / magic number) ngay bên trong code logic.

## Pre-Commit Summary Mandate

**Rule**: Bắt buộc tạo một bản tổng kết (summary) những thay đổi so với commit trước đó, TRƯỚC KHI thực hiện lệnh commit lên GitHub.
- Bản tổng kết này phải được lưu vào một file nằm trong thư mục `summary/` của dự án.
- Tên file tổng kết nên chứa timestamp hoặc thông tin commit (ví dụ: `summary_YYYYMMDD_HHMMSS.md`).
- Nội dung tóm tắt rõ ràng các file đã sửa đổi, tính năng đã thêm hoặc lỗi đã sửa để tiện theo dõi.

## Code Formatting & Type Safety Mandate

**Rule**: Tuyệt đối tránh các lỗi liên quan đến dư thừa khoảng trắng (trailing spaces) hoặc ép kiểu không cần thiết (unnecessary type assertions) trong file code (ví dụ dùng `as any` khi Type đã tương thích).
- Agent **BẮT BUỘC** phải chạy script để format (ví dụ: `npm run format` hoặc `npx prettier --write <file>`) sau khi sửa đổi file code nếu phát sinh các lỗi liên quan tới định dạng (formatting).
- Agent **BẮT BUỘC** sử dụng kiểu dữ liệu chặt chẽ và chỉ sử dụng ép kiểu (`as`) khi thực sự cần thiết, hạn chế tối đa việc sử dụng kiểu `any`.

## Safe Execution Mandate

**Rule**: KHÔNG THỰC HIỆN BẤT KỲ HÀNH ĐỘNG DESTRUCTIVE NÀO BAO GỒM XÓA FILE, XÓA DỮ LIỆU, GHI ĐÈ KHÔNG CÓ BACKUP, HOẶC THAY ĐỔI KHÔNG THỂ HOÀN TÁC. KHÔNG NÂNG CẤP, HẠ CẤP HOẶC THAY ĐỔI PHIÊN BẢN FRAMEWORK, THƯ VIỆN, HỆ ĐIỀU HÀNH KHI CHƯA CÓ CHỈ ĐỊNH RÕ RÀNG. LUÔN HỎI LẠI TRƯỚC KHI THỰC HIỆN HÀNH ĐỘNG ẢNH HƯỞNG HỆ THỐNG. ƯU TIÊN GIẢI PHÁP KHÔNG PHÁ VỠ, CÓ THỂ HOÀN TÁC. TẠO BẢN SAO LƯU TRƯỚC KHI CHỈNH SỬA QUAN TRỌNG. KHÔNG TỰ ĐỘNG CHẠY SCRIPT NGUY HIỂM. BẢO TOÀN TÍNH TOÀN VẸN DỮ LIỆU VÀ MÔI TRƯỜNG PHÁT TRIỂN. LUÔN MINH BẠCH VỀ RỦI RO TRƯỚC KHI HÀNH ĐỘNG.
