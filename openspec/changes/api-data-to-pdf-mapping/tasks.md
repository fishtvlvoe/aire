# Tasks — api-data-to-pdf-mapping

> Design refs: D1 assembleDossierData 改用 mockInvoke、D2 mock landRegistryPullData 真實欄位、D3 queryRealPrice handler、D4 移除 debug JSON、D5 地號建號回填、D6 Cover JSON.stringify 移除
> Spec refs: pdf-api-autofill（mock handler 回傳格式 + assembleDossierData 呼叫路徑）、dossier-land-document（Cover 不渲染 JSON）

## 1. 修 mock 層：landRegistryPullData 回傳真實欄位（實現 spec: mock landRegistryPullData returns field-accurate data）

- [x] 1.1 修改 `src/lib/mock-backend.ts` 的 `landRegistryPullData` 方法：對每個 apiId 回傳含業務欄位的 data 物件。land_registry → `{ area: 125.8, purpose: "田", lot_number: "0456-0000" }`；zoning → `{ zoning_type: "住宅區", usage_category: "甲種建築用地" }`；land_value → `{ announced_value: 58000, assessed_value: 42000 }`；mortgages → `[{ creditor: "台灣銀行", amount: 3000000 }]`；building_registry → `{ area: 85.5, purpose: "住家用", construction_date: "2015-06-15" }`；building_ownership → `{ certificate_no: "北松字第012345號", ownership_date: "2015-08-20" }`。未知 apiId 保持原 `{ source_api: apiId }` fallback [Tool: copilot]

## 2. 新增 mock 層：query_real_price handler

- [x] 2.1 在 `src/lib/mock-backend.ts` 的 `MockStore` 新增 `queryRealPrice` 方法，回傳 3 筆紀錄：每筆含 `unit_price`（number）、`total_price`、`area`、`address`（台南市地址）、`date`。在 `handleCommand` 的 switch 加 `"query_real_price"` case 路由到此方法 [Tool: copilot]
- [x] [P] 2.2 移除 `src/lib/safe-invoke.ts` 的 `query_real_price` mock handler（重複 mock 入口），`safeInvoke` 函式改為直接 passthrough 到 `baseSafeInvoke`，不再維護獨立 mockHandlers [Tool: copilot]

## 3. 修 assembleDossierData 走 mock 路徑（實現 spec: assembleDossierData returns populated fields in dev mode）

- [x] 3.1 修改 `src/lib/pdf-engine/assemble-dossier-data.ts`：將 `import { invoke } from "@tauri-apps/api/core"` 改為 `import { safeInvoke as invoke } from "@/lib/tauri-bridge"`。不改其他邏輯，只換 import 路徑，讓 dev 模式下所有 IPC 呼叫走 MockStore [Tool: copilot]

## 4. Step 2 地號/建號回填

- [x] 4.1 修改 `src/components/case-wizard/CaseWizardStep2.tsx`：在 `handlePullComplete` 回呼中，從 API 回傳的 `land_registry_data` 取出 `land_registry.data.lot_number` 填入 `landLotNo` state、`building_registry.data` 存在時取 building_number 填入 `buildingLotNo` state。確認 onSave 時這些值會寫回 CaseRow [Tool: copilot]

## 5. 隱藏 debug JSON、移除 Cover dump

- [x] [P] 5.1 修改 `src/components/PullParcelDataButton.tsx`：移除「已儲存資料」區塊（`persistedData && ...` 的 JSON.stringify 渲染，約第 224-231 行）和「結果預覽」區塊（`previewData && ...` 的 JSON.stringify 渲染，約第 265-278 行）。保留「確認儲存」按鈕，移到成功摘要內。成功時改顯示純文字「已取得 N 項地政資料」 [Tool: copilot]
- [x] [P] 5.2 修改 `src/lib/pdf-themes/theme-a-minimal/index.tsx` 的 Cover 元件：移除 `{JSON.stringify(caseData)}` 的 `<pre>` 區塊（實現 spec: Cover SHALL NOT render raw CaseDossierData JSON） [Tool: copilot]
- [x] [P] 5.3 修改 `src/lib/pdf-themes/theme-b-professional/index.tsx` 的 Cover 元件：移除 `{JSON.stringify(caseData)}` 的 `<pre>` 區塊 [Tool: copilot]
- [x] [P] 5.4 修改 `src/lib/pdf-themes/theme-c-tech-elegant/index.tsx` 的 Cover 元件：移除 `{JSON.stringify(caseData)}` 的 `<pre>` 區塊 [Tool: copilot]

## 6. 驗證

- [x] 6.1 執行 `npm run build`，確認零錯誤 [Tool: main]
- [x] 6.2 執行現有測試 `npm run test -- src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts`，確認通過（測試內部 mock 的 invoke 需同步調整 import 路徑） [Tool: main]
- [x] 6.3 瀏覽器 dev 模式走完整 wizard：Step 2 拉 API → 確認地號回填 → Step 4 預覽 → 確認 PDF 第 3 頁有 mock 值、第 9 頁有成交均價、封面無 JSON dump、Step 2 無 raw JSON [Tool: main]
