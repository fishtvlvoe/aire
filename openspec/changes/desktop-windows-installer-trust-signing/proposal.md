## Why

Windows 安裝器目前在安裝時會出現不安全、未知發行者或可能有病毒的警告，會讓內部驗收與未來客戶現場安裝都無法被視為正式 release-ready。這次 SR 要把安裝器信任鏈、SmartScreen/Defender 誤判處理與 Windows VM 驗收證據納入 release gate，避免把「能安裝」誤判成「可交付」。

## What Changes

- 新增 Windows 安裝器信任與簽章 release gate，要求每個對外 Windows installer 都要有來源、hash、簽章狀態與 SmartScreen/Defender 驗收紀錄。
- 新增 GitHub Actions Windows installer 簽章策略，優先規劃 Azure Artifact Signing 或等價正式 code signing 憑證，不接受自簽憑證作為客戶 release 解法。
- 新增 Microsoft Defender 誤判處理流程，若 Defender 回報具體威脅名稱，必須提交 Microsoft Security Intelligence 檔案申訴並保存 submission evidence。
- 修改 release 文件與驗收 checklist，將「Windows VM 可啟動」與「Windows installer trust gate」分成兩個獨立通過條件。
- 新增早期內部測試說明，允許 Fish 在 UTM VM 內手動繞過 SmartScreen 做 runtime smoke，但禁止把該結果標記為正式客戶可交付。

## Non-Goals

- 本次不處理 App 功能流程本身，例如地址查詢、COP PDF 產出或授權邏輯。
- 本次不把未簽章 installer 交付給客戶，也不把 SmartScreen 繞過步驟包裝成客戶安裝 SOP。
- 本次不導入自簽憑證作為正式解法，因為 Windows 預設不信任自簽憑證。
- 本次不承諾簽章後 SmartScreen 會立刻完全消失；新檔案 hash 仍可能需要下載信譽累積。

## Capabilities

### New Capabilities

- `windows-installer-trust`: Windows installer 的簽章、信譽、Defender 誤判處理與 release gate。

### Modified Capabilities

- `desktop-shell`: Windows installer build requirement 增加 release trust metadata 與簽章驗收約束。

## Impact

- Affected specs: windows-installer-trust, desktop-shell
- Affected code:
  - Modified: .github/workflows/release.yml
  - Modified: src-tauri/tauri.conf.json
  - Modified: docs/release/desktop-fullflow-acceptance-checklist.md
  - Modified: docs/release/desktop-fullflow-acceptance-report.md
  - New: docs/release/windows-installer-trust.md
  - New: scripts/verify-windows-installer-trust.mjs
  - New: artifacts/smoke/windows/trust/
  - Removed: none
- Dependencies 新增: Azure Artifact Signing 或等價 Windows code signing provider；Microsoft Security Intelligence submission portal 作為誤判申訴通路。
- 環境變數新增: AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TRUSTED_SIGNING_ACCOUNT, AZURE_TRUSTED_SIGNING_CERT_PROFILE, AZURE_TRUSTED_SIGNING_ENDPOINT
