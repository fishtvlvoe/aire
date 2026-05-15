## Context

AIRE v0.1.0 MVP 驗收時發現 5 個阻擋性 bug。核心問題：(1) Tauri 預設 icon 未替換 (2) Tauri 環境偵測邏輯在 Tauri 2.x 下失敗 (3) 前端 IPC 呼叫在瀏覽器環境直接 TypeError。本設計解決所有 5 個 bug，建立統一的 Tauri IPC bridge 防止未來類似問題。

## 範圍

### In Scope
- 替換 `src-tauri/icons/` 下所有 icon 檔案為 AIRE 品牌圖示
- 修正 activation 頁的 Tauri 環境偵測邏輯
- 建立統一的 Tauri IPC bridge（`src/lib/tauri-bridge.ts`）
- 修改 cases-api、log、branding 元件使用 bridge
- 瀏覽器環境下顯示友善錯誤提示

### Out of Scope
- 瀏覽器 mock data 層（不模擬後端）
- Rust 後端修改
- Tauri E2E 測試框架

## 設計決策

### D1: App Icon 替換策略

**選擇**：用 Tauri CLI 的 `pnpm tauri icon` 從單一 1024x1024 source 自動產生所有尺寸

**被否決**：手動逐個尺寸製作 — 容易遺漏尺寸、維護成本高

**實作步驟**：
1. 設計 AIRE icon source（1024x1024，品牌色藍底 + 白色 A 字樣）
2. 執行 `pnpm tauri icon <source.png>` 自動產生 icns/ico/png 全套
3. 確認 `tauri.conf.json` 的 `bundle.icon` 陣列指向正確

### D2: Tauri 環境偵測 — 非同步偵測 + 快取

**選擇**：建立 `src/lib/tauri-bridge.ts`，提供 `isTauriEnv(): Promise<boolean>` 非同步偵測，結果快取到模組變數

**偵測邏輯**：嘗試動態 import `@tauri-apps/api/core`，檢查 `typeof invoke === "function"`。成功 true，失敗 false。

**被否決**：
- 同步檢查 `"__TAURI__" in window` — Tauri 2.x 注入時序不保證，已在真機驗證中證實失敗
- `navigator.userAgent` 判斷 — Tauri 不修改 UA string

**快取機制**：模組頂層 `let _isTauri: boolean | null = null`，首次呼叫後快取，後續同步回傳。

### D3: 統一 IPC 呼叫封裝 — safeInvoke

**選擇**：`safeInvoke<T>(cmd, args?): Promise<T>` 統一包裝

**行為**：
- Tauri 環境：直接呼叫 `invoke(cmd, args)`，錯誤原樣拋出
- 非 Tauri 環境：拋出自定義 `NotInTauriError`，訊息為「此功能需在 AIRE 桌面 App 中使用」

**影響範圍**：`src/lib/cases-api.ts`（invokeIpc 改用 safeInvoke）、`src/lib/log.ts`（listRecentLogs 改用 safeInvoke）、`src/components/LogoUploader.tsx` 和 `src/components/ThemeSelector.tsx` 的 invoke 呼叫改用 safeInvoke。

### D4: Activation 頁環境偵測修正

**選擇**：用 D2 的 `isTauriEnv()` 取代同步 `"__TAURI__" in window`

**UI 狀態機**：
- `loading`（預設）→ 顯示 spinner
- `tauri`（偵測到 Tauri）→ 顯示序號輸入表單
- `browser`（非 Tauri）→ 顯示「請在 AIRE 桌面 App 中開啟」

**被否決**：setTimeout 等待 __TAURI__ 注入 — 不可靠、增加啟動延遲

### D5: 瀏覽器環境錯誤呈現

**選擇**：建立共用 `<TauriRequired />` 元件，各頁面 catch block 偵測 `NotInTauriError` 時渲染此元件。內容：「此功能需在 AIRE 桌面 App 中使用」+ 說明文字。

**被否決**：每個頁面各自寫提示 — 文案和樣式不一致

## Implementation Contract

### Task Group 1: Icon 替換
- 觀察行為：macOS Dock 和 Window title bar 顯示 AIRE 品牌 icon
- 驗證：`pnpm tauri dev` 啟動後目視確認 icon 非預設藍色漸層
- 失敗模式：icon 檔案格式不正確導致 Tauri build 報錯

### Task Group 2: tauri-bridge.ts
- 介面：`isTauriEnv(): Promise<boolean>` + `safeInvoke<T>(cmd, args?): Promise<T>` + `class NotInTauriError extends Error`
- 觀察行為（Tauri）：`safeInvoke("list_cases")` 正常回傳資料
- 觀察行為（瀏覽器）：`safeInvoke("list_cases")` 拋出 `NotInTauriError`
- 驗證：vitest 測試 mock `@tauri-apps/api/core` 驗證兩條路徑
- 失敗模式：動態 import 報 module not found — catch 處理為非 Tauri

### Task Group 3: Activation 頁修正
- 觀察行為（Tauri）：顯示序號輸入表單
- 觀察行為（瀏覽器）：先 spinner，偵測完成後顯示「請在桌面 App 中開啟」
- 驗證：vitest 測試 mock isTauriEnv 的兩個分支
- 失敗模式：偵測超時 — 設 3 秒上限，超時視為非 Tauri

### Task Group 4: 各頁面 fallback
- 觀察行為：瀏覽器下 /cases、/settings/branding、/settings/logs 顯示 `<TauriRequired />` 提示（非 TypeError）
- 驗證：瀏覽器 localhost:3000 各頁面手動確認 + vitest 測試
- 失敗模式：某頁面遺漏改用 safeInvoke — 仍顯示 TypeError
