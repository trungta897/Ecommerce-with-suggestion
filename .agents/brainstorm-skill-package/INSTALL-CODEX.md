# Port bộ `/brainstorm` sang Codex CLI

> Đưa skill `/brainstorm` (vốn viết cho Claude Code) sang **Codex CLI**. Codex đọc `.codex/` ở gốc project (song song `.claude/`) và file nền `AGENTS.md`. Brainstorm **không có agent/script phụ** — chỉ skill + rule + template, nên port rất gọn.

---

## A. Codex đọc cấu hình thế nào

| Loại | Claude Code | Codex CLI |
|---|---|---|
| Skills | `.claude/skills/{name}/SKILL.md` | `.codex/skills/{name}/SKILL.md` |
| Rules | `.claude/rules/*.md` | `.codex/rules/*.md` |
| Templates | `_templates/*.md` | `_templates/*.md` (giữ nguyên vị trí) |
| File nền | `CLAUDE.md` | `AGENTS.md` |

Brainstorm không dùng agent (`Task tool`) hay script Node → **không có gì phải chuyển định dạng**. Chỉ copy + rà path.

---

## B. Các bước

### B.1 — Copy skill + rules + template

```bash
# Từ thư mục gốc gói này; thay <project> bằng project Codex của bạn
mkdir -p <project>/.codex/skills <project>/.codex/rules <project>/_templates
cp -R claude-code/.claude/skills/brainstorm  <project>/.codex/skills/
cp    claude-code/.claude/rules/*.md          <project>/.codex/rules/
cp    claude-code/_templates/brainstorm.md    <project>/_templates/
```

7 rule: `feature-bootstrap`, `ba-conventions`, `approval-gate`, `naming-conventions`, `keyword-detection`, `resolve-oqs`, `changelog`.

### B.2 — Rà frontmatter SKILL.md

Codex chủ yếu dùng `name` + `description` để kích hoạt. Field Claude-Code-only (`allowed-tools`, `user-invocable`, `argument-hint`) — Codex bỏ qua; nếu báo lỗi parse thì chỉ giữ `name` + `description` và đưa cú pháp tham số (`/brainstorm <idea> | @<file>`) xuống mục "Cách gọi" trong body.

### B.3 — Rà References trong SKILL.md

SKILL.md trỏ `@../../rules/...` và `@../../../_templates/brainstorm.md`. Nếu Codex resolve khác, sửa cho khớp `.codex/rules/...` (hoặc bỏ mục References vì rule ở `.codex/rules/` được auto-load).

---

## C. Prompt tự động

Không cần làm tay từng bước — mở project trong Codex CLI, **mở `PROMPT-CODEX.md` và dán toàn bộ prompt trong đó vào chat**. Codex sẽ tự sao chép skill Claude Code sang thư mục `.codex/` + rà path References đúng chuẩn.

---

## D. Checklist

- [ ] `.codex/skills/brainstorm/SKILL.md` + `references/example-brainstorm.md` có.
- [ ] `.codex/rules/` có đủ 7 rule.
- [ ] `_templates/brainstorm.md` có.
- [ ] Path References trong SKILL.md khớp `.codex/`.
- [ ] Chạy thử `/brainstorm <ý tưởng>` → skill DỪNG ở bước xem trước (L1) trước khi ghi, không tự ghi im lặng.
