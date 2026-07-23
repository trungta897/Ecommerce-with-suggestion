# User Stories — Hệ thống bán lẻ điện tử tích hợp gợi ý sản phẩm

## 1. Mục đích

Tài liệu chuyển đổi các yêu cầu trong `docs/SRS.md` thành backlog User Story có thể dùng chung cho Business Analyst, phát triển và kiểm thử. Mỗi User Story được truy vết về yêu cầu nguồn và có tiêu chí nghiệm thu theo cú pháp Given/When/Then.

## 2. Vai trò

| Vai trò | Mô tả |
|---|---|
| Guest | Người chưa đăng nhập, có thể duyệt sản phẩm, quản lý giỏ cục bộ, tra cứu đơn và bắt đầu checkout. |
| Người dùng chưa xác thực | Tài khoản đã được tạo nhưng chưa hoàn tất xác thực email và đặt mật khẩu. |
| Khách hàng | Người dùng đã xác thực, có thể đặt hàng, thanh toán và quản lý hoạt động mua hàng. |
| Admin | Người vận hành danh mục, sản phẩm, đơn hàng, trả hàng, đánh giá và dashboard. |
| Super Admin | Quản trị viên có quyền quản lý tài khoản Admin. |
| Hệ thống gợi ý | Thành phần cung cấp kết quả gợi ý và cơ chế dự phòng. |

## 3. Quy ước

- ID có dạng `US-<EPIC>-<số thứ tự>`.
- Mức ưu tiên dùng `Must`, `Should`, `Could` theo phạm vi và lịch trình trong SRS.
- Tiêu chí nghiệm thu chỉ sử dụng quy tắc đã có trong SRS. Nội dung chưa được chốt được liệt kê tại Mục 12.
- Trạng thái đơn hàng sử dụng: `pending_payment`, `pending`, `confirmed`, `handed_over`, `delivering`, `completed`, `return_requested`, `returned`, `refunded`, `cancelled`.

## 4. Epic AUTH — Tài khoản và xác thực

### US-AUTH-01 — Đăng ký tài khoản

**User Story:** Là Guest, tôi muốn đăng ký tài khoản bằng email để có thể sử dụng các chức năng dành cho khách hàng.

**Ưu tiên:** Must  
**Truy vết:** FR-01, Mục 5.3, NFR bảo mật

**Acceptance Criteria:**

1. **Given** Guest cung cấp thông tin đăng ký hợp lệ và vượt qua kiểm tra reCAPTCHA, **when** gửi yêu cầu đăng ký, **then** hệ thống tạo tài khoản chưa xác thực và bắt đầu luồng xác thực email.
2. **Given** điểm reCAPTCHA nhỏ hơn `0.5`, **when** Guest gửi yêu cầu, **then** hệ thống từ chối đăng ký.
3. **Given** dữ liệu đầu vào không hợp lệ, **when** Guest gửi yêu cầu, **then** hệ thống không tạo tài khoản và trả phản hồi lỗi phù hợp.

### US-AUTH-02 — Đăng nhập

**User Story:** Là khách hàng, tôi muốn đăng nhập an toàn để truy cập tài khoản và các chức năng cá nhân.

**Ưu tiên:** Must  
**Truy vết:** FR-01, Mục 5.3, NFR bảo mật

**Acceptance Criteria:**

1. **Given** tài khoản hợp lệ, đã xác thực và thông tin đăng nhập chính xác, **when** người dùng đăng nhập và vượt qua reCAPTCHA, **then** hệ thống cấp phiên đăng nhập.
2. **Given** thông tin đăng nhập không chính xác, **when** người dùng đăng nhập, **then** hệ thống từ chối truy cập và không tiết lộ thông tin nhạy cảm.
3. **Given** điểm reCAPTCHA nhỏ hơn `0.5`, **when** người dùng gửi yêu cầu đăng nhập, **then** hệ thống chặn yêu cầu.

### US-AUTH-03 — Xác thực email bằng OTP

**User Story:** Là người dùng chưa xác thực, tôi muốn xác thực email bằng OTP để kích hoạt tài khoản.

**Ưu tiên:** Must  
**Truy vết:** FR-02, FR-E1, Mục 3.5.1

**Acceptance Criteria:**

1. **Given** OTP còn hiệu lực, **when** người dùng nhập đúng OTP, **then** hệ thống xác thực email, cấp lại quyền truy cập đã xác thực và yêu cầu người dùng đặt mật khẩu.
2. **Given** OTP sai và số lần sai nhỏ hơn 5, **when** người dùng xác nhận, **then** hệ thống hiển thị “Mã OTP không chính xác, vui lòng kiểm tra lại”.
3. **Given** người dùng nhập sai OTP lần thứ 5, **when** xác nhận, **then** hệ thống khóa chức năng gửi lại OTP trong 15 phút.
4. **Given** OTP đã quá 15 phút, **when** người dùng xác nhận, **then** hệ thống từ chối OTP hết hạn.

### US-AUTH-04 — Đặt mật khẩu sau xác thực

**User Story:** Là người dùng vừa xác thực email, tôi muốn tự đặt mật khẩu để hoàn tất kích hoạt tài khoản an toàn.

**Ưu tiên:** Must  
**Truy vết:** FR-02, Mục 3.5.1, Mục 4.2

**Acceptance Criteria:**

1. **Given** người dùng vừa xác thực OTP thành công, **when** cung cấp mật khẩu đáp ứng tối thiểu một chữ hoa, một chữ số và một ký tự đặc biệt, **then** hệ thống lưu mật khẩu an toàn, đánh dấu tài khoản đã xác thực và tiếp tục hành trình trước đó.
2. **Given** mật khẩu không đáp ứng chính sách, **when** người dùng gửi yêu cầu, **then** hệ thống từ chối và yêu cầu sửa mật khẩu.
3. **Given** chưa hoàn tất bước đặt mật khẩu, **when** người dùng cố hoàn tất Guest Checkout, **then** hệ thống chưa chốt đơn.

### US-AUTH-05 — Khôi phục mật khẩu

**User Story:** Là Guest hoặc khách hàng, tôi muốn khôi phục mật khẩu qua email đăng ký để lấy lại quyền truy cập.

**Ưu tiên:** Must  
**Truy vết:** FR-03, FR-E4

**Acceptance Criteria:**

1. **Given** yêu cầu hợp lệ, **when** người dùng yêu cầu khôi phục mật khẩu, **then** hệ thống gửi link hoặc OTP khôi phục đến email đăng ký.
2. **Given** link hoặc OTP còn trong thời hạn 15 phút, **when** người dùng xác minh thành công, **then** hệ thống cho phép đặt mật khẩu mới.
3. **Given** link hoặc OTP đã hết hạn, **when** người dùng sử dụng, **then** hệ thống từ chối yêu cầu.
4. **Given** đã phát sinh 5 lần thử không hợp lệ theo giới hạn của SRS, **when** người dùng thử tiếp, **then** hệ thống áp dụng giới hạn bảo vệ.

## 5. Epic CATALOG — Khám phá sản phẩm

### US-CAT-01 — Tìm kiếm và lọc sản phẩm

**User Story:** Là người mua, tôi muốn tìm kiếm và lọc sản phẩm để nhanh chóng tìm được sản phẩm phù hợp.

**Ưu tiên:** Must  
**Truy vết:** FR-04

**Acceptance Criteria:**

1. **Given** có sản phẩm phù hợp, **when** người mua tìm kiếm toàn văn, **then** hệ thống hiển thị danh sách kết quả liên quan.
2. **Given** người mua chọn một hoặc nhiều điều kiện về giá, danh mục và đánh giá, **when** áp dụng bộ lọc, **then** kết quả chỉ gồm sản phẩm thỏa điều kiện.
3. **Given** không có sản phẩm phù hợp, **when** tìm kiếm hoặc lọc, **then** hệ thống hiển thị trạng thái không có kết quả.

## 6. Epic CART — Giỏ hàng

### US-CART-01 — Thêm sản phẩm vào giỏ

**User Story:** Là người mua, tôi muốn thêm sản phẩm vào giỏ để chuẩn bị đặt hàng.

**Ưu tiên:** Must  
**Truy vết:** FR-05, Mục 4.2, Mục 5.3

**Acceptance Criteria:**

1. **Given** sản phẩm đang kinh doanh và còn hàng, **when** người mua thêm sản phẩm vào giỏ và vượt qua kiểm tra chống spam, **then** sản phẩm xuất hiện trong giỏ với số lượng đã chọn.
2. **Given** sản phẩm đã có trong giỏ, **when** người mua thêm lại, **then** hệ thống cộng dồn số lượng thay vì tạo dòng trùng.
3. **Given** điểm reCAPTCHA nhỏ hơn `0.5`, **when** người mua thêm vào giỏ, **then** hệ thống chặn yêu cầu.
4. **Given** Guest chưa đăng nhập, **when** thêm sản phẩm, **then** giỏ được duy trì cục bộ.

### US-CART-02 — Cập nhật giỏ hàng

**User Story:** Là người mua, tôi muốn thay đổi số lượng hoặc xóa sản phẩm để giỏ hàng phản ánh đúng nhu cầu.

**Ưu tiên:** Must  
**Truy vết:** FR-05

**Acceptance Criteria:**

1. **Given** sản phẩm đang có trong giỏ, **when** người mua cập nhật số lượng hợp lệ, **then** hệ thống cập nhật số lượng và giá trị giỏ.
2. **Given** sản phẩm đang có trong giỏ, **when** người mua chọn xóa, **then** sản phẩm được loại khỏi giỏ.
3. **Given** số lượng yêu cầu vượt quá tồn kho khả dụng, **when** người mua cập nhật, **then** hệ thống không chấp nhận số lượng vượt mức.

## 7. Epic CHECKOUT — Đặt hàng và thanh toán

### US-CHK-01 — Guest bắt đầu checkout

**User Story:** Là Guest, tôi muốn checkout bằng thông tin nhận hàng để có thể mua mà không phải đăng ký trước.

**Ưu tiên:** Must  
**Truy vết:** FR-06, Mục 3.5.1

**Acceptance Criteria:**

1. **Given** giỏ hàng hợp lệ, **when** Guest cung cấp email, số điện thoại và địa chỉ nhận hàng, **then** hệ thống tạo tài khoản chưa xác thực và đơn hàng tạm.
2. **Given** tài khoản chưa xác thực được tạo, **when** hệ thống tiếp tục checkout, **then** OTP có hiệu lực 15 phút được gửi qua email và Guest được chuyển đến bước nhập OTP.
3. **Given** email đã gắn với tài khoản đang chờ xác thực, **when** Guest quay lại checkout, **then** hệ thống nhận diện tài khoản cũ và tiếp tục luồng xác thực thay vì tạo tài khoản trùng.
4. **Given** Guest chưa xác thực OTP và chưa đặt mật khẩu, **when** luồng bị gián đoạn, **then** đơn vẫn ở trạng thái tạm và chưa được chốt.

### US-CHK-02 — Hoàn tất Guest Checkout

**User Story:** Là Guest đã xác thực, tôi muốn quay lại đơn hàng đang thực hiện để chọn giao hàng, thanh toán và chốt đơn.

**Ưu tiên:** Must  
**Truy vết:** FR-06, FR-07, Mục 3.5.1

**Acceptance Criteria:**

1. **Given** Guest đã xác thực OTP và đặt mật khẩu thành công, **when** hoàn tất kích hoạt, **then** hệ thống đưa người dùng trở lại đơn hàng đang thực hiện.
2. **Given** thông tin đơn và phương thức nhận hàng hợp lệ, **when** người dùng xác nhận đặt hàng, **then** hệ thống chốt đơn theo phương thức thanh toán đã chọn.
3. **Given** Guest bỏ dở luồng quá thời gian dọn dẹp đã cấu hình, **when** tác vụ dọn dẹp chạy, **then** tài khoản chưa hoàn tất và đơn tạm liên quan được xóa hoặc đánh dấu hết hạn, đồng thời tồn kho đã giữ được hoàn trả.

### US-CHK-03 — Áp dụng voucher

**User Story:** Là khách hàng, tôi muốn áp dụng voucher hợp lệ để được giảm giá cho đơn hàng.

**Ưu tiên:** Should  
**Truy vết:** Mục 3.6.2, Mục 4.2

**Acceptance Criteria:**

1. **Given** voucher còn hiệu lực, đang hoạt động, chưa hết lượt và đơn đạt giá trị tối thiểu, **when** khách hàng áp dụng voucher, **then** hệ thống tính giảm theo phần trăm hoặc số tiền cố định.
2. **Given** voucher phần trăm có mức giảm tối đa, **when** số tiền tính được vượt mức tối đa, **then** hệ thống chỉ giảm đến mức tối đa.
3. **Given** khách hàng đã sử dụng voucher đó trước đây, **when** áp dụng lại, **then** hệ thống từ chối.
4. **Given** voucher không còn hợp lệ hoặc đã hết giới hạn toàn hệ thống, **when** áp dụng, **then** hệ thống không giảm giá.

### US-CHK-04 — Đặt hàng COD

**User Story:** Là khách hàng đã xác thực, tôi muốn chọn COD để thanh toán khi nhận hàng.

**Ưu tiên:** Must  
**Truy vết:** FR-07, Mục 3.6.1

**Acceptance Criteria:**

1. **Given** đơn hàng hợp lệ và khách hàng chọn COD, **when** xác nhận đặt hàng, **then** đơn chuyển sang `pending` để chờ Admin duyệt.
2. **Given** đơn được tạo, **when** checkout hoàn tất, **then** tồn kho được giữ trong cùng giao dịch nghiệp vụ để tránh bán vượt số lượng.
3. **Given** đơn COD không được duyệt trong thời gian hợp lý đã cấu hình, **when** tác vụ hết hạn xử lý, **then** đơn bị hủy và tồn kho được hoàn trả.

### US-CHK-05 — Thanh toán VNPay

**User Story:** Là khách hàng đã xác thực, tôi muốn thanh toán qua VNPay để hoàn tất đơn hàng trực tuyến.

**Ưu tiên:** Must  
**Truy vết:** FR-07, FR-V1, FR-V2, Mục 3.5.2

**Acceptance Criteria:**

1. **Given** đơn hàng hợp lệ và khách hàng chọn VNPay, **when** bắt đầu thanh toán, **then** hệ thống tạo giao dịch an toàn và chuyển khách hàng đến trang thanh toán VNPay.
2. **Given** VNPay xác nhận giao dịch thành công qua IPN hợp lệ, **when** hệ thống xử lý thông báo, **then** trạng thái thanh toán chuyển thành `completed` và đơn chuyển từ `pending_payment` sang `pending`.
3. **Given** khách hàng quay lại từ VNPay, **when** trang kết quả được hiển thị, **then** kết quả cuối cùng được xác định từ trạng thái giao dịch phía hệ thống, không chỉ từ dữ liệu chuyển hướng.
4. **Given** giao dịch chưa hoàn tất, **when** đơn được tạo, **then** đơn giữ trạng thái `pending_payment` và tồn kho được giữ.

### US-CHK-06 — Thanh toán lại giao dịch VNPay

**User Story:** Là khách hàng có giao dịch VNPay bị gián đoạn, tôi muốn thanh toán lại để không phải tạo đơn mới.

**Ưu tiên:** Must  
**Truy vết:** FR-07, Mục 3.5.2, Mục 3.6.3

**Acceptance Criteria:**

1. **Given** đơn ở `pending_payment` và còn trong thời gian giữ đơn, **when** khách hàng xem kết quả hoặc chi tiết đơn, **then** hệ thống hiển thị khả năng thanh toán lại.
2. **Given** đơn còn hiệu lực, **when** khách hàng chọn thanh toán lại, **then** hệ thống khởi tạo lại luồng VNPay cho chính đơn đó.
3. **Given** thời gian giữ đơn đã hết hoặc IPN xác nhận thất bại, **when** hệ thống xử lý hết hạn, **then** đơn chuyển sang `cancelled`, không cho thanh toán lại và hoàn trả tồn kho.

### US-CHK-07 — Bảo toàn tồn kho khi checkout

**User Story:** Là người mua, tôi muốn số lượng hàng được xác nhận nhất quán để không đặt mua sản phẩm đã hết.

**Ưu tiên:** Must  
**Truy vết:** Mục 3.6.3, NFR toàn vẹn dữ liệu

**Acceptance Criteria:**

1. **Given** nhiều khách hàng cùng mua sản phẩm có tồn kho giới hạn, **when** các đơn được tạo đồng thời, **then** tổng số lượng được giữ không vượt quá tồn kho.
2. **Given** đơn được tạo thành công, **when** giao dịch nghiệp vụ hoàn tất, **then** tồn kho được trừ tạm đúng số lượng đặt.
3. **Given** đơn bị hủy hoặc hết hạn, **when** trạng thái hủy được xác nhận, **then** tồn kho đã giữ được hoàn trả đúng một lần.

## 8. Epic ORDER — Quản lý đơn hàng của khách

### US-ORD-01 — Xem lịch sử và trạng thái đơn

**User Story:** Là khách hàng, tôi muốn xem lịch sử và trạng thái đơn hàng để theo dõi quá trình mua hàng.

**Ưu tiên:** Must  
**Truy vết:** FR-10

**Acceptance Criteria:**

1. **Given** khách hàng đã đăng nhập, **when** mở lịch sử đơn hàng, **then** hệ thống chỉ hiển thị các đơn thuộc tài khoản đó.
2. **Given** trạng thái đơn thay đổi, **when** khách hàng đang theo dõi đơn, **then** trạng thái mới được đẩy qua SSE mà không cần tải lại trang.
3. **Given** kết nối realtime bị gián đoạn, **when** khách hàng mở lại chi tiết đơn, **then** hệ thống hiển thị trạng thái hiện tại đã lưu.

### US-ORD-02 — Hủy đơn

**User Story:** Là khách hàng, tôi muốn hủy đơn còn chờ xử lý để dừng giao dịch không còn nhu cầu.

**Ưu tiên:** Must  
**Truy vết:** FR-08, Mục 3.6.1

**Acceptance Criteria:**

1. **Given** đơn thuộc khách hàng và ở `pending` hoặc `pending_payment`, **when** khách hàng xác nhận hủy, **then** đơn chuyển sang `cancelled`.
2. **Given** đơn đã qua trạng thái cho phép hủy, **when** khách hàng yêu cầu hủy, **then** hệ thống từ chối.
3. **Given** đơn được hủy thành công, **when** hệ thống hoàn tất xử lý, **then** tồn kho đã giữ được hoàn trả.

### US-ORD-03 — Yêu cầu trả hàng

**User Story:** Là khách hàng, tôi muốn yêu cầu trả sản phẩm đã nhận trong thời hạn cho phép để được xử lý hoàn trả.

**Ưu tiên:** Should  
**Truy vết:** FR-09, Mục 3.6.1

**Acceptance Criteria:**

1. **Given** đơn thuộc khách hàng, ở `completed` và chưa quá 7 ngày, **when** khách hàng gửi yêu cầu trả hàng hợp lệ, **then** đơn chuyển sang `return_requested`.
2. **Given** đơn chưa hoàn tất hoặc đã quá 7 ngày, **when** khách hàng yêu cầu trả, **then** hệ thống từ chối.
3. **Given** đơn đã có yêu cầu trả, **when** khách hàng gửi lại, **then** hệ thống không tạo yêu cầu trùng.

### US-ORD-04 — Tra cứu đơn bằng hai yếu tố

**User Story:** Là Guest hoặc khách hàng, tôi muốn tra cứu đơn bằng mã đơn và thông tin liên hệ để xem trạng thái mà vẫn bảo vệ dữ liệu cá nhân.

**Ưu tiên:** Must  
**Truy vết:** FR-13

**Acceptance Criteria:**

1. **Given** mã đơn và số điện thoại khớp cùng một đơn, **when** người dùng tra cứu, **then** hệ thống hiển thị thông tin trạng thái được phép.
2. **Given** mã đơn và email khớp cùng một đơn, **when** người dùng tra cứu, **then** hệ thống hiển thị thông tin trạng thái được phép.
3. **Given** chỉ có số điện thoại hoặc email mà không có mã đơn, **when** người dùng tra cứu, **then** hệ thống từ chối.
4. **Given** hai yếu tố không khớp, **when** người dùng tra cứu, **then** hệ thống không tiết lộ thông tin đơn hàng.

### US-ORD-05 — Đánh giá sản phẩm đã nhận

**User Story:** Là khách hàng, tôi muốn đánh giá sản phẩm đã nhận để chia sẻ trải nghiệm và cải thiện gợi ý.

**Ưu tiên:** Should  
**Truy vết:** FR-11, Mục 4.2

**Acceptance Criteria:**

1. **Given** sản phẩm thuộc đơn đã `completed`, **when** khách hàng gửi đánh giá từ 1 đến 5 sao và bình luận, **then** hệ thống lưu đánh giá.
2. **Given** sản phẩm chưa được khách hàng nhận, **when** gửi đánh giá, **then** hệ thống từ chối.
3. **Given** khách hàng đã đánh giá sản phẩm trong cùng đơn, **when** gửi lại, **then** hệ thống không tạo đánh giá thứ hai.

## 9. Epic ADMIN — Vận hành hệ thống

### US-ADM-01 — Xem dashboard vận hành

**User Story:** Là Admin, tôi muốn xem các chỉ số kinh doanh để theo dõi hoạt động hệ thống.

**Ưu tiên:** Should  
**Truy vết:** FR-A01

**Acceptance Criteria:**

1. **Given** Admin có quyền truy cập, **when** mở dashboard, **then** hệ thống hiển thị doanh thu, số đơn hàng, tỷ lệ hủy và sản phẩm bán chạy.
2. **Given** người không có quyền Admin, **when** truy cập dashboard, **then** hệ thống từ chối.

### US-ADM-02 — Quản lý danh mục

**User Story:** Là Admin, tôi muốn quản lý danh mục để tổ chức sản phẩm cho người mua.

**Ưu tiên:** Must  
**Truy vết:** FR-A02

**Acceptance Criteria:**

1. **Given** thông tin danh mục hợp lệ, **when** Admin tạo hoặc chỉnh sửa, **then** thay đổi được lưu và phản ánh trong danh mục sản phẩm.
2. **Given** dữ liệu không hợp lệ hoặc slug bị trùng, **when** Admin lưu, **then** hệ thống từ chối thay đổi.

### US-ADM-03 — Quản lý sản phẩm

**User Story:** Là Admin, tôi muốn thêm, sửa và ngừng kinh doanh sản phẩm để duy trì danh mục bán hàng.

**Ưu tiên:** Must  
**Truy vết:** FR-A02, Mục 5.4

**Acceptance Criteria:**

1. **Given** thông tin sản phẩm hợp lệ, **when** Admin tạo hoặc chỉnh sửa sản phẩm, **then** hệ thống lưu thay đổi.
2. **Given** Admin tải ảnh sản phẩm hợp lệ, **when** lưu sản phẩm, **then** ảnh được lưu qua Cloudinary và sản phẩm tham chiếu đến ảnh đó.
3. **Given** sản phẩm cần ngừng kinh doanh, **when** Admin chọn ẩn, **then** sản phẩm được đánh dấu không hoạt động thay vì bị xóa vật lý.
4. **Given** người không có quyền Admin, **when** cố thay đổi sản phẩm, **then** hệ thống từ chối.

### US-ADM-04 — Duyệt đơn hàng

**User Story:** Là Admin, tôi muốn xem và duyệt đơn chờ xử lý để bắt đầu quy trình giao hàng.

**Ưu tiên:** Must  
**Truy vết:** FR-A03, Mục 3.6.1

**Acceptance Criteria:**

1. **Given** đơn ở `pending`, **when** Admin duyệt, **then** đơn chuyển sang `confirmed`.
2. **Given** đơn không ở trạng thái cho phép duyệt, **when** Admin thực hiện duyệt, **then** hệ thống từ chối chuyển trạng thái.
3. **Given** đơn VNPay đã được IPN xác nhận thành công, **when** hệ thống hoàn tất xử lý thanh toán, **then** đơn có thể tiếp tục quy trình xác nhận theo quy tắc đã cấu hình.

### US-ADM-05 — Ghi nhận giao hàng thủ công

**User Story:** Là Admin, tôi muốn nhập thông tin đối tác vận chuyển để khách hàng có thể theo dõi đơn.

**Ưu tiên:** Must  
**Truy vết:** FR-A03, Mục 3.6.5, Mục 5.6

**Acceptance Criteria:**

1. **Given** đơn đã `confirmed`, **when** Admin đặt dịch vụ vận chuyển bên ngoài và nhập đối tác, mã vận đơn cùng phí giao hàng, **then** hệ thống lưu thông tin và cho phép chuyển đơn sang `handed_over`.
2. **Given** đơn đã bàn giao, **when** tiến trình giao hàng thay đổi, **then** Admin có thể cập nhật lần lượt sang `delivering` và `completed`.
3. **Given** thông tin giao hàng được cập nhật, **when** khách hàng theo dõi đơn, **then** thông tin mới được phản ánh qua trạng thái đơn.
4. **Given** quy trình dùng Grab hoặc Be, **when** Admin thao tác, **then** hệ thống chỉ ghi nhận thông tin thủ công và không gọi API của đối tác.

### US-ADM-06 — Xử lý trả hàng và hoàn tiền

**User Story:** Là Admin, tôi muốn duyệt yêu cầu trả và hoàn tiền để hoàn tất quy trình hậu mãi.

**Ưu tiên:** Should  
**Truy vết:** FR-A04, FR-V3, Mục 3.6.1

**Acceptance Criteria:**

1. **Given** đơn ở `return_requested` và yêu cầu được chấp nhận, **when** Admin duyệt trả, **then** đơn chuyển sang `returned`.
2. **Given** đơn VNPay đã chuyển sang `returned`, **when** Admin thực hiện hoàn tiền, **then** hệ thống yêu cầu VNPay hoàn tiền và chỉ chuyển đơn sang `refunded` khi kết quả thành công.
3. **Given** đơn COD đã chuyển sang `returned`, **when** Admin xác nhận đã hoàn tiền thủ công, **then** đơn chuyển sang `refunded`.
4. **Given** hoàn tiền thất bại, **when** hệ thống nhận kết quả lỗi, **then** đơn không được đánh dấu `refunded` và lỗi được ghi nhận để xử lý.

### US-ADM-07 — Kiểm duyệt đánh giá

**User Story:** Là Admin, tôi muốn xem và ẩn đánh giá vi phạm để duy trì nội dung phù hợp.

**Ưu tiên:** Should  
**Truy vết:** FR-A05

**Acceptance Criteria:**

1. **Given** đánh giá đang hiển thị và vi phạm tiêu chuẩn cộng đồng, **when** Admin chọn ẩn, **then** trạng thái đánh giá chuyển sang `hidden`.
2. **Given** đánh giá đã bị ẩn, **when** người mua xem nội dung công khai, **then** đánh giá không xuất hiện.
3. **Given** người không có quyền Admin, **when** cố kiểm duyệt đánh giá, **then** hệ thống từ chối.

### US-ADM-08 — Quản lý tài khoản Admin

**User Story:** Là Super Admin, tôi muốn tạo hoặc xóa tài khoản Admin để kiểm soát quyền vận hành.

**Ưu tiên:** Must  
**Truy vết:** FR-A06

**Acceptance Criteria:**

1. **Given** Super Admin đã xác thực, **when** tạo tài khoản Admin hợp lệ, **then** hệ thống tạo tài khoản với quyền Admin.
2. **Given** Super Admin chọn một tài khoản Admin hợp lệ, **when** xác nhận xóa, **then** hệ thống xóa hoặc vô hiệu hóa quyền truy cập của tài khoản đó.
3. **Given** Admin thông thường, **when** cố tạo hoặc xóa Admin khác, **then** hệ thống từ chối.

## 10. Epic REC — Gợi ý sản phẩm

### US-REC-01 — Nhận gợi ý theo mức độ dữ liệu

**User Story:** Là khách hàng, tôi muốn nhận danh sách sản phẩm phù hợp trên trang chủ và trang chi tiết để dễ khám phá sản phẩm.

**Ưu tiên:** Must  
**Truy vết:** FR-12, FR-ML01, FR-ML02, FR-ML03, FR-ML04

**Acceptance Criteria:**

1. **Given** chưa có đủ dữ liệu người dùng, **when** hệ thống tạo gợi ý, **then** hệ thống sử dụng danh sách phổ biến dựa trên lượt xem, lượt bán và điểm đánh giá trung bình.
2. **Given** có dữ liệu hành vi hoặc lịch sử mua nhưng chưa đủ đánh giá, **when** tạo gợi ý, **then** hệ thống sử dụng gợi ý dựa trên nội dung phù hợp với giai đoạn dữ liệu.
3. **Given** người dùng có đủ dữ liệu đánh giá, **when** tạo gợi ý, **then** hệ thống kết hợp gợi ý dựa trên nội dung và cộng tác theo mô hình Hybrid.
4. **Given** danh sách gợi ý được trả về, **when** khách hàng mở trang chủ hoặc trang chi tiết, **then** sản phẩm gợi ý phù hợp được hiển thị.

### US-REC-02 — Cache và fallback gợi ý

**User Story:** Là khách hàng, tôi muốn vẫn nhận được gợi ý khi dịch vụ ML chậm hoặc lỗi để hành trình mua sắm không bị gián đoạn.

**Ưu tiên:** Must  
**Truy vết:** FR-ML05, Mục 5.5

**Acceptance Criteria:**

1. **Given** kết quả gợi ý đã được tạo, **when** có yêu cầu tương ứng trong vòng 1 giờ, **then** hệ thống có thể trả kết quả từ cache.
2. **Given** dịch vụ ML không phản hồi trong 5 giây, **when** hệ thống yêu cầu gợi ý, **then** hệ thống trả về danh sách sản phẩm phổ biến.
3. **Given** dịch vụ ML gặp lỗi, **when** khách hàng mở khu vực gợi ý, **then** trang vẫn hoạt động và dùng kết quả dự phòng.

### US-REC-03 — Đánh giá chất lượng mô hình

**User Story:** Là nhóm phát triển, tôi muốn so sánh các mô hình gợi ý bằng bộ chỉ số thống nhất để chứng minh chất lượng học thuật của hệ thống.

**Ưu tiên:** Must  
**Truy vết:** Mục 7

**Acceptance Criteria:**

1. **Given** bộ dữ liệu Amazon Electronics đã tiền xử lý theo 5-core, **when** chạy đánh giá offline, **then** dữ liệu được chia Train/Test theo tỷ lệ 80/20.
2. **Given** các mô hình Popular, Content-Based, SVD và Hybrid, **when** chạy đánh giá, **then** hệ thống xuất bảng so sánh Precision@10, Recall@10 và NDCG@10 với ngưỡng liên quan là đánh giá từ 4 sao.
3. **Given** mô hình SVD và Hybrid, **when** chạy đánh giá điểm số, **then** hệ thống xuất thêm RMSE và MAE.

## 11. Yêu cầu chất lượng áp dụng chung

| Mã | Yêu cầu | Áp dụng |
|---|---|---|
| Q-01 | Phản hồi API mục tiêu dưới 500 ms, ngoại trừ luồng ML có timeout riêng 5 giây. | Các story gọi API |
| Q-02 | Trạng thái đơn được cập nhật realtime qua SSE. | US-ORD-01, các story Admin cập nhật đơn |
| Q-03 | Trừ và hoàn tồn kho phải an toàn khi có thao tác đồng thời. | US-CHK-04 đến US-CHK-07, US-ORD-02 |
| Q-04 | Access Token có thời hạn 15 phút; Refresh Token có thời hạn 7 ngày. | Epic AUTH |
| Q-05 | Dữ liệu đầu vào phải được kiểm tra và làm sạch để giảm rủi ro XSS, SQL injection. | Toàn hệ thống |
| Q-06 | Hệ thống hướng tới uptime 99% và có logging cho lỗi tích hợp. | Toàn hệ thống |
| Q-07 | Giao diện responsive trên mobile, tablet, desktop và hỗ trợ Chrome, Safari, Edge. | Các story có giao diện |
| Q-08 | Mọi trạng thái tải, rỗng, lỗi và phản hồi hành động phải tuân thủ UI/UX guideline và i18n. | Các story có giao diện |

## 12. Câu hỏi mở và điểm cần thống nhất

1. **Guest Checkout:** Dòng mô tả FR-06 nói hệ thống gửi mật khẩu mặc định, nhưng sơ đồ tuần tự và lưu ý bảo mật yêu cầu không gửi mật khẩu plaintext mà để Guest tự đặt sau OTP. Tài liệu này ưu tiên luồng an toàn trong Mục 3.5.1; SRS cần được chỉnh để loại bỏ mô tả gửi mật khẩu mặc định.
2. **Thời gian thanh toán lại VNPay:** SRS đang ghi khoảng `30 phút - 1 giờ`; cần chốt một giá trị duy nhất.
3. **Thời gian chờ duyệt COD:** SRS chỉ ghi “trong thời gian hợp lý”; cần chốt thời hạn trước khi tự hủy và hoàn tồn kho.
4. **Dọn dẹp Guest Checkout:** SRS đề xuất 24 giờ nhưng chưa xác nhận là quy tắc chính thức.
5. **Quy trình từ chối trả hàng:** SRS mô tả duyệt yêu cầu trả nhưng chưa quy định trạng thái và kết quả khi Admin từ chối.
6. **Xóa Admin:** SRS chưa chốt xóa vật lý hay vô hiệu hóa tài khoản để bảo toàn lịch sử.
7. **Điểm thưởng/credit:** Chưa thuộc phạm vi hiện tại; hoàn tiền chỉ qua VNPay hoặc COD thủ công.
8. **i18n:** SRS xem i18n là ưu tiên thấp, trong khi convention và `.agents/AGENTS.md` quy định bắt buộc. Khi triển khai, quy định bắt buộc của dự án được ưu tiên.

## 13. Ma trận truy vết

| Yêu cầu SRS | User Story |
|---|---|
| FR-01 | US-AUTH-01, US-AUTH-02 |
| FR-02 | US-AUTH-03, US-AUTH-04 |
| FR-03 | US-AUTH-05 |
| FR-04 | US-CAT-01 |
| FR-05 | US-CART-01, US-CART-02 |
| FR-06 | US-CHK-01, US-CHK-02 |
| FR-07 | US-CHK-02, US-CHK-04, US-CHK-05, US-CHK-06 |
| FR-08 | US-ORD-02 |
| FR-09 | US-ORD-03 |
| FR-10 | US-ORD-01 |
| FR-11 | US-ORD-05 |
| FR-12 | US-REC-01 |
| FR-13 | US-ORD-04 |
| FR-A01 | US-ADM-01 |
| FR-A02 | US-ADM-02, US-ADM-03 |
| FR-A03 | US-ADM-04, US-ADM-05 |
| FR-A04 | US-ADM-06 |
| FR-A05 | US-ADM-07 |
| FR-A06 | US-ADM-08 |
| FR-ML01 đến FR-ML04 | US-REC-01 |
| FR-ML05 | US-REC-02 |
| FR-V1, FR-V2 | US-CHK-05 |
| FR-V3 | US-ADM-06 |
| FR-E1 | US-AUTH-03, US-CHK-01 |
| FR-E2 | US-CHK-02, US-CHK-04, US-CHK-05 |
| FR-E3 | US-ORD-05 |
| FR-E4 | US-AUTH-05 |
