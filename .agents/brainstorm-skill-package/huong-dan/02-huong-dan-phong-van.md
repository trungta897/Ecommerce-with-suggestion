# 02 — Hướng dẫn phỏng vấn: 7 nhóm câu hỏi

> Skill hỏi từng nhóm một. Phần này giải thích **mỗi nhóm hỏi gì** và **trả lời sao cho brainstorm chất lượng**. Đối chiếu với `example/food-delivery-checkout.md` để thấy câu trả lời tốt trông thế nào.

Mẹo chung: trả lời cụ thể, có số liệu, có wording thật. Chưa biết → cứ nói "chưa rõ / để sau" — skill ghi thành Open Question, không ép.

---

## Nhóm 1 — Tổng quan

**Skill hỏi:** Feature làm gì (góc user)? Giải pain gì, ai bị? Vì sao làm bây giờ?

**Trả lời tốt:** nêu pain cụ thể + tín hiệu (số liệu, request từ ai, deadline).
> ✅ "40% khách bỏ giỏ ở bước gọi điện đặt; đối thủ đều có checkout online."
> ❌ "Để app tốt hơn."

---

## Nhóm 2 — Người dùng & truy cập

**Skill hỏi:** Vai trò nào dùng? Cần điều kiện gì để truy cập (đăng nhập/gói/quyền)? Vào feature từ đâu? Ước lượng số user?

**Trả lời tốt:** liệt kê từng vai + điều họ cần.
> ✅ "Khách đã đăng nhập, Nhà hàng, Shipper, CSKH. Khách vào từ màn giỏ hàng."

---

## Nhóm 3 — Luồng chính (happy path)

**Skill hỏi:** Đi từng bước — user làm gì → hệ thống làm gì → user thấy gì? Có sub-flow khác (vd online vs COD)? Output cuối + có gửi thông báo/email không?

**Trả lời tốt:** kể tuần tự, tách các luồng con.
> ✅ "Luồng online: chọn món → tính tiền → chọn thanh toán → cổng thu → gửi nhà hàng… Luồng COD thì bỏ bước thu tiền trước."

Skill sẽ dựng **numbered steps + ASCII diagram** từ đây (xem Mục 5 của ví dụ).

---

## Nhóm 4 — Đi sâu (chỉ khi có tín hiệu phức tạp)

Chỉ chạy nếu ý tưởng có thanh toán/OAuth/webhook/nhiều nhánh. Gồm:

**4a. Hệ thống làm gì (mức nghiệp vụ)** — mỗi bước hệ thống làm gì: "validate địa chỉ", "gọi cổng thanh toán", "gửi đơn nhà hàng". Cần lưu **loại thông tin nghiệp vụ** nào (email, trạng thái, ngày). Gọi **dịch vụ ngoài** nào (chỉ tên + mục đích: "cổng thanh toán để thu tiền").
> ⚠️ Skill **không** hỏi tên bảng DB, endpoint, SDK. Nếu bị hỏi → nhắc "đây là BA".

**4b. Decision points** — mỗi if/else nghiệp vụ: điều kiện + nhánh YES/NO.
> ✅ "Thanh toán online? → YES gọi cổng / NO gửi thẳng (COD)."

**4c. State transitions** — entity nào có trạng thái, liệt kê `A → B → C`, trigger mỗi bước, có quay lại được không.
> ✅ "Order: pending_payment → paid → restaurant_accepted → … → delivered."

**4d. Interrupted transactions** (bắt buộc nếu có redirect/webhook) — user đóng app giữa flow còn gì, dịch vụ ngoài fail thì sao, webhook về trùng, 2 thiết bị cùng thao tác.
> ✅ "Khách đóng app khi ở cổng thanh toán → đơn giữ pending_payment; nếu webhook thu tiền về thì tiếp, quá 15' không thu thì auto-hủy."

**4e. ASCII flow** — skill vẽ v1, bạn duyệt "đúng chưa, sửa gì" (tối đa 3 vòng).

**4f. Scenario matrix** — skill dựng bảng combo (from-state × rule → action) từ câu trả lời, bạn xác nhận.

---

## Nhóm 5 — Validation, giới hạn & wording (quan trọng nhất)

**Skill hỏi:** Field bắt buộc + format? **Giới hạn số cụ thể** (rate limit X/phút, chờ Y phút, lockout Z lần)? Business rule? **Câu lỗi chính xác**? **Câu thành công chính xác**? **Câu thông tin/trung tính**?

Đây là nơi skill **ép độ cụ thể** — vì `/srs` sau này cần số liệu + wording thật cho Error Matrix.
> ✅ "Chờ nhà hàng 5 phút, chờ shipper 15 phút. Lỗi: 'Thanh toán không thành công. Vui lòng kiểm tra thẻ/ví và thử lại.'"
> ❌ "Rate limit phù hợp; báo lỗi khi fail." → skill hỏi lại "bao nhiêu phút? câu chính xác là gì?"

Wording chia 3 nhóm: **error / success / info** (xem Mục 7.3 của ví dụ).

---

## Nhóm 6 — Ngữ cảnh hệ thống (mức nghiệp vụ)

**Skill hỏi:** Cần lưu thêm **loại thông tin** gì (danh sách thiết bị, lịch sử đơn…)? Dịch vụ ngoài nào (email/OAuth/payment/SMS — tên + mục đích)? Thông báo qua kênh nào + khi nào? Có việc nền/định kỳ không (chỉ nhu cầu nghiệp vụ)? Có cần real-time không?

> ⚠️ Vẫn là mức nghiệp vụ — **không** hỏi cron syntax, queue, websocket, table name.

---

## Nhóm 7 — Edge case, rủi ro, câu hỏi mở

**Skill hỏi:** Mất mạng giữa flow? Dịch vụ ngoài chết? Thao tác đồng thời? Giao dịch bỏ dở (TTL, cleanup, resume)? Top 3 **rủi ro nghiệp vụ** (khả năng + hậu quả nghiệp vụ + cách phòng)? Còn chưa rõ gì → Open Questions?

**Rủi ro phải là nghiệp vụ, không phải bug/infra:**
> ✅ "Khách quen COD ngại thanh toán online → không đạt mục tiêu không-tiền-mặt."
> ❌ "API cổng thanh toán chậm; DB bị lock."

Các loại rủi ro nghiệp vụ: adoption (người dùng không theo), vendor (đối tác đổi phí), compliance (thiếu tài liệu audit), process (team chưa được train), timeline (legal chậm), data (dữ liệu cũ thiếu trường).

---

## Tổng kết: câu trả lời tốt vs kém

| Chủ đề | ❌ Kém | ✅ Tốt |
|---|---|---|
| Giới hạn | "có rate limit" | "khóa sau 5 lần sai trong 15 phút" |
| Wording | "báo lỗi" | "'Thanh toán không thành công. Vui lòng thử lại.'" |
| Rủi ro | "API chậm" | "nhà hàng phản hồi chậm giờ cao điểm → nhiều đơn auto-hủy" |
| Hệ thống làm gì | "insert vào bảng orders" | "tạo đơn + gửi thông báo cho nhà hàng" |
| Dịch vụ ngoài | "gọi POST /v1/charges" | "cổng thanh toán để thu tiền" |

Chưa biết đáp án cụ thể? Cứ để **Open Question** — brainstorm sẽ mang nó xuống `/urd`, `/srs` để chốt sau, không rơi rớt.
