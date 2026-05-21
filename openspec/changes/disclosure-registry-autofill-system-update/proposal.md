## Why

AIRE 目前已經有地政 API 串接與多份舊版不動產說明書資料，但缺少一個從「說明書欄位」反推「資料來源、API 覆蓋、成功判斷、費用」的主計畫。現在若只補單一 API，仍會留下欄位空白、失敗誤判、費用不可核對的問題，因此需要把分散 SR 整併成一個可執行的系統更新 SR。

## What Changes

- 新增欄位來源矩陣，從 `docs/dossier-implementation-spec.md`、`docs/0417-new`、`docs/0417-old`、現有 disclosure schemas 反推每個說明書欄位的資料來源與自動化狀態。
- 新增 MOI/COP 服務目錄，將 `docs/cop-scrape` 已爬到的服務、價格、文件、限制、免費/付費分類整理成可被程式引用的 catalog。
- 新增 registry autofill engine 規格，定義地政資料如何填入說明書欄位，以及如何標示 `filled_from_registry`、`mapping_gap`、`integration_gap`、`manual_required`、`not_supported`。
- 新增 outcome classifier 與 cost ledger 規格，讓成功、失敗、無資料、COP309、回傳筆數、官方價格、是否計費都有一致紀錄。
- 新增 registry autofill review UX 規格，定義欄位審核工作台、缺口標籤、費用摘要、API 明細、鍵盤操作與空/錯誤/loading 狀態，避免後續做完還需要大量重改介面。
- 新增 premium feature entitlement ports 規格，為 Google 地圖、進階圖資、街景/空拍、AI 格局圖等未來升級功能保留 UI 入口與後端端口。
- 修改既有地政欄位映射與 billing log 需求，從固定單價與分散 mapping 改成以 catalog、field matrix、outcome classifier 為準。
- 修改土地與成屋 disclosure form 需求，要求 UI 不再默默留下可查資料空白，必須顯示欄位來源、缺口原因與人工補件狀態。
- 修改 property type registry 需求，先針對農地、農舍、透天別墅建立欄位覆蓋優先順序，再擴到 13 種物件類型。
- 整併未開始的 `moi-api-coverage-fallback-cost-map` 與 `moi-api-usage-ledger-and-cost-audit`，後續由本 SR 統一承接，不再分散維護。

## Non-Goals

- 不在本 SR 一次實作全部 63 個 COP/MOI 服務。
- 不接正式付款、發票、自動扣款或 OPCOS 金流。
- 不把屋主個資、案件 PDF、完整地址或原始謄本上傳到 OPCOS。
- 不提供「反查私人屋主姓名」功能；私人屋主姓名只能由屋主提供、正式謄本/OCR 或人工輸入取得。
- 不用 AI 判斷現場狀況；漏水、增建、道路寬度、使用現況等仍需現場或人工確認。
- 不把政府限定或無權限 API 暴露給一般使用者；只在 catalog 透明標示。
- 不封存未完成 SR 為「已完成」；被本 SR 取代的未開始 SR 只做合併或停用整理。

## Capabilities

### New Capabilities

- `disclosure-field-source-matrix`: Defines the source, automation state, and gap reason for every disclosure field.
- `moi-service-catalog`: Defines the local audited catalog of COP/MOI services, pricing, eligibility, and documentation references.
- `registry-autofill-engine`: Defines how land registry and public GIS data populate disclosure drafts without overwriting manual user input.
- `moi-outcome-and-cost-ledger`: Defines outcome classification, billable cost calculation, and customer/admin usage audit records.
- `registry-autofill-review-ux`: Defines the user-facing review workspace, status language, audit dashboard layout, accessibility, and responsive behavior for registry autofill.
- `premium-feature-entitlement-ports`: Defines locked/unlocked upgrade feature UI and stable frontend/backend ports for future premium capabilities.
- `property-type-registry-coverage`: Defines property-type-specific registry coverage priorities for farmland, farmhouse, townhouse, and later property types.

### Modified Capabilities

- `land-registry-field-mapping`: Existing field mapping must be driven by the field-source matrix and catalog service codes.
- `land-registry-billing-log`: Existing billing log must record official service code, outcome, rows, cost policy, and billable amount.
- `disclosure-form-land`: Land forms must show registry-fill state and gap reason for fields that are available, missing, or manual.
- `disclosure-form-residential`: Residential forms must show registry-fill state and gap reason for building/land fields.
- `property-type-registry`: Property types must expose registry coverage profile and priority fields.

## Impact

- Affected specs: `disclosure-field-source-matrix`, `moi-service-catalog`, `registry-autofill-engine`, `moi-outcome-and-cost-ledger`, `registry-autofill-review-ux`, `premium-feature-entitlement-ports`, `property-type-registry-coverage`, `land-registry-field-mapping`, `land-registry-billing-log`, `disclosure-form-land`, `disclosure-form-residential`, `property-type-registry`
- Affected code:
  - New: `src/lib/disclosure-field-source-matrix.ts`, `src/lib/moi-service-catalog.ts`, `src/lib/registry-autofill-engine.ts`, `src/lib/registry-autofill-status.ts`, `src/lib/premium-feature-ports.ts`, `src/components/registry/RegistryAutofillReviewPanel.tsx`, `src/components/registry/RegistryFieldStatusBadge.tsx`, `src/components/registry/MoiUsageAuditTable.tsx`, `src/components/registry/PremiumFeatureGate.tsx`, `src-tauri/src/land_registry/service_catalog`, `src-tauri/src/land_registry/outcome`, `src-tauri/migrations/*_land_registry_usage_ledger.sql`
  - Modified: `src/lib/registry-preview.ts`, `src/lib/disclosure-schema-land.ts`, `src/lib/disclosure-schema-residential.ts`, `src/lib/property-types`, `src/lib/plan-entitlements.ts`, `src/components/PullParcelDataButton.tsx`, `src/components/BalanceMonitor.tsx`, `src/app/(dashboard)/settings`, `src-tauri/src/land_registry/apis`, `src-tauri/src/land_registry/pull.rs`, `src-tauri/src/land_registry/billing_log`, `docs/cop-scrape`, `docs/0417-new`, `docs/0417-old`
  - Removed: none
- Dependencies 新增: none planned
- 環境變數新增: none planned
