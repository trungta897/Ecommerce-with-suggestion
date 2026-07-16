# 01 — Cách skill hoạt động (4 pha)

> Hiểu luồng chạy giúp bạn biết khi nào skill hỏi, khi nào chờ bạn duyệt, và tại sao nó ép bạn cho số liệu cụ thể.

---

## Toàn cảnh

```
Pha A — Suy tên & phát hiện độ phức tạp (âm thầm)
Pha B — Phỏng vấn 7 nhóm (hỏi từng phần một)
Pha C — Tổng hợp + tự kiểm chất lượng
Pha D — Xem trước (L1) → ghi file → xử lý Open Questions
```

---

## Pha A — Suy tên & phát hiện độ phức tạp

Skill **không bắt bạn nhập tên feature**. Nó tự:

1. **Suy tên feature** từ nội dung ý tưởng (danh từ chính, kebab-case ASCII). Vd "đặt món & thanh toán" → `food-delivery`. Bạn xác nhận/sửa ở bước xem trước (L1).
2. **Suy tên ý tưởng** (slug) từ chủ đề. Trùng → tự thêm `-v2`.
3. **Phát hiện ngôn ngữ** (Việt/Anh) từ nội dung.
4. **Phát hiện tín hiệu phức tạp** để quyết cần vẽ artifact nào:

| Tín hiệu | Ví dụ từ khóa | Artifact bắt buộc |
|---|---|---|
| Chuyển hướng ngoài / OAuth / thanh toán / webhook | "cổng thanh toán", "callback", "verify" | ASCII flow + **interrupted-tx matrix** |
| Nhiều nhánh (≥2 path) | if/else nghiệp vụ | ASCII flow + Decision Points |
| Nhiều vai trò / trạng thái đầu vào | "admin/user", "free/paid" | **Scenario matrix** |
| Entity có trạng thái | "pending → active", "draft → published" | **State transitions** |
| Rate limit / quota / lockout | "khóa sau N lần" | ép số liệu cụ thể ở Mục 7.2 |

> Ý tưởng nhỏ không kích tín hiệu nào → không bị ép trả lời 6 câu sâu cho một cái nút.

---

## Pha B — Phỏng vấn 7 nhóm (từng phần một)

Skill hỏi **từng nhóm một**, mỗi lượt tối đa 2–5 câu, **chờ bạn trả lời** rồi mới sang nhóm kế. Không dồn 10 câu.

1. **Tổng quan** — làm gì, giải pain nào, vì sao bây giờ.
2. **Người dùng & truy cập** — vai trò nào, cần điều kiện gì để dùng, vào từ đâu.
3. **Luồng chính (happy path)** — user làm gì → hệ thống làm gì → user thấy gì.
4. **Đi sâu** (chỉ khi có tín hiệu phức tạp) — hệ thống làm gì ở mỗi bước, decision points, trạng thái, xử lý gián đoạn, ASCII flow (duyệt tối đa 3 vòng), scenario matrix.
5. **Validation, giới hạn & wording** — rule bắt buộc, **số liệu chính xác**, **câu lỗi/thành công chính xác**.
6. **Ngữ cảnh hệ thống** (nghiệp vụ) — cần lưu thông tin gì, dịch vụ ngoài nào, thông báo qua kênh nào, có việc nền không.
7. **Edge case, rủi ro, câu hỏi mở**.

Chi tiết mỗi nhóm hỏi gì → `02-huong-dan-phong-van.md`.

**Ba nguyên tắc quan trọng khi phỏng vấn:**

- **Ép độ cụ thể.** "Có rate limit" → hỏi "bao nhiêu lần/phút". "Báo lỗi" → hỏi "câu chính xác là gì". Bạn vẫn mơ hồ sau 1 lần hỏi lại → skill ghi `TBD` + biến thành Open Question, **không ép bạn**.
- **Không hỏi lại.** Bạn đã nói "mặc định COD" → skill không hỏi lại "COD hay online mặc định". Nó quét cả ý tưởng + câu trả lời trước + doc có sẵn.
- **Ngôn ngữ nghiệp vụ.** Skill hỏi "hệ thống làm gì" (validate, lưu, gửi email, gọi dịch vụ ngoài), **không** hỏi tên bảng DB / endpoint / framework / thuật toán. Nếu bạn thấy câu hỏi quá kỹ thuật → nhắc "đây là BA", skill sẽ hỏi lại bằng ngôn ngữ nghiệp vụ.

---

## Pha C — Tổng hợp + tự kiểm

Skill gom mọi câu trả lời → dựng 12 mục theo `_templates/brainstorm.md`, rồi **tự kiểm** trước khi ghi:

- Mỗi luồng có numbered steps + ASCII (nếu phức tạp)?
- Decision points có đủ nhánh chính?
- Interrupted-tx handling có (nếu external redirect)?
- Số liệu ở Mục 7.2 là **số cụ thể** (không "phù hợp")?
- Wording lỗi/thành công là **chuỗi exact**?
- Rủi ro dùng framing nghiệp vụ (không phải bug/infra)?
- Open Questions có ID `OQ-1, OQ-2…`?

Thiếu chỗ nào → skill in ra + đề xuất hỏi thêm. Bạn có thể chọn "cứ ghi với TBD".

---

## Pha D — Xem trước → ghi → Open Questions

1. **Xem trước (L1)** — skill mô tả bằng **ngôn ngữ nghiệp vụ** ("Em sẽ tạo file… với các luồng…, số liệu lockout 5 lần, wording lỗi…"). **Không** phải bảng path/action kiểu dev. Bạn gõ `Y` / sửa / đổi tên feature.
2. **Ghi** `docs/{feature}/brainstorms/{slug}.md` từ template.
3. **Xử lý Open Questions** — skill liệt kê OQ, hỏi bạn muốn chốt ngay không:
   - `Y` → hỏi từng OQ một; câu trả lời có thể **cập nhật lại** các mục liên quan (Assumptions/Risks…) qua diff.
   - `skip` → giữ OQ; khi bạn chạy `/urd`, `/brd`, `/srs` sau này, chúng **kế thừa** lại danh sách này và hỏi trong ngữ cảnh của chúng.

> Đây là điểm giữ **chuỗi thông tin liền mạch** — câu hỏi chưa trả lời không rơi rớt giữa các bước. Xem `explain-skills/brainstorm.md` phần resolve-oqs.

---

## Sau brainstorm

Skill gợi ý bước tiếp: `/urd` (góc người dùng) · `/brd` (business case) · `/prd-epic` (scope) · `/srs` (đặc tả). Brainstorm là **checkpoint** — không tự động chạy tiếp, bạn quyết định.

Nếu dự án có `docs/_product/prd.md` (PRD sản phẩm), brainstorm còn tự đề xuất đánh dấu feature "✅ đã chi tiết hóa" ngược lên Feature Map (bạn duyệt qua diff).
