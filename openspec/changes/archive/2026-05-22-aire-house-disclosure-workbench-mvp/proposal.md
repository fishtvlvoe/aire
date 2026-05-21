## Why

AIRE 房屋版不動產說明書已完成架構、Page Contract 與來源資料對齊，但目前可售 MVP 的主要風險仍在實作層：拉謄本後使用者看不到完整可帶入欄位、現場必問與秘書後補尚未獨立成工作台、進階功能按鈕仍混有 mock / dev feature flag，且預覽、列印、PDF 匯出必須維持同一份固定模板。

## What Changes

- 建立拉謄本後的「謄本資料預覽 / 帶入欄位」UI，顯示可自動帶入不動產說明書的土地、建物、所有權、他項權利與缺漏欄位。
- 確認 `land_registry_data` 在 Tauri 本機資料庫可持久保存，重新開啟案件後仍能讀取。
- 將現場必問資料做成獨立工作台，不混入案件建立頁；支援房屋類型差異欄位與照片區。
- 將秘書後補做成簽委託後第二階段工作台，沿用同一份 Page Contract 與固定 PDF 模板。
- 將實價登錄、周邊行情、地圖、地籍圖、空拍圖、街景、格局圖等自動化按鈕改由 SaaS entitlement 控制。
- 補齊固定模板 PDF / 預覽的一致性測試與可手寫列印 spacing 檢查。
- 補齊 Tauri 桌面版可交付驗收計畫：macOS 本機驗收、Windows 版由 UTM Windows VM 或 GitHub Actions 打包驗收，macOS 交叉編譯只作備援。

## Non-Goals

- 不在此 change 完成完整 opcOS 生態系登入中心。
- 不在此 change 完成正式金流、支付閘道或訂閱扣款。
- 不在此 change 上傳客戶案件、謄本、地址、地號、所有權人、PDF 或照片到雲端。
- 不在此 change 實作 104、社群貼文、DM、591 行銷模組。
- 不移除手動 fallback；API 查不到時仍須留空白或允許手動補件。
- 不把 macOS 交叉編譯成功視為 Windows 版完成；Windows 安裝檔必須在 Windows VM 或 Windows runner 實測。

## Capabilities

### New Capabilities

- `house-disclosure-registry-preview`: 拉謄本後顯示可帶入不動產說明書的欄位預覽、缺漏欄位與本機保存狀態。
- `house-disclosure-field-survey-workbench`: 房屋版現場必問與照片工作台，依房屋類型顯示差異欄位。
- `house-disclosure-supplement-workbench`: 簽委託後秘書後補工作台，支援合約、謄本、圖資、照片命名與一致性檢查。

### Modified Capabilities

- `disclosure-document-generation`: 固定模板預覽與 PDF 匯出 SHALL 使用同一份 Page Contract 資料，並保留空白欄位供手寫。
- `plan-entitlements`: 自動化進階功能 SHALL 由 SaaS entitlement 決定可見與可執行狀態。

## Impact

- Affected specs: house-disclosure-registry-preview, house-disclosure-field-survey-workbench, house-disclosure-supplement-workbench, disclosure-document-generation, plan-entitlements
- Affected code:
  - `src/components/case-wizard/*`
  - `src/lib/pdf-engine/*`
  - `src/lib/page-contracts/*`
  - `src/lib/mock-backend.ts`
  - `src-tauri/src/db/*`
  - `src-tauri/src/commands/*`
  - `.github/workflows/release.yml`
  - `src-tauri/tauri.conf.json`
  - `docs/tauri-utm-windows-test-plan.md`
- Dependencies 新增: none expected
- 環境變數新增: none expected
