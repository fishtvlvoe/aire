## Context

`desktop-fullflow-r02-cop-parity` 是本期主線，負責把 AIRE 做成 Mac/Windows 桌面完整版。自動更新只有在桌面完整版可安裝、可登入或可進入授權狀態、可新增案件、可完成地政資料確認、可產出物調與 PDF 後才有意義。

此 SR 的設計目標是讓客戶知道「有新版本可更新」，而不是讓客戶理解更新技術。所有 manifest、signature、GitHub Releases、Tauri updater 等底層詞只留在工程文件、log 與 release 驗收報告中。

## Goals / Non-Goals

### Goals

- macOS 與 Windows stable 版本可安全檢查更新。
- 使用者可在系統設定看到目前版本與更新狀態。
- app 啟動時可背景檢查更新，但不得阻斷案件流程。
- 更新下載完成後由使用者選擇重啟套用。
- release pipeline 可產出簽章、manifest 與平台安裝檔。
- 更新後仍能保留本機案件資料、查詢 JSON、費用紀錄與錯誤 log。

### Non-Goals

- 不做 SaaS 自動更新。
- 不做強制更新與遠端鎖版。
- 不做 beta/dev/stable 多 channel 切換 UI。
- 不改變客戶 COP API 憑證儲存方式。
- 不改變地政查詢主流程。

## Decisions

### Decision 1: Use Tauri updater as the only desktop update path

AIRE Desktop 以 Tauri 為桌面殼，自動更新 SHALL 使用 Tauri updater。舊 Electron updater 或歷史 Electron release 設定只作歷史參考，不能作為新實作基礎。

驗證方式：

- `src-tauri/tauri.conf.json` 存在 updater 設定。
- release workflow 產生 Tauri updater 需要的 artifact 與 signature。
- 程式碼掃描不得新增 Electron updater dependency。

### Decision 2: Stable channel first, GitHub Releases first

第一版更新源採 GitHub Releases 或等價可簽章 artifact host。若未來要搬到 OPCOS/CDN，必須另開 SR，並維持相同 manifest contract。

驗證方式：

- release 文件列出 stable 更新 URL 與平台 artifact。
- macOS 與 Windows smoke test 使用同一 stable channel manifest。

### Decision 3: Update checks are non-blocking

啟動 app 後的背景檢查不得讓使用者卡在 loading。網路失敗、manifest 失敗或簽章驗證失敗時，案件管理仍可使用；錯誤只寫入設定頁狀態與 log。

驗證方式：

- 模擬更新 endpoint timeout 時，`/cases/new` 仍可開啟。
- 設定頁顯示更新檢查失敗與重試按鈕。
- log 可查到錯誤碼與發生時間。

### Decision 4: Customer UI uses task language

前台 UI 只顯示「目前版本」、「檢查更新」、「有新版本」、「下載更新」、「重新啟動完成更新」、「已是最新版本」、「更新失敗，稍後再試」。不得顯示 manifest、signature、GitHub Releases、Tauri、endpoint 等工程詞。

驗證方式：

- Settings page content assertion 不含禁用工程詞。
- 更新錯誤 detail 預設收合，必要時管理人員才展開。

### Decision 5: Update must preserve local data

更新流程不得清空本機案件資料、查詢 JSON、費用紀錄、錯誤 log、客戶 COP 憑證狀態或補件資料。

驗證方式：

- 舊版建立案件與查詢紀錄。
- 更新到新版。
- 新版開啟後仍看得到同一案件、同一查詢紀錄、同一 PDF 預覽資料。

## Risks and Mitigations

| Risk | Mitigation | Verification |
| --- | --- | --- |
| macOS 未簽章或未 notarize 導致客戶無法開啟 | release 前檢查 code signing 與 notarization 結果 | macOS 實機安裝與首次啟動 smoke |
| Windows 安裝檔被 SmartScreen 或防毒攔截 | 建立 code signing 與下載來源紀錄 | Windows 實機或 VM 安裝 smoke |
| 更新服務失敗影響案件操作 | 更新檢查 non-blocking | endpoint timeout E2E |
| 更新後本機資料遺失 | 禁止更新流程清資料；加資料保留測試 | old-to-new update smoke |
| 客戶看到工程詞造成認知負荷 | 客戶前台文案掃描 | settings content assertion |

## Rollout

1. 先完成 `desktop-fullflow-r02-cop-parity` 的 macOS/Windows 驗收。
2. 建立 Tauri updater 設定與 release artifact。
3. 新增設定頁版本與更新 UI。
4. 建立 macOS 與 Windows old-to-new smoke。
5. 用內部測試帳號發布一版舊版，再升到新版。
6. 驗收更新後主流程與本機資料仍存在。

## Open Questions

- 最終 stable artifact host 是否先用 GitHub Releases，或由 OPCOS 網域反向代理。此 SR 預設 GitHub Releases first。
- macOS 與 Windows code signing 憑證由哪個帳號持有。此 SR 會把缺少憑證視為 release blocker，而不是讓未簽章版本冒充正式版。
