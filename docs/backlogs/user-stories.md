# User Stories — Hệ thống bán lẻ điện tử tích hợp gợi ý sản phẩm

## 1. Mục đích

Tài liệu chuyển đổi các yêu cầu trong `docs/SRS.md` thành backlog User Story có thể dùng chung cho Business Analyst, phát triển và kiểm thử. Mỗi User Story được truy vết về yêu cầu nguồn và có tiêu chí nghiệm thu theo cú pháp Given/When/Then.

## 2. Vai trò

| Vai trò                  | Mô tả                                                                                                                                                                                                            |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Guest                    | Người chưa đăng nhập, có thể duyệt sản phẩm, quản lý giỏ cục bộ, tra cứu đơn và bắt đầu checkout.                                                                                                                |
| Người dùng chưa xác thực | Tài khoản đã được tạo nhưng chưa hoàn tất xác thực email và đặt mật khẩu.                                                                                                                                        |
| Khách hàng               | Người dùng đã xác thực, có thể đặt hàng, thanh toán và quản lý hoạt động mua hàng.                                                                                                                               |
| Nhân viên                | Người vận hành tác vụ đơn hàng hàng ngày (duyệt đơn, ghi nhận giao hàng, duyệt yêu cầu trả hàng, kiểm duyệt đánh giá). Không có quyền với danh mục, sản phẩm, voucher, tài khoản Admin, hoặc thao tác hoàn tiền. |
| Admin                    | Người vận hành danh mục, sản phẩm, voucher, dashboard, tài khoản hoàn tiền và có toàn bộ quyền của Nhân viên.                                                                                                    |
| Super Admin              | Quản trị viên có quyền quản lý tài khoản Admin và Nhân viên.                                                                                                                                                     |
| Hệ thống gợi ý           | Thành phần cung cấp kết quả gợi ý và cơ chế dự phòng.                                                                                                                                                            |

Các công việc phục vụ vận hành kỹ thuật hoặc đánh giá học thuật không đại diện cho nhu cầu trực tiếp của một vai trò người dùng được xếp riêng tại nhóm **Technical Stories**.

## 3. Quy ước

- ID có dạng `US-<EPIC>-<số thứ tự>`.
- Mức ưu tiên dùng `Must`, `Should`, `Could` theo phạm vi và lịch trình.
- Trạng thái đơn hàng sử dụng: `pending_payment`, `pending`, `confirmed`, `handed_over`, `delivering`, `completed`, `return_requested`, `return_rejected`, `returned`, `refunded`, `cancelled`.
- Các tác vụ hết hạn đơn dùng chung một quy tắc hủy và hoàn tồn kho có tính idempotent: tác vụ xử lý điều kiện trước sẽ chuyển trạng thái và hoàn tồn kho; tác vụ chạy sau không được hoàn tồn kho lần thứ hai.

## 4. Epic AUTH — Tài khoản và xác thực

### US-AUTH-01 — Đăng ký tài khoản

**User Story:** Là Guest, tôi muốn đăng ký tài khoản bằng email để có thể sử dụng các chức năng dành cho khách hàng.

**Ưu tiên:** Must  
**Truy vết:** FR-01, Mục 5.3, NFR bảo mật

**Acceptance Criteria:**

1. **Given** Guest cung cấp thông tin đăng ký hợp lệ, **when** gửi yêu cầu đăng ký (vượt qua reCAPTCHA nếu phát hiện nghi ngờ spam), **then** hệ thống tạo tài khoản chưa xác thực và bắt đầu luồng xác thực email.
2. **Given** phát hiện hành vi spam (điểm reCAPTCHA < `0.5`), **when** Guest gửi yêu cầu, **then** hệ thống từ chối đăng ký.
3. **Given** dữ liệu đầu vào không hợp lệ, **when** Guest gửi yêu cầu, **then** hệ thống không tạo tài khoản và trả phản hồi lỗi phù hợp.

### US-AUTH-02 — Đăng nhập

**User Story:** Là khách hàng, tôi muốn đăng nhập an toàn để truy cập tài khoản và các chức năng cá nhân.

**Ưu tiên:** Must  
**Truy vết:** FR-01, Mục 5.3, NFR bảo mật

**Acceptance Criteria:**

1. **Given** tài khoản hợp lệ, đã xác thực và thông tin đăng nhập chính xác, **when** người dùng đăng nhập, **then** hệ thống cấp phiên đăng nhập.
2. **Given** thông tin đăng nhập không chính xác, **when** người dùng đăng nhập, **then** hệ thống từ chối truy cập và không tiết lộ thông tin nhạy cảm.
3. **Given** có dấu hiệu spam (điểm reCAPTCHA < `0.5`), **when** người dùng gửi yêu cầu đăng nhập, **then** hệ thống chặn yêu cầu.

### US-AUTH-03 — Xác thực email bằng OTP

**User Story:** Là người dùng chưa xác thực, tôi muốn xác thực email bằng OTP để kích hoạt tài khoản.

**Ưu tiên:** Must  
**Truy vết:** FR-02, FR-E1, Mục 3.5.1

**Acceptance Criteria:**

1. **Given** OTP còn hiệu lực, **when** người dùng nhập đúng OTP, **then** hệ thống xác thực email, cấp lại quyền truy cập đã xác thực và yêu cầu người dùng tự đặt mật khẩu.
2. **Given** OTP sai và số lần sai nhỏ hơn 5, **when** người dùng xác nhận, **then** hệ thống hiển thị “Mã OTP không chính xác, vui lòng kiểm tra lại”.
3. **Given** người dùng nhập sai OTP lần thứ 5, **when** xác nhận, **then** hệ thống khóa chức năng gửi lại OTP trong 15 phút.

### US-AUTH-04 — Đặt mật khẩu sau xác thực

**User Story:** Là người dùng vừa xác thực email, tôi muốn tự đặt mật khẩu để hoàn tất kích hoạt tài khoản an toàn (Không sử dụng mật khẩu mặc định qua email).

**Ưu tiên:** Must  
**Truy vết:** FR-02, Mục 3.5.1, Mục 4.2

**Acceptance Criteria:**

1. **Given** người dùng vừa xác thực OTP thành công, **when** cung cấp mật khẩu đáp ứng tối thiểu một chữ hoa, một chữ số và một ký tự đặc biệt, **then** hệ thống lưu mật khẩu an toàn và đánh dấu tài khoản đã xác thực.
2. **Given** người dùng đang trong luồng mua hàng (Checkout), **when** đặt mật khẩu thành công, **then** hệ thống tự động điều hướng (redirect) về lại trang đơn hàng trước đó và tự động điền thông tin (merge cart & auto-fill).
3. **Given** mật khẩu không đáp ứng chính sách, **when** người dùng gửi yêu cầu, **then** hệ thống từ chối và yêu cầu sửa.

### US-AUTH-05 — Khôi phục mật khẩu

**User Story:** Là Guest hoặc khách hàng, tôi muốn khôi phục mật khẩu qua email đăng ký để lấy lại quyền truy cập.

**Ưu tiên:** Must  
**Truy vết:** FR-03, FR-E4

**Acceptance Criteria:**

1. **Given** yêu cầu hợp lệ, **when** người dùng yêu cầu khôi phục, **then** hệ thống gửi link hoặc OTP khôi phục đến email.
2. **Given** link hoặc OTP còn trong thời hạn 15 phút, **when** người dùng xác minh, **then** hệ thống cho phép đặt mật khẩu mới.

### US-AUTH-06 — Quản lý Profile

**User Story:** Là khách hàng, tôi muốn quản lý thông tin cá nhân (Profile) bao gồm cập nhật tên, ảnh đại diện và địa chỉ giao hàng mặc định.

**Ưu tiên:** Should  
**Truy vết:** FR-14

**Acceptance Criteria:**

1. **Given** khách hàng đã đăng nhập, **when** cập nhật các thông tin Profile hợp lệ, **then** hệ thống lưu và hiển thị thông tin mới.
2. **Given** khách hàng cập nhật địa chỉ mặc định, **when** đặt hàng lần sau, **then** địa chỉ này được tự động điền vào form Checkout.

## 5. Epic CATALOG — Khám phá sản phẩm

### US-CAT-01 — Tìm kiếm và lọc sản phẩm

**User Story:** Là người mua, tôi muốn tìm kiếm và lọc sản phẩm để nhanh chóng tìm được sản phẩm phù hợp.

**Ưu tiên:** Must  
**Truy vết:** FR-04

**Acceptance Criteria:**

1. **Given** có sản phẩm phù hợp, **when** người mua tìm kiếm toàn văn, **then** hệ thống hiển thị danh sách kết quả.
2. **Given** người mua áp dụng bộ lọc (giá, danh mục, đánh giá), **when** tìm kiếm, **then** kết quả chỉ gồm sản phẩm thỏa điều kiện.

### US-CAT-02 — Xem chi tiết sản phẩm

**User Story:** Là người mua, tôi muốn xem chi tiết sản phẩm với đầy đủ mô tả, ảnh gallery và các đánh giá để ra quyết định mua hàng.

**Ưu tiên:** Must  
**Truy vết:** FR-15

**Acceptance Criteria:**

1. **Given** sản phẩm đang hoạt động, **when** người mua truy cập trang chi tiết, **then** hệ thống hiển thị tên, giá, mô tả chi tiết, kho ảnh gallery, và khu vực gợi ý sản phẩm.
2. **Given** sản phẩm có nhiều đánh giá, **when** người mua cuộn xuống, **then** hệ thống hiển thị danh sách đánh giá có phân trang.

## 6. Epic CART — Giỏ hàng

### US-CART-01 — Thêm sản phẩm vào giỏ

**User Story:** Là người mua, tôi muốn thêm sản phẩm vào giỏ để chuẩn bị đặt hàng. Giỏ hàng đóng vai trò lưu trữ sản phẩm muốn mua. Hệ thống kiểm tra tồn kho ngay tại bước thêm vào giỏ để đảm bảo số lượng không vượt quá `stock` hiện có (kiểu Shopee).

**Ưu tiên:** Must  
**Truy vết:** FR-05, Mục 4.2, Mục 5.3

**Acceptance Criteria:**

1. **Given** sản phẩm đang kinh doanh, **when** người mua thêm sản phẩm, **then** nếu `quantity <= product.stock`, sản phẩm xuất hiện trong giỏ với số lượng đã chọn (reCAPTCHA chỉ kích hoạt khi có nghi ngờ spam). Nếu vượt tồn kho, hệ thống thông báo số lượng còn lại.
2. **Given** sản phẩm đã có trong giỏ, **when** người mua thêm lại, **then** hệ thống cộng dồn số lượng.
3. **Given** Guest chưa đăng nhập có Giỏ cục bộ (Local Cart) và đăng nhập vào tài khoản có Giỏ trực tuyến (Online Cart), **when** đăng nhập thành công, **then** hệ thống sẽ gộp (merge) số lượng các sản phẩm của 2 giỏ lại với nhau.
4. **Given** sản phẩm đã hết hàng (`stock = 0`), **when** người mua thêm vào giỏ, **then** hệ thống từ chối và hiển thị thông báo hết hàng.
5. **Given** sản phẩm đã ngừng kinh doanh (`isActive = false`), **when** người mua thêm vào giỏ, **then** hệ thống từ chối.

### US-CART-02 — Cập nhật giỏ hàng

**User Story:** Là người mua, tôi muốn thay đổi số lượng hoặc xóa sản phẩm để giỏ hàng phản ánh đúng nhu cầu.

**Ưu tiên:** Must  
**Truy vết:** FR-05

**Acceptance Criteria:**

1. **Given** sản phẩm đang có trong giỏ, **when** người mua cập nhật số lượng, **then** nếu `quantity <= product.stock`, hệ thống cập nhật số lượng và giá trị giỏ. Nếu vượt tồn kho, hệ thống thông báo số lượng tối đa có thể mua.
2. **Given** sản phẩm đang có trong giỏ, **when** người mua chọn xóa, **then** sản phẩm được loại khỏi giỏ.
3. **Given** sản phẩm bị Admin ngừng bán sau khi đã nằm trong giỏ, **when** người mua cập nhật số lượng, **then** hệ thống từ chối và thông báo sản phẩm đã ngừng kinh doanh.

## 7. Epic CHECKOUT — Đặt hàng và thanh toán

### US-CHK-01 — Guest bắt đầu checkout

**User Story:** Là Guest, tôi muốn checkout bằng thông tin nhận hàng để có thể mua mà không phải đăng ký trước.

**Ưu tiên:** Must  
**Truy vết:** FR-06, Mục 3.5.1

**Acceptance Criteria:**

1. **Given** giỏ hàng hợp lệ, **when** Guest nhập email, SĐT và địa chỉ, **then** hệ thống tạo tài khoản chưa xác thực, gửi OTP và giữ đơn ở trạng thái tạm.
2. **Given** Guest chưa xác thực OTP, **when** luồng bị gián đoạn, **then** đơn vẫn ở trạng thái tạm và chưa chốt.

### US-CHK-02 — Hoàn tất Guest Checkout

**User Story:** Là Guest đã xác thực OTP và tự đặt mật khẩu thành công, tôi muốn hệ thống tự động khôi phục lại đơn hàng đang thực hiện để tiếp tục.

**Ưu tiên:** Must  
**Truy vết:** FR-06, FR-07, Mục 3.5.1

**Acceptance Criteria:**

1. **Given** Guest hoàn tất kích hoạt, **when** trở lại luồng, **then** hệ thống hiển thị lại giỏ hàng và tự điền thông tin người nhận đã nhập trước đó.
2. **Given** thông tin đơn hợp lệ, **when** xác nhận đặt hàng, **then** hệ thống kiểm tra tồn kho cuối cùng và chốt đơn theo phương thức thanh toán.

### US-CHK-03 — Áp dụng voucher

**User Story:** Là khách hàng, tôi muốn áp dụng voucher hợp lệ để được giảm giá cho đơn hàng.

**Ưu tiên:** Should  
**Truy vết:** FR-A07, Mục 3.6.2, Mục 4.2

**Acceptance Criteria:**

1. **Given** voucher (tạo từ nội bộ) còn hiệu lực và lượt dùng, **when** áp dụng, **then** hệ thống giảm giá theo phần trăm hoặc số tiền cố định (có chặn mức giảm tối đa).

### US-CHK-04 — Đặt hàng COD & Tự động duyệt qua Webhook

**User Story:** Là khách hàng đã xác thực, tôi muốn chọn COD để thanh toán khi nhận hàng. Đơn COD sẽ được tự động duyệt qua các trạng thái khi Shipper giao hàng.

**Ưu tiên:** Must  
**Truy vết:** FR-07, Mục 3.6.1

**Acceptance Criteria:**

1. **Given** đơn COD được tạo, **when** xác nhận đặt hàng, **then** đơn chuyển sang `pending` chờ xử lý.
2. **Given** đơn COD đã được Admin duyệt (`confirmed`) và luồng Webhook đa kênh hoạt động, **when** đối tác vận chuyển cập nhật trạng thái trên hệ thống của họ, **then** hệ thống sẽ tự động cập nhật tuần tự các trạng thái: `handed_over` (khi Shipper lấy hàng) -> `delivering` (khi bắt đầu giao) -> `completed` (khi giao thành công).
3. **Given** phương thức thủ công (Shipper nội bộ / Webhook lỗi), **when** Admin xác nhận, **then** đơn chuyển trạng thái tương ứng.

### US-CHK-05 — Thanh toán VNPay (Timeout 30 phút)

**User Story:** Là khách hàng đã xác thực, tôi muốn thanh toán qua VNPay để hoàn tất đơn hàng trực tuyến.

**Ưu tiên:** Must  
**Truy vết:** FR-07, FR-V1, FR-V2, Mục 3.5.2

**Acceptance Criteria:**

1. **Given** khách hàng chọn VNPay, **when** thanh toán, **then** hệ thống chuyển sang trang VNPay.
2. **Given** VNPay xác nhận thành công qua IPN, **when** xử lý, **then** đơn chuyển trạng thái `pending`.
3. **Given** đơn ở `pending_payment` quá **30 phút** không thanh toán, **when** hệ thống kiểm tra, **then** đơn tự động bị hủy và hoàn tồn kho.

### US-CHK-06 — Thanh toán lại giao dịch VNPay

**User Story:** Là khách hàng có giao dịch VNPay bị gián đoạn, tôi muốn thanh toán lại trong vòng 30 phút để không phải tạo đơn mới.

**Ưu tiên:** Must  
**Truy vết:** FR-07, Mục 3.5.2, Mục 3.6.3

**Acceptance Criteria:**

1. **Given** đơn ở `pending_payment` chưa quá 30 phút, **when** xem chi tiết, **then** hệ thống cho phép "Thanh toán lại".

### US-CHK-07 — Bảo toàn tồn kho khi checkout

**User Story:** Là người mua, tôi muốn tồn kho được kiểm tra và giữ ngay tại bước cuối cùng của Checkout để không bán vượt.

**Ưu tiên:** Must  
**Truy vết:** Mục 3.6.3, NFR

**Acceptance Criteria:**

1. **Given** nhiều khách hàng cùng mua sản phẩm có tồn kho giới hạn, **when** các đơn được tạo đồng thời, **then** tổng số lượng được giữ không vượt quá tồn kho.
2. **Given** đơn được tạo thành công, **when** hoàn tất giao dịch, **then** tồn kho được trừ đúng số lượng.
3. **Given** đơn bị hủy hoặc hết hạn, **when** trạng thái hủy được xác nhận, **then** tồn kho đã giữ được hoàn trả đúng một lần.

## 8. Epic ORDER — Quản lý đơn hàng của khách

### US-ORD-01 — Xem lịch sử và trạng thái đơn

**User Story:** Là khách hàng, tôi muốn xem lịch sử và trạng thái đơn hàng (realtime).

**Ưu tiên:** Must  
**Truy vết:** FR-10

**Acceptance Criteria:**

1. **Given** trạng thái đơn thay đổi, **when** đang theo dõi, **then** trạng thái đẩy qua SSE realtime.

### US-ORD-02 — Hủy đơn

**User Story:** Là khách hàng, tôi muốn hủy đơn còn chờ xử lý.

**Ưu tiên:** Must  
**Truy vết:** FR-08, Mục 3.6.1

**Acceptance Criteria:**

1. **Given** đơn thuộc khách hàng và ở `pending` hoặc `pending_payment`, **when** hủy, **then** chuyển `cancelled`.

### US-ORD-03 — Yêu cầu trả hàng với lý do tiêu chuẩn

**User Story:** Là khách hàng, tôi muốn yêu cầu trả sản phẩm trong 7 ngày theo danh sách lý do hợp lệ.

**Ưu tiên:** Should  
**Truy vết:** FR-09, Mục 3.6.1

**Acceptance Criteria:**

1. **Given** đơn ở `completed` chưa quá 7 ngày, **when** khách hàng yêu cầu trả hàng, **then** bắt buộc phải chọn 1 trong 6 lý do hợp lệ: Bể vỡ/móp méo, Lỗi kỹ thuật, Sai sản phẩm, Thiếu phụ kiện, Hàng đã qua sử dụng, Hàng giả/nhái (Không chấp nhận lý do "Không thích"). Yêu cầu phải đính kèm ảnh/video chứng minh.
2. **Given** yêu cầu trả hàng bị từ chối (đơn chuyển sang `return_rejected`), **when** khách hàng xem chi tiết đơn, **then** hệ thống hiển thị trạng thái từ chối kèm lý do.

### US-ORD-04 — Tra cứu đơn bằng hai yếu tố

**User Story:** Là Guest hoặc khách hàng, tôi muốn tra cứu đơn bằng mã đơn và thông tin liên hệ.

**Ưu tiên:** Must  
**Truy vết:** FR-13

**Acceptance Criteria:**

1. **Given** nhập đúng SĐT/Email và Mã đơn, **when** tra cứu, **then** hiển thị trạng thái đơn.

### US-ORD-05 — Đánh giá sản phẩm đã nhận

**User Story:** Là khách hàng, tôi muốn đánh giá sản phẩm để chia sẻ trải nghiệm.

**Ưu tiên:** Should  
**Truy vết:** FR-11, Mục 4.2

**Acceptance Criteria:**

1. **Given** sản phẩm thuộc đơn `completed`, **when** gửi đánh giá 1-5 sao, **then** hệ thống lưu và hiển thị.

## 9. Epic ADMIN — Vận hành hệ thống

### US-ADM-01 — Xem dashboard vận hành

**User Story:** Là Admin, tôi muốn xem các chỉ số kinh doanh để theo dõi hoạt động hệ thống.

**Ưu tiên:** Should  
**Truy vết:** FR-A01

**Acceptance Criteria:**

1. **Given** Admin có quyền truy cập, **when** mở dashboard, **then** hệ thống hiển thị doanh thu, số đơn hàng, tỷ lệ hủy và sản phẩm bán chạy.
2. **Given** người không có quyền Admin, **when** truy cập, **then** hệ thống từ chối.

### US-ADM-02 — Quản lý danh mục

**User Story:** Là Admin, tôi muốn quản lý danh mục để tổ chức sản phẩm cho người mua.

**Ưu tiên:** Must  
**Truy vết:** FR-A02

**Acceptance Criteria:**

1. **Given** thông tin danh mục hợp lệ, **when** Admin tạo/sửa, **then** hệ thống lưu thành công.
2. **Given** slug bị trùng, **when** Admin lưu, **then** hệ thống báo lỗi và từ chối.

### US-ADM-03 — Quản lý sản phẩm

**User Story:** Là Admin, tôi muốn quản lý sản phẩm (thêm, sửa, ngừng kinh doanh).

**Ưu tiên:** Must  
**Truy vết:** FR-A02

**Acceptance Criteria:**

1. **Given** sản phẩm hợp lệ, **when** Admin tải ảnh lên, **then** ảnh được lưu qua Cloudinary và link được lưu vào DB.
2. **Given** sản phẩm cần ngừng bán, **when** Admin ẩn, **then** SP được đánh dấu không hoạt động (soft delete) thay vì xóa vật lý.

### US-ADM-04 — Duyệt đơn hàng

**User Story:** Là Admin hoặc Nhân viên, tôi muốn xem và duyệt đơn chờ xử lý (nếu không chạy webhook auto).

**Ưu tiên:** Must  
**Truy vết:** FR-A03

**Acceptance Criteria:**

1. **Given** đơn ở `pending`, **when** Admin hoặc Nhân viên duyệt, **then** đơn chuyển sang `confirmed`.

### US-ADM-05 — Ghi nhận giao hàng thủ công

**User Story:** Là Admin hoặc Nhân viên, tôi muốn nhập thông tin đối tác vận chuyển thủ công trong trường hợp lỗi webhook hoặc dùng shipper ngoài.

**Ưu tiên:** Must  
**Truy vết:** FR-A03, Mục 5.6

**Acceptance Criteria:**

1. **Given** đơn `confirmed`, **when** Admin hoặc Nhân viên nhập mã vận đơn, **then** đơn chuyển sang `handed_over`.
2. **Given** có thông tin mới, **when** Admin hoặc Nhân viên cập nhật, **then** đơn chuyển sang `delivering` hoặc `completed`.

### US-ADM-06 — Duyệt yêu cầu trả hàng

**User Story:** Là Admin hoặc Nhân viên, tôi muốn duyệt hoặc từ chối yêu cầu trả hàng để hoàn tất bước kiểm tra hậu mãi.

**Ưu tiên:** Should  
**Truy vết:** FR-A04

**Acceptance Criteria:**

1. **Given** đơn `return_requested`, **when** Admin hoặc Nhân viên duyệt trả, **then** đơn chuyển sang `returned`.
2. **Given** đơn `return_requested`, **when** Admin hoặc Nhân viên từ chối trả, **then** đơn chuyển sang `return_rejected`.

### US-ADM-06b — Hoàn tiền

**User Story:** Là Admin, tôi muốn xác nhận hoàn tiền cho đơn đã trả hàng vì đây là thao tác liên quan trực tiếp đến tiền thật, chỉ Admin mới được thực hiện.

**Ưu tiên:** Should  
**Truy vết:** FR-A04, FR-V3

**Acceptance Criteria:**

1. **Given** đơn VNPay đã `returned`, **when** Admin hoàn tiền, **then** gọi API VNPay Refund; chỉ khi thành công mới chuyển sang `refunded`. Hoàn tiền thất bại không được chuyển trạng thái.
2. **Given** người dùng có vai trò Nhân viên, **when** cố thực hiện thao tác hoàn tiền, **then** hệ thống từ chối truy cập.

### US-ADM-07 — Kiểm duyệt đánh giá

**User Story:** Là Admin hoặc Nhân viên, tôi muốn xem và ẩn đánh giá vi phạm tiêu chuẩn cộng đồng.

**Ưu tiên:** Should  
**Truy vết:** FR-A05

**Acceptance Criteria:**

1. **Given** đánh giá vi phạm, **when** Admin hoặc Nhân viên chọn ẩn, **then** trạng thái chuyển sang `hidden`.

### US-ADM-08 — Quản lý tài khoản Admin và Nhân viên

**User Story:** Là Super Admin, tôi muốn tạo hoặc vô hiệu hóa tài khoản Admin để kiểm soát quyền. Là Admin hoặc Super Admin, tôi muốn tạo hoặc vô hiệu hóa tài khoản Nhân viên để quản lý đội ngũ vận hành.

**Ưu tiên:** Must  
**Truy vết:** FR-A06

**Acceptance Criteria:**

1. **Given** Super Admin chọn xóa một Admin, **when** thao tác, **then** tài khoản bị vô hiệu hóa (Soft Delete) chứ không xóa vật lý.
2. **Given** Admin hoặc Super Admin chọn tạo hoặc vô hiệu hóa một tài khoản Nhân viên, **when** thao tác, **then** hệ thống thực hiện tương ứng; vô hiệu hóa dùng Soft Delete, không xóa vật lý.
3. **Given** người dùng có vai trò Nhân viên, **when** cố tạo hoặc vô hiệu hóa bất kỳ tài khoản nào (Admin, Super Admin hoặc Nhân viên khác), **then** hệ thống từ chối truy cập.

### US-ADM-09 — Quản lý Voucher Nội bộ

**User Story:** Là Admin, tôi muốn quản lý (tạo, sửa, giới hạn lượt dùng, set thời hạn) các mã Voucher nội bộ để khuyến mãi cho khách hàng mà không phụ thuộc Tool thứ 3.

**Ưu tiên:** Must  
**Truy vết:** FR-A07

**Acceptance Criteria:**

1. **Given** form hợp lệ, **when** Admin tạo voucher (% hoặc tiền mặt, min order, giới hạn), **then** voucher được lưu.
2. **Given** voucher hết lượt, **when** người dùng áp dụng, **then** hệ thống từ chối.

## 10. Epic REC — Gợi ý sản phẩm

### US-REC-01 — Nhận gợi ý theo mức độ dữ liệu

**User Story:** Là khách hàng, tôi muốn nhận gợi ý phù hợp trên trang chủ và trang chi tiết (Popular, Content-Based, Hybrid).

**Ưu tiên:** Must  
**Truy vết:** FR-12, FR-ML01, FR-ML02, FR-ML03, FR-ML04

**Acceptance Criteria:**

1. **Given** chưa có dữ liệu user, **when** truy cập, **then** hệ thống hiển thị Top Popular.
2. **Given** có hành vi nhưng chưa đủ review, **when** truy cập, **then** hệ thống hiển thị Content-Based.
3. **Given** có đủ dữ liệu, **when** truy cập, **then** hệ thống gọi mô hình Hybrid.

### US-REC-02 — Cache và fallback gợi ý

**User Story:** Là khách hàng, tôi muốn vẫn nhận được gợi ý khi dịch vụ ML chậm hoặc lỗi.

**Ưu tiên:** Must  
**Truy vết:** FR-ML05, Mục 5.5

**Acceptance Criteria:**

1. **Given** kết quả đã tạo, **when** request trong 1 giờ, **then** lấy từ Cache.
2. **Given** ML API timeout (5s) hoặc lỗi, **when** gọi, **then** trả về danh sách Popular dự phòng.

## 11. Technical Stories

### TS-ML-01 — Đánh giá chất lượng mô hình

**Technical Story:** Nhóm thực hiện cần đánh giá các mô hình qua offline testing (Precision@10, Recall@10, NDCG, RMSE).

**Ưu tiên:** Must  
**Truy vết:** Mục 7

**Acceptance Criteria:**

1. **Given** dataset Amazon Electronics, **when** chạy script, **then** chia Train/Test 80/20 và xuất file kết quả so sánh.

### TS-CRON-01 — Dọn dẹp hệ thống (Guest Cleanup)

**Technical Story:** Hệ thống cần tự động dọn dẹp các dữ liệu rác để tiết kiệm tài nguyên và bảo vệ quyền riêng tư.

**Ưu tiên:** Must  
**Truy vết:** Mục 3.6.4 (Cập nhật)

**Acceptance Criteria:**

1. **Given** Đơn hàng tạm của Guest, **when** qua 24 giờ không kích hoạt OTP, **then** hệ thống tự động xóa đơn và hoàn tồn kho (nếu có giữ).
2. **Given** Tài khoản Guest chưa kích hoạt, **when** đến ngày thứ 6, **then** hệ thống gửi 1 Email cảnh báo xóa tài khoản.
3. **Given** Tài khoản Guest chưa kích hoạt, **when** đến ngày thứ 7, **then** hệ thống tự động xóa tài khoản và gửi 1 Email thông báo đã xóa.

## 12. Yêu cầu chất lượng áp dụng chung

| Mã   | Yêu cầu                                                                          | Áp dụng                   |
| ---- | -------------------------------------------------------------------------------- | ------------------------- |
| Q-01 | Phản hồi API mục tiêu dưới 500 ms, ngoại trừ luồng ML có timeout riêng 5 giây.   | Các story gọi API         |
| Q-02 | Trạng thái đơn được cập nhật realtime qua SSE.                                   | US-ORD-01, Admin thao tác |
| Q-03 | Trừ và hoàn tồn kho phải an toàn khi có thao tác đồng thời (idempotent).         | Epic CHECKOUT             |
| Q-04 | Access Token có thời hạn 15 phút; Refresh Token có thời hạn 7 ngày.              | Epic AUTH                 |
| Q-05 | Dữ liệu đầu vào phải được làm sạch để giảm rủi ro XSS, SQL injection.            | Toàn hệ thống             |
| Q-06 | Hệ thống hướng tới uptime 99% và có logging.                                     | Toàn hệ thống             |
| Q-07 | Giao diện responsive trên mobile, tablet, desktop.                               | Các story giao diện       |
| Q-08 | Trạng thái tải, rỗng, lỗi tuân thủ UI/UX guideline và bắt buộc áp dụng **i18n**. | Các story giao diện       |

## 13. Ma trận truy vết

| Yêu cầu SRS         | User Story                                 |
| ------------------- | ------------------------------------------ |
| FR-01               | US-AUTH-01, US-AUTH-02                     |
| FR-02               | US-AUTH-03, US-AUTH-04                     |
| FR-03               | US-AUTH-05                                 |
| FR-04               | US-CAT-01                                  |
| FR-05               | US-CART-01, US-CART-02                     |
| FR-06               | US-CHK-01, US-CHK-02                       |
| FR-07               | US-CHK-02, US-CHK-04, US-CHK-05, US-CHK-06 |
| FR-08               | US-ORD-02                                  |
| FR-09               | US-ORD-03                                  |
| FR-10               | US-ORD-01                                  |
| FR-11               | US-ORD-05                                  |
| FR-12               | US-REC-01                                  |
| FR-13               | US-ORD-04                                  |
| FR-14               | US-AUTH-06                                 |
| FR-15               | US-CAT-02                                  |
| FR-A01              | US-ADM-01                                  |
| FR-A02              | US-ADM-02, US-ADM-03                       |
| FR-A03              | US-ADM-04, US-ADM-05                       |
| FR-A04              | US-ADM-06, US-ADM-06b                      |
| FR-A05              | US-ADM-07                                  |
| FR-A06              | US-ADM-08                                  |
| FR-A07              | US-ADM-09, US-CHK-03                       |
| FR-ML01 đến FR-ML04 | US-REC-01                                  |
| FR-ML05             | US-REC-02                                  |
| FR-V1, FR-V2        | US-CHK-05                                  |
| FR-V3               | US-ADM-06b                                 |
| FR-E1               | US-AUTH-03, US-CHK-01                      |
| FR-E2               | US-CHK-02, US-CHK-04, US-CHK-05            |
| FR-E3               | US-ORD-05                                  |
| FR-E4               | US-AUTH-05                                 |
| Mục 3.6.4           | TS-CRON-01                                 |
