# AIRE SDD 實作 Prompt

你是 AIRE 專案的實作代理。以下是 3 個 Spectra Change 的完整規格（proposal + design + tasks），請按照 tasks.md 中的任務清單逐一實作。

## 專案基本資訊

- **框架**：Next.js 16 (App Router) + React 19 + TypeScript 5
- **資料庫**：SQLite (better-sqlite3)
- **樣式**：Tailwind CSS 4
- **PDF 產出**：Puppeteer
- **套件管理**：npm

## 實作規則

1. 每個任務完成後標記 `[x]`
2. 程式碼用英文，註解用繁體中文
3. 遵循既有程式碼風格（看同目錄其他檔案）
4. 不要改動不在任務範圍內的檔案
5. 新增 DB 表時用 migration 方式（在 `src/lib/db/index.ts` 加 CREATE TABLE IF NOT EXISTS）
6. API route 用 Next.js App Router 格式（`export async function GET/POST/PATCH/DELETE`）
7. 前端元件用 `'use client'` directive
8. 完成後跑 `npm run build` 確認無錯誤

## 執行順序

建議按以下順序執行（依賴關係）：
1. **vendor-account**（獨立，無前置依賴）
2. **ui-fixes-and-admin**（部分任務依賴 Sidebar 修改）
3. **html-template-system**（依賴 admin 頁面框架）

---


# ═══════════════════════════════════════════════════════════════
# Change: vendor-account
# ═══════════════════════════════════════════════════════════════

## ── vendor-account / proposal.md ──

## Why

系統商（核流有限公司）部署 App 到客戶端後，需要能登入任何客戶的系統進行設定、排錯和維護。目前只有一種 admin 角色，系統商若要登入客戶系統，要不就借用客戶管理員帳號（客戶覺得奇怪），要不就另建帳號（客戶看到陌生帳號也奇怪）。需要一個對客戶完全隱形的系統商登入通道。

## What Changes

1. License Server 驗證成功時，回傳中包含 vendor credentials（vendor username + bcrypt-hashed password）
2. 客戶端收到 license init 成功回應後，自動靜默在 users 表建立一筆 vendor 帳號，帶 `is_vendor = 1` flag
3. users 表新增 `is_vendor` 欄位（INTEGER DEFAULT 0）
4. 用戶管理頁面的 query 加上 `WHERE is_vendor = 0` 過濾條件，客戶完全看不到 vendor 帳號
5. vendor 帳號可正常透過登入頁登入，擁有 admin 權限
6. 若 vendor 帳號已存在（重複驗證 license 時），更新密碼而非重複建立

## Non-Goals

- License Server 端的實作（本 change 只處理客戶端 App 接收和建立 vendor 帳號）
- vendor 帳號的操作行為追蹤（audit log 已有記錄，不額外區分）
- vendor 專屬的 UI 面板或功能（vendor 登入後看到的介面與 admin 完全相同）

## Capabilities

### New Capabilities

- `vendor-account-provisioning`: License 驗證成功時自動靜默建立或更新 vendor 帳號
- `vendor-account-hiding`: 用戶管理頁面過濾 is_vendor 帳號，客戶端不可見

### Modified Capabilities

- `user-account-management`: users 表新增 is_vendor 欄位，查詢時過濾 vendor 帳號
- `first-admin-setup`: License init API 回應新增 vendor credentials 欄位處理

## Impact

- Affected specs: `vendor-account-provisioning`（新）、`vendor-account-hiding`（新）、`user-account-management`（修改）、`first-admin-setup`（修改）
- Affected code:
  - New: src/lib/auth/vendor.ts
  - Modified: src/app/api/license/init/route.ts, src/lib/auth/db.ts, src/lib/db/schema.ts, src/app/admin/users/page.tsx, migrations/005_vendor_account.sql
  - Removed: （無）

## ── vendor-account / design.md ──

## Context

目前系統只有一種 admin 角色。系統商（核流有限公司）部署 App 到客戶端後，若要登入客戶系統維護，必須借用客戶管理員帳號或額外建帳號，兩者都會讓客戶感到困惑。需要一個隱形的系統商帳號機制。

相關模組：License init API（src/app/api/license/init/route.ts）、auth DB（src/lib/auth/db.ts）、users schema（src/lib/db/schema.ts）、用戶管理 UI（src/app/admin/users/page.tsx）、middleware.ts 的 hasUsers() 判斷。

## Goals / Non-Goals

**Goals:**

- License 驗證成功時自動靜默建立 vendor 帳號
- vendor 帳號在客戶端用戶管理介面完全不可見
- vendor 可用固定帳密登入任何客戶的系統
- 重複驗證 license 時更新 vendor 密碼，不重複建立

**Non-Goals:**

- License Server 端回傳 vendorCredentials 的實作（本 change 只處理客戶端接收）
- vendor 專屬的管理面板或額外功能
- vendor 操作的額外 audit 區分（現有 audit log 已記錄所有操作）

## Decisions

### D1: users 表新增 is_vendor 欄位

migration 檔 `migrations/005_vendor_account.sql` 新增 `is_vendor INTEGER NOT NULL DEFAULT 0`。vendor 帳號 is_vendor = 1，role = admin。正常用戶 is_vendor = 0。

### D2: License Init API 回應擴展

`src/app/api/license/init/route.ts` 收到 License Server 回應後，檢查是否包含 `vendorCredentials` 欄位（username、passwordHash、displayName）。若存在，呼叫 `provisionVendorAccount()` 建立或更新 vendor 帳號。

### D3: Vendor 帳號建立邏輯

新檔案 `src/lib/auth/vendor.ts` 匯出 `provisionVendorAccount(credentials)`。流程：查詢 users 表是否已有同 username 且 is_vendor = 1 的紀錄。存在則 UPDATE password_hash 和 display_name；不存在則 INSERT 新紀錄，role 固定為 admin，is_vendor = 1。email 使用 `{username}@vendor.AIRE.app` 格式（內部用，不寄信）。密碼 hash 由 License Server 預先計算（bcrypt），客戶端直接存入 DB。

### D4: 用戶管理頁面過濾

用戶列表 API 和 admin 頁面的查詢加上 `WHERE is_vendor = 0`，vendor 帳號不出現在客戶的用戶管理介面。middleware.ts 的 `hasUsers()` 不受影響——vendor 帳號在 License init 之後才建立，`hasUsers()` 在 License 驗證之前就已判斷。

### D5: 登入流程不變

vendor 帳號使用與一般用戶相同的 NextAuth CredentialsProvider 登入流程。`getUserByUsername()` 不區分 is_vendor，vendor 可正常登入，JWT token role = admin。

## Risks / Trade-offs

- **風險**：若 License Server 回傳的 vendorCredentials 被中間人竊取，攻擊者可取得 vendor 帳密。緩解：License init 走 HTTPS，passwordHash 是 bcrypt 而非明文。
- **取捨**：vendor 帳號使用固定 username + password，而非一次性 token。優點是系統商操作簡便，缺點是安全性略低。在本產品的場景（本機安裝的桌面 App，非雲端 SaaS）風險可接受。
- **取捨**：vendor 帳號的 email 是虛擬格式（@vendor.AIRE.app），不支援密碼重設。系統商若忘記密碼需重新驗證 license。

## ── vendor-account / specs / first-admin-setup ──

## ADDED Requirements

### Requirement: license-init-handles-vendor-credentials

The license init API handler SHALL check the License Server response for a `vendorCredentials` field. When present, it SHALL call `provisionVendorAccount()` to create or update the vendor account before proceeding with the normal license activation flow.

#### Scenario: license init with vendor credentials

- **WHEN** the License Server responds with `{ valid: true, features: [...], vendorCredentials: { username, passwordHash, displayName } }`
- **THEN** the license init API calls `provisionVendorAccount()` with the vendor credentials, then continues to write the license cache and return success to the client

#### Scenario: license init without vendor credentials

- **WHEN** the License Server responds with `{ valid: true, features: [...] }` without `vendorCredentials`
- **THEN** the license init API proceeds normally without creating any vendor account

## ── vendor-account / specs / user-account-management ──

## ADDED Requirements

### Requirement: is-vendor-column

The users table SHALL include an `is_vendor` column (INTEGER NOT NULL DEFAULT 0) to distinguish vendor accounts from regular user accounts.

#### Scenario: schema migration adds is_vendor

- **WHEN** the migration `005_vendor_account.sql` runs
- **THEN** the users table gains an `is_vendor` column with default value 0, and all existing user records have `is_vendor = 0`

## ── vendor-account / specs / vendor-account-hiding ──

## ADDED Requirements

### Requirement: hide-vendor-from-user-list

All user management queries that return user lists for client-facing UI SHALL exclude records where `is_vendor = 1`.

#### Scenario: admin views user list

- **WHEN** a client admin navigates to the user management page
- **THEN** the user list does NOT include any vendor accounts (is_vendor = 1)

##### Example: vendor hidden from user list

- **GIVEN** users table contains: `[{id:1, username:"admin", is_vendor:0}, {id:2, username:"agent1", is_vendor:0}, {id:3, username:"vendor-fish", is_vendor:1}]`
- **WHEN** the admin user list API is called
- **THEN** the response contains only users with id 1 and 2; user id 3 is not included

### Requirement: vendor-can-login-normally

A vendor account SHALL be able to authenticate through the standard login form using the same NextAuth CredentialsProvider flow as regular users.

#### Scenario: vendor logs in

- **WHEN** a vendor enters their username and password on the login page
- **THEN** the system authenticates them as an admin user and grants full admin access

##### Example: vendor login succeeds

- **GIVEN** users table contains a vendor account: `{username: "vendor-fish", password_hash: "$2b$10$abc...", role: "admin", is_vendor: 1}`
- **WHEN** the vendor submits username `"vendor-fish"` and the correct password
- **THEN** `authorizeCredentials()` returns `{id: "3", name: "vendor-fish"}` and a JWT token is issued with admin role

### Requirement: vendor-count-excluded-from-setup-check

The `hasUsers()` check in middleware (used to determine whether to redirect to first-admin-setup) SHALL count all users including vendor accounts. This prevents the edge case where only a vendor account exists but the system still prompts for first admin creation.

#### Scenario: only vendor account exists

- **WHEN** the users table contains only a vendor account (is_vendor = 1) and no regular users
- **THEN** `hasUsers()` returns true, and the system does NOT redirect to the first-admin-setup page

## ── vendor-account / specs / vendor-account-provisioning ──

## ADDED Requirements

### Requirement: auto-provision-vendor-account

When the License init API receives a successful response from the License Server that includes a `vendorCredentials` object, the system SHALL automatically create or update a vendor account in the local users table.

#### Scenario: first-time license activation with vendor credentials

- **WHEN** a client activates their license for the first time and the License Server response includes `vendorCredentials` with username, passwordHash, and displayName
- **THEN** the system creates a new user record with `is_vendor = 1`, `role = 'admin'`, the provided username, passwordHash stored directly, displayName, and email set to `{username}@vendor.AIRE.app`

##### Example: initial vendor provisioning

- **GIVEN** License Server responds with `vendorCredentials: { username: "vendor-fish", passwordHash: "$2b$10$abc...", displayName: "系統維護" }`
- **WHEN** the license init API processes this response
- **THEN** a user record is inserted: `username = "vendor-fish"`, `email = "vendor-fish@vendor.AIRE.app"`, `role = "admin"`, `is_vendor = 1`, `password_hash = "$2b$10$abc..."`

### Requirement: update-existing-vendor-account

When a vendor account with the same username already exists (is_vendor = 1), the system SHALL update the password_hash and display_name instead of creating a duplicate.

#### Scenario: re-activation updates vendor password

- **WHEN** a client re-verifies their license and a vendor account with the same username already exists
- **THEN** the system updates the existing vendor account's password_hash and display_name without creating a new record

##### Example: vendor password rotation

- **GIVEN** user record exists: `username = "vendor-fish"`, `is_vendor = 1`, `password_hash = "$2b$10$old..."`
- **WHEN** License Server responds with `vendorCredentials: { username: "vendor-fish", passwordHash: "$2b$10$new...", displayName: "系統維護" }`
- **THEN** the existing record is updated: `password_hash = "$2b$10$new..."`, no new record is created

### Requirement: no-vendor-without-credentials

When the License Server response does NOT include `vendorCredentials`, the system SHALL NOT create any vendor account.

#### Scenario: license activation without vendor credentials

- **WHEN** the License Server response is valid but does not contain `vendorCredentials`
- **THEN** no vendor account is created or modified, and the license activation proceeds normally

## ── vendor-account / tasks.md（實作清單）──

# Tasks: vendor-account

## Wave 1: Schema 與基礎設施

- [ ] [P] 1.1 建立 migration 檔 `migrations/005_vendor_account.sql`，內容為 `ALTER TABLE users ADD COLUMN is_vendor INTEGER NOT NULL DEFAULT 0;`。在 `src/lib/db/schema.ts` 的 `initDb()` 中加入執行此 migration 的邏輯（參考既有 migration 執行模式）。[Tool: Copilot] [Spec: user-account-management/is-vendor-column] [Design: D1]
- [ ] [P] 1.2 建立 `src/lib/auth/vendor.ts`，匯出 `provisionVendorAccount(credentials: { username: string; passwordHash: string; displayName: string }): void`。邏輯：查詢 `SELECT id FROM users WHERE username = ? AND is_vendor = 1`；若存在則 `UPDATE users SET password_hash = ?, display_name = ? WHERE id = ?`；若不存在則 `INSERT INTO users (username, email, password_hash, display_name, role, is_vendor) VALUES (?, ?, ?, ?, 'admin', 1)`，email 格式為 `{username}@vendor.AIRE.app`。使用 `db` from `@/lib/db`，同步 API（better-sqlite3）。[Tool: Copilot] [Spec: vendor-account-provisioning/auto-provision-vendor-account, vendor-account-provisioning/update-existing-vendor-account] [Design: D3]

## Wave 2: License Init API 整合

- [ ] 2.1 修改 `src/app/api/license/init/route.ts`：在 License Server 回應成功後，檢查回應 body 是否包含 `vendorCredentials` 欄位（型別 `{ username: string; passwordHash: string; displayName: string }`）。若存在，import 並呼叫 `provisionVendorAccount(vendorCredentials)`。若不存在則跳過，不影響現有流程。[Tool: Copilot] [Spec: first-admin-setup/license-init-handles-vendor-credentials] [Design: D2]

## Wave 3: 用戶管理頁面過濾

- [ ] 3.1 修改用戶列表相關的 API 或頁面查詢（`src/app/admin/users/page.tsx` 或對應的 API route），在 SQL 查詢中加上 `WHERE is_vendor = 0`（或 `AND is_vendor = 0`），確保 vendor 帳號不出現在客戶的用戶管理介面。同時確認用戶數量統計（若有）也排除 vendor。[Tool: Copilot] [Spec: vendor-account-hiding/hide-vendor-from-user-list] [Design: D4]

## Wave 4: 測試

- [ ] [P] 4.1 在 `src/lib/auth/__tests__/` 下新增 `vendor.test.ts`，測試以下場景：(a) 首次呼叫 provisionVendorAccount 建立 vendor 帳號，驗證 is_vendor = 1、role = admin、email 格式正確；(b) 第二次呼叫同 username 更新 password_hash，不產生重複紀錄；(c) 不呼叫時不建立任何 vendor 帳號。[Tool: Copilot] [Spec: vendor-account-provisioning/auto-provision-vendor-account, vendor-account-provisioning/update-existing-vendor-account, vendor-account-provisioning/no-vendor-without-credentials]
- [ ] [P] 4.2 在用戶管理 API 或頁面的既有測試中，新增案例：users 表包含 vendor 帳號時，API 回應不包含 vendor 帳號。[Tool: Copilot] [Spec: vendor-account-hiding/hide-vendor-from-user-list]
- [ ] [P] 4.3 驗證 middleware.ts 的 `hasUsers()` 在只有 vendor 帳號時回傳 true（不重導到 first-admin-setup）。[Tool: Copilot] [Spec: vendor-account-hiding/vendor-count-excluded-from-setup-check]
- [ ] [P] 4.4 驗證 vendor 帳號可透過標準登入流程（NextAuth CredentialsProvider）正常登入，取得 admin 權限的 JWT token。在 vendor.test.ts 中新增：建立 vendor 帳號後，呼叫 `authorizeCredentials({ username: "vendor-fish", password: "test-pass" })` 驗證回傳非 null。[Tool: Copilot] [Spec: vendor-account-hiding/vendor-can-login-normally] [Design: D5]

## Wave 5: 驗收

- [ ] 5.1 執行 `npm run build` 確認零錯誤，執行 `npm run test` 確認全綠。[Tool: 主對話]


# ═══════════════════════════════════════════════════════════════
# Change: ui-fixes-and-admin
# ═══════════════════════════════════════════════════════════════

## ── ui-fixes-and-admin / proposal.md ──

## Problem

本機測試 Electron App 發現多個 UI/UX 和功能問題：

1. **UpdateChecker Hydration 錯誤**：UpdateChecker 元件在 render body 中直接讀 `typeof window !== 'undefined'`，SSR 回傳 null 但 CSR 回傳 div，導致 React hydration mismatch 錯誤
2. **Listings 頁面左右空白**：`max-w-[1440px]` 限制容器寬度，超過 1440px 的螢幕兩側出現空白，不是全螢幕
3. **Admin 用戶管理頁面無入口**：`/admin/users` 頁面存在但 Sidebar 沒有連結，管理員找不到用戶管理功能
4. **基本資訊欄位計數 6/7 錯誤**：用途欄位（radio button）選中後值未正確寫入 form state，或 chapter-grouper 的 keyword 比對把 `other_rights`（他項權利登記）分到 legal 章節而非 basic，導致 basic 章節計數為 6/7 而非 7/7
5. **文件產生功能設定需權限控制**：物調表、銷售 DM、591 PO 文、社群貼文、不動產說明書 5 種文件都需要能成功產出，且文件類型的啟用/停用設定只有總管理員可調整

## Root Cause

1. UpdateChecker L8：`const isElectron = typeof window !== 'undefined' && !!window.electronAPI` 在元件 body 執行，非 useEffect 內
2. Listings page L150：`max-w-[1440px]` class
3. Sidebar 的 NAV_ITEMS 沒有 admin 區塊的連結
4. chapter-grouper.ts L46 LEGAL_KEYWORDS 包含「權利」，`other_rights` label「他項權利登記」命中此 keyword 被分到 legal；加上 usage 欄位 type='text' 但 UI 渲染為 radio button，radio 選中值可能未寫入 form state
5. 文件產生 API 缺少管理員權限檢查

## Proposed Solution

1. UpdateChecker 改用 `useState(false)` + `useEffect` 延遲設定 isElectron，確保 SSR/CSR 一致
2. 移除 `max-w-[1440px]`，改用 `w-full`
3. Sidebar 新增 admin 管理區塊（用戶管理、功能設定），僅 admin 角色顯示
4. 修正 chapter-grouper：把 `other_rights` 加入 BASIC_KEYS 或 LEGAL_KEYS 明確歸類；檢查 usage radio button 的 form state 寫入邏輯
5. 文件產生設定頁面加入權限檢查，API route 驗證 admin 角色

## Non-Goals

- 不重構整個 form-renderer 欄位分類系統（只修 basic 章節的計數問題）
- 不調整文件產生的 AI 模型或 prompt（只處理權限和 UI 入口）
- 不新增文件類型（現有 5 種已足夠）

## Success Criteria

1. UpdateChecker 在 dev 模式下不再出現 hydration mismatch 錯誤
2. Listings 頁面在任何螢幕寬度下都是全螢幕，無左右空白
3. Admin 用戶可在 Sidebar 看到「管理」區塊，點擊進入用戶管理頁面
4. 基本資訊章節所有欄位填完後顯示 7/7
5. 文件產生設定頁面只有 admin 角色可存取和修改

## Impact

- Affected code:
  - Modified: src/components/UpdateChecker.tsx, src/app/listings/page.tsx, src/components/Sidebar.tsx, src/lib/form-renderer/chapter-grouper.ts, src/components/forms/FieldVisitForm.tsx
  - New: （視 admin 設定頁面需求而定）
  - Removed: （無）

## ── ui-fixes-and-admin / design.md ──

## Context

Electron App 本機測試發現 5 個 UI/UX 問題。UpdateChecker hydration 錯誤、listings 頁面非全螢幕、admin 用戶管理無入口、基本資訊計數 6/7、文件產生設定需權限控制。所有問題都有明確根因，修改範圍集中在 5-6 個檔案。

## Goals / Non-Goals

**Goals:**

- 修復所有 5 個已確認的 UI/UX 問題
- 確保 admin 管理功能可從 Sidebar 進入
- 基本資訊欄位計數準確
- 文件產生設定加入權限控制

**Non-Goals:**

- 不重構 form-renderer 欄位分類邏輯
- 不新增文件類型
- 不調整 AI 生成 prompt

## Decisions

### D1: UpdateChecker SSR 修復

將 `isElectron` 從 render body 移到 `useState(false)` + `useEffect(() => setIsElectron(!!window.electronAPI), [])`。SSR 時始終回傳 null（與 CSR 初始狀態一致），mount 後才檢查 Electron 環境。

### D2: Listings 全螢幕

移除 `src/app/listings/page.tsx` L150 的 `max-w-[1440px]`，保留 `w-full`。

### D3: Sidebar Admin 區塊

在 `src/components/Sidebar.tsx` 的 NAV_ITEMS 底部新增 admin 區塊：用戶管理（/admin/users）、功能設定（/admin/features）。此區塊只在 user.role === 'admin' 時顯示。需要在 Sidebar 元件中取得當前用戶角色（透過 props 或 session hook）。

### D4: 基本資訊欄位計數修復

**根因已確認**：`usage` 欄位有自訂 renderer（FieldVisitForm.tsx L433-480），選中值寫入 `form.utility_type` / `form.utility_other` / `form.utility_notes`，但從不寫入 `form['usage']`。計數器（L246）檢查 `form['usage'].trim() !== ""`，永遠為空字串，導致 filledAll 少 1（顯示 6/7 而非 7/7）。

修法：在 usage 的自訂 renderer 中，選中 radio 時同步寫入 `updateField('usage', selectedOption)`，讓計數器能正確偵測已填。不需要改動 chapter-grouper.ts 的 BASIC_KEYS。

### D5: 文件產生設定權限

文件產生設定頁面（/admin/features）已存在，需確認：(a) 只有 admin 角色可存取（middleware 或頁面內權限檢查）；(b) 5 種文件類型（物調表、銷售 DM、591 PO 文、社群貼文、不動產說明書）都能成功觸發產生。

## Risks / Trade-offs

- D2 移除 max-width 後，超寬螢幕（如 3440px ultrawide）內容可能過度拉伸。在當前產品階段可接受。
- D4 把更多欄位加入 BASIC_KEYS 會讓 keyword-based 分類的彈性降低，但明確歸類比 keyword 猜測更可靠。

## ── ui-fixes-and-admin / specs / document-generation-settings ──

## ADDED Requirements

### Requirement: Admin feature settings page controls document generation types

The system SHALL provide an admin-only settings page at /admin/features that lists all available document generation types. Only users with the admin role SHALL be able to access and modify these settings.

#### Scenario: Admin accesses feature settings
- **WHEN** an admin user navigates to /admin/features
- **THEN** the page SHALL display toggles for 5 document types: 不動產說明書, 物調表, 銷售 DM, 591 文案, 社群貼文

#### Scenario: Non-admin denied access
- **WHEN** a non-admin user attempts to navigate to /admin/features
- **THEN** the system SHALL redirect to the listings page or display an unauthorized message

#### Scenario: Admin enables a document type
- **WHEN** an admin toggles a document type to enabled and saves
- **THEN** the document generation page SHALL include that type as an available option for all users

#### Scenario: Admin disables a document type
- **WHEN** an admin toggles a document type to disabled and saves
- **THEN** the document generation page SHALL NOT show that type as an available option

## ── ui-fixes-and-admin / specs / field-visit-completion ──

## MODIFIED Requirements

### Requirement: Field visit form counts usage field correctly

The field visit form completion counter SHALL count the usage field as filled when the user has selected a radio option, regardless of which internal form keys store the value. The custom usage renderer MUST synchronize the selected value back to form['usage'] so the completion counter can detect it.

#### Scenario: Usage radio selected updates completion count
- **WHEN** a user selects a usage radio option (e.g., "住宅")
- **THEN** the completion counter SHALL increment filledAll by 1 for the usage field

##### Example: Building type basic info completion
- **GIVEN** a building-type listing with 7 basic info fields, user has filled all 7 including selecting a usage radio option
- **WHEN** the completion counter calculates filledAll for basic info chapter
- **THEN** the display SHALL show "7/7"

#### Scenario: Usage radio not selected
- **WHEN** no usage radio option has been selected
- **THEN** the completion counter SHALL count usage as unfilled (e.g., display "6/7" if other 6 fields are filled)

## ── ui-fixes-and-admin / specs / listings-layout ──

## MODIFIED Requirements

### Requirement: Listings page uses full viewport width

The listings page container SHALL span the full available viewport width. The layout MUST NOT impose a fixed maximum width constraint (such as max-w-[1440px]).

#### Scenario: Wide screen display
- **WHEN** the listings page is displayed on a screen wider than 1440px
- **THEN** the content area SHALL expand to fill the full viewport width without horizontal whitespace gaps on either side

#### Scenario: Standard screen display
- **WHEN** the listings page is displayed on a screen 1440px or narrower
- **THEN** the content area SHALL fill the available width as before

## ── ui-fixes-and-admin / specs / sidebar-navigation ──

## MODIFIED Requirements

### Requirement: Sidebar displays admin management section

The Sidebar component SHALL display an admin management section containing links to user management (/admin/users) and feature settings (/admin/features). This section MUST only be visible when the current user has the admin role.

#### Scenario: Admin user sees admin section
- **WHEN** a user with role "admin" views the sidebar
- **THEN** the sidebar SHALL display an admin section with links to "/admin/users" (user management) and "/admin/features" (feature settings)

#### Scenario: Non-admin user does not see admin section
- **WHEN** a user with role "agent" views the sidebar
- **THEN** the sidebar SHALL NOT display the admin management section

#### Scenario: Admin clicks user management link
- **WHEN** an admin user clicks the user management link in the sidebar
- **THEN** the browser SHALL navigate to /admin/users

## ── ui-fixes-and-admin / specs / update-checker ──

## MODIFIED Requirements

### Requirement: UpdateChecker renders without hydration mismatch

The UpdateChecker component SHALL use client-side state initialization to detect the Electron environment. The component MUST render identically on server and client during initial render (both return null). After mount, the component SHALL check `window.electronAPI` via `useEffect` and update state accordingly.

#### Scenario: SSR and CSR initial render match
- **WHEN** the page is server-rendered and then hydrated on the client
- **THEN** both server and client initial render return null (no hydration mismatch error)

#### Scenario: Electron environment detected after mount
- **WHEN** the component mounts in an Electron environment where `window.electronAPI` exists
- **THEN** the component SHALL display the update checker UI after the useEffect runs

#### Scenario: Browser environment detected after mount
- **WHEN** the component mounts in a standard browser where `window.electronAPI` is undefined
- **THEN** the component SHALL remain hidden (return null)

## ── ui-fixes-and-admin / tasks.md（實作清單）──

## 1. UpdateChecker Hydration 修復

- [ ] 1.1 修改 `src/components/UpdateChecker.tsx`：將 `isElectron` 改為 `useState(false)` + `useEffect(() => setIsElectron(!!window.electronAPI), [])`，確保 SSR 與 CSR 初始 render 一致（都回傳 null） [Design: D1] [Spec: update-checker] [Tool: Copilot]

## 2. Listings 全螢幕寬度

- [ ] 2.1 修改 `src/app/listings/page.tsx`：移除 `max-w-[1440px]` class，保留 `w-full`，讓列表頁面填滿整個 viewport 寬度 [Design: D2] [Spec: listings-layout] [Tool: Copilot]

## 3. Sidebar Admin 區塊

- [ ] 3.1 修改 `src/components/Sidebar.tsx`：在 NAV_ITEMS 底部新增 admin 區塊，包含「用戶管理」（/admin/users）和「功能設定」（/admin/features）兩個連結，僅在 user.role === 'admin' 時顯示。透過 useSession hook 或 props 取得當前用戶角色 [Design: D3] [Spec: sidebar-navigation] [Tool: Copilot]

## 4. 基本資訊欄位計數修復

- [ ] 4.1 修改 `src/components/forms/FieldVisitForm.tsx`：在 usage 欄位的自訂 radio renderer（L433-480）中，當用戶選中 radio 時，除了現有的 `updateField('utility_type', opt)` 外，同步呼叫 `updateField('usage', opt)`，讓完成度計數器 `form['usage'].trim() !== ""` 能正確偵測為已填 [Design: D4] [Spec: field-visit-completion] [Tool: Copilot]

## 5. 文件產生設定權限控制

- [ ] 5.1 建立 `src/app/admin/features/page.tsx`：Admin 功能設定頁面，列出 5 種文件類型（不動產說明書、物調表、銷售 DM、591 文案、社群貼文）並提供啟用/停用 toggle。頁面載入時檢查 user.role === 'admin'，非 admin 則 redirect 到 /listings [Design: D5] [Spec: document-generation-settings] [Tool: Copilot]
- [ ] 5.2 建立設定 API `src/app/api/admin/features/route.ts`：GET 回傳目前 5 種文件類型的啟用狀態，PATCH 接受 `{ [docType]: boolean }` 格式更新啟用狀態。在 DB 中新增 `feature_flags` 表（key TEXT PRIMARY KEY, enabled INTEGER DEFAULT 1）存放設定 [Design: D5] [Spec: document-generation-settings] [Tool: Copilot]
- [ ] 5.3 修改文件產生頁面：讀取 feature_flags 設定，只顯示 enabled 的文件類型 [Design: D5] [Spec: document-generation-settings] [Tool: Copilot]

## 6. 驗證

- [ ] 6.1 啟動 dev server + Electron App，逐一驗證 5 個修復項目：(a) 無 hydration 錯誤 (b) 全螢幕無空白 (c) admin sidebar 可見 (d) 基本資料 7/7 (e) 功能設定可存取且能切換 [Tool: 主對話]


# ═══════════════════════════════════════════════════════════════
# Change: html-template-system
# ═══════════════════════════════════════════════════════════════

## ── html-template-system / proposal.md ──

## Why

目前文件產出（不動產說明書等）使用固定的 HTML 模板，客戶無法自訂文件的排版風格。不同房仲公司有各自的品牌形象和版面偏好，需要一套模板管理機制讓管理員上傳自訂 HTML 模板，業務人員在產出文件時可選擇模板、預覽效果、確認後下載 PDF。

## What Changes

1. **模板管理後台**：管理員可上傳 HTML 模板檔案，管理（新增/刪除/設為預設）多套模板
2. **模板變數引擎**：系統將物件欄位資料（地址、坪數、權利範圍等）透過 Mustache 語法注入模板
3. **即時預覽**：業務在文件產出頁面選擇模板後，可在瀏覽器內預覽「實際資料 + 模板樣式」的渲染結果
4. **PDF 下載**：預覽滿意後一鍵將渲染結果透過 Puppeteer 轉成 PDF 下載

## Non-Goals

- 不做所見即所得（WYSIWYG）的視覺化模板編輯器，模板以 HTML 原始碼方式管理
- 不做模板版本控管或 diff 功能
- 不做跨客戶的模板市集或分享機制
- 不改動 AI 文案生成的 prompt 或內容邏輯，模板只負責排版外觀

## Capabilities

### New Capabilities

- `template-management`: 管理員上傳、列表、刪除、設定預設 HTML 模板
- `template-rendering`: 將物件欄位資料注入 HTML 模板並渲染為完整 HTML
- `template-preview`: 業務在瀏覽器預覽模板 + 實際資料的渲染結果
- `template-pdf-export`: 將渲染後的 HTML 透過 Puppeteer 轉成 PDF 並下載

### Modified Capabilities

- `document-generation`: 文件產出流程新增模板選擇步驟

## Impact

- Affected specs: template-management, template-rendering, template-preview, template-pdf-export, document-generation
- Affected code:
  - New: src/app/admin/templates/page.tsx, src/app/api/admin/templates/route.ts, src/app/api/admin/templates/[id]/route.ts, src/app/api/documents/preview/route.ts, src/app/api/documents/export-pdf/route.ts, src/lib/template-engine.ts, src/components/TemplatePreview.tsx
  - Modified: src/app/listings/[id]/documents/page.tsx, src/lib/db/index.ts
  - Removed: （無）

## ── html-template-system / design.md ──

## Context

客戶要求文件產出可自訂排版樣式。目前系統用固定 HTML 模板產出不動產說明書，需要改為可替換的模板機制。系統已有 Puppeteer 基礎設施（用於現有 PDF 產出），SQLite 資料庫，Next.js API Routes。

## Goals / Non-Goals

**Goals:**

- 管理員可上傳、管理多套 HTML 模板
- 模板支援變數插值（物件欄位自動帶入）
- 業務可預覽模板 + 實際資料的渲染效果
- 一鍵匯出 PDF

**Non-Goals:**

- 不做 WYSIWYG 編輯器
- 不做模板版本控管
- 不改動 AI 生成邏輯

## Decisions

### D1: 模板儲存方式

模板 metadata 存在 SQLite `templates` 表（id, name, description, is_default, created_at, updated_at），HTML 內容存在檔案系統 `data/templates/{id}.html`。理由：HTML 檔案可能較大（含內嵌 CSS/圖片 base64），存檔案比存 BLOB 更易除錯和備份。

表結構：
```sql
CREATE TABLE IF NOT EXISTS templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  doc_type TEXT NOT NULL DEFAULT 'disclosure',
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### D2: 模板變數語法

採用 Mustache 雙大括號語法 `{{variable_name}}`。變數名稱對應物件的欄位 key（如 `{{address}}`、`{{total_price}}`、`{{ownership_scope}}`）。用 Handlebars 套件（`handlebars`）做模板編譯和渲染，因為它支援條件判斷 `{{#if}}` 和迴圈 `{{#each}}`，比純字串替換更靈活。

可用變數來自三個來源合併：
1. `field_visit_data` JSON（現勘欄位）
2. `supplementary_data` JSON（補充資料）
3. `pre_commission_data` JSON（委託前資料）
4. listing 基本欄位（property_type, status, created_at）

### D3: 預覽 API 設計

預覽 API `POST /api/documents/preview`，接收 `{ listingId: number, templateId: number }`，回傳渲染後的完整 HTML 字串。前端用 iframe sandbox 顯示預覽結果，避免模板 CSS/JS 影響主頁面。iframe 使用 `srcdoc` 屬性直接注入 HTML，不需要額外 URL。

### D4: PDF 匯出流程

PDF 匯出 API `POST /api/documents/export-pdf`，接收 `{ listingId: number, templateId: number }`。流程：讀取模板 → 合併物件資料 → Handlebars 渲染 → Puppeteer `page.setContent(html)` → `page.pdf()` → 回傳 PDF binary（Content-Type: application/pdf）。

PDF 設定：A4 尺寸、含頁首頁尾（可在模板中用 `@page` CSS 控制）、邊距 15mm。

### D5: 模板上傳驗證

上傳時驗證：(a) 檔案副檔名為 .html 或 .htm；(b) 檔案大小上限 2MB；(c) 內容必須包含至少一個 `{{` 變數標記；(d) 用 DOMPurify 在 server 端清理惡意 script 標籤（保留 style 標籤）。

### D6: 預設模板機制

每種文件類型（doc_type）最多一個預設模板。設定新預設時，先將同 doc_type 的其他模板 `is_default = 0`，再設定目標模板 `is_default = 1`。若刪除預設模板，不自動指派新預設。產出文件時若無預設模板，使用系統內建的 fallback 模板（現有的固定模板）。

## Risks / Trade-offs

- Handlebars 模板語法對非技術用戶有門檻，但搭配範例模板和變數對照表可降低學習成本
- iframe sandbox 預覽無法完美模擬 PDF 分頁效果，但足以驗證排版和資料正確性
- 檔案系統儲存 HTML 在 Docker 部署時需要 volume mount，已有 data/ 目錄的 volume 配置可復用

## ── html-template-system / specs / document-generation ──

## MODIFIED Requirements

### Requirement: Document generation page includes template selection

The document generation page SHALL display a template selector dropdown that lists all available templates for the current document type. The selector SHALL default to the template marked as is_default=1 for that doc_type. If no templates exist, the system SHALL use the built-in fallback template (current fixed template). The user SHALL be able to switch templates and preview each one before exporting.

#### Scenario: Template selector shows available templates
- **WHEN** a user navigates to the document generation page for a listing
- **THEN** the page SHALL display a dropdown listing all templates for the relevant doc_type, with the default template pre-selected

#### Scenario: No custom templates available
- **WHEN** no templates exist for the current doc_type
- **THEN** the system SHALL use the built-in fallback template and hide the template selector

#### Scenario: User switches template
- **WHEN** a user selects a different template from the dropdown
- **THEN** the preview area SHALL update to show the newly selected template rendered with the current listing data

## ── html-template-system / specs / template-management ──

## ADDED Requirements

### Requirement: Admin can upload HTML templates

The system SHALL provide an API endpoint POST /api/admin/templates that accepts an HTML file upload with metadata (name, description, doc_type). The uploaded file MUST be validated for: file extension (.html or .htm), file size (2MB maximum), presence of at least one Mustache variable marker ({{), and sanitized with DOMPurify to remove script tags while preserving style tags. The template metadata SHALL be stored in the templates SQLite table and the HTML content SHALL be saved to data/templates/{id}.html.

#### Scenario: Successful template upload
- **WHEN** an admin uploads a valid HTML file with name "品牌模板A" and doc_type "disclosure"
- **THEN** the system SHALL return HTTP 201 with the created template metadata including id, name, doc_type, and is_default=false

#### Scenario: File too large
- **WHEN** an admin uploads an HTML file larger than 2MB
- **THEN** the system SHALL return HTTP 400 with error message indicating the size limit

#### Scenario: Missing variable markers
- **WHEN** an admin uploads an HTML file containing no {{ markers
- **THEN** the system SHALL return HTTP 400 with error message indicating the template must contain variable placeholders

#### Scenario: Malicious script tags removed
- **WHEN** an admin uploads an HTML file containing script tags
- **THEN** the system SHALL strip all script tags before saving, preserving style tags and other HTML content

### Requirement: Admin can list all templates

The system SHALL provide an API endpoint GET /api/admin/templates that returns all templates with their metadata. Results SHALL be filterable by doc_type query parameter.

#### Scenario: List all templates
- **WHEN** an admin sends GET /api/admin/templates
- **THEN** the system SHALL return HTTP 200 with an array of template objects sorted by created_at descending

#### Scenario: Filter by doc_type
- **WHEN** an admin sends GET /api/admin/templates?doc_type=disclosure
- **THEN** the system SHALL return only templates with doc_type "disclosure"

### Requirement: Admin can delete a template

The system SHALL provide an API endpoint DELETE /api/admin/templates/{id} that removes the template metadata from the database and deletes the HTML file from data/templates/{id}.html.

#### Scenario: Successful deletion
- **WHEN** an admin sends DELETE /api/admin/templates/5
- **THEN** the system SHALL remove the database row and HTML file, returning HTTP 200

#### Scenario: Delete non-existent template
- **WHEN** an admin sends DELETE /api/admin/templates/999 for a template that does not exist
- **THEN** the system SHALL return HTTP 404

### Requirement: Admin can set a default template

The system SHALL provide an API endpoint PATCH /api/admin/templates/{id} that accepts { is_default: true }. Setting a template as default SHALL unset the previous default template for the same doc_type (set is_default=0) before setting the new one (is_default=1).

#### Scenario: Set new default
- **WHEN** an admin sets template 3 as default for doc_type "disclosure", and template 1 was previously the default
- **THEN** template 1 SHALL have is_default=0 and template 3 SHALL have is_default=1

##### Example: Default swap
- **GIVEN** templates: T1(doc_type=disclosure, is_default=1), T2(doc_type=disclosure, is_default=0), T3(doc_type=dm, is_default=1)
- **WHEN** admin sets T2 as default
- **THEN** T1.is_default=0, T2.is_default=1, T3.is_default=1 (T3 unchanged because different doc_type)

## ── html-template-system / specs / template-pdf-export ──

## ADDED Requirements

### Requirement: PDF export API converts rendered template to PDF

The system SHALL provide an API endpoint POST /api/documents/export-pdf that accepts { listingId: number, templateId: number } and returns a PDF file. The endpoint SHALL render the template with listing data, then use Puppeteer to convert the HTML to PDF with A4 page size and 15mm margins. The response SHALL have Content-Type application/pdf and Content-Disposition attachment header with a filename based on the listing address or id.

#### Scenario: Successful PDF export
- **WHEN** a user sends POST /api/documents/export-pdf with valid listingId and templateId
- **THEN** the system SHALL return HTTP 200 with a PDF binary file

#### Scenario: PDF respects template page layout
- **WHEN** the template uses CSS @page rules for margins or headers
- **THEN** the generated PDF SHALL reflect those CSS @page rules

#### Scenario: Template not found for PDF export
- **WHEN** a user sends POST /api/documents/export-pdf with a templateId that does not exist
- **THEN** the system SHALL return HTTP 404

### Requirement: User can download PDF from preview page

The document generation page SHALL display a "下載 PDF" button when a template preview is active. Clicking the button SHALL trigger the export-pdf API call and initiate a file download in the browser.

#### Scenario: Download button triggers PDF download
- **WHEN** a user clicks "下載 PDF" while previewing a template
- **THEN** the browser SHALL download a PDF file named with the listing identifier

## ── html-template-system / specs / template-preview ──

## ADDED Requirements

### Requirement: Preview API returns rendered HTML for a listing and template combination

The system SHALL provide an API endpoint POST /api/documents/preview that accepts { listingId: number, templateId: number } and returns the fully rendered HTML as a text/html response. The endpoint SHALL read the template file, merge listing data using the template engine, and return the result.

#### Scenario: Successful preview
- **WHEN** a user sends POST /api/documents/preview with listingId=1 and templateId=2
- **THEN** the system SHALL return HTTP 200 with Content-Type text/html containing the rendered template with listing 1's data

#### Scenario: Template not found
- **WHEN** a user sends POST /api/documents/preview with a templateId that does not exist
- **THEN** the system SHALL return HTTP 404 with error message

#### Scenario: Listing not found
- **WHEN** a user sends POST /api/documents/preview with a listingId that does not exist
- **THEN** the system SHALL return HTTP 404 with error message

### Requirement: Frontend displays preview in sandboxed iframe

The TemplatePreview component SHALL render the preview HTML inside an iframe with sandbox attribute to isolate the template's CSS and scripts from the main application. The iframe SHALL use the srcdoc attribute to inject the HTML content directly without requiring a separate URL.

#### Scenario: Preview renders in iframe
- **WHEN** a user selects a template and clicks preview on the document generation page
- **THEN** the page SHALL display an iframe showing the rendered template with the current listing's data

#### Scenario: Template CSS does not leak
- **WHEN** the template contains CSS rules that would affect body or global elements
- **THEN** the main application page layout SHALL NOT be affected by those CSS rules

## ── html-template-system / specs / template-rendering ──

## ADDED Requirements

### Requirement: Template engine merges listing data into HTML template

The template engine SHALL compile an HTML template using Handlebars and render it with merged listing data. The data context SHALL be assembled from four sources: field_visit_data JSON, supplementary_data JSON, pre_commission_data JSON, and listing base fields (property_type, status, created_at, updated_at). All source fields SHALL be flattened into a single context object. If multiple sources contain the same key, field_visit_data takes precedence over supplementary_data, which takes precedence over pre_commission_data.

#### Scenario: Basic variable substitution
- **WHEN** a template contains {{address}} and the listing has address "台北市信義區信義路五段7號"
- **THEN** the rendered HTML SHALL contain "台北市信義區信義路五段7號" in place of {{address}}

##### Example: Multi-source merge precedence
- **GIVEN** field_visit_data has { "address": "現勘地址" }, pre_commission_data has { "address": "委託地址", "owner_name": "王大明" }
- **WHEN** template contains {{address}} and {{owner_name}}
- **THEN** rendered output uses "現勘地址" (field_visit_data wins) and "王大明" (only in pre_commission_data)

#### Scenario: Missing variable renders empty string
- **WHEN** a template contains {{nonexistent_field}} and no data source has this key
- **THEN** the rendered HTML SHALL replace it with an empty string (no error thrown)

#### Scenario: Conditional block rendering
- **WHEN** a template contains {{#if restriction_records}}...{{/if}} and restriction_records has a non-empty value
- **THEN** the content inside the if block SHALL be rendered

#### Scenario: Conditional block with falsy value
- **WHEN** a template contains {{#if restriction_records}}...{{/if}} and restriction_records is null or empty string
- **THEN** the content inside the if block SHALL NOT be rendered

## ── html-template-system / tasks.md（實作清單）──

## 1. 資料庫 Schema 與模板引擎

- [ ] 1.1 在 src/lib/db/index.ts 新增 templates 表的 migration（CREATE TABLE IF NOT EXISTS templates: id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT, doc_type TEXT NOT NULL DEFAULT 'disclosure', is_default INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT datetime('now'), updated_at TEXT NOT NULL DEFAULT datetime('now')），並新增 CRUD helper functions：getTemplate(id), getAllTemplates(docType?), createTemplate(meta), deleteTemplate(id), setDefaultTemplate(id, docType) [Design: D1] [Spec: template-management] [Tool: Copilot]
- [ ] [P] 1.2 建立 src/lib/template-engine.ts：(a) assembleContext(listing) 函式，從 field_visit_data、supplementary_data、pre_commission_data、listing 基本欄位合併為單一扁平物件，優先序為 field_visit_data > supplementary_data > pre_commission_data > listing 基本欄位；(b) renderTemplate(htmlContent, context) 函式，用 Handlebars 編譯模板並注入 context，缺失變數渲染為空字串（Handlebars 預設行為） [Design: D2] [Spec: template-rendering] [Tool: Copilot]

## 2. 模板管理 API

- [ ] 2.1 建立 src/app/api/admin/templates/route.ts：GET 回傳模板列表（支援 ?doc_type 篩選），POST 接受 multipart/form-data 上傳 HTML 檔案 + name + description + doc_type。POST 驗證：副檔名 .html/.htm、檔案大小上限 2MB、內容包含至少一個 {{ 標記、用 DOMPurify（isomorphic-dompurify）清理 script 標籤。驗證通過後寫入 DB 和 data/templates/{id}.html [Design: D1, D5] [Spec: template-management] [Tool: Copilot]
- [ ] [P] 2.2 建立 src/app/api/admin/templates/[id]/route.ts：DELETE 刪除模板（DB row + 檔案），PATCH 接受 { is_default: true } 設定預設（先將同 doc_type 其他模板 is_default=0 再設定目標 is_default=1）。DELETE 找不到模板回 404 [Design: D1, D6] [Spec: template-management] [Tool: Copilot]

## 3. 預覽與 PDF 匯出 API

- [ ] 3.1 建立 src/app/api/documents/preview/route.ts：POST 接受 { listingId, templateId }，讀取模板 HTML 檔案，用 template-engine assembleContext + renderTemplate 合併物件資料，回傳渲染後的 HTML（Content-Type: text/html）。listingId 或 templateId 不存在時回 404 [Design: D3] [Spec: template-preview] [Tool: Copilot]
- [ ] [P] 3.2 建立 src/app/api/documents/export-pdf/route.ts：POST 接受 { listingId, templateId }，渲染模板後用 Puppeteer page.setContent(html) + page.pdf({ format: 'A4', margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' } }) 產出 PDF，回傳 binary（Content-Type: application/pdf, Content-Disposition: attachment; filename=listing-{id}.pdf）。templateId 不存在時回 404 [Design: D4] [Spec: template-pdf-export] [Tool: Copilot]

## 4. 前端模板管理頁面

- [ ] 4.1 建立 src/app/admin/templates/page.tsx：管理員模板管理頁面，包含：(a) 模板列表（顯示 name、doc_type、is_default 標記、建立時間）；(b) 上傳按鈕，點擊後彈出表單填寫 name、description、doc_type 並選擇 HTML 檔案；(c) 每個模板有「設為預設」和「刪除」按鈕。頁面載入時檢查 user.role === 'admin'，非 admin redirect 到 /listings [Design: D1] [Spec: template-management] [Tool: Copilot]

## 5. 文件產出頁面整合

- [ ] 5.1 修改 src/app/listings/[id]/documents/page.tsx：(a) 新增模板選擇 dropdown（呼叫 GET /api/admin/templates?doc_type=disclosure 取得列表，預設選中 is_default=1 的模板）；(b) 選擇模板後呼叫 preview API 取得渲染 HTML；(c) 用 iframe srcdoc 顯示預覽結果；(d) 預覽下方顯示「下載 PDF」按鈕，點擊後呼叫 export-pdf API 觸發瀏覽器檔案下載。無自訂模板時隱藏 dropdown 使用內建 fallback 模板 [Design: D3, D4, D6] [Spec: template-preview, template-pdf-export, document-generation] [Tool: Copilot]
- [ ] 5.2 建立 src/components/TemplatePreview.tsx：接收 html string prop，用 iframe sandbox="allow-same-origin" + srcdoc 屬性渲染，自動調整 iframe 高度配合內容。元件提供 loading 狀態顯示 [Design: D3] [Spec: template-preview] [Tool: Copilot]

## 6. Sidebar 導航更新

- [ ] 6.1 在 src/components/Sidebar.tsx 的 admin 區塊新增「模板管理」連結指向 /admin/templates，僅 admin 角色可見 [Spec: template-management] [Tool: Copilot]

## 7. 驗證

- [ ] 7.1 啟動 dev server，以 admin 帳號登入，驗證：(a) 上傳 HTML 模板成功且出現在列表中 (b) 設為預設成功 (c) 文件產出頁面顯示模板 dropdown (d) 預覽渲染正確帶入物件資料 (e) PDF 下載成功且排版與預覽一致 (f) 刪除模板後列表更新 [Tool: 主對話]

