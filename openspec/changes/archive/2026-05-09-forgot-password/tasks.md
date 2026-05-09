## 1. Email 發送基礎建設

- [x] 1.1 建立 email helper（Email sending via toSend API）：src/lib/email.ts 匯出 sendPasswordResetEmail(email, resetUrl) 函式，呼叫 toSend API（POST https://tosend.io/api/send），使用 TOSEND_API_KEY 和 TOSEND_FROM_EMAIL 環境變數。toSend API 失敗時 console.error 不拋異常（silent failure）。驗證：單元測試 mock fetch 確認正確呼叫參數和錯誤處理。[Tool: copilot]

## 2. 忘記密碼 API

- [x] 2.1 建立忘記密碼端點（Password reset request via email）：POST /api/auth/forgot-password 接受 `{ email }` 參數。Email 存在時用 NEXTAUTH_SECRET 簽 JWT（payload: email + purpose:"password-reset"，15 分鐘過期），呼叫 sendPasswordResetEmail 發送重設連結。不論 email 是否存在都回 200 `{ message }` — 設計決策「不揭露 email 是否存在」。缺少 email 欄位回 400。驗證：單元測試涵蓋 email 存在、不存在、缺欄位三種場景。[Tool: copilot]

## 3. 重設密碼 API

- [x] 3.1 建立重設密碼端點（Password reset confirmation with token）：POST /api/auth/reset-password 接受 `{ token, password }` 參數。驗證 JWT 簽章和 purpose="password-reset"。成功時用 bcryptjs cost 10 雜湊新密碼寫入 SQLite users 表 — 設計決策「密碼雜湊使用 bcryptjs cost factor 10」。Token 過期回 401「重設連結已過期」，無效回 401「重設連結無效」，缺欄位回 400。驗證：單元測試涵蓋有效 token、過期 token、無效 token、缺欄位四種場景。[Tool: copilot]

## 4. 前端頁面

- [x] [P] 4.1 建立忘記密碼頁面（Forgot password page）：/forgot-password 顯示 email 輸入欄位和送出按鈕。送出後呼叫 POST /api/auth/forgot-password 並顯示成功訊息。空 email 有客戶端驗證。含返回 /login 連結 — 設計決策「重設密碼頁面路由設計」。驗證：瀏覽器截圖確認頁面渲染正確。[Tool: copilot]
- [x] [P] 4.2 建立重設密碼頁面（Reset password page）：/reset-password 從 URL 讀 token query 參數。顯示「新密碼」和「確認密碼」欄位。兩次密碼不一致顯示錯誤。成功後顯示訊息並 3 秒後導向 /login。API 回 401 顯示錯誤訊息 — 設計決策「Token 簽署方式使用 JWT」「Token 有效期設為 15 分鐘」。驗證：瀏覽器截圖確認頁面渲染和錯誤狀態。[Tool: copilot]
- [x] 4.3 登入頁加忘記密碼連結（User login with credentials — Forgot password link visible on login page）：在 /login 頁面登入按鈕下方、「總管理員登入」連結上方新增「忘記密碼」連結，導向 /forgot-password。驗證：瀏覽器截圖確認連結位置和導向。[Tool: copilot]

## 5. 環境變數設定

- [x] 5.1 新增 TOSEND_FROM_EMAIL 環境變數 — 設計決策「Email 發送使用 toSend HTTP API」：在 .env.example 和 .env.local 加入 TOSEND_FROM_EMAIL=fish@aiver.me。驗證：grep .env.local 確認值存在。[Tool: copilot]

## 6. Middleware 白名單

- [x] 6.1 middleware 放行忘記密碼路由：確認 src/middleware.ts 白名單包含 /forgot-password 和 /reset-password，未登入用戶可存取。驗證：curl 測試未帶 token 存取 /forgot-password 回 200。[Tool: copilot]

## 7. 端到端驗證

- [x] 7.1 E2E 驗證完整忘記密碼流程：用瀏覽器走完 /login → 忘記密碼 → /forgot-password → 送出 → /reset-password → 輸入新密碼 → 導回 /login。截圖每個步驟。驗證：所有頁面截圖正確，API 回應符合 spec。[Tool: sonnet]

## 8. Code Review

- [x] 8.1 Kimi CR 全部新增和修改檔案：審查安全性（token 不揭露 email 存在性、JWT 簽章正確性、bcrypt 使用）、邏輯正確性、錯誤處理。驗證：Kimi 報告無 Critical finding。（本地無 Kimi MCP，改由 Codex 做同等安全審查，新增 audit log 與 user 存在性檢查，無 Critical finding）[Tool: kimi]
