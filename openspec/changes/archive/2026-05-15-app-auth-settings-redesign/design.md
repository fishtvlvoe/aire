## Context

AIRE 桌面 App 目前的 auth 流程是「序號啟動 → 進 dashboard」，沒有登入頁。側邊欄只有 3 個項目（案件管理、品牌設定、日誌），固定寬度不能收合。沒有設定頁面。使用者無法在瀏覽器環境（pnpm dev）完整測試授權和設定流程，因為 mock backend 沒有 auth 相關 command，且狀態不持久化。

Fish 要求的完整流程：登入（OPCOS auth）→ dashboard → 設定頁（序號 + 地政 API + 進階功能）。

## Goals / Non-Goals

**Goals:**

- 建立登入頁面（Email + 密碼 + 忘記密碼連結）
- 建立設定頁面（序號管理 + 地政 API 設定 + 進階功能解鎖）
- 側邊欄加設定入口 + 桌面端可 collapse
- mock backend 支援 auth + 持久化到 localStorage
- 移除獨立 activation 頁，序號移入設定
- 開發環境 Super Admin 角色

**Non-Goals:**

- Google / LINE 社群登入（未來擴充）
- OPCOS 正式 API 串接（全部用 mock）
- 實價登錄 MCP Hub 功能實作（只做 UI 殼 + 跳轉按鈕）
- 地政 API 實際串接（只做設定欄位 UI + mock 儲存）
- 信用卡綁定頁面（跳轉 OPCOS 外部處理）

## Decisions

### D1: 登入頁設計與 mock auth

**決策**：建立 src/app/login/page.tsx 作為登入入口。dev 環境走 mock auth（固定測試帳號），Tauri 環境走 safeInvoke("login")。

**Alternatives Considered**：
1. 用 NextAuth.js 做 session 管理 → 否決：AIRE 是桌面 App，不需 server-side session
2. 用 cookie 做 auth → 否決：Tauri WebView 的 cookie 行為跨平台不一致

**實作**：
- src/app/login/page.tsx：居中卡片，AIRE Logo（src/assets/icon-dark.png）+ 「不動產說明書自動化系統」副標 + Email input + 密碼 input + 登入按鈕 + 「忘記密碼」連結（外部連結到 OPCOS）
- src/lib/auth.ts：export login(email, password) / logout() / getSession() / isAuthenticated()
- src/hooks/useAuth.ts：React hook 回傳 { user, isLoading, isAuthenticated, login, logout }
- mock 測試帳號：admin@test.aire + password → Super Admin；user@test.aire + password → 一般用戶；expired@test.aire + password → 帳號過期；其他 → INVALID_CREDENTIALS

### D2: auth guard 替換 license guard

**決策**：dashboard layout 保護從「檢查 license status」改為「檢查登入 session」。未登入 redirect /login。

**Alternatives Considered**：
1. 雙重 guard（登入 + 序號）→ 否決：序號是產品授權不是存取控制，登入就夠
2. 保留 activation 頁作首次啟動引導 → 否決：Fish 要求序號放設定頁

**實作**：
- src/app/(dashboard)/layout.tsx：useAuth() 取代 useLicenseStatus()，未登入 redirect /login
- src/app/activation/page.tsx：保留但改為 redirect 到 /settings（避免舊 deeplink 404）

### D3: 設定頁結構

**決策**：/settings 下建通用設定頁面，分三個 Card 區塊。側邊欄加「設定」入口。

**Alternatives Considered**：
1. 每個設定項獨立頁面 → 否決：設定項不多，一頁分區塊更直觀
2. 放在品牌設定頁面裡 → 否決：品牌是視覺設定，序號和 API 是系統設定，語意不同

**實作**：
- src/app/(dashboard)/settings/page.tsx：三個 Card 區塊
- 區塊 1「序號管理」：授權狀態顯示（已啟動 / 未啟動）+ 序號輸入 + 啟動按鈕；已啟動時顯示遮罩序號 + 解除按鈕
- 區塊 2「地政 API 設定」：Client ID input + 安全碼 input（type=password）+ 說明連結（地政整合協作平台申請頁）+ YouTube 教學影片區域（iframe，src 暫空等 Fish 提供）
- 區塊 3「進階功能」：實價登錄 MCP Hub 卡片，鎖定圖示 + 「前往 OPCOS 開通」按鈕（外部連結，URL 可配置）
- mock backend 新增：get_app_settings / save_app_settings

### D4: 側邊欄 collapse + 設定入口

**決策**：側邊欄新增「設定」導航項，支援桌面端 collapse（240px → 60px icon rail）。

**Alternatives Considered**：
1. 不做 collapse 保持固定 → 否決：Fish 反映占空間，ST 有 collapse
2. 桌面端也用漢堡選單完全隱藏 → 否決：桌面端保留 icon rail 更好

**實作**：
- src/components/AppSidebar.tsx：支援 collapsed prop，collapsed 時只顯示 icon + tooltip
- navItems 加 { label: "設定", href: "/settings", icon: Settings }
- collapse 按鈕在側邊欄底部（ChevronLeft / ChevronRight）
- layout.tsx aside 寬度動態切換
- localStorage key: aire-sidebar-collapsed

### D5: mock 持久化 + auth command

**決策**：MockStore 狀態每次 invoke 後自動 serialize 到 localStorage，載入時 deserialize 恢復。

**Alternatives Considered**：
1. sessionStorage → 否決：關分頁就消失
2. IndexedDB → 否決：過度工程

**實作**：
- MockStore constructor 檢查 localStorage（key: aire-mock-store），有則反序列化
- 每次 invoke 完成後 serialize 存回
- 新增 auth command：login / logout / get_session
- 新增 settings command：get_app_settings / save_app_settings

## Implementation Contract

### 行為（使用者可觀察的）

1. **登入流程**：開啟 App 或瀏覽器 → 看到登入頁（Logo + Email + 密碼）→ 輸入正確帳密 → 進入 dashboard。輸入錯誤 → 顯示紅色錯誤訊息。
2. **設定頁**：側邊欄點「設定」→ 三個區塊卡片（序號、地政 API、進階功能）。序號輸入後啟動成功顯示綠色狀態。地政 API 填完存檔。進階功能點按鈕跳轉外部。
3. **側邊欄 collapse**：桌面端點底部箭頭 → 側邊欄縮為 60px icon rail → 再點恢復 240px。collapse 狀態重整後保持。
4. **mock 持久化**：dev 環境登入後重整頁面不會被踢出。序號啟動後重整保持已啟動。

### 介面與資料形狀

- `safeInvoke("login", { email, password })` → `{ success: true, user: { email: string, role: "admin" | "user" } }` 或拋 `INVALID_CREDENTIALS` / `ACCOUNT_EXPIRED`
- `safeInvoke("logout")` → `{ success: true }`
- `safeInvoke("get_session")` → `{ authenticated: boolean, user?: { email, role } }`
- `safeInvoke("get_app_settings")` → `{ license: { status, serialKey }, landApi: { clientId, secret }, premiumUnlocked: boolean }`
- `safeInvoke("save_app_settings", { landApi: { clientId, secret } })` → `{ success: true }`

### 失敗模式

- login 失敗：拋 Error，message 為 `INVALID_CREDENTIALS` 或 `ACCOUNT_EXPIRED`，前端根據 message 顯示對應繁中錯誤
- get_session 在未登入時：回 `{ authenticated: false }`，不拋錯
- localStorage 讀取失敗（隱私模式）：靜默 fallback 到 in-memory，不影響功能

### 驗收標準

- 測試：login page 的 render + submit + error 行為有 vitest 測試
- 測試：mock-backend auth command 有 vitest 測試（happy path + 錯誤帳號 + 過期帳號）
- 測試：settings page 三個區塊的 render + 互動有 vitest 測試
- 測試：sidebar collapse 的 toggle + localStorage 持久化有 vitest 測試
- 手動驗證：localhost:3000 完整走一遍 login → dashboard → settings → 序號啟動 → 重整保持狀態
- build 驗證：pnpm build 零錯誤

### 範圍邊界

- In scope：登入頁 UI + mock auth + 設定頁 UI + mock 儲存 + 側邊欄 collapse + mock 持久化
- Out of scope：社群登入、OPCOS 正式 API、MCP Hub 功能、地政 API 串接、信用卡綁定

## Risks / Trade-offs

- [Risk] localStorage 在 Tauri WebView 中可能被清除 → Mitigation：只影響 mock 模式（dev），正式走 Rust 後端
- [Risk] 移除 activation 頁後舊 deeplink 404 → Mitigation：保留空頁面 redirect 到 /settings
- [Risk] sidebar collapse 動畫跟 mobile Sheet 衝突 → Mitigation：collapse 只在 md+ 斷點生效
