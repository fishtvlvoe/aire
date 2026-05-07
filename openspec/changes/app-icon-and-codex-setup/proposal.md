## Why

Electron 桌面 App 的核心功能已完成（middleware、登入、更新、PDF），但交付給客戶前還缺兩樣：(1) App 圖示——目前使用 Electron 預設 icon，客戶看到的是醜的預設圖；(2) Codex CLI 授權流程——客戶首次啟動需要設定 ChatGPT/OpenAI API Key 才能使用 AI 功能，目前 /setup 頁面只有 License 輸入，沒有 OpenAI 授權步驟。

## What Changes

### App Icon
- 製作 1024x1024 PNG app icon（建築輪廓 + AI 元素，深藍色調白色前景）
- 從 PNG 轉換產出 .icns（macOS）和 .ico（Windows）
- 設定 electron-builder 使用新 icon

### Codex CLI 授權流程
- 在現有 /setup 頁面新增 Step 2：OpenAI API Key 設定（手動輸入 API Key）
- API Key 驗證邏輯（呼叫 OpenAI API 確認 key 有效）
- API Key 加密存放於本機設定檔
- 生產模式（NEXT_PUBLIC_APP_MODE=production）鎖定只用 Codex adapter，隱藏開發者 LLM 切換 UI

## Non-Goals

- 不做 OAuth 自動授權（手動貼 API Key 即可，客戶操作更簡單）
- 不做 macOS Keychain / Windows Credential Manager 整合（加密存檔即可）
- 不做 ChatGPT Plus 訂閱狀態檢查（客戶自行確認）

## Capabilities

### New Capabilities

- `app-icon`: App 圖示製作與 electron-builder icon 設定
- `codex-setup-flow`: 首次啟動 OpenAI API Key 設定流程，含驗證與加密存放

### Modified Capabilities

- `electron-packaging`: electron-builder 設定新增 icon 路徑
- `codex-integration`: 新增 API Key 輸入 UI 和驗證邏輯

## Impact

- Affected specs: electron-packaging（修改）、codex-integration（修改）、app-icon（新增）、codex-setup-flow（新增）
- Affected code:
  - New: build/icon.png, build/icon.icns, build/icon.ico, src/app/setup/codex/page.tsx, src/lib/codex-client/key-store.ts, src/app/api/setup/verify-openai/route.ts
  - Modified: src/app/setup/page.tsx（新增 Step 2 導向 codex setup）, package.json（electron-builder icon 設定）
  - Removed: 無
