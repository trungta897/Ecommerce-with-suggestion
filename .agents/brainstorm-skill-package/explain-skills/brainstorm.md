---
type: skill-explainer
skill: brainstorm
updated: 2026-07-14
---

# `/brainstorm` là gì và nó chạy như thế nào?

## 1. Dùng để làm gì, khi nào nên gõ lệnh này

`/brainstorm` là lệnh dùng để biến một ý tưởng còn thô thành một tài liệu brainstorm có cấu trúc (khoảng 12-13 mục) cho **một tính năng cụ thể**. Nói ngắn gọn, đây là bước **làm rõ ý tưởng** (clarify): bạn kể ra thứ đang có trong đầu, hệ thống hỏi lại để cùng bạn làm nó rõ ràng và đầy đủ hơn — trước khi biến thành tài liệu yêu cầu.

Ý tưởng ban đầu có thể chỉ là vài chữ như: “thêm cách ôn từ vựng theo lịch lặp lại”, “cho đăng nhập bằng Google”, hoặc một file ghi chú bạn đã viết trước đó. Hệ thống sẽ không vội biến chúng thành tài liệu yêu cầu chính thức. Thay vào đó, hệ thống hỏi bạn từng phần để làm rõ: ai dùng, họ làm gì, điều gì xảy ra khi có lỗi, cần giới hạn bao nhiêu lần, câu thông báo cần hiện là gì...

> **Mẹo quan trọng:** câu lệnh ví dụ chỉ là vài chữ cho gọn. Thực tế, **bạn nên gõ ra càng nhiều càng tốt mọi thứ bạn đang biết và mong muốn về ý tưởng này** — nó dùng để làm gì, phục vụ ai, bạn hình dung nó chạy ra sao, có ràng buộc hay con số nào (giới hạn số lần, thời hạn, quy tắc riêng...), và điều bạn muốn tránh. Cứ viết thoải mái, dài dòng cũng không sao. Mục tiêu là để **hệ thống hiểu đúng ý tưởng và mong muốn của bạn** — bạn cung cấp càng nhiều bối cảnh thì nó càng làm rõ đúng hướng, càng đỡ phải hỏi đi hỏi lại và càng ít phải suy đoán. Viết sơ sài thì vẫn chạy được — chỉ là phần phỏng vấn ở sau sẽ phải hỏi bạn nhiều hơn để bù lại.

Nhưng "làm rõ" ở đây không phải tưởng tượng tự do. Hệ thống làm rõ ý tưởng của bạn **trong khuôn khổ những gì dự án đã có và những gì thực tế làm được**: nó đọc lại các tính năng hiện có để không vẽ trùng hay mâu thuẫn với phần đã chốt, và luôn hỏi tới con số, ràng buộc, giả định và rủi ro cụ thể để ý tưởng đứng được trong thực tế — chứ không dừng ở một ý nghe hay nhưng chung chung (xem thêm Mục 11).

Đây là bước phù hợp khi:

- Bạn vừa có một ý tưởng tính năng nhưng chưa chắc đã nghĩ đủ các tình huống.
- Bạn nhận một ghi chú ngắn từ quản lý, khách hàng hoặc đội vận hành và cần “gỡ” nó ra thành nội dung dễ dùng về sau.
- Bạn muốn cả nhóm thống nhất cách hiểu trước khi viết URD, BRD, PRD cho tính năng.
- Bạn muốn làm thử một ý tưởng nhỏ, nhưng vẫn muốn lưu lại các giả định và câu hỏi còn bỏ ngỏ.

Bạn có thể gõ đơn giản như:

```
/brainstorm thêm ôn từ vựng theo lịch lặp lại cho công cụ luyện từ
```

Hoặc đưa hệ thống đọc một ghi chú có sẵn:

```
/brainstorm @notes/idea.md
```

Nếu chỉ gõ:

```
/brainstorm
```

hệ thống sẽ hỏi bạn muốn brainstorm về ý tưởng nào. Nếu dự án đã có danh sách việc cần làm theo thứ tự ưu tiên, hệ thống có thể gợi ý một tính năng đang cần xử lý trước.

Brainstorm là điểm bắt đầu ở cấp từng tính năng. Sau đó, bạn có thể đi tiếp sang `/urd`, `/brd`, `/prd-epic`, rồi mới tới `/srs`.

---

## 2. Toàn bộ luồng chạy — sơ đồ

Điểm quan trọng nhất cần nhớ: **ở chế độ mặc định, hệ thống phỏng vấn từng phần một và luôn cho bạn xem trước nội dung trước khi ghi thành file.** Bạn không phải trả lời một lúc quá nhiều câu, và hệ thống không tự lưu bản brainstorm khi chưa được bạn đồng ý. (Nếu bạn chọn chế độ nhanh gọn ở Mục 7, hệ thống gộp lại hỏi một lượt — nhưng vẫn giữ nguyên nguyên tắc cho xem trước trước khi ghi.)

```
 BẠN GÕ LỆNH
 /brainstorm "ý tưởng của bạn"
        │
        ▼
 ┌──────────────────────────────────────────────────────┐
 │ GIAI ĐOẠN 1 — Hiểu ý tưởng ban đầu                    │
 │  Hệ thống đọc phần bạn gõ hoặc ghi chú bạn đưa vào.   │
 │  Nếu bạn chưa nêu rõ tính năng là gì, hệ thống hỏi    │
 │  thêm để hiểu đúng chủ đề cần brainstorm.             │
 └──────────────────────────────────────────────────────┘
        │
        ▼
 ┌──────────────────────────────────────────────────────┐
 │ GIAI ĐOẠN 2 — Chọn cách trao đổi phù hợp              │
 │  Mặc định: trao đổi sâu, đủ 7 phần.                   │
 │  Nếu bạn nói "làm nhanh thôi" hoặc "shallow thôi":    │
 │  hệ thống chuyển sang bản hỏi nhanh gọn hơn.          │
 └──────────────────────────────────────────────────────┘
        │
        ▼
 ┌──────────────────────────────────────────────────────┐
 │ GIAI ĐOẠN 3 — Phỏng vấn từng phần một                 │
 │  Hệ thống lần lượt hỏi về:                             │
 │  1. Tổng quan                                          │
 │  2. Người dùng và quyền truy cập                       │
 │  3. Luồng chính                                        │
 │  4. Các bước chi tiết                                  │
 │  5. Dữ liệu, giới hạn, câu chữ hiển thị                │
 │  6. Bối cảnh hệ thống                                  │
 │  7. Ngoại lệ, rủi ro, câu hỏi mở                       │
 │                                                        │
 │  Trả lời xong một phần mới sang phần tiếp theo.       │
 │  Bạn có thể gõ "skip" để để trống một phần.           │
 └──────────────────────────────────────────────────────┘
        │
        ▼
 ┌──────────────────────────────────────────────────────┐
 │ GIAI ĐOẠN 4 — Chỉ đào sâu khi thật sự cần              │
 │  Nếu ý tưởng có nhiều nhánh, nhiều loại người dùng,   │
 │  chuyển sang dịch vụ ngoài hoặc có thay đổi trạng      │
 │  thái, hệ thống đề xuất thêm sơ đồ/bảng phù hợp.       │
 │  Ý tưởng đơn giản thì không bị hỏi thêm vô cớ.        │
 └──────────────────────────────────────────────────────┘
        │
        ▼
 ┌──────────────────────────────────────────────────────┐
 │ GIAI ĐOẠN 5 — Rà lại độ rõ ràng                        │
 │  Hệ thống tự kiểm tra: luồng đã đủ bước chưa, các số  │
 │  liệu và câu chữ đã cụ thể chưa, câu hỏi còn mở đã    │
 │  được ghi nhận chưa.                                  │
 │  Thiếu chỗ nào, hệ thống đề xuất hỏi thêm.             │
 └──────────────────────────────────────────────────────┘
        │
        ▼
 ┌──────────────────────────────────────────────────────┐
 │ GIAI ĐOẠN 6 — Xem trước trước khi ghi                  │
 │  Hệ thống trình bày bản tóm tắt bằng ngôn ngữ BA:     │
 │  luồng nào sẽ có, bảng nào sẽ có, chỗ nào còn để      │
 │  trống chờ bổ sung.                                   │
 │                                                        │
 │  Bạn gõ Y để đồng ý, hoặc yêu cầu sửa lại.            │
 └──────────────────────────────────────────────────────┘
        │
        ▼
 ┌──────────────────────────────────────────────────────┐
 │ GIAI ĐOẠN 7 — Ghi brainstorm và xử lý việc còn mở     │
 │  Sau khi bạn đồng ý, hệ thống mới ghi bản brainstorm. │
 │  Hệ thống gom các câu chưa có đáp án và hỏi bạn muốn  │
 │  giải quyết ngay, chọn vài câu, hay để sau.            │
 └──────────────────────────────────────────────────────┘
        │
        ▼
     HOÀN TẤT — có một nền tảng rõ hơn để viết tài liệu
     yêu cầu cho tính năng ở các bước tiếp theo
```

---

## 3. Vì sao phải phỏng vấn từng phần một?

Một ý tưởng mới thường giống như câu: “Mình nên mở một quán cà phê có góc đọc sách.” Câu đó có hướng đi, nhưng còn rất nhiều điều chưa rõ: ai là khách chính, họ ngồi bao lâu, có cần đặt chỗ không, nếu hết chỗ thì làm gì, có phục vụ thành viên không...

Nếu dồn mười câu hỏi vào một lúc, người trả lời thường gặp hai tình huống:

- Trả lời rất ngắn cho xong, khiến phần sau vẫn mơ hồ.
- Bỏ sót câu hỏi quan trọng vì chưa kịp nghĩ tới.

Vì vậy `/brainstorm` chia cuộc trao đổi thành 7 phần, hỏi từng phần một rồi chờ bạn trả lời. Khi đã hiểu người dùng là ai, hệ thống mới hỏi tiếp luồng chính. Khi đã biết luồng chính, hệ thống mới đào sâu những bước dễ phát sinh vấn đề.

Cách này giống một buổi phỏng vấn nghiệp vụ tốt: người hỏi không cầm một tờ khảo sát dài rồi yêu cầu bạn điền hết, mà cùng bạn lần lượt mở từng lớp của vấn đề. Bạn có thời gian suy nghĩ, còn hệ thống có đủ bối cảnh để hỏi tiếp đúng chỗ.

Nếu một phần chưa có thông tin, bạn có thể gõ `skip`. Hệ thống không coi đó là lỗi. Phần đó sẽ được ghi là **để trống, chờ bổ sung**, đồng thời chuyển thành một câu hỏi mở để không bị quên.

---

## 4. Vì sao hệ thống hay hỏi lại “cụ thể là bao nhiêu?” hoặc “câu chữ chính xác là gì?”

Một câu như “có giới hạn số lần thử” nghe có vẻ đã rõ, nhưng người khác đọc vào vẫn chưa thể làm theo. Giới hạn là 3 lần, 5 lần hay 10 lần? Tính trong một phút, một ngày hay từ lúc tạo tài khoản? Hết giới hạn thì thông báo gì?

Tương tự, “hiện thông báo lỗi” chưa cho biết người dùng sẽ nhìn thấy câu nào. “Có lỗi xảy ra” và “Bạn đã nhập sai mật khẩu 5 lần. Vui lòng thử lại sau 15 phút.” tạo ra hai mức độ rõ ràng rất khác nhau.

Vì thế, hệ thống cố gắng kéo câu trả lời từ chung chung sang cụ thể:

- “Có giới hạn số lần thử” có thể được hỏi lại thành “Cụ thể là bao nhiêu lần, trong khoảng thời gian nào?”
- “Gửi email xác nhận” có thể được hỏi lại thành “Email được gửi ngay hay sau bao lâu, và đường dẫn trong email hết hạn sau mấy giờ?”
- “Hiện lỗi cho người dùng” có thể được hỏi lại thành “Người dùng cần nhìn thấy câu thông báo nào?”

Nhưng đây không phải một cuộc tra khảo. **Hệ thống chỉ hỏi lại đúng một lần.** Nếu bạn vẫn chưa biết, hệ thống ghi nhận là để trống, chờ bổ sung và đưa thành câu hỏi mở.

Điều này giữ được hai việc cùng lúc: tài liệu cố lấy thông tin đủ cụ thể để dùng được thật, nhưng tiến độ không bị kẹt chỉ vì hôm nay bạn chưa có câu trả lời.

---

## 5. Vì sao hệ thống không hỏi lại điều bạn đã trả lời?

Bị hỏi lại một câu mình vừa trả lời thường tạo cảm giác như người đối diện không nghe. Trong công việc BA, điều đó còn làm mất thời gian và giảm niềm tin rất nhanh.

Trước mỗi phần phỏng vấn, `/brainstorm` nhìn lại:

- Ý tưởng ban đầu bạn đã gõ.
- Những câu trả lời bạn đã đưa ra trong cuộc trao đổi hiện tại.
- Nội dung brainstorm cũ, nếu bạn đang tiếp tục làm rõ một ý tưởng đã có.

Từ đó, hệ thống bỏ qua các câu đã có đáp án. Nếu bạn mới trả lời được một nửa, hệ thống chỉ hỏi nốt phần còn thiếu.

Ví dụ, bạn đã nói rõ “chỉ học viên đã đăng nhập mới dùng được”, hệ thống không nên quay lại hỏi “ai được dùng tính năng này?”. Thay vào đó, nó có thể hỏi tiếp phần còn thiếu như: “Người học đã đăng nhập nhưng chưa có từ vựng nào thì màn hình cần hiện gì?”

Nguyên tắc này đơn giản nhưng quan trọng: **mỗi câu hỏi phải giúp cuộc trao đổi tiến lên, không được đưa nó quay lại chỗ cũ.**

---

## 6. “Tự nhận diện độ phức tạp” nghĩa là gì?

Không phải ý tưởng nào cũng cần cùng một lượng câu hỏi.

Ví dụ, ý tưởng “thêm nút bật/tắt chế độ tối” thường chỉ cần làm rõ nút ở đâu, ai dùng được, lựa chọn có được nhớ cho lần sau không, và giao diện thay đổi thế nào. Bắt bạn ngồi vẽ nhiều sơ đồ hoặc trả lời hàng loạt tình huống chi tiết cho việc này sẽ gây mệt mà không tạo thêm nhiều giá trị.

Ngược lại, “cho đăng nhập bằng Google” có nhiều điểm cần kiểm tra hơn: người dùng rời sang Google rồi quay về, có thể đóng trình duyệt giữa chừng, có thể bấm vào đường dẫn quá hạn, hoặc Google trả kết quả về nhưng hệ thống chưa nhận được. Những tình huống đó cần được nhìn rõ từ sớm.

Vì vậy, hệ thống đọc ý tưởng để nhận ra các dấu hiệu phức tạp và chỉ đề xuất phần bổ sung phù hợp:

| Dấu hiệu trong ý tưởng | Hệ thống đề xuất làm thêm |
|---|---|
| Có chuyển sang dịch vụ bên ngoài, như đăng nhập Google hoặc thanh toán | Sơ đồ luồng và bảng xử lý các tình huống bị gián đoạn giữa chừng |
| Có từ hai hướng xử lý trở lên, hoặc có việc tự chạy ngầm phía sau (người dùng không phải ngồi chờ trên màn hình) | Sơ đồ luồng |
| Có nhiều loại người dùng hoặc nhiều tình trạng đầu vào | Bảng các kịch bản: điều kiện nào dẫn tới xử lý nào và kết quả gì |
| Có đối tượng đổi từ tình trạng này sang tình trạng khác, như chờ duyệt sang hoạt động | Bảng chuyển trạng thái |

Các phần này không phải “bài tập bắt buộc cho mọi ý tưởng”. Chúng chỉ được bật khi nội dung thật sự cần. Có thể hình dung như đi khám: bác sĩ không cho mọi người chụp tất cả xét nghiệm, mà dựa vào dấu hiệu để chỉ định thứ cần thiết.

---

## 7. Chế độ “nhanh gọn” dùng khi nào?

Bình thường, `/brainstorm` đi theo chế độ sâu với đủ 7 phần phỏng vấn. Đây là lựa chọn phù hợp khi tính năng có ảnh hưởng đáng kể, còn nhiều điều chưa rõ, hoặc bạn muốn tạo nền tảng chắc hơn trước khi bước sang tài liệu yêu cầu.

Nhưng có những lúc bạn chỉ cần làm nhanh:

- Ý tưởng nhỏ, ít người dùng và ít tình huống.
- Một thử nghiệm ngắn hạn để kiểm tra phản hồi.
- Một bản làm thử tối thiểu.
- Bạn đang trong buổi họp, cần ghi lại ý chính trước rồi quay lại đào sâu sau.

Bạn không cần nhớ cú pháp đặc biệt. Chỉ cần nói tự nhiên như:

```
/brainstorm nhanh gọn cho ý tưởng thêm nút lưu từ vựng
```

hoặc:

```
/brainstorm làm nhanh thôi: cho học viên đánh dấu bài học yêu thích
```

Khi đó, hệ thống gộp lại thành một loạt 6 câu hỏi cốt lõi và bỏ qua những phần vẽ chi tiết không cần thiết.

Chế độ nhanh gọn không có nghĩa là “làm qua loa”. Nó là cách đổi độ sâu của cuộc trao đổi cho phù hợp với quy mô ý tưởng. Những chỗ chưa rõ vẫn được ghi lại để bạn hoặc bước sau xử lý tiếp.

---

## 8. Vì sao brainstorm là điểm dừng bắt buộc trước URD và PRD?

Brainstorm không tự động nhảy sang bước viết URD hay PRD, dù hệ thống đã có đủ nội dung để bắt đầu. Đây là chủ ý.

Hãy hình dung brainstorm như lúc đứng trước một tấm bảng trắng để làm rõ: “Chúng ta đang thực sự muốn làm gì?” Còn URD, BRD, PRD và SRS giống các tài liệu yêu cầu chính thức, được viết sau khi người phụ trách đã xem lại và xác nhận nội dung brainstorm.

Nếu biến ý tưởng thô thành tài liệu chính thức quá sớm, những giả định chưa kiểm tra có thể vô tình trở thành “yêu cầu đã chốt”. Sau này, khi phát hiện hiểu sai, cả chuỗi tài liệu phía dưới đều phải sửa lại.

Vị trí của `/brainstorm` trong dây chuyền thường là:

```
 /prd (toàn sản phẩm)  •  /roadmap  •  /discover
                        │
                        ▼
                   /brainstorm
                        │
                        ▼
        /urd  →  /brd  →  /prd-epic  →  /srs
```

Ở phía trên, `/prd` (mô tả toàn sản phẩm) và `/roadmap` đưa ra danh sách tính năng để bạn chọn cái nào brainstorm trước; `/discover` điều tra một tính năng còn phân vân rồi chuyển phạm vi thô sang làm mồi. Còn `/brainstorm` là nơi **bắt đầu đào sâu cho từng tính năng** trong danh sách đó.

Những câu hỏi chưa có đáp án ở brainstorm không bị bỏ rơi. Chúng được ghi lại và các bước sau như `/urd` hoặc `/brd` sẽ tự động nhắc lại. Điều này giúp bạn đi tiếp khi cần, nhưng vẫn giữ được một danh sách minh bạch về những điều chưa được quyết định.

Phần phụ thuộc giữa các tính năng và các quyết định kỹ thuật chưa phải trọng tâm của brainstorm. Phụ thuộc được chuyển sang `/prd-epic` hoặc `/srs`; còn quyết định kỹ thuật để dành cho `/srs` và đội phát triển — khi phạm vi đã rõ hơn.

---

## 9. Vì sao hệ thống không hỏi câu lập trình?

`/brainstorm` đứng ở vai trò người hỗ trợ BA, không phải người ép BA phải trả lời thay đội phát triển.

Vì vậy, hệ thống có thể hỏi:

- Hệ thống cần lưu những loại thông tin nào, như email, trạng thái hay ngày tạo?
- Có cần gửi email xác nhận không?
- Có dùng dịch vụ ngoài như Google hoặc một cổng thanh toán không, và để làm gì?
- Người dùng được phép làm gì trong từng tình huống?

Nhưng hệ thống không nên hỏi những việc thuộc lựa chọn thực hiện kỹ thuật, như tên bảng dữ liệu, tên cột, tên hàm, cách mã hóa mật khẩu, hoặc công nghệ đội phát triển sẽ chọn.

Sự phân chia này giúp cuộc trao đổi bám vào điều BA và người vận hành hiểu rõ nhất: **người dùng cần gì, nghiệp vụ phải chạy ra sao, và kết quả nào là đúng.** Khi đã có nền đó, đội kỹ thuật có thể bàn tiếp phần cách xây dựng ở bước đặc tả phù hợp.

---

## 10. Vì sao phải xem trước và tự rà lại trước khi ghi?

Trước khi ghi file, hệ thống cho bạn xem một bản tóm tắt bằng ngôn ngữ dễ đọc: tính năng sẽ có những luồng nào, cần những bảng nào, có các con số cụ thể nào, và còn câu hỏi mở nào.

Bạn có thể:

- Gõ `Y` để đồng ý ghi.
- Yêu cầu sửa nội dung.
- Sửa lại tên tính năng nếu hệ thống đoán chưa đúng.
- Nói cứ ghi luôn dù còn một vài chỗ chưa đủ thông tin.

Trước khi đưa bản xem trước, hệ thống cũng tự rà lại một số điểm cơ bản:

- Mỗi luồng chính đã có các bước theo thứ tự chưa?
- Ý tưởng phức tạp đã có sơ đồ hoặc bảng cần thiết chưa?
- Các giới hạn và câu thông báo đã đủ cụ thể chưa?
- Các câu hỏi mở đã được đánh số để dễ theo dõi chưa?

Nếu thấy thiếu, hệ thống đề xuất hỏi thêm vài câu. Tuy nhiên, **quyền quyết định vẫn ở bạn**. Bạn có thể chọn ghi ngay và để phần còn thiếu xử lý sau.

Sau khi ghi xong, hệ thống gom các câu hỏi mở lại để hỏi bạn muốn giải quyết ngay, chỉ chọn một số câu, hay để sau. Vì brainstorm là tài liệu gốc của tính năng, danh sách này chỉ gồm những câu hỏi phát sinh trong chính brainstorm — nó không phải gánh thêm câu hỏi còn treo từ tài liệu khác (điều đó chỉ xảy ra ở các bước sau như `/urd`, `/brd`). Ngoài ra, nếu dự án có danh sách tính năng ở PRD toàn sản phẩm, hệ thống cũng có thể đề xuất đánh dấu tính năng này là “đã chi tiết”, để người theo dõi biết nó đã có brainstorm riêng.

Bản brainstorm được giữ sạch: chỉ có nội dung nghiệp vụ thực sự cần dùng, không chèn các lời nhắc nội bộ hoặc câu thừa làm người đọc sau này khó theo dõi.

---

## 11. Vì sao “làm rõ” phải khớp với hệ thống hiện tại và thực tế?

Có một hiểu lầm cần tránh: brainstorm không phải chỗ để mơ mộng tự do, kiểu “cứ nghĩ ra thật nhiều thứ hay ho”. Nó làm rõ ý tưởng của bạn, nhưng luôn kéo ý tưởng đó về khớp với **hai ràng buộc thật**: những gì dự án đã có, và những gì thực tế làm được.

**Khớp với hệ thống hiện tại.** Trước khi hỏi, hệ thống đọc lại danh sách các tính năng đã có trong dự án. Nhờ vậy nó tránh vẽ ra một thứ trùng lặp hoặc mâu thuẫn với phần đã chốt. Ví dụ, nếu ứng dụng đã có sẵn phần đăng nhập bằng email, thì khi bạn brainstorm “đăng nhập bằng Google”, hệ thống sẽ hỏi ngay những câu nối hai phần đó lại: một người đã có tài khoản email, giờ đăng nhập bằng Google cùng địa chỉ đó thì nối vào tài khoản cũ hay tạo tài khoản mới? Đây là kiểu câu hỏi chỉ nảy ra khi đặt ý tưởng cạnh cái đang có, chứ không phải nghĩ nó một mình.

**Khớp với thực tế.** Hệ thống không để ý tưởng dừng ở mức nghe hay nhưng chung chung. Nó liên tục kéo về mặt đất bằng cách hỏi tới con số cụ thể (giới hạn bao nhiêu, thời hạn bao lâu), buộc ghi rõ các **giả định** đang dựa vào, và liệt kê các **rủi ro** thực tế (người dùng có chịu dùng không, phụ thuộc vào dịch vụ ngoài nào, có vướng qui định gì). Một ý tưởng chỉ thật sự đáng theo đuổi khi nó đứng được với những con số và rủi ro đó — chứ không phải khi nó nghe thuyết phục trên giấy.

Có thể hình dung như một kiến trúc sư giỏi: họ rất muốn hiểu đúng mong muốn của bạn về ngôi nhà mơ ước, nhưng họ cũng luôn đối chiếu với miếng đất bạn thực sự có, ngân sách thực tế, và phần móng đã đổ sẵn. Làm rõ mong muốn mà bỏ qua mấy thứ đó thì chỉ ra được một bức vẽ đẹp không xây được. Brainstorm cũng vậy: nó giúp ý tưởng của bạn vừa rõ ràng, vừa **có thể làm thật**.

---

## Ví dụ thực tế

Chị **Hương** là BA cho một ứng dụng học tiếng Anh. Trong buổi họp, Product Manager nói: “Mình nên cho học viên đăng nhập bằng Google để vào nhanh hơn.” Chị Hương muốn làm rõ ý tưởng trước khi viết yêu cầu chính thức, nên gõ:

```
/brainstorm thêm đăng nhập bằng Google cho ứng dụng học tiếng Anh
```

Hệ thống nhận ra đây không chỉ là một nút mới trên màn hình. Người dùng sẽ rời ứng dụng sang Google rồi quay lại, nên có dấu hiệu cần xem kỹ luồng đi và về.

Đầu tiên, hệ thống hỏi chị Hương phần tổng quan: mục tiêu là giảm thời gian đăng ký và đăng nhập cho học viên mới. Sau đó nó hỏi ai được dùng. Chị Hương trả lời: học viên chưa đăng nhập và học viên đã có tài khoản đều dùng được; quản trị viên vẫn dùng cách đăng nhập hiện tại.

Đến phần luồng chính, chị Hương mô tả: người dùng bấm “Đăng nhập với Google”, chọn tài khoản Google, quay lại ứng dụng, rồi vào trang chủ.

Hệ thống hỏi tiếp một điểm cụ thể: “Nếu email Google đã trùng với một tài khoản đang có thì xử lý thế nào?” Chị Hương trả lời rằng hệ thống tự nối với tài khoản cũ và cho đăng nhập luôn.

Khi chị nói “nếu đăng nhập thất bại thì báo lỗi”, hệ thống hỏi lại đúng một lần: “Câu thông báo người dùng cần thấy là gì?” Chị Hương chưa chốt được câu chữ nên trả lời: “Để tôi hỏi lại đội nội dung.” Hệ thống không hỏi dai. Nó ghi thành một câu hỏi mở: “Cần chốt câu thông báo khi đăng nhập Google không thành công.”

Vì có chuyển sang Google rồi quay lại, hệ thống đề xuất thêm sơ đồ luồng và một bảng các tình huống bị gián đoạn. Chị Hương cùng hệ thống làm rõ vài trường hợp:

- Người dùng đóng trình duyệt khi đang chọn tài khoản Google.
- Người dùng từ chối cấp quyền.
- Google trả kết quả nhưng ứng dụng chưa nhận được thông tin.
- Người dùng dùng một email Google đã liên kết với tài khoản khác.

Khi trao đổi xong, hệ thống tự rà lại và đề xuất hỏi thêm: “Nếu người dùng có tài khoản cũ nhưng chưa xác nhận email thì có cho tự nối không?” Chị Hương chưa có quyết định nên chọn ghi lại thành câu hỏi mở.

Sau đó, hệ thống cho chị xem trước: bản brainstorm sẽ có mục tiêu, nhóm người dùng, luồng đăng nhập, sơ đồ luồng, bảng tình huống gián đoạn, các quy tắc cần áp dụng và hai câu hỏi còn mở. Hệ thống trình bày rõ cả những gì đã biết lẫn những gì chưa biết.

Chị Hương thấy đúng ý, gõ `Y`. Lúc này hệ thống mới ghi bản brainstorm.

Sau khi ghi, hệ thống hỏi chị có muốn xử lý hai câu hỏi mở ngay không. Chị Hương chọn “để sau” vì cần xác nhận với Product Manager và đội nội dung. Các câu đó vẫn được giữ lại để khi chị chuyển sang `/urd`, hệ thống nhắc tiếp thay vì để chúng biến mất.

Nhờ vậy, chị Hương chưa phải bàn chuyện kỹ thuật xây thế nào, nhưng đã có một nền tảng đủ rõ để cả Product Manager, đội vận hành và đội phát triển hiểu cùng một ý về tính năng đăng nhập Google.

---

## Xem thêm

Tài liệu này chỉ giải thích ý tưởng và luồng chạy ở mức dễ hiểu. Muốn xem đầy đủ chi tiết kỹ thuật (7 phần phỏng vấn, các dấu hiệu nhận diện độ phức tạp, cổng chất lượng, format lệnh, các trường hợp đặc biệt), đọc file gốc: `.claude/skills/brainstorm/SKILL.md`.
