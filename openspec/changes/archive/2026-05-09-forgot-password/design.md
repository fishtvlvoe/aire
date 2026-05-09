## Context

AIRE 客戶登入系統使用 next-auth 4.x + SQLite（better-sqlite3）。客戶忘記密碼時，目前只能聯繫管理員手動重設。系統已有 toSend email API 整合（TOSEND_API_KEY 在 .env 中），發信地址為 fish@aiver.me。NEXTAUTH_SECRET 已存在，可用於簽署 JWT token。

## Goals / Non-Goals

**Goals:**

- 客戶能從登入頁自助完成密碼重設，無需管理員介入
- 使用 email 驗證身份，透過一次性 token 確保安全
- 整合現有 toSend API，不引入新依賴

**Non-Goals:**

- 管理員忘記密碼功能（管理員只有一人，直接改 .env 重啟即可）
- SMS 簡訊驗證
- 密碼強度規則驗證
- 帳號鎖定機制（多次失敗嘗試）
- email 模板美化（先用純文字）

## Decisions

### Token 簽署方式使用 JWT

使用 jsonwebtoken 套件以 NEXTAUTH_SECRET 簽署含 email + 用途 + 過期時間的 JWT token。

**Alternatives Considered:**

1. 隨機 UUID 存 DB → 需要額外建 reset_tokens 表，增加 DB 複雜度，且需要清理過期記錄。否決因為 JWT 無狀態更簡單。
2. 用 crypto.createHmac 手動簽 → 需自己處理過期邏輯和 payload 編碼。否決因為 jsonwebtoken 已處理這些。

### Token 有效期設為 15 分鐘

重設連結 15 分鐘後自動失效。

**Alternatives Considered:**

1. 1 小時 → 時間太長，安全風險增加。否決。
2. 5 分鐘 → 太短，客戶可能來不及檢查 email。否決。

### Email 發送使用 toSend HTTP API

直接用 fetch 呼叫 toSend API，不引入 nodemailer 等套件。

**Alternatives Considered:**

1. nodemailer + SMTP → 需要額外套件和 SMTP 設定。否決因為 toSend 已經可用且更簡單。
2. Resend API → 需要額外註冊和 API key。否決因為已有 toSend。

### 重設密碼頁面路由設計

忘記密碼頁面：/forgot-password。重設密碼頁面：/reset-password?token=xxx。兩個都是獨立頁面，不在 /login 內做 tab 切換。

**Alternatives Considered:**

1. /login?mode=forgot → URL 不直覺，且會讓 login 頁面邏輯變複雜。否決。
2. /auth/forgot-password → 加 /auth 前綴無必要，目前 /login 也沒有前綴。否決。

### 密碼雜湊使用 bcryptjs cost factor 10

與現有系統一致（seed-admin 使用 cost factor 10）。

**Alternatives Considered:**

1. cost factor 12 → 更安全但每次雜湊慢 4 倍，對本機 SQLite 部署無必要。否決。
2. argon2 → 更現代但需要 native binding，增加部署複雜度。否決。

### 不揭露 email 是否存在

無論 email 是否存在於資料庫，forgot-password API 都回傳相同成功訊息，避免 email 枚舉攻擊。

**Alternatives Considered:**

1. 回傳「此 email 不存在」→ 讓攻擊者探測有效帳號。否決因為安全風險。
2. 加 CAPTCHA → 增加使用者摩擦，目前規模不需要。否決但未來可加。

## Implementation Contract

**Behavior:**

1. 客戶在 /login 頁面點擊「忘記密碼」連結 → 導向 /forgot-password
2. 客戶輸入 email 按送出 → POST /api/auth/forgot-password → 無論 email 是否存在都顯示「如果帳號存在，重設連結已發送至您的信箱」
3. 若 email 存在 → toSend API 發送含重設連結的 email（連結格式：{NEXTAUTH_URL}/reset-password?token={jwt}）
4. 客戶點擊連結 → /reset-password 頁面驗證 token → 顯示新密碼輸入表單
5. 客戶送出新密碼 → POST /api/auth/reset-password → 驗證 token、bcryptjs 雜湊新密碼、更新 SQLite users 表 → 回傳成功 → 導回 /login

**Interface / Data Shape:**

- POST /api/auth/forgot-password — body: `{ email: string }` — response: `{ message: string }` (always 200)
- POST /api/auth/reset-password — body: `{ token: string, password: string }` — response: 200 `{ message: string }` or 400/401 `{ error: string }`
- JWT payload: `{ email: string, purpose: "password-reset", iat: number, exp: number }`
- toSend API call: POST https://tosend.io/api/send — headers: `{ Authorization: Bearer <TOSEND_API_KEY> }` — body: `{ from: TOSEND_FROM_EMAIL, to: email, subject: string, text: string }`
- Email helper: src/lib/email.ts — export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<void>

**Failure Modes:**

- token 過期 → 401 `{ error: "重設連結已過期，請重新申請" }`
- token 無效/竄改 → 401 `{ error: "重設連結無效" }`
- toSend API 失敗 → 記 console.error，但前端仍顯示成功訊息（不揭露 email 存在性）
- email 不存在 → 不寄信，前端仍顯示成功訊息

**Acceptance Criteria:**

- 完整流程：輸入存在的 email → 收到信 → 點連結 → 設新密碼 → 用新密碼登入成功
- 安全性：輸入不存在的 email → 前端顯示相同成功訊息，不寄信
- token 過期：等 15 分鐘後點連結 → 顯示過期錯誤
- 密碼更新後舊密碼無法登入

**Scope Boundaries:**

- IN: forgot-password 頁面、reset-password 頁面、兩個 API endpoint、email 發送 helper、login 頁面加連結
- OUT: 管理員密碼重設、SMS 驗證、密碼強度規則、帳號鎖定、email 模板美化

## Risks / Trade-offs

- [JWT 無法撤銷] → 15 分鐘短存活期 + 單次用途設計降低風險。未來可加 DB blacklist。
- [toSend API 故障] → 前端不揭露失敗，記 console.error。客戶可重試。
- [Email 延遲送達] → 15 分鐘窗口足夠涵蓋一般 email 延遲。
- [純文字 email] → 先求功能可用，美化留給後續迭代。
