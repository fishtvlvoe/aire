# Tasks — aire-settings-polish

## 1. Sidebar 重構（D1: Sidebar 精簡為兩層、Two-item sidebar navigation、Sidebar 行為、設定頁 tabs 行為）

- [ ] 1.1 修改 `src/app/(dashboard)/layout.tsx` sidebar 導航：移除「品牌設定」和「日誌」項目，只保留「案件管理」（FileText icon, href=/cases）和「設定」（Settings icon, href=/settings）。對應 requirement: Two-item sidebar navigation。[Tool: copilot] 驗證：sidebar 只顯示 2 個項目→點「設定」導航到 /settings
- [ ] 1.2 建立 `src/components/SettingsTabs.tsx` 元件：渲染 3 個 tab（「一般設定」→/settings、「品牌設定」→/settings/branding、「操作日誌」→/settings/logs），根據當前路由高亮 active tab。對應 requirement: Settings page tab navigation。[Tool: copilot] 驗證：/settings 頁「一般設定」active→點「品牌設定」tab→導航到 /settings/branding 且 tab active
- [ ] 1.3 在設定頁、品牌設定頁、日誌頁頂部加入 `SettingsTabs` 元件：修改 `src/app/(dashboard)/settings/page.tsx`、`src/app/(dashboard)/settings/branding/page.tsx`、`src/app/(dashboard)/settings/logs/page.tsx` 引入 SettingsTabs。[Tool: copilot] 驗證：三個設定子頁面都顯示 tabs 且切換正常

## 2. 日誌接真實資料（D2: 日誌接真實操作紀錄、日誌行為、Real operation log recording、Log list display）

- [ ] 2.1 在 `src/lib/mock-backend.ts` 新增操作日誌功能：新增 `operation_logs` 陣列、`add_log(action, detail)` 方法、`list_logs()` 方法。每筆 log 含 `id`（UUID）、`timestamp`（ISO 8601）、`action`、`detail`、`user_email`。在 `create_case`、`update_case`、`delete_case` 方法內呼叫 `add_log`。對應 requirement: Real operation log recording。[Tool: copilot] 驗證：呼叫 `create_case` 後 `list_logs()` 回傳含一筆 action='建立案件' 的紀錄
- [ ] 2.2 重寫日誌頁 `src/app/(dashboard)/settings/logs/page.tsx`：移除 5 筆 hardcoded mock 資料，改為呼叫 `list_logs` 取得真實紀錄，按 timestamp DESC 排序顯示（時間/操作類型/詳細說明）。無紀錄時顯示「尚無操作紀錄」。對應 requirement: Log list display。[Tool: copilot] 驗證：新 session 無紀錄→顯示「尚無操作紀錄」→建立案件→日誌頁顯示「建立案件」紀錄

## 3. 品牌設定擴充（D3: 品牌主題擴充）

- [ ] 3.1 在品牌設定頁 `src/app/(dashboard)/settings/branding/page.tsx` 新增 3 個主題選項：Professional（專業沉穩, #2c3e50）、Fresh（清新自然, #27ae60）、Warm（溫暖親切, #e67e22），加入現有主題陣列。主題卡片渲染邏輯不變，只擴充資料。[Tool: copilot] 驗證：品牌設定頁顯示 5 個主題卡片→點選新主題能切換

## 4. 設定頁 placeholder 處理（D4: 「敬請期待」統一提示元件、Coming soon placeholder cards）

- [ ] 4.1 建立 `src/components/ComingSoonCard.tsx` 元件：接收 `title` prop，渲染灰色底卡片（Clock icon + 「敬請期待」文字）。[Tool: copilot] 驗證：元件渲染含 Clock icon 和「敬請期待」文字的卡片
- [ ] 4.2 修改設定頁 `src/app/(dashboard)/settings/page.tsx`：將「申請說明」區和「教學影片即將上線」區替換為 `ComingSoonCard` 元件。對應 requirement: Coming soon placeholder cards。[Tool: copilot] 驗證：設定頁「申請說明」區顯示「敬請期待」→「教學影片」區顯示「敬請期待」→無「教學影片即將上線」文字

## 5. 測試連線 tooltip 與驗收（D5: 測試連線 tooltip、Disabled button tooltip explanation、接受標準、範圍界限）

- [ ] 5.1 修改設定頁「測試連線」按鈕：disabled 時加 `title="請先填入 Client ID 和安全碼"`，當 Client ID 和安全碼都非空時移除 disabled 和 tooltip。對應 requirement: Disabled button tooltip explanation, Test connection button tooltip。[Tool: copilot] 驗證：兩欄空白→hover 按鈕顯示 tooltip→填入兩欄→按鈕啟用無 tooltip
