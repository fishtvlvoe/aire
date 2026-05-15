## Problem

AIRE v0.1.0 MVP 驗收時發現 5 個阻擋性問題：

1. **App Icon 未顯示**：macOS Dock 和 App Switcher 顯示 Tauri 預設藍色漸層 icon，非 AIRE 品牌 Logo。`src-tauri/icons/` 目錄內的 icon 檔案均為 Tauri CLI 初始化自動產生的預設圖示，未替換為 AIRE 專屬設計。
2. **Tauri App 內 activation 頁錯誤顯示「請在 AIRE 桌面 App 中開啟」**：activation 頁用 `"__TAURI__" in window` 偵測 Tauri 環境，但 Tauri 2.x 的 IPC bridge 注入時序可能晚於 React hydration，導致偵測失敗，用戶被卡在無法操作的狀態。
3. **案件列表 TypeError**：瀏覽器環境下 `casesApi.list()` 呼叫 `invoke()` 時 `@tauri-apps/api/core` 回傳 undefined，TypeError: Cannot read properties of undefined (reading 'invoke')。
4. **品牌設定頁點擊無反應**：同上原因，branding 相關的 invoke 呼叫在瀏覽器環境靜默失敗。
5. **日誌頁 TypeError**：`src/lib/log.ts:83` 的 `listRecentLogs` 呼叫 `invoke("list_recent_logs")` 在瀏覽器環境拋出 TypeError。

Bug 3、4、5 的根因相同：前端 IPC 封裝層（`src/lib/cases-api.ts`、branding 元件、`src/lib/log.ts`）在非 Tauri 環境下沒有 graceful fallback。

## Root Cause

| Bug | 根因 |
|-----|------|
| Bug 1 | `src-tauri/icons/` 內所有 png/icns/ico 均為 `tauri init` 自動產生的預設圖示（藍色漸層），從未被替換 |
| Bug 2 | `activation/page.tsx` 用同步檢查 `"__TAURI__" in window` 判斷環境，但 Tauri 2.x 的 `window.__TAURI__` 注入可能在 `@tauri-apps/api/core` 動態 import 完成後才可用，同步檢查時尚未注入 |
| Bug 3-5 | `cases-api.ts` 的 `invokeIpc` 函式做 `const { invoke } = await import("@tauri-apps/api/core")`，在瀏覽器環境下模組存在但 `invoke` 為 undefined（沒有 Tauri runtime）。呼叫端沒有統一的環境偵測和 fallback |

## Proposed Solution

### Bug 1：替換 App Icon
- 設計 AIRE 專屬 icon（使用現有品牌色 + 字母 A 標誌）
- 產生所有平台尺寸（32/64/128/256/512 + icns/ico）
- 替換 `src-tauri/icons/` 下所有檔案

### Bug 2：修正 Tauri 環境偵測
- 將同步檢查 `"__TAURI__" in window` 改為非同步偵測：嘗試動態 import `@tauri-apps/api/core` 並呼叫一個輕量 IPC（如 `invoke("get_license_status")`），成功則確認為 Tauri 環境
- 偵測結果快取到模組層級變數，避免重複偵測
- activation 頁在偵測完成前顯示 loading 狀態，不顯示「請在桌面 App 中開啟」

### Bug 3-5：統一 IPC fallback 層
- 建立 `src/lib/tauri-bridge.ts` 統一封裝環境偵測 + invoke 呼叫
- 提供 `isTauri()` 非同步偵測函式（快取結果）
- 提供 `safeInvoke<T>(cmd, args)` 包裝：Tauri 環境走 IPC，瀏覽器環境回傳友善錯誤訊息（而非 TypeError）
- 各頁面的錯誤提示改為「此功能需在 AIRE 桌面 App 中使用」，取代 raw TypeError

## Non-Goals

- 不實作完整的瀏覽器 mock data 層（只做錯誤提示，不模擬後端回傳）
- 不修改 Rust 後端 IPC 命令
- 不新增 Tauri 測試框架

## Success Criteria

1. macOS Dock 顯示 AIRE 專屬 icon（非預設藍色漸層）
2. Tauri App 內開啟 activation 頁，顯示序號輸入表單（非「請在桌面 App 中開啟」）
3. 瀏覽器 localhost:3000 開啟 /cases 頁，顯示友善提示「此功能需在 AIRE 桌面 App 中使用」（非 TypeError）
4. 瀏覽器 localhost:3000 開啟 /settings/branding，同上友善提示
5. 瀏覽器 localhost:3000 開啟 /settings/logs，同上友善提示
6. `pnpm build` 零 TypeScript 錯誤
7. `npx vitest run` 所有前端測試通過

## Impact

- Affected code:
  - New: `src/lib/tauri-bridge.ts`
  - Modified: `src/app/activation/page.tsx`, `src/lib/cases-api.ts`, `src/lib/log.ts`, `src/components/LogoUploader.tsx`, `src/components/ThemeSelector.tsx`
  - Modified: `src-tauri/icons/32x32.png`, `src-tauri/icons/64x64.png`, `src-tauri/icons/128x128.png`, `src-tauri/icons/128x128@2x.png`, `src-tauri/icons/icon.icns`, `src-tauri/icons/icon.ico`, `src-tauri/icons/icon.png`
