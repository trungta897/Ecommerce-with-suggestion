# Ví dụ đầy đủ — Brainstorm feature `food-delivery` (checkout đa phương thức)

> Một **output thật** do `/brainstorm` sinh ra cho feature nhiều luồng, nhiều vai trò (Khách · Nhà hàng · Shipper · CSKH). Dùng làm bản mẫu để đối chiếu khi bạn chạy skill trên ý tưởng của mình — "đúng thì trông thế nào".

File: **`food-delivery-checkout.md`** (trong thư mục này). Trong workspace thật, brainstorm sẽ ghi vào `docs/food-delivery/brainstorms/food-delivery-checkout.md`.

---

## Vì sao chọn ví dụ này

Feature "đặt món & thanh toán" đủ phức tạp để kích hoạt **mọi artifact bắt buộc** của brainstorm deep mode:

| Tín hiệu phức tạp | Trong ví dụ | Artifact được kích hoạt |
|---|---|---|
| Cổng thanh toán + webhook (external redirect) | Thanh toán online, webhook thu tiền | **Interrupted-tx matrix** (Mục 6.4) |
| ≥2 nhánh quyết định | 6 decision points (D1–D6) | **Decision Points table** (Mục 6.1) |
| Nhiều vai trò / trạng thái đầu vào | Khách/Nhà hàng/Shipper/CSKH | **Scenario matrix** (Mục 6.2) |
| Entity có trạng thái | Order 11 trạng thái, Payment | **State transitions table** (Mục 6.3) |
| Luồng phân nhánh | Online vs COD, nhiều nhánh lỗi | **ASCII flow diagram** per flow (Mục 5) |

---

## Bản đồ 12 mục (theo `_templates/brainstorm.md`)

| Mục | Nội dung trong ví dụ |
|---|---|
| 1. Idea Seed | Câu mô tả gốc |
| 2. Context | Vì sao làm bây giờ (40% bỏ giỏ ở bước gọi điện) |
| 3. User Types | 4 vai trò + pain + need |
| 4. Capabilities | P0/P1/P2 |
| 5. Core Flows | 2 flow (online + COD) kèm **ASCII diagram** |
| 6.1 Decision Points | 6 điểm rẽ D1–D6 |
| 6.2 Scenario Matrix | 5 kịch bản đa vai trò |
| 6.3 State Transitions | Order + Payment |
| 6.4 Interrupted Tx | 5 tình huống gián đoạn thanh toán/webhook |
| 6.5 Other Edge Cases | Món hết, ngoài vùng, mất mạng… |
| 7.1–7.3 | Validation + **limits số cụ thể** (5'/15'/3 lần) + **wording exact** (error/success/info) |
| 8. Assumptions | 5 giả định cần verify |
| 9. Risks | 5 rủi ro **nghiệp vụ** (IT-BA framing, không phải bug/infra) |
| 10. Success Criteria | Chỉ số đo được (bỏ giỏ < 20%, ≥30% online…) |
| 11. Open Questions | 4 OQ có ID, sẽ inherit xuống URD/BRD/SRS |
| 12. Next Steps | Lệnh downstream gợi ý |

---

## Điểm đáng học từ ví dụ

- **Số liệu cụ thể, không mơ hồ.** "Chờ nhà hàng 5 phút", "3 lần trong 10 phút" — không viết "rate limit phù hợp". Đây là điều brainstorm **push** bạn cung cấp.
- **Wording exact.** Câu lỗi/thành công là chuỗi đúng người dùng sẽ thấy, tiếng Việt tự nhiên — sau này map sang Error Matrix ở `/srs`.
- **Rủi ro nghiệp vụ, không kỹ thuật.** "Khách quen COD ngại online → không đạt mục tiêu" — chứ không phải "API chậm", "DB lock".
- **Open Questions có ID.** OQ-1…OQ-4 sẽ được `/urd`, `/brd`, `/srs` **inherit** và hỏi lại đúng ngữ cảnh (xem `explain-skills/brainstorm.md` về resolve-oqs).

---

## Liên kết với bộ diagram-skills

Feature `food-delivery` này cũng là ví dụ trong **bộ diagram-skills** (`dist/diagram-skills-package/`). Brainstorm là **bước trước** khi vẽ sơ đồ: từ brainstorm này bạn có đủ luồng + trạng thái + decision points để chạy tiếp `/sequence`, `/state`, `/activity-swimlane`, `/bpmn`… Đây là minh họa quy trình BA-with-AI đầy đủ dạy ở [ai4ba.com](https://ai4ba.com).
