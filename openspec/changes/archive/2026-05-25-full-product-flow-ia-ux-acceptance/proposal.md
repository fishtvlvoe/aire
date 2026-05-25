## Why

AIRE 目前多個頁面把相同功能重複放在左側選單、頁內分類、假按鈕或設定卡片中，使用者無法判斷該從哪裡開始，也無法知道哪些功能真的可操作。這次必須用完整使用流程驗收，而不是只修單一畫面，確保 Fish 回來後可以從新增物件到產出文件完整測試一次。

## What Changes

- 新增全流程 IA/UX 驗收契約，規定一級選單、二級選單與頁內操作不可重複呈現同一功能。
- 修改案件流程，讓「新增案件」成為唯一新增物件入口；地址地政判斷是新增案件內的步驟，不再另外用「地政查詢」偽裝成獨立流程。
- 修改設定頁，移除頁內「設定分類」重複側欄，`功能開關` 只顯示一組功能 toggle，不混入授權卡、MCP Hub 或 Super Admin。
- 修改工作台，未完成後端閉環的按鈕不得看起來像已可執行功能；可保留的動作必須有明確作用、狀態或導向。
- 修正地址與地政判斷測試，建物地址不得被本機 fallback 誤標為農地或農舍；只有明確土地/農地線索才可標為土地。
- 新增 E2E 驗收，從新增案件、案件總覽、案件工作台、補件、資料來源、費用、PDF 預覽、列印匯出、地政授權、功能開關、授權升級逐頁點擊驗證。

## Non-Goals

- 不在本 SR 完成所有 MOI/COP 後端 API 串接；API catalog、ledger、autofill engine 仍由 `disclosure-registry-autofill-system-update` 追蹤。
- 不新增付費收款流程。
- 不上線部署；本次先以本機與 CI 可跑的自動化驗收為準。
- 不保留客戶看不懂或不能操作的開發工具入口。

## Capabilities

### New Capabilities

- `full-product-flow-ia-ux-acceptance`: 定義 AIRE 客戶可見流程、導覽去重、功能獨立性與全流程驗收規則。

### Modified Capabilities

- `sidebar-navigation`: 左側選單 SHALL 是功能導覽的唯一二級入口來源，不再要求舊版兩項導覽。
- `case-management`: 新增案件流程 SHALL 以地址先行判斷地政資料，且不得跳過判斷直接建立案件。
- `settings-page`: 設定頁 SHALL 不再顯示頁內重複分類，且每個 section 只顯示該 section 的內容。
- `land-registry-address-lookup`: 本機 fallback SHALL 不得把一般建物地址誤分類為農地或農舍。

## Impact

- Affected specs:
  - New: `full-product-flow-ia-ux-acceptance`
  - Modified: `sidebar-navigation`, `case-management`, `settings-page`, `land-registry-address-lookup`
- Affected code:
  - Modified: `src/lib/product-navigation-ia.ts`
  - Modified: `src/lib/product-ui-demo-alignment.ts`
  - Modified: `src/app/(dashboard)/settings/page.tsx`
  - Modified: `src/app/(dashboard)/cases/new/page.tsx`
  - Modified: `src/components/workbench/DemoAlignedWorkbench.tsx`
  - Modified: `src/components/AppSidebar.tsx`
  - Modified: `e2e/product-ui-demo-alignment.spec.ts`
  - Modified: `e2e/product-navigation-ia.spec.ts`
  - New: `e2e/full-product-flow-ia-ux-acceptance.spec.ts`
- Dependencies 新增: 無
- 環境變數新增: 無
