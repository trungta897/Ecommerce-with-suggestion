# Port bộ `/brainstorm` sang Google Antigravity IDE

> Đưa skill `/brainstorm` (vốn viết cho Claude Code) sang **Google Antigravity IDE**. Gồm: (A) cấu trúc cấu hình, (B) ánh xạ Claude Code → Antigravity, (C) prompt copy-paste ở `PROMPT-ANTIGRAVITY.md`.
>
> Cập nhật theo tài liệu Antigravity tới ~6/2026. Path có thể đổi giữa các bản — luôn đối chiếu cây thư mục thật (xem cảnh báo A.3).

---

## A. Antigravity cấu hình thế nào

### A.1 — Vị trí (workspace / project scope)

| Loại | Đường dẫn | Vai trò |
|---|---|---|
| **Skills** | `<project-root>/.agents/skills/{name}/SKILL.md` | "Sổ tay" agent nạp khi liên quan. |
| **Rules** | `<project-root>/.agents/rules/*.md` | Như system instruction — luôn áp dụng. |
| **Workflows** | `<project-root>/.agent/workflows/*.md` | Prompt lưu sẵn, gọi bằng `/<tên>`. |
| **AGENTS.md** | `<project-root>/AGENTS.md` | Nền tảng chung (Antigravity + Cursor + Claude Code đều đọc). |

### A.2 — Global scope

| Loại | Đường dẫn |
|---|---|
| Skills | `~/.gemini/config/skills/` |
| Rules | `~/.gemini/GEMINI.md` |

### A.3 — ⚠️ Cảnh báo tên thư mục (`.agent` vs `.agents`)

Điểm dễ sai nhất — nguồn tài liệu lẫn số ít/số nhiều:
- **Skills/Rules:** đa số dùng **`.agents/`** (số nhiều).
- **Workflows:** có nguồn ghi `.agent/workflows/`, có nguồn `.agents/workflows/`; Antigravity còn cho tạo workflow qua UI.

👉 **Trước khi copy, tạo thử 1 skill rỗng qua UI/lệnh của Antigravity để xem nó đẻ ra thư mục tên gì.** Dùng đúng tên đó. Hướng dẫn dưới mặc định `.agents/`.

### A.4 — SKILL.md của Antigravity

```yaml
---
name: brainstorm
description: <trigger phrase NGỮ NGHĨA, càng cụ thể càng dễ kích hoạt đúng>
---
```
- `description` là **bắt buộc** và là "trigger phrase". Mô tả cụ thể ("Ghi lại ý tưởng thô rồi phỏng vấn sâu làm rõ luồng/decision/số liệu/wording trước khi viết URD/PRD, hỏi bằng ngôn ngữ nghiệp vụ") mới được nạp đúng.
- Kích hoạt qua ngôn ngữ tự nhiên; muốn gõ `/brainstorm` thì tạo thêm Workflow mỏng (B.4).

---

## B. Ánh xạ Claude Code → Antigravity

| Thành phần Claude Code | Trong gói | → Antigravity |
|---|---|---|
| `.claude/skills/brainstorm/SKILL.md` | `claude-code/.claude/skills/brainstorm/` | `.agents/skills/brainstorm/SKILL.md` (sửa frontmatter, B.1) |
| `references/example-brainstorm.md` | trong skill | `.agents/skills/brainstorm/references/example-brainstorm.md` |
| `.claude/rules/*.md` (7 file) | `claude-code/.claude/rules/` | `.agents/rules/*.md` (giữ nội dung) |
| `_templates/brainstorm.md` | `claude-code/_templates/` | `.agents/skills/brainstorm/templates/brainstorm.md` |

> Brainstorm **không dùng agent/script phụ** (không Task tool, không Node) → không có bước chuyển agent như các bộ khác. Đơn giản hơn nhiều.

### B.1 — Frontmatter SKILL.md

- **Giữ:** `name`, `description`.
- **Bỏ:** `allowed-tools`, `user-invocable`, `context`, `argument-hint`.
- Cú pháp tham số (`/brainstorm <idea> | @<file>`) → chuyển xuống mục "Cách gọi" trong body.

### B.2 — Template & References

- Copy `brainstorm.md` vào `.agents/skills/brainstorm/templates/` và sửa reference trong SKILL.md (`@../../../_templates/brainstorm.md` → `templates/brainstorm.md`).
- Copy 7 rule vào `.agents/rules/` (auto-load). Sửa/bỏ mục "## References" cho khớp.

### B.3 — (Tùy chọn) Lệnh `/brainstorm`

Muốn gõ `/brainstorm` như Claude Code: tạo Workflow mỏng `.agent/workflows/brainstorm.md` (frontmatter có `description`) trỏ về skill.

---

## C. Prompt tự động

Không cần làm tay từng bước — mở gói này trong Antigravity IDE, **mở `PROMPT-ANTIGRAVITY.md` và dán toàn bộ prompt trong đó vào chat agent**. AI sẽ tự sao chép + chuyển đổi skill Claude Code sang chuẩn Antigravity IDE (prompt đã dặn agent bám tài liệu Antigravity mới nhất ~06/2026).

---

## D. Checklist

- [ ] `.agents/skills/brainstorm/SKILL.md` có, frontmatter chỉ còn `name` + `description`.
- [ ] `.agents/skills/brainstorm/templates/brainstorm.md` có; reference đã sửa.
- [ ] `.agents/skills/brainstorm/references/example-brainstorm.md` có.
- [ ] `.agents/rules/` có 7 rule (hoặc workspace đã có bộ tương đương).
- [ ] Chạy thử "brainstorm luồng đặt món cho app giao đồ ăn" → agent hỏi từng nhóm một, DỪNG ở bước xem trước trước khi ghi, không tự ghi im lặng.

---

## Nguồn tham khảo (Antigravity, tới ~6/2026)

- [Getting Started with Google Antigravity — Codelabs](https://codelabs.developers.google.com/getting-started-google-antigravity)
- [Authoring Antigravity Skills — Codelabs](https://codelabs.developers.google.com/getting-started-with-antigravity-skills)
- [Antigravity Docs — Skills](https://antigravity.google/docs/skills) · [Rules & Workflows](https://antigravity.google/docs/rules-workflows)
