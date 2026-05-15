## Context

AIRE 桌面應用使用 `src/lib/tauri-bridge.ts` 的 `safeInvoke` 作為所有 IPC 呼叫的統一入口。目前非 Tauri 環境一律拋 `NotInTauriError`，各頁面顯示 fallback UI。本設計在 `safeInvoke` 內加入 dev mock 分支，瀏覽器開發環境自動 dispatch 到 in-memory mock handler。

## Scope

### In Scope

- `safeInvoke` 的 mock dispatch 邏輯
- 所有 IPC command 的 mock handler（license / cases / pdf / drafts / log / branding / legal）
- Mock store 的 in-memory 資料結構
- activation 頁面在 mock 環境顯示完整序號輸入流程
- 單元測試覆蓋 mock handler

### Out of Scope

- Rust 後端修改
- Production build 的 mock
- localStorage 持久化
- 網路延遲/錯誤模擬

## Design Decisions

### D1: Mock dispatch 架構 — safeInvoke 內部條件分支

在 `safeInvoke` 函式內，當 `isTauriEnv()` 回傳 false 且 `process.env.NODE_ENV === "development"` 時，呼叫 `mockInvoke(cmd, args)` 取代拋出 `NotInTauriError`。

被否決方案：
- MSW（Mock Service Worker）— IPC 不是 HTTP，MSW 攔截不到 invoke 呼叫
- 獨立的 mock provider context — 需要每個元件都包 provider，侵入性太高
- 環境變數開關（NEXT_PUBLIC_USE_MOCK）— 多一個手動設定，且 dev + 非 Tauri 已是明確條件

實作步驟：
1. `tauri-bridge.ts` 的 `safeInvoke` 在 `!inTauri` 分支加 `if (process.env.NODE_ENV === "development")` 條件
2. 條件成立時 dynamic import `mock-backend.ts` 的 `mockInvoke`
3. 條件不成立時維持現有行為（拋 NotInTauriError）

### D2: Mock store 資料結構 — 單一 MockStore class

建立 `MockStore` class，內含：
- `license: { status: "none" | "valid" | "expired", serialKey: string | null }`
- `cases: Map<string, CaseRow>`（預設含 2 筆範例案件）
- `drafts: Map<string, unknown>`
- `brandSettings: BrandingData`（預設公司名稱「測試不動產」）
- `logs: LogEntry[]`（預設含 5 筆操作紀錄）
- `logo: Uint8Array | null`
- `clauses: Map<string, ClauseData>`（預設含 3 條法條）

每個 IPC command 對應一個 handler method。MockStore 在模組層級建立單例，頁面重新整理時重設。

被否決方案：
- 純函式 + 閉包 — 難以在測試中 reset 狀態
- localStorage 持久化 — 增加複雜度，且 mock 的目的是快速迭代不是資料持久

實作步驟：
1. 新建 `src/lib/mock-backend.ts`
2. 定義 `MockStore` class，constructor 初始化預設資料
3. 匯出 `mockInvoke(cmd: string, args?: Record<string, unknown>): Promise<unknown>` 函式
4. `mockInvoke` 用 switch-case dispatch 到 MockStore 的對應 method
5. 未知的 cmd 拋出 `Error("Mock not implemented: <cmd>")`

### D3: Activation 頁面 mock 環境行為 — 顯示完整啟動流程

目前 `activation/page.tsx` 在非 Tauri 環境顯示「請在 AIRE 桌面 App 中開啟」。修改為：dev + 非 Tauri 時走 mock backend，顯示序號輸入框，activate_license 呼叫 mockInvoke 成功後導向 dashboard。

被否決方案：
- 直接 auto-skip activation — 失去測試啟動流程的能力

實作步驟：
1. `activation/page.tsx` 的環境偵測邏輯：Tauri 環境 → 真 invoke；dev 非 Tauri → mock invoke；prod 非 Tauri → 顯示提示
2. 移除「請在 AIRE 桌面 App 中開啟」的硬判斷，改為只在 prod 非 Tauri 時顯示
3. dev 環境下 `safeInvoke("activate_license", { serial_key })` 自動走 mock，回傳成功

### D4: Dashboard 頁面 mock 環境行為 — 移除 TauriRequired 包裹

目前 cases / branding / logs 頁面在非 Tauri 環境被 `TauriRequired` 元件包裹顯示 fallback。修改為：dev 環境下不顯示 TauriRequired fallback，讓頁面正常載入走 mock invoke。

被否決方案：
- 只改 TauriRequired 元件 — 不夠，各頁面的 invoke 呼叫也需要 mock 支援

實作步驟：
1. `TauriRequired` 元件加入 dev 環境判斷：`process.env.NODE_ENV === "development"` 時直接 render children
2. 各頁面的 safeInvoke 呼叫已由 D1 覆蓋，不需額外修改

## Implementation Contract

### Task Group 1: Mock backend 核心（D1 + D2）

**行為**：`safeInvoke` 在 dev 非 Tauri 環境呼叫 `mockInvoke`，MockStore 處理所有 IPC command 並回傳型別正確的資料。

**介面**：
- `mockInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T>`
- `MockStore` class with `reset()` method for testing
- 支援的 command 清單：get_license_status, activate_license, deactivate_license, check_license, list_cases, get_case, create_case, update_case, delete_case, mark_completed, export_pdf, save_draft, load_draft, list_recent_logs, get_brand_settings, save_brand_settings, upload_logo, get_logo, list_themes, get_clause, list_clauses, sync_clauses

**失敗模式**：未實作的 cmd → 拋 Error("Mock not implemented: {cmd}")

**驗收**：mock-backend.test.ts 覆蓋每個 command 的 happy path + reset 後狀態回初始值

### Task Group 2: safeInvoke 改造（D1）

**行為**：非 Tauri + dev → mockInvoke；非 Tauri + prod → NotInTauriError；Tauri → 真 invoke

**驗收**：tauri-bridge.test.ts 三個分支各有測試案例

### Task Group 3: Activation + Dashboard 頁面適配（D3 + D4）

**行為**：dev 瀏覽器環境下 activation 頁顯示序號輸入框可完成啟動，dashboard 頁面正常載入資料

**驗收**：瀏覽器 localhost:3000 可完成「輸入序號 → 啟動成功 → 進入 dashboard → 看到案件列表 / 品牌設定 / 日誌」完整流程
