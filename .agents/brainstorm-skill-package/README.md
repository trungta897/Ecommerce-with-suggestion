# Bộ skill `/brainstorm` cho BA — Brainstorm Skill Package

> Skill `/brainstorm` biến **một ý tưởng thô** thành **brainstorm board có cấu trúc** (12 mục) qua phỏng vấn sâu từng phần: luồng chính + ASCII diagram, decision points, scenario matrix, state transitions, xử lý giao dịch gián đoạn, và **số liệu + wording chính xác** — trước khi viết URD/BRD/PRD/SRS. Phục vụ **IT Business Analyst**, không phải developer: hỏi bằng ngôn ngữ nghiệp vụ, không hỏi schema DB / endpoint / framework.
>
> Gói này viết cho **Claude Code**, kèm hướng dẫn **port sang Codex CLI** và **Google Antigravity IDE**.

Bộ này là một phần của bộ công cụ BA-KIT dạy trong khóa **AI4BA** — [ai4ba.com](https://ai4ba.com). Xem mục [Về AI4BA](#về-ai4ba).

---

## `/brainstorm` làm gì

Bạn gõ một câu ý tưởng → skill:

1. **Tự suy tên feature + tên ý tưởng** (bạn xác nhận, sửa được).
2. **Phát hiện độ phức tạp** (có thanh toán/OAuth/webhook? nhiều vai trò? có trạng thái?) để quyết định cần vẽ artifact nào.
3. **Phỏng vấn sâu từng phần** (7 nhóm, hỏi từng phần một — không dồn 10 câu) bằng **ngôn ngữ nghiệp vụ**.
4. **Ép số liệu + wording chính xác** — không chấp nhận "có rate limit" mà hỏi "bao nhiêu lần/phút"; không chấp nhận "báo lỗi" mà hỏi "câu lỗi chính xác là gì".
5. **Tổng hợp** thành board 12 mục + tự kiểm chất lượng → xem trước (L1) rồi mới ghi.
6. **Xử lý Open Questions** — chốt ngay hoặc để dành, downstream (`/urd`, `/srs`…) sẽ **kế thừa** lại.

> Có ý tưởng nhỏ (dark mode, đổi nút)? Nói "brainstorm nhanh gọn" → skill chạy nhanh 1 lượt, bỏ qua deep interview. Không cần gõ flag.

---

## Gói này có gì

```
brainstorm-skill-package/
├── README.md                      ← bạn đang đọc
├── LICENSE                        ← MIT
├── huong-dan/                     ← HƯỚNG DẪN SỬ DỤNG CHI TIẾT
│   ├── 00-bat-dau-nhanh.md        ← cài + chạy thử trong 5 phút
│   ├── 01-cach-hoat-dong.md       ← luồng 4 pha: suy tên → phỏng vấn → tổng hợp → ghi + OQ
│   ├── 02-huong-dan-phong-van.md  ← 7 nhóm câu hỏi hỏi gì, trả lời sao cho chất lượng
│   └── 03-cau-hoi-thuong-gap.md   ← FAQ + mẹo + xử lý tình huống
├── explain-skills/
│   └── brainstorm.md              ← giải thích nghiệp vụ (cho người không rành kỹ thuật)
├── example/                       ← VÍ DỤ ĐẦY ĐỦ: brainstorm feature food-delivery (nhiều luồng)
│   ├── README.md                  ← bản đồ 12 mục + điểm đáng học
│   └── food-delivery-checkout.md  ← output thật
├── claude-code/                   ← BỘ NGUYÊN BẢN cho Claude Code (copy vào workspace)
│   ├── .claude/
│   │   ├── skills/brainstorm/     ← skill + references/example-brainstorm.md
│   │   └── rules/                 ← 7 rule skill phụ thuộc
│   └── _templates/
│       └── brainstorm.md          ← khung output 12 mục (skill render từ đây)
├── INSTALL-CODEX.md               ← port sang Codex CLI (.codex/)
├── INSTALL-ANTIGRAVITY.md         ← port sang Google Antigravity IDE (.agents/)
├── PROMPT-CODEX.md                ← prompt copy-paste để Codex tự cài
└── PROMPT-ANTIGRAVITY.md          ← prompt copy-paste để Antigravity tự cài
```

> **Khác gói cũ:** bản này gom sang cấu trúc `claude-code/` + `huong-dan/` + `explain-skills/` + `example/` (giống bộ diagram-skills), thêm **ví dụ nhiều luồng render sẵn**, hướng dẫn phỏng vấn chi tiết, và port cho cả Codex + Antigravity.

---

## Bắt đầu ngay (Claude Code)

`/brainstorm` **không cần cài công cụ render** nào (khác diagram-skills) — chỉ cần Claude Code + một workspace BA. Copy skill vào workspace:

```bash
cp -R claude-code/.claude/skills/brainstorm  <workspace>/.claude/skills/
cp    claude-code/.claude/rules/*.md         <workspace>/.claude/rules/
cp    claude-code/_templates/brainstorm.md   <workspace>/_templates/
```

> Workspace đã có bộ BA-KIT → rule có thể trùng, cứ giữ bản đang dùng. Chưa có → copy đủ 7 rule (skill tham chiếu ở mục References: feature-bootstrap, ba-conventions, approval-gate, naming-conventions, keyword-detection, resolve-oqs, changelog).

Mở Claude Code tại workspace và chạy:

```
/brainstorm thêm luồng đặt món và thanh toán online/COD cho app giao đồ ăn
/brainstorm đăng nhập email + Google OAuth        # phức tạp → deep mode tự bật
/brainstorm dark mode toggle, brainstorm nhanh gọn thôi   # nhỏ → nói "nhanh gọn"
/brainstorm @notes/idea-2026-07-15.md             # ý tưởng từ file
```

👉 Chi tiết ở **`huong-dan/00-bat-dau-nhanh.md`**.

---

## Điểm mạnh của bộ này

- **Hỏi đúng cái BA cần** (business language) — cấm hỏi tên column DB, endpoint, framework, thuật toán (theo `rules/ba-conventions.md`).
- **Ép độ cụ thể.** Số liệu (5 lần/phút, 24h) + wording chính xác — nền cho `/srs` Error Matrix sau này.
- **Không hỏi lại.** Quét ý tưởng + câu trả lời trước + doc có sẵn, chỉ hỏi phần còn thiếu (no re-ask).
- **Artifact theo độ phức tạp.** Có thanh toán/OAuth → tự yêu cầu ASCII flow + interrupted-tx matrix; có trạng thái → state transitions; nhiều vai → scenario matrix.
- **Approval gate (HITL).** Không tự ghi — xem trước (L1) bằng ngôn ngữ nghiệp vụ rồi mới ghi.
- **Chuỗi OQ liền mạch.** Open Questions được `/urd` `/brd` `/srs` kế thừa, không rơi rớt.

---

## Port sang công cụ khác

- **Codex CLI** → `INSTALL-CODEX.md` + `PROMPT-CODEX.md`.
- **Google Antigravity IDE** → `INSTALL-ANTIGRAVITY.md` + `PROMPT-ANTIGRAVITY.md`.

---

## Về AI4BA

Bộ skill này là công cụ thực hành trong khóa **AI4BA — AI cho Business Analyst** tại **[ai4ba.com](https://ai4ba.com)**.

AI4BA dạy BA/PO dùng AI (Claude Code, Codex, Antigravity…) để làm nhanh và chuẩn hơn toàn bộ vòng đời tài liệu nghiệp vụ: từ **brainstorm ý tưởng** (chính là bộ này) → URD/BRD/PRD/SRS → vẽ sơ đồ → user story/acceptance criteria → đồng bộ Jira/Confluence và bàn giao. Brainstorm là **cửa vào** — nơi biến ý tưởng thô thành thông tin đủ chắc để đặc tả.

### Triết lý: Human-in-the-loop — BA vẫn là cốt lõi

AI4BA **không** thay BA bằng AI. Ngược lại: **BA là người điều khiển, AI là công cụ tăng tốc.** `/brainstorm` là ví dụ rõ nhất của triết lý này:

- **BA cung cấp context — AI mới hiểu đúng nghiệp vụ.** Brainstorm không tự nghĩ ra nghiệp vụ; nó **phỏng vấn BA** để moi ra luồng, số liệu, wording, ràng buộc. Chất lượng board phụ thuộc câu trả lời của BA. Chưa có thông tin → skill ghi Open Question, **không bịa** số liệu/luật.
- **BA duyệt trước khi ghi (approval gate).** Skill hỏi từng phần, ép độ cụ thể, tổng hợp — rồi **xem trước (L1)** bằng ngôn ngữ nghiệp vụ. BA gõ `Y` mới ghi. Mọi thay đổi qua tay người.
- **BA review output — không giao khoán cho AI.** Brainstorm board là **bản nháp có cấu trúc để BA thẩm định + bổ sung**, không phải đặc tả cuối. BA sửa, thêm, chốt Open Questions. AI hệ thống hóa; BA chịu trách nhiệm nội dung.
- **AI lo phần máy móc, BA lo phần tư duy.** AI nhớ khung 12 mục, ép cấu trúc, không quên hỏi edge case/interrupted-tx — để BA tập trung vào cái chỉ con người làm được: hiểu nghiệp vụ, phán đoán đánh đổi, làm việc với stakeholder.

> Nói ngắn: **AI làm nhanh hơn, BA làm chuẩn hơn.** Bộ skill này ép đúng vòng lặp đó — AI đề xuất, BA kiểm soát và quyết.

Muốn học đầy đủ quy trình BA-with-AI và các bộ skill khác → **[ai4ba.com](https://ai4ba.com)**.

---

## License

MIT — xem `LICENSE`. Dùng tự do, ghi nguồn AI4BA nếu chia sẻ lại.
