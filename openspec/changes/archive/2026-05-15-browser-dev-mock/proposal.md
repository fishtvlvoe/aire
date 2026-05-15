## Why

AIRE 是 Tauri 桌面應用，所有後端功能（案件 CRUD、授權驗證、品牌設定、日誌）透過 IPC invoke 呼叫 Rust 後端。目前在 `pnpm dev`（port 3000 純瀏覽器）環境下，所有頁面顯示「此功能需在 AIRE 桌面 App 中使用」的 fallback UI，無法測試任何功能。

開發者必須每次跑 `pnpm tauri build`（約 3 分鐘）打包成 .app 才能測試，嚴重拖慢開發迭代速度。需要一層 mock backend，讓瀏覽器環境也能跑完整的使用者流程。

## What Changes

在 `safeInvoke` 加入 dev mock 分支：當 `process.env.NODE_ENV === "development"` 且非 Tauri 環境時，自動 dispatch 到 mock handler。Mock handler 用 in-memory store 模擬所有 IPC command 的行為，包含：

- **license 系列**：get_license_status 回傳 valid、activate_license 接受任意序號、deactivate_license 重設狀態
- **cases 系列**：list_cases / get_case / create_case / update_case / delete_case / mark_completed 用 Map 儲存
- **pdf 系列**：export_pdf 模擬成功回傳檔案路徑
- **drafts 系列**：save_draft / load_draft 用 Map 儲存 JSON
- **log 系列**：list_recent_logs 回傳預設操作紀錄
- **branding 系列**：get_brand_settings / save_brand_settings / upload_logo / get_logo / list_themes 用記憶體儲存
- **legal 系列**：get_clause / list_clauses / sync_clauses 回傳預設法條資料

Mock store 在頁面重新整理後重設（純 in-memory），不做 localStorage 持久化。

## Non-Goals

- 不做 Tauri 環境的 mock（Tauri 環境永遠走真正的 invoke）
- 不做 production build 的 mock（只在 development 環境啟用）
- 不模擬網路延遲或錯誤情境（mock 永遠成功回傳）
- 不做 mock 資料的匯出/匯入
- 不修改 Rust 後端任何程式碼

## Capabilities

### New Capabilities

- `browser-dev-mock`: 瀏覽器開發環境 mock backend — 在 pnpm dev 環境下自動 fallback 到 in-memory mock handler，支援所有 IPC command 的完整流程測試

### Modified Capabilities

- `license-activation-ui`: activation 頁面在 mock 環境下顯示序號輸入框並可完成啟動流程

## Impact

- Affected specs: `browser-dev-mock`（新建）、`license-activation-ui`（修改 — mock 環境行為）
- Affected code:
  - New: `src/lib/mock-backend.ts`、`src/lib/__tests__/mock-backend.test.ts`
  - Modified: `src/lib/tauri-bridge.ts`、`src/app/activation/page.tsx`
