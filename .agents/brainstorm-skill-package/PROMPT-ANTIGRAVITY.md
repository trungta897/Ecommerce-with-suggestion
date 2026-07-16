# Prompt cài bộ `/brainstorm` vào Antigravity IDE

> **Cách dùng:** mở thư mục gói này (`brainstorm-skill-package/`) trong Google Antigravity IDE → mở chat agent → copy NGUYÊN khối prompt dưới đây → dán → gửi. Agent tự đọc file trong gói, sao chép và chuyển skill vào đúng chỗ. Muốn hiểu cơ chế, xem `INSTALL-ANTIGRAVITY.md`.

---

````text
Đây là bộ skill /brainstorm phỏng vấn làm rõ ý tưởng BA, được viết ban đầu cho Claude Code.
Bạn là agent của Google Antigravity IDE. Nhiệm vụ của bạn là SAO CHÉP bộ này sang Antigravity
và CHUYỂN ĐỔI đúng chuẩn Antigravity, không cài trực tiếp cấu trúc Claude Code.

Bám tài liệu Antigravity mới nhất khoảng 06/2026 khi thực hiện:
antigravity.google/docs/skills, antigravity.google/docs/rules-workflows và codelab
Authoring Antigravity Skills. Nếu có thể đọc web, hãy đối chiếu trực tiếp; nếu không, làm theo
INSTALL-ANTIGRAVITY.md trong gói này vì file đã được cập nhật theo tài liệu khoảng 06/2026.
Path và format có thể khác giữa các bản Antigravity, nên không được đoán theo bản cũ.

══════════ BƯỚC 0 — CHỌN PHẠM VI VÀ XÁC MINH CẤU HÌNH ══════════
TRƯỚC KHI sao chép, hỏi tôi và chờ câu trả lời: cài cho workspace hiện tại hay cài global cho
mọi project. Không được tự chọn phạm vi.

- Workspace: xác minh thư mục cấu hình thực tế là .agents/ hay .agent/.
- Global: dùng phạm vi global dưới ~/.gemini/ theo đúng cấu trúc mà phiên bản Antigravity hiện
  tại hỗ trợ.
- Kiểm tra tài liệu, cấu trúc workspace hiện có và màn hình/câu lệnh tạo skill của IDE.
- Nếu vẫn chưa chắc, tạo một skill thử nghiệm rỗng bằng UI hoặc lệnh chính thức, reload IDE,
  xác nhận Antigravity đã nhận diện skill và ghi lại path thực tế.
- Xóa skill thử nghiệm sau khi xác minh. Dùng đúng path đã xác minh thay cho mọi path mẫu bên
  dưới, rồi báo tôi biết phạm vi và thư mục cấu hình đã chọn.

Gọi thư mục cấu hình đã xác minh là THU_MUC_CAU_HINH trong các bước tiếp theo.

══════════ BƯỚC 1 — ĐỌC NGUỒN TRONG GÓI NÀY ══════════
Đọc đầy đủ nội dung nguồn trước khi tạo file đích:

- Skill: claude-code/.claude/skills/brainstorm/SKILL.md.
- Reference: claude-code/.claude/skills/brainstorm/references/example-brainstorm.md.
- Đủ 7 rule tại claude-code/.claude/rules/: feature-bootstrap, ba-conventions,
  approval-gate, naming-conventions, keyword-detection, resolve-oqs và changelog.
- Template: claude-code/_templates/brainstorm.md.
- Ví dụ mẫu: example/food-delivery-checkout.md để hiểu output đúng phải trông như thế nào.

Skill brainstorm KHÔNG có agent hoặc script phụ; bộ này chỉ gồm skill, rule và template.
Không bịa bước chuyển agent, subagent, Task tool, script hoặc engine không tồn tại trong nguồn.

══════════ BƯỚC 2 — TẠO SKILL BRAINSTORM CHO ANTIGRAVITY ══════════
Sao chép skill sang THU_MUC_CAU_HINH/skills/brainstorm/SKILL.md theo cấu trúc hiện hành của
Antigravity.

- Giữ TOÀN BỘ nội dung nghiệp vụ: Goal, 4 pha, 7 nhóm phỏng vấn, Constraints, Gotchas và
  các hướng dẫn liên quan.
- Chuyển các phần phụ thuộc Claude Code sang cơ chế tương đương của Antigravity, nhưng không
  làm thay đổi logic nghiệp vụ brainstorm.
- Frontmatter chỉ giữ name và description, trừ khi tài liệu Antigravity hiện hành bắt buộc thêm
  field khác; nếu có, chỉ thêm field bắt buộc và ghi rõ trong báo cáo.
- Bỏ field chỉ dành cho Claude Code: allowed-tools, user-invocable, context và argument-hint.
- Đưa cú pháp gọi cũ vào mục Cách gọi trong body:
  /brainstorm <idea> | @<file> | (empty).
- Copy reference example-brainstorm.md vào
  THU_MUC_CAU_HINH/skills/brainstorm/references/example-brainstorm.md.
- Sửa hoặc bỏ các mục References còn trỏ tới path Claude Code cũ.

Description là trigger phrase quyết định skill có được Antigravity nhận diện và nạp đúng hay
không. Viết cụ thể rằng skill ghi lại ý tưởng thô rồi phỏng vấn sâu để làm rõ luồng, decision,
số liệu và wording trước khi viết URD/PRD; hỏi bằng ngôn ngữ nghiệp vụ.

- Description xấu: Hỗ trợ brainstorm.
- Description tốt: Ghi lại ý tưởng BA thô và phỏng vấn từng nhóm để làm rõ luồng, quyết định,
  số liệu và wording trước khi viết URD hoặc PRD; dùng ngôn ngữ nghiệp vụ và yêu cầu xem trước
  kế hoạch trước khi ghi tài liệu.

Không dùng description chung chung hoặc chỉ mô tả tên skill.

══════════ BƯỚC 3 — TEMPLATE VÀ 7 RULE ══════════
- Copy claude-code/_templates/brainstorm.md vào
  THU_MUC_CAU_HINH/skills/brainstorm/templates/brainstorm.md.
- Sửa reference trong SKILL.md từ @../../../_templates/brainstorm.md thành
  templates/brainstorm.md hoặc path tương đương đúng theo cấu trúc đích đã xác minh.
- Copy đủ 7 rule nguồn vào THU_MUC_CAU_HINH/rules/ nếu phiên bản Antigravity tự nạp rules ở đó.
- Nếu tài liệu hiện hành dùng cơ chế rules khác, chuyển đủ nội dung 7 rule sang cơ chế đó và
  ghi rõ ánh xạ trong báo cáo.
- Không để reference nào vẫn trỏ đến .claude/ ngoài thư mục nguồn.

══════════ BƯỚC 4 — WORKFLOW HOẶC LỆNH /brainstorm TÙY CHỌN ══════════
Nếu phiên bản Antigravity hỗ trợ workflows hoặc slash command, tạo workflow mỏng cho brainstorm
theo path và format chính thức của IDE, để người dùng có thể gọi /brainstorm. Workflow chỉ cần
description rõ ràng và trỏ về skill tương ứng.

Nếu workspace không dùng workflows hoặc tài liệu hiện hành không hỗ trợ cách này, bỏ qua bước
này và nêu rõ cách kích hoạt bằng câu tự nhiên. Không tạo file workflow theo cấu trúc đoán mò.

══════════ BƯỚC 5 — KIỂM TRA SAU CÀI ══════════
Reload hoặc khởi động lại Antigravity theo cách tài liệu hiện hành yêu cầu.

- Mở Skills panel, command palette, log nạp skill hoặc cơ chế tương đương trong IDE.
- Xác nhận brainstorm được nhận diện theo cả name và description, không chỉ kiểm tra file đã
  tồn tại.
- Nếu skill không xuất hiện hoặc không được kích hoạt bởi câu phù hợp, sửa path, frontmatter
  hoặc description rồi reload và kiểm tra lại.
- Chạy thử: brainstorm luồng đặt món và thanh toán cho app giao đồ ăn.
- Xác nhận agent hỏi TỪNG NHÓM MỘT, không dồn toàn bộ câu hỏi một lần, rồi DỪNG tại bước xem
  trước trước khi ghi file; không tự ghi im lặng.

══════════ RÀNG BUỘC KHÔNG ĐỔI ══════════
- Giữ nguyên logic phỏng vấn 7 nhóm và bắt buộc HỎI TỪNG PHẦN MỘT.
- Hỏi bằng ngôn ngữ nghiệp vụ; KHÔNG hỏi tên column DB, endpoint hay framework.
- Ép làm rõ số liệu và wording chính xác khi cần; không hỏi lại thông tin đã có, theo nguyên
  tắc no re-ask.
- Giữ approval gate: phải xem trước kế hoạch rồi mới ghi tài liệu.
- Xử lý Open Questions ở cuối đúng theo workflow gốc.
- Giữ shallow mode khi người dùng nói nhanh gọn hoặc tương đương.
- Vietnamese-first.
- Với ý tưởng có thanh toán, OAuth hoặc webhook, vẫn phải vẽ ASCII flow để người dùng duyệt và
  bao gồm tình huống interrupted-tx.
- Không làm mất nội dung nghiệp vụ chỉ vì Antigravity không có cơ chế giống Claude Code.

══════════ BÁO CÁO ══════════
Sau khi xong, in ra:

1. Phạm vi đã chọn và THU_MUC_CAU_HINH thực tế đã xác minh.
2. Cây thư mục đã tạo, gồm skill, reference, template, 7 rule và workflow nếu có.
3. Trạng thái Antigravity đã nhận diện skill brainstorm theo name và description.
4. Cách kích hoạt: câu tự nhiên và /brainstorm nếu có workflow.
5. Những gì đã đổi so với Claude Code: frontmatter, path, reference, rules và workflow.
6. Kết quả chạy thử food-delivery, xác nhận đã hỏi TỪNG NHÓM MỘT và dừng ở bước xem trước
   trước khi ghi file.
````
