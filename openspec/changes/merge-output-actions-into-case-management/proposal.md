## Why

「PDF 預覽」與「列印與匯出」目前作為獨立的產出文件選單，但兩者都只是先選案件再進同一個 PDF 流程，會讓使用者誤以為有兩套不同功能。案件列表本身已是選案件的地方，產出動作應該放回案件管理的操作區。

## What Changes

- 移除「產出文件」一級選單與其底下的 PDF 預覽、列印與匯出子選單。
- 修改案件列表操作區，直接提供「預覽 PDF」與「匯出 PDF」動作。
- 修改導覽 active 判斷，含 query 的設定頁不再同時標亮「個人設定」。
- 修改新增案件流程，只保留一個主要「判斷地政資料」送出入口，未判斷時點擊會真的執行判斷，不顯示重複按鈕。
- 修改物件審核流程：資料來源分頁顯示地政匯入資料並可下載 JSON；補件與現場必問合併成可填寫與上傳的同一張表單；費用提前在欄位審核顯示。
- 修改個人設定與方案升級：個人設定只保留可修改的名稱、Email、密碼、品牌色與 Logo；帳號授權管理放到方案升級頁。
- 修改 PDF 圖資行為：格局圖/土地規劃圖沒有上傳或核准素材時，PDF 保留空白框，不把草稿 AI 格局圖放入正式預覽。
- 修正 PDF 成交行情測試資料來源，避免永康/勝利街案件顯示固定東區裕農路資料，並保留成交日期。
- 更新導覽、案件列表與 E2E 測試，確認使用者不會看到重複入口。

## Non-Goals

- 不改 PDF 預覽頁主框架與下載 API。
- 不移除 `/cases/:id/preview` 深層頁面。
- 不調整地政資料或系統設定的一級選單。
- 不在本次串接正式地政重查、補件自動產生或現場必問後端 API。
- 不在本次串接正式實價登錄雲端資料源；本次只修 mock/fallback 與 PDF 組資料欄位。

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `sidebar-navigation`: 側邊欄不再顯示產出文件資料夾，且 query route active state 必須唯一。
- `case-management`: 案件總覽操作區承接 PDF 預覽與匯出入口，新增案件與工作台不得保留無功能或重複的流程按鈕，PDF 成交行情不得顯示與案件地址不符的固定 mock 資料。

## Impact

- Affected specs: sidebar-navigation, case-management
- Affected code:
  - Modified: src/lib/product-navigation-ia.ts
  - Modified: src/lib/product-ui-demo-alignment.ts
  - Modified: src/components/AppSidebar.tsx
  - Modified: src/components/CaseListActions.tsx
  - Modified: src/app/(dashboard)/cases/page.tsx
  - Modified: src/app/(dashboard)/cases/new/page.tsx
  - Modified: src/app/(dashboard)/settings/page.tsx
  - Modified: src/components/workbench/DemoAlignedWorkbench.tsx
  - Modified: src/lib/mock-backend.ts
  - Modified: src/lib/pdf-engine/assemble-dossier-data.ts
  - Modified: src/lib/pdf-blocks/floor-plan-photo-page.tsx
  - Modified: src/lib/pdf-engine/html-blocks/location-and-exterior.tsx
  - Modified: src/components/__tests__/AppSidebar.test.tsx
  - Modified: src/lib/__tests__/product-navigation-ia.test.ts
  - Modified: src/lib/__tests__/product-ui-demo-alignment.test.ts
  - Modified: src/app/(dashboard)/cases/__tests__/page.test.tsx
  - Modified: src/app/(dashboard)/cases/new/__tests__/new-case-page.test.tsx
  - Modified: src/components/__tests__/DemoAlignedWorkbench.test.tsx
  - Modified: src/lib/__tests__/mock-backend.test.ts
  - Modified: src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - Modified: src/lib/pdf-engine/__tests__/html-renderer-floor-plan-photo.test.tsx
  - Modified: src/app/(dashboard)/settings/__tests__/page.test.tsx
  - Modified: src/app/(dashboard)/settings/__tests__/settings-page.test.tsx
  - Modified: e2e/full-product-flow-ia-ux-acceptance.spec.ts
  - Modified: e2e/product-ui-demo-alignment.spec.ts
  - Modified: e2e/product-auth-functional-flow.spec.ts
  - Modified: e2e/product-navigation-ia.spec.ts
  - Modified: e2e/aire-disclosure-registry-ux.spec.ts
- Dependencies 新增: none
- 環境變數新增: none
