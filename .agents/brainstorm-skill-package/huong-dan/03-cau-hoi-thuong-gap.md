# 03 — Câu hỏi thường gặp & mẹo

---

## Cài đặt

**H: `/brainstorm` cần cài công cụ gì không?**
Không. Khác bộ diagram-skills (cần mmdc/d2…), brainstorm chỉ cần Claude Code + workspace BA. Chỉ copy skill + 7 rule + template.

**H: Thiếu rule thì sao?**
Skill vẫn chạy nhưng thiếu quy ước — vd không có `approval-gate.md` thì có thể bỏ bước xem trước; không có `ba-conventions.md` thì có thể hỏi câu quá kỹ thuật. Copy đủ 7 rule cho chắc.

**H: Workspace chưa có `docs/` hay `CLAUDE.md`?**
Brainstorm là "điểm vào" — nó tự tạo `docs/{feature}/brainstorms/`. Nhưng nên có `CLAUDE.md` để skill biết quy ước vault. Nếu dùng bộ BA-KIT đầy đủ thì đã có sẵn.

---

## Hành vi phỏng vấn

**H: Skill hỏi tên bảng DB / endpoint / framework.**
Không đúng vai. Nhắc "đây là BA, không phải code" — skill sẽ hỏi lại bằng ngôn ngữ nghiệp vụ ("lưu thông tin gì?", "gọi dịch vụ nào?"). Đây là quy ước cứng trong `rules/ba-conventions.md`.

**H: Skill hỏi lại câu tôi đã trả lời.**
Không nên xảy ra (no re-ask). Nếu có, nhắc "cái này em nói ở trên rồi" — skill bỏ qua. Ở chế độ chạy lại (file brainstorm đã có), skill phải đọc file trước, chỉ hỏi phần thiếu.

**H: Tôi bị ép cho số liệu mà chưa biết.**
Skill hỏi lại **1 lần** với câu cụ thể hơn. Vẫn chưa biết → nói "để sau / chưa rõ", skill ghi `TBD` + biến thành Open Question. Nó **không** ép bạn bịa số.

**H: Phỏng vấn dài quá cho ý tưởng nhỏ.**
Nói "brainstorm nhanh gọn" / "shallow thôi" → skill chạy 1 lượt 6 câu, bỏ artifact bắt buộc. Hoặc `skip` từng nhóm bạn thấy không cần.

**H: Skill vẽ ASCII flow sai.**
Ở bước duyệt ASCII, nói rõ sửa gì ("thiếu nhánh COD", "gộp 2 bước này") — skill vẽ lại, tối đa 3 vòng. Sau đó bạn chỉnh tay trong file cũng được.

---

## Output & Open Questions

**H: File ghi ở đâu?**
`docs/{feature}/brainstorms/{idea-slug}.md`. Tên feature + idea do skill tự suy, bạn xác nhận/sửa ở bước xem trước (L1).

**H: Open Questions để làm gì?**
Là câu chưa chốt. Khi bạn chạy `/urd`, `/brd`, `/prd-epic`, `/srs` sau này, chúng **kế thừa** danh sách OQ này và hỏi lại trong ngữ cảnh của chúng — nên câu chưa trả lời không bị quên. Bạn chọn chốt ngay (`Y`) hoặc để dành (`skip`) ở cuối brainstorm.

**H: Chạy lại `/brainstorm` cho feature đã có?**
Skill vào chế độ cập nhật — đọc file cũ trước, chỉ hỏi phần thiếu, và xem **diff** trước khi ghi đè (L2). Không hỏi lại từ đầu.

**H: Brainstorm có tự viết URD/PRD luôn không?**
Không. Brainstorm là **checkpoint riêng** — nó dừng lại, gợi ý bước tiếp, bạn quyết định chạy `/urd`… Đây là chủ ý: tách "làm rõ ý tưởng" khỏi "đặc tả".

---

## Mẹo để brainstorm chất lượng

1. **Trả lời cụ thể ngay từ đầu** — số liệu, wording thật. Đỡ bị hỏi lại (xem `02-huong-dan-phong-van.md`).
2. **Tách luồng con rõ ràng** — online vs COD, new vs returning. Skill vẽ mỗi luồng một ASCII.
3. **Nghĩ rủi ro theo nghiệp vụ** — ai mất gì, mất bao nhiêu, vì sao. Không phải "API chậm".
4. **Chưa biết thì để OQ** — đừng bịa. OQ có giá trị: nó theo bạn xuống tận SRS.
5. **Đối chiếu ví dụ** — `example/food-delivery-checkout.md` cho thấy độ sâu mong đợi.

---

## Vẫn kẹt?

- Đọc `explain-skills/brainstorm.md` (giải thích skill bằng ngôn ngữ nghiệp vụ).
- Đọc SKILL.md gốc trong `claude-code/.claude/skills/brainstorm/` (chi tiết cho AI).
- Học đầy đủ quy trình BA-with-AI: [ai4ba.com](https://ai4ba.com).
