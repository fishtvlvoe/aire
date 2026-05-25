## Why

目前 AIRE 的案件頁把一級側欄、頁內分頁、案件列動作、工作台子功能混在同一層，使用者點擊後無法預期是「切換分類」、「進入案件」還是「切換同頁狀態」。這會讓正式工作流程看起來重複且不順，也會讓 demo reference 的工作台概念被誤用成另一層頁內選單。

## What Changes

- 修改產品資訊架構，明確定義一級側欄、二級列表/模組、三級案件工作台的責任與點擊行為。
- 修改案件總覽頁，避免同一頁同時重複顯示側欄子選單與頁內同名分頁。
- 修改案件列動作，釐清「點擊案件列」與「開啟工作台」是否為同一個主動作，移除不必要的重複 CTA。
- 修改現場必問工作台與說明書工作台的關係，將它定義為案件內的三級模組，而不是從總覽頁直接攤開所有功能。
- 修改客戶前台文案，禁止在客戶工作台顯示 BASIC、pro、advanced 等方案 enum 與工程語彙。
- 新增 UX 驗收矩陣，要求每個導覽入口只能有一個主目的，且 Playwright 要驗證點擊後落在正確層級。

## Non-Goals

- 不重做地政 API、費用計算、謄本欄位 mapping 或後端資料模型。
- 不在本 SR 決定升級價格或商業方案內容，只處理客戶可見的功能入口與狀態呈現。
- 不刪除現有現場必問、補件、PDF 預覽功能；本 SR 只重新分類入口與顯示層級。
- 不以 demo HTML 原封不動作為最終產品；demo 是參考，但正式產品必須遵守清楚的一級、二級、三級操作層級。

## Capabilities

### New Capabilities

- `product-navigation-ia`: 定義 AIRE 產品的一級、二級、三級導覽層級、點擊語意、去重規則與客戶工作流。

### Modified Capabilities

- `case-management`: 案件總覽不再是舊式 plain table 或同名分頁重複區，必須成為二級案件選擇與狀態概覽。
- `sidebar-navigation`: 側欄不再只是兩項導覽，也不能把頁內同名功能重複攤開；需定義一級資料夾與進入二級頁面的規則。
- `ux-interaction-patterns`: 補上導覽去重、主動作唯一、三層點擊行為與客戶文案降噪規則。

## Impact

- Affected specs: product-navigation-ia, case-management, sidebar-navigation, ux-interaction-patterns
- Affected code:
  - Modified: src/components/AppSidebar.tsx
  - Modified: src/app/(dashboard)/cases/page.tsx
  - Modified: src/app/(dashboard)/cases/[id]/page.tsx
  - Modified: src/components/workbench/DemoAlignedWorkbench.tsx
  - Modified: src/components/HouseMvpWorkbench.tsx
  - Modified: src/lib/product-ui-demo-alignment.ts
  - Modified: src/lib/plan-entitlements.ts
  - Modified: e2e/product-ui-demo-alignment.spec.ts
  - Modified: e2e/product-auth-functional-flow.spec.ts
  - New: src/lib/product-navigation-ia.ts
  - New: src/lib/__tests__/product-navigation-ia.test.ts
- Dependencies 新增: none
- 環境變數新增: none
