## Why

客戶需要在辦公室電腦上雙擊圖示就能使用「不動產 AI 系統」，不需要懂終端機或瀏覽器操作。目前系統只能透過 `npm run dev` + 瀏覽器開啟，不適合交付給非技術人員。

## What Changes

- 新增 Electron 主程序（`electron/main.ts`），負責建立無框瀏覽器視窗、載入 Next.js server
- 新增 App icon（`build/icon.icns` + `build/icon.ico`），顯示在 Dock/工作列和安裝程式
- 新增 `electron-builder` 打包設定，產出 macOS `.dmg` 和 Windows `.exe` 安裝檔
- 修改 `package.json` 新增 `build:desktop`、`start:electron` 等腳本
- 新增 `electron/preload.ts` 處理 Electron 與 renderer 之間的安全通訊
- 內包 Codex CLI 至安裝檔，客戶無須額外安裝
- 新增 ChatGPT OAuth 授權流程（`/setup/codex`），首次啟動時引導客戶授權
- 生產模式鎖定只用 Codex 後端，隱藏其他 LLM 選項

## Non-Goals

- 不做 Linux 打包（客戶無 Linux 環境）
- 不在此 change 處理授權序號和自動更新（另開 `license-and-auto-update` change）
- 不改動現有 Next.js 業務邏輯代碼
- 不做 Codex CLI 以外的 LLM 後端設定（生產模式鎖定 Codex）

## Capabilities

### New Capabilities

- `electron-packaging`: Electron 打包設定、multi-platform 建構腳本、安裝檔產出
- `desktop-launcher`: 一鍵啟動機制——雙擊圖示時自動啟動 Next.js server 並開啟應用視窗
- `codex-integration`: Codex CLI 內包、ChatGPT OAuth 授權流程、生產模式鎖定

### Modified Capabilities

（無）

## Impact

- Affected specs: `electron-packaging`（已有）、`desktop-launcher`（已有）、`codex-integration`（已有）
- Affected code:
  - New: `electron/main.ts`, `electron/preload.ts`, `build/icon.icns`, `build/icon.ico`, `build/icon.png`, `src/app/setup/codex/page.tsx`, `electron/codex-bundler.ts`
  - Modified: `package.json`（新增 scripts + electron-builder 設定 + codex 打包）, `src/lib/codex-client/index.ts`（生產模式鎖定）
  - Removed: 無
- Dependencies 新增: `electron-builder`（devDependency，已有 `electron`）
- 環境變數新增: `NEXT_PUBLIC_APP_MODE`（production 時鎖定 Codex）
