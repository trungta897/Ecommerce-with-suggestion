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

## Modularization Mandate

**Rule**: Bắt buộc phải chia nhỏ code và các file tài nguyên dịch thuật thành nhiều modules nhỏ độc lập theo từng tính năng (ví dụ: `common`, `auth`, `product`) áp dụng cho CẢ Frontend và Backend.
- Không được nhồi nhét tất cả vào một file khổng lồ duy nhất, để đảm bảo hệ thống dễ dàng quản lý, mở rộng và bảo trì sau này.
