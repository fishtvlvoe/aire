## Why

目前 AIRE 產品頁面與 `UI-UX-DEMO-REFERENCE/registry-autofill-workbench.html`、`UI-UX-DEMO-REFERENCE/registry-autofill-settings.html` 的 UI/UX、功能分區、前後端契約落差很大。這不是單純樣式未套，而是主流程仍停在舊版 wizard、demo 工作台與設定頁未整合到正式產品，導致使用者看到的畫面與規劃完全不一致。

## What Changes

- 新增以 `UI-UX-DEMO-REFERENCE` 兩個 HTML 為唯一產品 UI 參考的對齊 SR，先把靜態 demo 轉成正式產品契約。
- 修改主案件入口，從舊版五步 wizard 改為 demo 定義的「說明書工作台」：左側案件/章節，右側欄位審核。
- 修改左側主選單，從只有「案件管理 / 設定」改為 demo 的資料夾式一級選單與子選單。
- 修改新增案件流程，改成地址優先，由地政判斷土地/建物與需要審核的章節；只有查不到或多候選時才人工選。
- 修改地政資料工作台，將目前局部的 `CaseWizardStep2` 與 `registry-preview` 整合成完整欄位審核，而不是藏在 wizard 第二步。
- 新增系統設定整合頁，對齊 demo 的「授權與升級 / 地政資料規則 / 費用與帳務 / PDF 圖資位置 / 地政授權」分類。
- 新增升級功能 toggle 與 entitlement port 對齊，未升級灰色 disabled，已升級可開關本機功能。
- 新增費用紀錄與 API 稽核 UI，讓地政查詢成功、失敗、回傳筆數、費用、0 元不計費原因可查。
- 修改客戶畫面文案，禁止顯示 `MOI_API_*`、`COP309`、backend enum、`BASIC`、`pro`、`advanced` 等工程或英文方案字。
- 修改現有 `HouseMvpWorkbench`，保留現場必問與秘書後補能力，但移除主工作台內不該常駐的升級開關與英文方案文案。

## Non-Goals

- 不在本 SR 同時重做 PDF 模板排版。
- 不在本 SR 完成所有 MOI/COP API 實串；本 SR 只要求 UI 與端口有清楚契約。
- 不把案件資料上傳 OPCOS。
- 不把靜態 HTML 直接 iframe 到產品裡假裝完成。
- 不保留舊版 wizard 作為主要流程；若短期需要過渡，只能放在 legacy/dev route。
- 不把升級功能、資料邊界、費用規則常駐塞進案件工作台。

## Capabilities

### New Capabilities

- `product-ui-demo-alignment`: 定義正式產品必須對齊根目錄 `UI-UX-DEMO-REFERENCE` 兩個 HTML 的工作台、設定、導覽、文案與前後端端口契約。

### Modified Capabilities

(none)

## Impact

- Affected specs: `product-ui-demo-alignment`
- Affected code:
  - New: `src/components/workbench/DemoAlignedWorkbench.tsx`, `src/components/workbench/WorkbenchSidebar.tsx`, `src/components/settings/EntitlementSettingsPanel.tsx`, `src/components/settings/UsageCostSettingsPanel.tsx`, `src/lib/product-ui-demo-alignment.ts`
  - Modified: `src/app/(dashboard)/layout.tsx`, `src/components/AppSidebar.tsx`, `src/app/(dashboard)/cases/page.tsx`, `src/app/(dashboard)/cases/new/page.tsx`, `src/app/(dashboard)/cases/[id]/page.tsx`, `src/components/case-wizard/CaseWizard.tsx`, `src/components/case-wizard/CaseWizardStep2.tsx`, `src/components/HouseMvpWorkbench.tsx`, `src/components/KeyinSplitPage.tsx`, `src/app/(dashboard)/settings/page.tsx`, `src/lib/plan-entitlements.ts`, `src/lib/cases-api.ts`, `src/lib/mock-backend.ts`, `src-tauri/src`
  - Removed: none
- Dependencies 新增: none planned
- 環境變數新增: none planned
