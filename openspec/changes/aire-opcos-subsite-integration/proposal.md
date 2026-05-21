## Why

AIRE 已經有正式子網域 `aire.opcos.me`，但目前頁面內容仍偏模板與暫時文案，無法清楚承接 OPCOS 登入、授權購買、AIRE 桌面 App 下載/啟用與後續子網站功能。現在已完成 OPCOS 登入、LINE 串接與 AIRE logo 修正，下一步必須用 SR 固定網站整合契約，避免後續只改畫面卻沒有驗收標準。

## What Changes

- 新增 AIRE 子網站整合規格，定義 `aire.opcos.me` 的角色、頁面內容、CTA、登入/註冊導向、授權狀態導向與正式站 smoke 測試標準。
- 新增 AIRE 子網站內容契約，要求首頁以 AIRE 不動產桌面 App 為第一視覺，不再使用模板式 SaaS 文字或不相關 dashboard 內容。
- 新增 OPCOS 與 AIRE 的跨站導向契約，明確 `opcos.me` 作為帳號/授權中台，`aire.opcos.me` 作為 AIRE 產品入口與下載/啟用入口。
- 修改 AIRE 平台架構規格，補上 OPCOS 子網站是雲端入口層，不能承接或儲存屋主個資與案件資料。
- 新增部署驗收標準，要求正式站 `https://aire.opcos.me`、`https://opcos.me/products/aire`、登入 redirect 與 AIRE 圖示資產都可被 production smoke 驗證。

## Non-Goals

- 不在本次把 AIRE 桌面 App 改成 Web SaaS；案件資料與屋主個資仍只存在本機 SQLite。
- 不在本次實作 AI 平面圖生成、格局圖上傳、PDF 文件產出等桌面功能；這些維持在既有 floor-plan 與 PDF 相關 SR。
- 不在本次新增付費金流方案或改變 NT$30,000 買斷授權模型；本次只串接既有 OPCOS 帳號與授權入口。
- 不在本次新增 Gmail、LINE 的真人 OAuth 自動化測試；需要真人授權時由 Fish 手動驗證。

## Capabilities

### New Capabilities

- `aire-opcos-subsite`: 定義 AIRE 子網站在 OPCOS 平台中的頁面內容、跨站導向、授權入口、隱私邊界與正式站驗收。

### Modified Capabilities

- `unified-platform-architecture`: 補充 AIRE 與 OPCOS 的雲端入口分工：OPCOS 提供帳號、授權、下載與更新入口，AIRE 桌面端仍維持本機案件資料與離線優先。

## Impact

- Affected specs: `aire-opcos-subsite`, `unified-platform-architecture`
- Affected code:
  - New: none in AIRE repo
  - Modified: `openspec/specs/unified-platform-architecture/spec.md`
  - Removed: none
  - External repository: OPCOS marketing app will update the AIRE subsite route, AIRE product page copy, CTA links, visual assets, and production smoke tests.
- Dependencies 新增: none
- 環境變數新增: none
