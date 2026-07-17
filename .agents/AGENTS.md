# Agent Rules & Behavioral Constraints

## Planning Mandate

**Rule**: Trước khi bắt đầu xây dựng một tính năng mới (feature) hoặc thay đổi một logic phức tạp nào đó, Agent **BẮT BUỘC** phải tạo một Kế hoạch triển khai (Implementation Plan) để xin ý kiến và sự xác nhận (Approve) từ User.

- Không được phép tự ý sửa file code khi chưa thống nhất kế hoạch.
- Áp dụng cho mọi yêu cầu có tính chất "xây dựng chức năng mới" hoặc "cập nhật logic cốt lõi".

## Project Structure Mandate

**Rule**: Dự án này có một cấu trúc thư mục quy chuẩn chặt chẽ (phân chia `docs/`, `code/`, `test/`...). Agent **BẮT BUỘC** phải tham khảo cấu trúc thư mục tại file `.agents/project-structure.md` trước khi tiến hành tạo file mới hoặc tìm kiếm source code, để đảm bảo lưu đúng thư mục.

## Documentation Sync Mandate

**Rule**: Nếu trong quá trình code hoặc thiết kế có bất kỳ sự thay đổi nào làm lệch đi so với các tài liệu đã chốt ban đầu, Agent **BẮT BUỘC** phải tự động cập nhật lại các file tài liệu liên quan trong thư mục `docs/` (ví dụ: `SRS.md`, `project_plan.md`, v.v.) để đảm bảo documentation luôn đồng bộ với code thực tế.
