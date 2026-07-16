# Prompt cài bộ `/brainstorm` vào Codex CLI

> **Cách dùng:** mở thư mục gói này trong project của bạn (hoặc copy gói vào project) → mở Codex CLI → copy NGUYÊN khối prompt dưới đây → dán → gửi. Codex tự copy + rà path. Muốn hiểu cơ chế, xem `INSTALL-CODEX.md`.

---

````text
Đây là skill /brainstorm phỏng vấn làm rõ ý tưởng cho BA, được viết ban đầu cho Claude Code.
Bạn là Codex CLI. Hãy SAO CHÉP skill Claude Code có sẵn trong thư mục gói
"brainstorm-skill-package/" sang .codex/ của project này và rà lại path cho tương thích Codex.
Skill này KHÔNG có agent/script phụ — chỉ skill + rule + template.

NGUỒN:
- Skill:     brainstorm-skill-package/claude-code/.claude/skills/brainstorm/
             (SKILL.md + references/example-brainstorm.md)
- 7 rule:    brainstorm-skill-package/claude-code/.claude/rules/*.md
             (feature-bootstrap, ba-conventions, approval-gate, naming-conventions,
              keyword-detection, resolve-oqs, changelog)
- Template:  brainstorm-skill-package/claude-code/_templates/brainstorm.md
- Ví dụ mẫu: brainstorm-skill-package/example/food-delivery-checkout.md (output đúng trông thế nào)

CÁC BƯỚC:

1. Copy skill:
   cp -R brainstorm-skill-package/claude-code/.claude/skills/brainstorm  .codex/skills/
   (tạo .codex/skills/ nếu chưa có)

2. Copy 7 rule:
   cp brainstorm-skill-package/claude-code/.claude/rules/*.md  .codex/rules/

3. Copy template:
   cp brainstorm-skill-package/claude-code/_templates/brainstorm.md  _templates/

4. Rà frontmatter SKILL.md: nếu Codex báo lỗi parse, chỉ giữ name + description và đưa
   cú pháp tham số (/brainstorm <idea> | @<file> | (empty)) xuống mục "Cách gọi" trong body.

5. Rà mục "## References" trong SKILL.md: đảm bảo path rule + template khớp vị trí mới
   (.codex/rules/... và _templates/brainstorm.md). Bỏ được nếu rule ở .codex/rules/ auto-load.

RÀNG BUỘC (KHÔNG ĐỔI):
- Giữ nguyên LOGIC: phỏng vấn 7 nhóm hỏi từng phần một, hỏi bằng ngôn ngữ nghiệp vụ
  (KHÔNG hỏi tên column DB/endpoint/framework), ép số liệu + wording chính xác, no re-ask,
  approval gate (xem trước L1 rồi mới ghi), xử lý Open Questions cuối cùng. Vietnamese-first.
- Shallow mode qua lời nói ("nhanh gọn") vẫn giữ.

BÁO CÁO sau khi xong:
1. Cây thư mục .codex/ đã tạo.
2. Path References đã rà/sửa.
Rồi chạy thử: /brainstorm thêm luồng đặt món và thanh toán cho app giao đồ ăn
và xác nhận skill DỪNG ở bước xem trước (L1) trước khi ghi, hỏi từng nhóm một, không tự ghi im lặng.
````
