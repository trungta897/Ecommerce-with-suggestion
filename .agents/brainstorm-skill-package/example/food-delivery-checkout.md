---
type: brainstorm
feature: food-delivery
status: draft
updated: 2026-07-15
links:
  - docs/_product/prd.md
---

# Đặt món & thanh toán (checkout đa phương thức)

## 1. Idea Seed

Thêm luồng đặt món và thanh toán cho app giao đồ ăn: khách chọn món từ một nhà hàng, xác nhận địa chỉ giao, chọn thanh toán online (thẻ/ví) hoặc COD, hệ thống tính tiền và điều phối đơn cho nhà hàng + shipper. Cần xử lý các trường hợp: thanh toán thất bại, nhà hàng từ chối, hết shipper, khách hủy, giao thất bại + hoàn tiền.

## 2. Context

App giao đồ ăn đang có màn duyệt menu nhưng chưa có checkout hoàn chỉnh — hiện chỉ "gọi điện đặt". Mục tiêu quý này: đưa đặt-online + thanh-toán vào để giảm đơn rớt do gọi điện và mở kênh thanh toán không tiền mặt. Tín hiệu: 40% khách bỏ giỏ ở bước "gọi để đặt". Đối thủ (GrabFood, ShopeeFood) đều có checkout online + hoàn tiền tự động.

## 3. User Types (preliminary)

| User Type | Pain Point | Primary Need |
|-----------|-----------|--------------|
| Khách (đã đăng nhập) | Đặt qua điện thoại phiền, không biết phí ship trước | Đặt nhanh, thấy tổng tiền rõ, thanh toán linh hoạt |
| Nhà hàng | Nhận đơn qua điện thoại dễ sót, không kiểm soát được đơn | Nhận đơn có cấu trúc, xác nhận/từ chối rõ ràng |
| Shipper | Không biết đơn nào gần, giao nhầm | Được gán đơn gần nhất, xác nhận lấy/giao |
| CSKH | Xử lý khiếu nại thủ công, không có dấu vết | Thấy trạng thái đơn + xử lý hoàn tiền có kiểm soát |

## 4. Capabilities Breakdown

### P0 — must have
- Chọn món từ 1 nhà hàng + xem giỏ + tổng tiền (món + phí ship + khuyến mãi).
- Thanh toán online (cổng thanh toán) và COD.
- Điều phối đơn: gửi nhà hàng, nhà hàng xác nhận/từ chối, gán shipper.
- Hoàn tiền tự động khi nhà hàng từ chối / hết shipper (nếu đã thu online).
- Theo dõi trạng thái đơn (khách thấy đơn đang ở bước nào).

### P1 — should have
- Xử lý giao thất bại chuyển CSKH + hoàn tiền một phần.
- Đánh giá đơn sau khi nhận.
- Khuyến mãi/mã giảm giá áp vào tổng tiền.

### P2 — nice to have
- Đặt từ nhiều nhà hàng trong 1 đơn.
- Lưu địa chỉ + phương thức thanh toán cho lần sau.
- Đặt lịch giao (giao sau).

## 5. Core Flows (Happy Path)

### 5.1 Đặt món + thanh toán online (happy path)

1. Khách chọn món từ nhà hàng, thêm vào giỏ, mở giỏ.
2. Hệ thống tính tổng tiền (món + phí ship + khuyến mãi) và hiển thị.
3. Khách xác nhận địa chỉ giao + chọn "Thanh toán online".
4. Hệ thống tạo giao dịch, chuyển sang cổng thanh toán.
5. Khách nhập thông tin thẻ/ví, cổng thu tiền thành công (gửi webhook về hệ thống).
6. Hệ thống gửi đơn cho nhà hàng, nhà hàng xác nhận và bắt đầu chuẩn bị.
7. Hệ thống gán shipper gần nhất; shipper nhận cuốc.
8. Khách thấy "Đơn đã được nhận, đang chuẩn bị" + theo dõi shipper trên bản đồ.
9. Shipper lấy món, giao tới khách; khách nhận món.
10. Hệ thống ghi nhận hoàn tất; mời khách đánh giá.

```
[Khách] chọn món ─▶ [Hệ thống] tính tiền ─▶ [Khách] chọn thanh toán online
                                                        │
                                                        ▼
                                        [Hệ thống] gọi cổng thanh toán
                                                        │
                                          ┌─────────────┴─────────────┐
                                     thu tiền OK                  thu tiền FAIL
                                          │                            │
                                          ▼                            ▼
                              [Hệ thống] gửi đơn NH          "Thanh toán thất bại,
                                          │                    vui lòng thử lại"
                              ┌───────────┴───────────┐              (dừng)
                         NH xác nhận            NH từ chối/quá 5'
                              │                        │
                              ▼                        ▼
                    [Hệ thống] gán shipper    [Hệ thống] hoàn tiền
                              │                        │
                              ▼                        ▼
                    shipper giao ─▶ khách nhận   "Đã hoàn tiền" (dừng)
                              │
                              ▼
                       Hoàn tất + mời đánh giá
```

### 5.2 Đặt món COD (happy path)

1. Khách chọn món, mở giỏ, xác nhận địa chỉ + chọn "Thanh toán khi nhận (COD)".
2. Hệ thống bỏ qua bước thu tiền trước, gửi thẳng đơn cho nhà hàng.
3. Nhà hàng xác nhận + chuẩn bị; hệ thống gán shipper.
4. Shipper giao, thu tiền mặt khi khách nhận món.
5. Hệ thống ghi nhận đã thanh toán + hoàn tất.

```
[Khách] chọn COD ─▶ [Hệ thống] gửi đơn NH ─▶ NH xác nhận ─▶ gán shipper
                                                                  │
                                                                  ▼
                                          shipper giao ─▶ thu tiền mặt ─▶ hoàn tất
```

## 6. System Behavior Deep Dive

### 6.1 Decision Points

| ID | Flow | Khi nào | YES (nhánh đồng ý) | NO (nhánh từ chối) |
|---|---|---|---|---|
| D1 | Checkout | Thanh toán online? | Gọi cổng thanh toán | Gửi thẳng đơn (COD) |
| D2 | Checkout | Cổng thu tiền thành công? | Gửi đơn cho nhà hàng | Báo "Thanh toán thất bại", dừng |
| D3 | Điều phối | Nhà hàng nhận đơn trong 5 phút? | Chuẩn bị món + gán shipper | Hoàn tiền (nếu đã thu) + hủy đơn |
| D4 | Điều phối | Có shipper nhận trong 15 phút? | Shipper lấy món + giao | Hoàn tiền + hủy đơn |
| D5 | Giao hàng | Giao thành công? | Ghi nhận hoàn tất | Chuyển CSKH xử lý / hoàn tiền |
| D6 | Thanh toán | Đơn là COD? | Shipper thu tiền mặt | Ghi nhận đã thanh toán online |

### 6.2 Scenario Matrix (has_multi_role — Khách/Nhà hàng/Shipper/CSKH)

| From State | To State | Rule | Action | Result |
|------------|----------|------|--------|--------|
| Đã đặt (online) | Đã thanh toán | Cổng thu OK | Gửi đơn NH | NH nhận thông báo đơn mới |
| Đã thanh toán | Nhà hàng nhận | NH bấm xác nhận | Bắt đầu chuẩn bị | Khách thấy "đang chuẩn bị" |
| Đã thanh toán | Hoàn tiền | NH từ chối / quá 5' | Gọi cổng hoàn tiền | Khách nhận "đã hoàn tiền" |
| Đang giao | Giao thất bại | Không liên lạc khách 3 lần/10' | Chuyển CSKH | CSKH quyết định hoàn tiền |
| Đang giao (COD) | Hoàn tất | Khách nhận + trả tiền | Ghi nhận đã thu | Đơn đóng, mời đánh giá |

### 6.3 State Transitions (has_state_machine)

```
Order: pending_payment → paid → restaurant_accepted → preparing
                                                          → ready_for_pickup → delivering → delivered
     pending_payment → cancelled (thanh toán fail / khách hủy)
     paid → refunding → refunded (NH từ chối / hết shipper)
     delivering → delivery_failed → refunding (CSKH duyệt)
```

| Entity | Từ | Sang | Trigger | Quay lại được? |
|--------|------|----|---------|-------------|
| Order | pending_payment | paid | Cổng thu tiền OK | không |
| Order | pending_payment | cancelled | Thanh toán fail / khách hủy | không |
| Order | paid | restaurant_accepted | NH xác nhận | không |
| Order | paid | refunding | NH từ chối / hết shipper | không |
| Order | delivering | delivered | Khách nhận món | không |
| Order | delivering | delivery_failed | Không liên lạc được khách | không |
| Payment | authorized | captured | NH nhận đơn (thu thật) | không |
| Payment | captured | refunded | Hoàn tiền toàn phần | không |

### 6.4 Interrupted Transactions (has_external_redirect — cổng thanh toán + webhook)

| Tình huống | Hệ thống còn lại gì | Resume | Cleanup |
|---|---|---|---|
| Khách đóng app khi đang ở cổng thanh toán | Order `pending_payment`, chưa có webhook | Khách mở lại đơn → nếu cổng đã thu (webhook về) thì tiếp; chưa thu thì cho thử lại | Đơn `pending_payment` quá 15' không thu → auto-hủy |
| Cổng thanh toán timeout / không gửi webhook | Order `pending_payment`, tiền có thể đã trừ | Đối soát với cổng: nếu đã thu → chuyển `paid` + gửi đơn; chưa thu → hủy | Job đối soát chạy mỗi 10' |
| Webhook "thu tiền OK" về TRÙNG (2 lần) | Order đã `paid` | Bỏ qua webhook trùng (idempotency theo mã giao dịch) | — |
| Khách bấm "Đặt lại" khi đơn cũ còn pending | 2 order cùng giỏ | Chặn tạo đơn mới khi còn đơn `pending_payment` cùng nhà hàng < 15' | Nhắc khách "Bạn còn đơn đang chờ thanh toán" |
| 2 shipper cùng bấm nhận 1 đơn | 1 delivery được gán | Đơn gán cho shipper bấm trước; shipper sau nhận "Đơn đã có người nhận" | — |

### 6.5 Other Edge Cases

- Món hết khi khách đang ở giỏ → khi xác nhận, hệ thống báo "Món {tên} vừa hết, vui lòng chọn lại" và cập nhật giỏ.
- Địa chỉ giao ngoài vùng phục vụ của nhà hàng → chặn ở bước tính phí ship, báo "Nhà hàng không giao tới khu vực này".
- Mất mạng khi đang theo dõi shipper → màn theo dõi hiển thị trạng thái gần nhất + tự cập nhật khi có mạng lại.
- Khuyến mãi hết hạn giữa lúc đặt → tính lại tổng tiền, báo "Mã khuyến mãi đã hết hạn".
- COD nhưng khách không có mặt khi giao → shipper báo giao thất bại → CSKH liên hệ, không phát sinh hoàn tiền (chưa thu).

## 7. Validation, Limits & Wording

### 7.1 Validation rules

| Field | Rule |
|---|---|
| Giỏ hàng | Bắt buộc ≥1 món; tất cả món cùng 1 nhà hàng (P0 không cho đa nhà hàng) |
| Địa chỉ giao | Bắt buộc; phải trong vùng phục vụ của nhà hàng |
| Phương thức thanh toán | Bắt buộc chọn 1 (online / COD) |
| Mã khuyến mãi | Tùy chọn; nếu nhập phải còn hạn + đủ điều kiện đơn tối thiểu |
| Tổng tiền | ≥ giá trị đơn tối thiểu của nhà hàng (nếu có) |

### 7.2 Limits & Quotas (exact values)

| Tham số | Giá trị | Window | Behavior khi vượt |
|---|---|---|---|
| Chờ nhà hàng xác nhận | 5 phút | / đơn | Quá hạn → auto-hủy + hoàn tiền |
| Chờ gán shipper | 15 phút | / đơn | Quá hạn → auto-hủy + hoàn tiền |
| Đơn pending_payment chưa thu | 15 phút | / đơn | Auto-hủy đơn |
| Thử liên lạc khách khi giao | 3 lần trong 10 phút | / đơn | Quá → shipper báo giao thất bại |
| Đơn pending cùng nhà hàng | tối đa 1 | / khách / nhà hàng | Chặn tạo đơn thứ 2 khi đơn cũ < 15' |

### 7.3 Wording samples (exact strings)

#### Error messages

| Tình huống | Wording | Code |
|---|---|---|
| Thanh toán thất bại | "Thanh toán không thành công. Vui lòng kiểm tra thẻ/ví và thử lại." | E-? |
| Nhà hàng từ chối | "Nhà hàng không nhận đơn lúc này. Đơn đã được hủy và hoàn tiền (nếu có)." | E-? |
| Hết shipper | "Hiện chưa có tài xế nhận đơn. Đơn đã được hủy và hoàn tiền (nếu có)." | E-? |
| Ngoài vùng giao | "Nhà hàng không giao tới khu vực này." | E-? |
| Món hết | "Món {tên} vừa hết, vui lòng chọn lại." | E-? |
| Còn đơn chờ | "Bạn còn một đơn đang chờ thanh toán ở nhà hàng này." | E-? |

#### Success messages

| Tình huống | Wording |
|---|---|
| Đặt thành công | "Đặt hàng thành công! Nhà hàng đang xác nhận đơn của bạn." |
| Đã hoàn tiền | "Đơn đã được hủy. Số tiền {amount} sẽ hoàn về trong 1–3 ngày làm việc." |
| Giao hoàn tất | "Đơn đã giao thành công. Chúc bạn ngon miệng!" |

#### Info / neutral messages

| Tình huống | Wording |
|---|---|
| Đang chờ nhà hàng | "Đang chờ nhà hàng xác nhận…" |
| Đang tìm shipper | "Đang tìm tài xế gần bạn…" |
| Shipper đang giao | "Tài xế đang trên đường giao tới bạn." |

## 8. Assumptions

- Mỗi đơn thuộc đúng 1 nhà hàng (P0). Đa nhà hàng để P2.
- Cổng thanh toán gửi webhook xác nhận thu/hoàn tiền (không chỉ redirect).
- Hoàn tiền chỉ áp dụng cho đơn đã thu online; COD hủy trước khi thu → không phát sinh hoàn.
- Vùng phục vụ + phí ship do nhà hàng cấu hình sẵn (không tính động theo khoảng cách ở P0).
- Region: Việt Nam; tiền tệ VND.

## 9. Risks

| Rủi ro | Khả năng | Hậu quả nghiệp vụ | Cách phòng |
|--------|----------|-------------------|-----------|
| Cổng thanh toán không gửi webhook / gửi trễ | thỉnh thoảng | Đơn kẹt `pending_payment`, khách bị trừ tiền nhưng đơn không chạy | Job đối soát mỗi 10' + hoàn tiền tự động nếu không có đơn |
| Nhà hàng phản hồi chậm giờ cao điểm | thường | Nhiều đơn bị auto-hủy → khách bực, giảm conversion | Cảnh báo nhà hàng + cho phép nới thời gian giờ cao điểm |
| Hết shipper khu vực xa | thỉnh thoảng | Đơn hủy nhiều ở vùng rìa → mất khách khu vực đó | Giới hạn vùng phục vụ rõ + hiển thị "khu vực chưa hỗ trợ" |
| CSKH chưa được train luồng hoàn tiền một phần | thường | Xử lý sai số tiền hoàn → complaint / tranh chấp | Tài liệu vận hành + giới hạn quyền hoàn tiền theo mức |
| Khách quen COD, ngại thanh toán online | thường | Tỷ lệ online thấp, không đạt mục tiêu không-tiền-mặt | Giữ COD song song + khuyến mãi cho thanh toán online |

## 10. Success Criteria (preliminary)

- Tỷ lệ bỏ giỏ ở bước checkout < 20% (hiện 40% ở bước "gọi để đặt").
- ≥ 30% đơn thanh toán online trong 3 tháng đầu.
- Thời gian từ "đặt" đến "nhà hàng xác nhận" < 3 phút (trung vị).
- Tỷ lệ đơn auto-hủy do quá hạn xác nhận/shipper < 8%.

## 11. Open Questions

- [ ] OQ-1: Hoàn tiền một phần khi giao thiếu món — tính theo giá món hay có phí xử lý? (chờ chính sách CSKH)
- [ ] OQ-2: Phí ship tính cố định theo nhà hàng hay động theo khoảng cách? (P0 giả định cố định — cần xác nhận)
- [ ] OQ-3: Có cho hủy đơn sau khi nhà hàng đã xác nhận không, và ai chịu phí? (chờ thỏa thuận với nhà hàng)
- [ ] OQ-4: Cổng thanh toán nào (VNPay / Momo / cả hai)? Ảnh hưởng phí + luồng webhook.

## 12. Next Steps

Sau brainstorm này (sau khi BA approve):
- `/urd food-delivery` — capture góc nhìn người dùng (inherit OQ còn hold)
- `/brd food-delivery` — business case (mục tiêu không-tiền-mặt, ROI)
- `/prd-epic food-delivery` — product scope (P0/P1/P2 ở trên)
- `/srs food-delivery` — đặc tả kỹ thuật (FR/NFR/Error Matrix, hình thức hóa OQ)
