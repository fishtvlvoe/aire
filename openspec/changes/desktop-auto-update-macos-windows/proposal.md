## Why

AIRE 本期要先完成 Mac 與 Windows 桌面完整版，讓客戶能在線下或半離線環境操作案件、保存資料、使用自己的 COP API，並產出物調與 PDF。當桌面完整版進入客戶試用後，更新不能依賴工程師手動重新傳檔，否則每次修 bug 或補流程都會造成客戶版本不一致，也會讓驗收紀錄與客服判斷變困難。

這個 change 是 `desktop-fullflow-r02-cop-parity` 完成後的下一期 SR：建立 macOS 與 Windows 桌面 app 的自動更新能力，讓使用者能收到新版本通知，在系統設定中手動檢查更新，下載更新後重啟套用，並讓發版流程能留下可追溯的版本與平台驗收紀錄。

## What Changes

- 新增 Tauri Desktop 自動更新能力，支援 macOS 與 Windows stable channel。
- 新增「系統設定 > 版本與更新」區塊，顯示目前版本、更新狀態、最後檢查時間與手動檢查更新按鈕。
- 新增 app 啟動後的背景更新檢查；檢查失敗不得阻斷使用者進入案件流程。
- 新增更新可用、下載中、已下載待重啟、已是最新、更新失敗等 UI 狀態。
- 新增 release workflow 產出 updater manifest、簽章與 macOS/Windows 安裝檔。
- 新增 macOS 與 Windows 舊版升新版 smoke test，確認更新後仍可跑通桌面主流程。

## Non-Goals

- 不在 `desktop-fullflow-r02-cop-parity` 完成前實作自動更新。
- 不使用舊 Electron updater；AIRE 桌面版以 Tauri updater 為準。
- 不在客戶前台暴露 GitHub Releases、manifest、signature、CDN 等技術詞。
- 不把更新流程設計成強制中斷式更新；除非未來另開安全性 hotfix SR。
- 不在本期實作多 channel 管理後台；先完成 stable channel。
- 不把 COP API key、案件資料或查詢 JSON 上傳到更新服務。

## Capabilities

### New Capabilities

- `tauri-desktop-auto-update`: Desktop App 可檢查、下載並套用 signed update。
- `release-verification`: 發版流程必須驗證 macOS 與 Windows 更新後仍能跑通主流程。

### Modified Capabilities

- `settings-page`: 系統設定新增版本與更新狀態，不在案件或查詢紀錄頁顯示更新細節。
- `desktop-shell`: 桌面殼新增安全更新設定、簽章設定與版本檢查流程。

## Impact

- Affected specs: tauri-desktop-auto-update, release-verification, settings-page, desktop-shell
- Affected code:
  - New: src/lib/desktop-update.ts, src/components/settings/UpdateSettingsPanel.tsx, e2e/desktop-auto-update.spec.ts, docs/release/desktop-update-verification.md
  - Modified: src-tauri/tauri.conf.json, src-tauri/Cargo.toml, src/app/(dashboard)/settings/page.tsx, src/components/settings/SettingsNavigation.tsx, .github/workflows/release.yml
  - Removed: none
