## Context

AIRE 目前的登入頁（`/login`）只有帳號 + 密碼兩欄，預設顯示 admin/admin123 提示。License key 驗證在 middleware 層靜默執行（讀取本機已儲存的 license），客戶無需手動輸入序號。管理員帳號透過 `/setup/admin` 自助建立，任何人都能建立。

本次變更需將登入頁分成「客戶登入」和「管理員登入」兩個入口，客戶登入時需輸入授權序號，管理員登入禁止自助註冊。

現有認證架構：NextAuth CredentialsProvider（JWT 15 分鐘 + Refresh Token 7 天）+ 自建 session（HttpOnly Cookie 8 小時）。兩套並行。

## Goals / Non-Goals

**Goals:**

- 客戶登入頁新增 license key 欄位，登入時同步驗證序號有效性
- 管理員登入頁獨立於客戶登入，入口為客戶登入頁下方的小字連結
- 移除預設帳密提示和自助管理員建立功能
- 管理員帳號透過環境變數 seed，系統啟動時自動建立

**Non-Goals:**

- 不做多管理員支援
- 不做客戶自助註冊
- 不做 OAuth / SSO
- 不改動 license server 端邏輯
- 不修改登入後的業務頁面

## Decisions

### 管理員帳號 Seed 策略

透過環境變數 `ADMIN_EMAIL` 和 `ADMIN_PASSWORD` 在應用啟動時 seed 管理員帳號到 SQLite users 表。若帳號已存在則更新密碼 hash，若不存在則建立。

**Alternatives Considered:**
1. 寫死在程式碼中 → 否決，密碼不應進版控
2. 保留 `/setup/admin` 但加密碼保護 → 否決，仍有被未授權存取的風險

### 客戶登入時的 License Key 驗證方式

客戶登入 API 接收 username + password + license_key 三個欄位。先驗 license key（Ed25519 簽章 + 過期日期），通過後再驗帳密。License key 無效則回傳明確錯誤訊息「授權序號無效或已過期」。

**Alternatives Considered:**
1. License key 獨立頁面先驗再跳登入 → 否決，多一步降低使用體驗
2. 維持 middleware 靜默驗證 → 否決，客戶需求是在登入時輸入序號

### 管理員登入路由設計

新增 `/admin/login` 頁面，使用 NextAuth CredentialsProvider 的同一套驗證邏輯，但不要求 license key。管理員登入成功後同樣進 `/listings` 頁面。

**Alternatives Considered:**
1. 同頁面切換模式（客戶/管理員 tab） → 否決，管理員入口應低調，不宜與客戶等高展示
2. 使用不同的認證 provider → 否決，增加複雜度，現有 CredentialsProvider 已足夠

### Middleware 路由保護調整

移除 middleware 中的 license 靜默檢查（`getCachedLicense()`），改由登入 API 驗證。Middleware 只負責：靜態資源放行 → 白名單路由放行（login、admin/login、API auth 端點）→ JWT token 檢查。

**Alternatives Considered:**
1. 保留 middleware license 檢查 + 登入時再驗一次 → 否決，雙重驗證增加維護負擔且邏輯重複
2. 只在 middleware 驗 → 否決，不符合「客戶在登入頁輸入序號」的需求

## Implementation Contract

### 行為

1. **客戶登入頁**（`/login`）：顯示三欄位表單（帳號、密碼、授權序號）+ 登入按鈕 + 下方小字連結「總管理員登入」。無預設值、無提示文字。
2. **管理員登入頁**（`/admin/login`）：顯示兩欄位表單（帳號、密碼）+ 登入按鈕。頁面標題區分為「總管理員登入」。
3. **客戶登入 API**（`POST /api/auth/login`）：接收 `{ email, password, licenseKey }`，先驗 license key 有效性，再驗帳密。回傳 JSON `{ success: true }` 或 `{ error: "具體錯誤訊息" }`。
4. **管理員 Seed**：應用啟動時讀取 `ADMIN_EMAIL` + `ADMIN_PASSWORD` 環境變數，在 users 表 upsert 一筆 `role='admin'` 的記錄。密碼使用 bcryptjs hash（cost factor 10）。
5. **Middleware**：不再檢查 license 有效性。白名單包含 `/login`、`/admin/login`、`/api/auth/*`、靜態資源。其餘路由需 JWT token。

### 失敗模式

- License key 格式錯誤：回傳 400 `{ error: "授權序號格式錯誤" }`
- License key 過期：回傳 403 `{ error: "授權序號已過期" }`
- License key 有效但帳密錯誤：回傳 401 `{ error: "帳號或密碼錯誤" }`
- 環境變數 `ADMIN_EMAIL` / `ADMIN_PASSWORD` 未設定：seed 函式靜默跳過，不建立管理員帳號，console.warn 提醒
- 非管理員帳號嘗試從 `/admin/login` 登入：回傳 403 `{ error: "無管理員權限" }`

### 驗收標準

- 客戶登入頁無 admin/admin123 提示
- 客戶輸入正確序號 + 帳密 → 登入成功進 `/listings`
- 客戶輸入錯誤序號 → 顯示錯誤，無法登入
- 管理員從 `/admin/login` 用環境變數設定的帳密 → 登入成功
- 非管理員帳號從 `/admin/login` → 被拒絕
- `/setup/admin` 路由不再可用（回 404 或重導）
- 環境變數未設定時系統仍可啟動，但無管理員可登入

### 範圍邊界

- In scope：登入頁 UI、登入 API、管理員 seed、middleware 調整、移除自助管理員建立
- Out of scope：登入後的業務頁面、license server 端、客戶帳號 CRUD、多管理員

## Risks / Trade-offs

- [環境變數遺失] 部署時忘記設定 `ADMIN_EMAIL` / `ADMIN_PASSWORD` 會導致無管理員可登入 → 啟動時 console.warn 提醒，README 明確記載必要環境變數
- [License key 洩漏] 客戶在登入頁輸入序號，可能被肩窺 → 序號欄位使用 password type 遮蔽顯示
- [BREAKING 變更] 移除 `/setup/admin` 會影響現有部署流程 → Migration Plan 中說明轉換步驟
- [單點故障] 只有一個管理員帳號 → 符合當前需求，未來可擴展但本次不做
