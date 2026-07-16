# 00 — Bắt đầu nhanh (5 phút)

> `/brainstorm` không cần cài công cụ render nào — chỉ cần Claude Code và một workspace BA. Cài xong và chạy được ngay.

---

## Bước 1 — Copy skill vào workspace BA

Từ thư mục gốc gói này (thay `<workspace>` bằng workspace BA của bạn — nơi có `CLAUDE.md` + `docs/`):

```bash
cp -R claude-code/.claude/skills/brainstorm  <workspace>/.claude/skills/
cp    claude-code/.claude/rules/*.md         <workspace>/.claude/rules/
cp    claude-code/_templates/brainstorm.md   <workspace>/_templates/
```

Nếu workspace **chưa có** các thư mục này thì tạo trước:
```bash
mkdir -p <workspace>/.claude/{skills,rules} <workspace>/_templates
```

> 7 rule trong `.claude/rules/` được skill tham chiếu (mục References). Workspace đã có bộ BA-KIT → rule trùng cứ giữ bản đang dùng; chưa có → copy đủ, nếu thiếu skill sẽ thiếu quy ước (approval gate, naming, IT-BA framing, resolve OQ…).

---

## Bước 2 — Mở Claude Code và chạy

```bash
cd <workspace>
claude
```

Trong chat, gõ một câu ý tưởng (không cần chuẩn bị gì — skill sẽ hỏi lại):

```
/brainstorm thêm luồng đặt món và thanh toán online/COD cho app giao đồ ăn
```

Skill sẽ:
1. Đề xuất tên feature + tên ý tưởng (bạn xác nhận `Y` hoặc sửa).
2. Phỏng vấn **từng phần một** (tổng quan → người dùng → luồng → đi sâu → số liệu/wording → ngữ cảnh → rủi ro). Bạn trả lời từng phần; có thể `skip` phần nào.
3. Với ý tưởng có thanh toán/OAuth/webhook: vẽ **ASCII flow** cho bạn duyệt (sửa tối đa 3 vòng).
4. Tổng hợp → **xem trước** kế hoạch ghi (L1) → bạn gõ `Y`.
5. Ghi `docs/{feature}/brainstorms/{slug}.md` → hỏi xử lý Open Questions.

---

## Bước 3 — Ý tưởng nhỏ? Nói "nhanh gọn"

Không phải ý tưởng nào cũng cần phỏng vấn sâu. Với thứ nhỏ (dark mode, đổi nhãn nút):

```
/brainstorm dark mode toggle, brainstorm nhanh gọn thôi
```

→ Skill chạy 1 lượt 6 câu, bỏ qua artifact bắt buộc. Không cần gõ flag — chỉ cần nói "nhanh gọn" / "shallow thôi".

---

## Bước 4 — Xem bản mẫu trước khi tự làm

Mở `example/food-delivery-checkout.md` trong gói này — đó là **output thật** cho một feature nhiều luồng (đặt món + thanh toán, online + COD, 4 vai trò). Đọc `example/README.md` để có bản đồ 12 mục + điểm đáng học (số liệu cụ thể, wording exact, rủi ro nghiệp vụ, OQ có ID).

---

## Các cách gọi

```
/brainstorm                          # tương tác: skill hỏi bạn brainstorm gì
/brainstorm <câu ý tưởng>            # ý tưởng gõ thẳng
/brainstorm @<đường-dẫn-file>        # ý tưởng lấy từ file (note, brief)
/brainstorm <ý tưởng>, nhanh gọn     # chạy shallow mode
/brainstorm <ý tưởng>, viết bằng tiếng Anh   # output tiếng Anh
```

## Không chắc trả lời phỏng vấn sao?

→ `02-huong-dan-phong-van.md` (7 nhóm câu hỏi hỏi gì + trả lời sao cho chất lượng).

## Muốn hiểu skill làm gì bên trong?

→ `01-cach-hoat-dong.md` (4 pha) hoặc `explain-skills/brainstorm.md` (ngôn ngữ nghiệp vụ).
