# Tasks

## Group 1: Mock Backend 擴充（基礎層）

- [x] 1.1 [P] [Tool: Codex] 擴充 mock-backend.ts — 新增 `get_land_api_settings`、`save_land_api_settings`、`test_land_api_connection` commands，滿足 spec "Extended mock commands for settings" 的 Land API 相關場景，對齊 design "D4: Mock Backend 擴充 — 新增 commands + 持久化完整覆蓋" 的 Interface / Data Shape 定義。`test_land_api_connection` 模擬 500ms 延遲回傳 `{ success: true, latency_ms: <number> }`。資料透過既有 `save_app_settings` / `get_app_settings` 持久化到 localStorage，滿足 spec "localStorage persistence for all settings"。遵循 Observable Behavior 第 5 點和 Failure Modes 中的地政 API 連線測試失敗處理。驗證：`npm test -- mock-backend.test` 新增測試通過。
- [x] 1.2 [P] [Tool: Codex] 擴充 mock-backend.ts — 新增 `get_premium_status`、`subscribe_premium` commands，滿足 spec "Extended mock commands for settings" 的 Premium 相關場景，對齊 design "D4: Mock Backend 擴充 — 新增 commands + 持久化完整覆蓋"。`subscribe_premium` 回傳 `{ redirect_url: "https://opcos.tw/checkout/mcp-hub" }`，對齊 Failure Modes 中的 Premium subscribe 處理。驗證：`npm test -- mock-backend.test` 新增測試通過。
- [x] 1.3 [P] [Tool: Codex] 擴充 mock-backend.ts — 新增 `get_feature_flags`、`toggle_feature_flag` commands，滿足 spec "Feature flags default list" 和 "Toggle feature flag" 場景，對齊 design "D4: Mock Backend 擴充 — 新增 commands + 持久化完整覆蓋"。預設 3 個 flag：`premium-unlock`（false）、`mcp-hub`（false）、`land-registry-api`（true）。驗證：`npm test -- mock-backend.test` 新增測試通過。
- [x] 1.4 [Tool: Codex] 擴充 mock-backend.test.ts — 新增覆蓋所有 Group 1 新 commands 的測試用例，滿足 spec "localStorage persistence for all settings" 場景。驗證：測試跑過，覆蓋 save→get、toggle、persistence across MockStore instances，滿足 Acceptance Criteria 中 mock-backend.test.ts 覆蓋所有新 commands。

## Group 2: 文案修正（全域掃描）

- [x] 2.1 [Tool: Codex] 全面搜尋 `src/` 目錄中的 "30天"、"30 天"、"30日"、"試用"、"trial" 文案，全部替換為正確的授權描述（"尚未啟用授權"），滿足 design "D5: 錯誤文案修正 — 移除「30天」，改為正確授權描述" 和 spec "No trial period messaging" 與 "No trial period text in mock responses"。包含 mock-backend.ts 的回傳值。驗證：`grep -r "30天\|30 天\|30日\|試用\|trial" src/` 回傳 0 結果，滿足 Acceptance Criteria。

## Group 3: 登入頁重寫

- [x] 3.1 [Tool: Codex] TDD 紅燈：為登入頁寫失敗測試，驗證 spec "Minimal login page layout" — 測試登入頁不含 license 相關 UI、只有 email/password/login button/forgot password。測試 "Successful login" 和 "Failed login with invalid credentials" 和 "Failed login with expired account" 場景。驗證：測試存在且全部 fail（紅燈）。
- [x] 3.2 [Tool: Codex] 重寫 `src/app/(auth)/login/page.tsx`，極簡化登入頁，滿足 design "D1: 登入頁架構 — 極簡單頁，license 邏輯完全移除"，遵循 design "D7: UI 設計系統 — 與 OPCOS 共用視覺 token"（shadcn/ui Card + Input + Button + lucide-react icons）和 design "D8: UX 互動模式 — 與 OPCOS 共用行為規則"（loading spinner + error message 即時回饋）。只保留 AIRE Logo + Email + Password + Login button + 忘記密碼連結。Failure Modes：INVALID_CREDENTIALS → "帳號或密碼錯誤"，ACCOUNT_EXPIRED → "帳號已過期"。滿足 Observable Behavior 第 1-2 點和 Acceptance Criteria 中 login/page.tsx 不含 license 相關 import。驗證：Group 3.1 紅燈測試全部變綠。

## Group 4: 設定頁元件（可並行）

- [ ] 4.1 [Tool: Codex] TDD 紅燈：為 LicenseSection 寫失敗測試，驗證 spec "License status display" 和 "License deactivation with confirmation" 的所有場景（未啟用/啟用成功/啟用失敗/停用確認/停用取消）。驗證：測試存在且全部 fail。
- [ ] 4.2 [P] [Tool: Codex] 建立 `src/components/settings/LicenseSection.tsx`，滿足 design "D2: 設定頁重組 — 三區塊 Card 佈局" 的序號管理區塊，遵循 design "D7: UI 設計系統 — 與 OPCOS 共用視覺 token"（shadcn Card + Input + Button + Badge + AlertDialog + lucide-react icons）和 design "D8: UX 互動模式 — 與 OPCOS 共用行為規則"（三態 loading/empty/error + 破壞性操作二次確認 Dialog）。滿足 Observable Behavior 第 4 點和 Scope Boundaries。驗證：Group 4.1 紅燈測試全部變綠。
- [ ] 4.3 [Tool: Codex] TDD 紅燈：為 LandApiSection 寫失敗測試，驗證 spec "Land API credentials input and save" 和 "Connection test" 的所有場景（儲存/空欄位禁用/連線成功/連線失敗）。驗證：測試存在且全部 fail。
- [ ] 4.4 [P] [Tool: Codex] 建立 `src/components/settings/LandApiSection.tsx`，滿足 design "D2: 設定頁重組 — 三區塊 Card 佈局" 的地政 API 設定區塊，遵循 design "D7: UI 設計系統 — 與 OPCOS 共用視覺 token" 和 design "D8: UX 互動模式 — 與 OPCOS 共用行為規則"。包含 Client ID + 安全碼（password）+ 儲存 + 測試連線 + 說明連結 + YouTube 預留區。實作三態。滿足 Observable Behavior 第 5 點。驗證：Group 4.3 紅燈測試全部變綠。
- [ ] 4.5 [Tool: Codex] TDD 紅燈：為 PremiumUnlockSection 寫失敗測試，驗證 spec "Premium unlock section display" 的所有場景（未訂閱/訂閱跳轉/已訂閱）。驗證：測試存在且全部 fail。
- [ ] 4.6 [P] [Tool: Codex] 建立 `src/components/settings/PremiumUnlockSection.tsx`，滿足 design "D2: 設定頁重組 — 三區塊 Card 佈局" 的進階功能解鎖區塊，遵循 design "D7: UI 設計系統 — 與 OPCOS 共用視覺 token" 和 design "D8: UX 互動模式 — 與 OPCOS 共用行為規則"。未訂閱：說明 + 價格 + CTA；已訂閱：Badge + 方案名 + 到期日 + 管理連結。滿足 Observable Behavior 第 6 點。驗證：Group 4.5 紅燈測試全部變綠。
- [ ] 4.7 [Tool: Codex] TDD 紅燈：為 DevSuperAdmin 寫失敗測試，驗證 spec "Developer Super Admin panel visibility" 和 "Feature flags management" 場景。特別驗證 production 環境不渲染。驗證：測試存在且全部 fail。
- [ ] 4.8 [P] [Tool: Codex] 建立 `src/components/settings/DevSuperAdmin.tsx`，滿足 design "D6: 開發環境 Super Admin — DevSuperAdmin 元件"，遵循 design "D7: UI 設計系統 — 與 OPCOS 共用視覺 token"。顯示 feature flags toggle list，條件渲染僅 development。滿足 Observable Behavior 第 9 點和 Acceptance Criteria 中 DevSuperAdmin 不渲染條件。驗證：Group 4.7 紅燈測試全部變綠。

## Group 5: 設定頁整合 + Session Guard

- [ ] 5.1 [Tool: Codex] 重組 `src/app/(dashboard)/settings/page.tsx`，import LicenseSection + LandApiSection + PremiumUnlockSection + DevSuperAdmin，由上到下排列為三個 Card + 底部 DevSuperAdmin。移除舊有的獨立 license 管理 UI。滿足 design "D2: 設定頁重組 — 三區塊 Card 佈局" 和 Observable Behavior 第 3 點。驗證：`npm run build` 通過，設定頁顯示三個區塊。
- [ ] 5.2 [Tool: Codex] 更新 session guard，滿足 spec "Session guard with mock auth support" 和 "Development auto-login"。確保 dashboard 路由需要認證，未登入 redirect 到 /login。開發環境自動以 `admin@test.aire` 登入。驗證：未登入訪問 /dashboard 被導向 /login；dev 環境自動登入。

## Group 6: 側邊欄收合

- [ ] 6.1 [Tool: Codex] TDD 紅燈：為側邊欄收合寫失敗測試，驗證 spec "Sidebar collapse toggle" 和 "Sidebar state persistence" 場景（收合/展開/localStorage 持久化/重載恢復）。驗證：測試存在且全部 fail。
- [ ] 6.2 [Tool: Codex] 修改 `src/components/sidebar.tsx`，加入收合/展開切換，滿足 design "D3: 側邊欄收合 — 寬度 240px ↔ 60px + localStorage 持久化"，遵循 design "D7: UI 設計系統 — 與 OPCOS 共用視覺 token"（lucide-react ChevronsLeft/ChevronsRight icons）。底部加收合 toggle。收合時只顯示 icon + tooltip。CSS transition 200ms ease-in-out。localStorage key `aire-sidebar-collapsed`。滿足 Observable Behavior 第 7-8 點和 Acceptance Criteria。驗證：Group 6.1 紅燈測試全部變綠。

## Group 7: 路由清理

- [ ] 7.1 [Tool: Codex] 刪除 `src/app/(auth)/activation/page.tsx`（如果存在），或移除 activation 相關路由。加 redirect rule `/activation` → `/settings`。滿足 Acceptance Criteria 中 activation 頁已刪除。驗證：訪問 /activation 會導向 /settings。

## Group 8: 建構驗證

- [ ] 8.1 [Tool: Codex] 跑 `npm run build` + `npm test` 全量驗證。修復所有 build error 和 test failure。滿足所有 Acceptance Criteria 和 Scope Boundaries。驗證：build 0 error，test 全綠。

## Group 9: Code Review

- [ ] 9.1 [Tool: Kimi] Code Review — 用 Kimi CLI review 所有本 change 的 diff（登入頁 + 設定頁 + 側邊欄 + mock-backend）。檢查：邏輯正確性、型別安全、UX 一致性、設計決策對齊。驗證：CR 無 Critical 發現。
