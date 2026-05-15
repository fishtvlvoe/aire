## Context

AIRE 桌面 App（Tauri 2.x + Next.js 16 + React 19）的登入頁和設定頁有多個 UX 問題需要統一修正。目前：
- 登入頁（`src/app/(auth)/login/page.tsx`）混合了 license 啟用邏輯，新使用者困惑
- 設定頁（`src/app/(dashboard)/settings/page.tsx`）缺少地政 API 和進階功能區塊
- 側邊欄（`src/components/sidebar.tsx`）桌面端不可收合
- Mock backend（`src/lib/mock-backend.ts`）已有 localStorage 持久化基礎，但覆蓋不完整
- 「30天試用期」錯誤文案散佈在多處

本 change 統一重整登入 + 設定 + 側邊欄 + Mock，對齊 OPCOS 平台 UI 規範（lucide-react icons、Noto Sans TC + Inter 字型、shadcn/ui 元件）。

## Goals / Non-Goals

**Goals:**
- 登入頁極簡化，只留 Email/密碼/忘記密碼
- 設定頁整合三大區塊：序號管理、地政 API、進階功能解鎖
- 側邊欄桌面端可收合，狀態持久化
- Mock backend 完整覆蓋新 commands + localStorage 持久化
- 修正所有「30天」錯誤文案
- 開發環境 Super Admin 視角

**Non-Goals:**
- OPCOS 後台整合（本 change 只處理 AIRE App 端）
- 真實 OPCOS OAuth 接入（先用 mock auth）
- 付款流程實作（只跳轉 OPCOS URL）
- 多語言支援

## Decisions

### D1: 登入頁架構 — 極簡單頁，license 邏輯完全移除

登入頁只保留：AIRE Logo（居中）+ Email 欄位 + 密碼欄位 + 登入按鈕 + 忘記密碼連結。不顯示任何 license/序號 UI。登入成功後由 session guard 判斷導向 dashboard。

**被否決**：(1) 登入頁內嵌 license 啟用步驟 → 初次使用者困惑先後順序。(2) 登入頁加 tab 切換（登入/註冊/啟用）→ 增加認知負擔，AIRE 是買斷制不需要註冊流程。

**步驟**：移除 login/page.tsx 中 license 相關 state 和 UI → 只留 email + password form → 登入用 mockInvoke("login") → 成功 redirect 到 dashboard。

### D2: 設定頁重組 — 三區塊 Card 佈局

設定頁分為三個 shadcn Card 區塊，由上到下排列：

1. **序號管理**（LicenseSection）：顯示目前序號狀態（未啟用/有效/過期）、序號輸入框、啟用/停用按鈕。從原本獨立的 activation 頁面移入。
2. **地政 API 設定**（LandApiSection）：Client ID + 安全碼（password 遮罩）+ 連線測試按鈕 + 說明連結（開外部瀏覽器）+ YouTube 教學影片預留區（灰色佔位框）。
3. **進階功能解鎖**（PremiumUnlockSection）：實價登錄 MCP Hub 訂閱狀態 + 跳轉 OPCOS 結帳頁按鈕。未訂閱時顯示功能說明 + 價格 + CTA。

**被否決**：(1) 設定分多個 tab 頁面 → 增加導覽複雜度，三個區塊內容不多一頁可以放完。(2) 保留獨立 activation 頁 → 多餘的頁面，序號管理邏輯上屬於設定。

**步驟**：建三個獨立元件 → settings/page.tsx import 並排列 → 各元件透過 mockInvoke 操作對應 commands → 移除 activation 頁面路由。

### D3: 側邊欄收合 — 寬度 240px ↔ 60px + localStorage 持久化

桌面端側邊欄增加收合按鈕（sidebar 底部的 ChevronsLeft/ChevronsRight icon）。收合時只顯示 icon，展開時顯示 icon + 文字標籤。收合狀態存 localStorage key `aire-sidebar-collapsed`，重新開啟 App 時恢復。CSS transition 動畫 200ms ease-in-out。

**被否決**：(1) hover 自動展開 → 滑鼠經過時意外展開干擾操作。(2) 收合狀態存 backend → 過度工程，localStorage 足夠。

**步驟**：sidebar.tsx 加 collapsed state → 讀取 localStorage 初始化 → 切換時同步 localStorage → CSS width transition → 收合時 tooltip 顯示完整標籤。

### D4: Mock Backend 擴充 — 新增 commands + 持久化完整覆蓋

擴充 mock-backend.ts 支援以下新 commands：
- `get_land_api_settings` / `save_land_api_settings` — 地政 API Client ID + Secret
- `test_land_api_connection` — 模擬連線測試（固定回成功 + 延遲 500ms）
- `get_premium_status` / `subscribe_premium` — 進階功能訂閱狀態
- `get_feature_flags` / `toggle_feature_flag` — Super Admin 用的 feature flag 管理

所有 settings 類資料透過既有 `save_app_settings` / `get_app_settings` 持久化到 localStorage。

**被否決**：(1) 每個 command 各自存 localStorage → key 混亂難維護。(2) 不做 mock 直接對接 API → 目前無 OPCOS 後端可對接。

**步驟**：在 MockStore 加 handler → 擴充 AppSettings type → 確保 localStorage 同步 → 測試覆蓋。

### D5: 錯誤文案修正 — 移除「30天」，改為正確授權描述

全面搜尋 codebase 中「30天」「30 天」「30日」「trial」相關文案，替換為正確的授權描述。AIRE 是買斷制，沒有試用期概念。未啟用序號時顯示「尚未啟用授權」，非「試用期」。

**被否決**：(1) 只改 UI 不改 mock 回傳 → 不徹底，mock 回傳也會帶「trial」字樣。(2) 改成「免費版」→ AIRE 沒有免費版概念。

**步驟**：grep 搜尋 → 逐一替換 → 同步改 mock 回傳值。

### D6: 開發環境 Super Admin — DevSuperAdmin 元件

開發環境（`process.env.NODE_ENV === 'development'`）下，設定頁底部顯示 DevSuperAdmin 元件：列出所有 feature flags 的開關（toggle switch），可即時切換。Production 環境完全不渲染此元件。

**被否決**：(1) 用 URL query param 控制 → 容易被誤觸或外洩。(2) 用 .env 檔案控制 → 每次改需重啟 dev server。

**步驟**：建 DevSuperAdmin.tsx → 讀取 mockInvoke("get_feature_flags") → 渲染 toggle list → 切換時 mockInvoke("toggle_feature_flag") → 條件渲染僅 development。

### D7: UI 設計系統 — 與 OPCOS 共用視覺 token

遵循既有 OPCOS 設計系統：lucide-react icons、Noto Sans TC + Inter 字型、shadcn/ui 元件庫。新元件（LicenseSection、LandApiSection 等）使用 Card / Input / Button / Badge / Switch 組合，不引入新 UI 框架。色彩、間距、圓角沿用既有 tailwind theme token。

**被否決**：(1) 引入 Ant Design 或 MUI → 打包體積膨脹，與既有 shadcn 風格衝突。(2) 完全自訂 CSS → 不一致風險高。

**步驟**：確認共用 design tokens → 新元件用 shadcn primitive → icon 統一 lucide-react。

### D8: UX 互動模式 — 與 OPCOS 共用行為規則

統一互動模式：
- 表單操作立即回饋（loading spinner → 成功 toast / 失敗 error message）
- 破壞性操作（停用序號）需二次確認 Dialog
- 空狀態有明確提示（「尚未設定」+ CTA 按鈕）
- loading / empty / error 三態 UI 每個區塊都要覆蓋

**被否決**：(1) 操作完跳新頁面確認 → SPA 體驗差。(2) 不做二次確認 → 誤觸停用序號風險高。

**步驟**：定義三態（loading skeleton / empty placeholder / error alert）→ 每個 Section 元件都實作三態 → 破壞性操作加 AlertDialog。

## Implementation Contract

### Observable Behavior

1. 登入頁只顯示 AIRE Logo + Email + 密碼 + 登入按鈕 + 忘記密碼連結，無 license 相關 UI
2. 登入成功 → redirect 到 /dashboard；失敗 → 顯示錯誤訊息（「帳號或密碼錯誤」或「帳號已過期」）
3. 設定頁三個 Card 區塊由上到下：序號管理 → 地政 API → 進階功能
4. 序號啟用：輸入序號 → 點啟用 → 成功顯示「已啟用」Badge；停用需二次確認 Dialog
5. 地政 API：輸入 Client ID + 安全碼 → 點儲存 → 點測試連線 → 顯示成功/失敗
6. 進階功能：未訂閱顯示說明 + 價格 + 跳轉按鈕；已訂閱顯示狀態
7. 側邊欄點收合按鈕 → 動畫過渡到 60px 寬，只顯示 icon；再點展開回 240px
8. 側邊欄收合狀態跨 session 保持（localStorage）
9. 開發環境設定頁底部顯示 Super Admin（feature flags toggle）
10. 所有「30天」相關文案消失，改為「尚未啟用授權」

### Interface / Data Shape

**新增 Mock Commands：**
- `get_land_api_settings() -> { clientId: string, secret: string }`
- `save_land_api_settings({ clientId: string, secret: string }) -> { success: true }`
- `test_land_api_connection() -> { success: boolean, latency_ms: number }`
- `get_premium_status() -> { subscribed: boolean, plan: string | null, expires_at: string | null }`
- `subscribe_premium() -> { redirect_url: string }`
- `get_feature_flags() -> Array<{ id: string, name: string, enabled: boolean }>`
- `toggle_feature_flag({ id: string }) -> { success: true, enabled: boolean }`

**修改 AppSettings 結構：**
```typescript
interface AppSettings {
  license: { status: string; serialKey: string | null };
  landApi: { clientId: string; secret: string };
  premium: { subscribed: boolean; plan: string | null; expiresAt: string | null };
  premiumUnlocked: boolean;
}
```

**localStorage Keys：**
- `aire-sidebar-collapsed`: `"true"` | `"false"`
- `aire-mock-store`: 既有，擴充 premium + featureFlags

### Failure Modes

- Mock login 失敗 → 顯示「帳號或密碼錯誤」（INVALID_CREDENTIALS）或「帳號已過期」（ACCOUNT_EXPIRED）
- 序號啟用失敗 → 顯示「序號無效」（mock 只接受 `AIRE-TEST-VALID-001` 格式）
- 地政 API 連線測試失敗 → 顯示「連線失敗，請確認 Client ID 和安全碼」
- localStorage 不可用 → graceful fallback 到 memory-only（不 crash）
- Premium subscribe → 開外部瀏覽器跳轉，失敗時顯示 fallback URL 文字

### Acceptance Criteria

- login/page.tsx 不含任何 license/activation 相關 import 或 UI
- 設定頁三個 Section 元件各自有 loading / empty / error 三態
- 側邊欄收合動畫 200ms，收合後寬度 60px（±2px）
- mock-backend.test.ts 覆蓋所有新 commands
- grep -r "30天\|30 天\|30日\|trial" src/ 回傳 0 結果
- DevSuperAdmin 元件在 NODE_ENV !== 'development' 時不渲染（條件編譯或 runtime check）
- `activation/page.tsx` 已刪除或路由已移除

### Scope Boundaries

**In scope：**
- `src/app/(auth)/login/page.tsx`（重寫）
- `src/app/(dashboard)/settings/page.tsx`（重組）
- `src/components/settings/LicenseSection.tsx`（新增）
- `src/components/settings/LandApiSection.tsx`（新增）
- `src/components/settings/PremiumUnlockSection.tsx`（新增）
- `src/components/settings/DevSuperAdmin.tsx`（新增）
- `src/components/sidebar.tsx`（修改）
- `src/lib/mock-backend.ts`（擴充）
- `src/lib/__tests__/mock-backend.test.ts`（擴充）

**Out of scope：**
- Rust backend / Tauri IPC（本 change 只動前端 + mock）
- PDF 渲染
- 真實 OPCOS auth 整合
- 真實地政 API 連線（由 aire-land-registry-apis-ui change 負責）
- 資料庫 schema

## Risks / Trade-offs

- [Risk] 移除 activation 頁面後舊書籤失效 → Mitigation: 加 redirect rule，/activation → /settings
- [Risk] Mock 與未來真實 API 介面不一致 → Mitigation: Mock commands 命名對齊 design.md 的 IPC 規格，切換時只改實作不改呼叫端
- [Risk] localStorage 持久化在 Tauri webview 中行為不一致 → Mitigation: 已有 fallback 到 memory-only 機制（mock-backend.ts 已實作）
- [Risk] 側邊欄收合動畫在低階 Windows 機器卡頓 → Mitigation: 使用 CSS transform 而非 width animation，GPU 加速
