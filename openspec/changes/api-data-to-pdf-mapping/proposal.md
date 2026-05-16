## Problem

Step 2「地政資料」API 拉完（顯示「3 項成功」），但 PDF 全部欄位顯示「待補」，API 回來的資料沒有流到 PDF。具體問題：

1. **mock backend 回傳假值**：`MockStore.landRegistryPullData()` 對每個 apiId 只回傳 `{ source_api: apiId }`，完全沒有真實欄位（area、purpose、zoning_type 等），導致 `assembleDossierData` 用 `safeGet` 取值全部拿到 undefined
2. **地號/建號沒有回填**：Step 2 的「已儲存資料」包含 land_registry 結果，但地號（lot_number）和建號（building_number）沒寫回表單欄位，欄位顯示空白
3. **實價登錄沒接進流程**：`assembleDossierData` 有呼叫 `invoke("query_real_price")`，但 mock-backend 沒有對應的 mock handler（只有 `safe-invoke.ts` 有），dev 模式下 `invoke` 直接拋錯被靜默 catch，實價登錄資料永遠為 undefined
4. **debug JSON 給客戶看**：`PullParcelDataButton.tsx` 的「已儲存資料」和「結果預覽」區塊用 `JSON.stringify` 直接渲染 raw JSON，不是給客戶看的東西
5. **主題 Cover 有 JSON.stringify 殘留**：theme-a-minimal、theme-b-professional、theme-c-tech-elegant 的 Cover 元件都有 `JSON.stringify(caseData)` 輸出到封面

## Root Cause

- `mock-backend.ts` 第 1074 行：`results[apiId] = { success: true, data: { source_api: apiId }, source: "api" }` — data 物件只有 source_api 標記，沒有任何業務欄位
- `PullParcelDataButton.tsx` 第 224-278 行：`persistedData` 和 `previewData` 直接用 `JSON.stringify` 渲染，是開發階段遺留
- `assembleDossierData` 用 `invoke`（Tauri native），而 mock handler 註冊在兩個地方：`mock-backend.ts`（透過 mockInvoke）和 `safe-invoke.ts`（透過 safeInvoke），但 `assembleDossierData` 用的是原生 `invoke`，dev 模式下打不到任何 mock
- 三個主題的 Cover 元件有 `JSON.stringify(caseData)` 是先前 code review 已標記的開發遺留（WARNING #6）

## Proposed Solution

1. **修 mock-backend 的 landRegistryPullData**：回傳真實結構欄位值（land_registry → area/purpose/lot_number，zoning → zoning_type/usage_category，land_value → announced_value/assessed_value，mortgages → creditor/amount 陣列，building_registry → area/purpose/construction_date）
2. **新增 mock-backend 的 query_real_price handler**：回傳 2-3 筆含 unit_price 的實價登錄紀錄，讓 `computeRecentSaleStats` 能計算出均價
3. **修 assembleDossierData 用 mockInvoke**：dev 模式下改用 `mockInvoke`（同 tauri-bridge 的 mock 機制），讓所有 IPC 命令走 mock-backend
4. **Step 2 地號/建號回填**：land_registry 回傳 lot_number 後，寫回 CaseRow 的 land_lot_no 和 building_lot_no，並更新表單 state
5. **隱藏 debug JSON**：移除 PullParcelDataButton 的「已儲存資料」和「結果預覽」raw JSON 區塊，改為簡潔的成功摘要（如「已取得 3 項地政資料」）
6. **移除 Cover 的 JSON.stringify**：三個主題的 Cover 元件移除 `JSON.stringify(caseData)` 區塊

## Non-Goals

- 不改 assembleDossierData 的欄位 mapping 邏輯（mapping 本身是正確的，只是 mock 沒給真實值）
- 不改 PDF 頁面結構（10 頁章節結構已在 pdf-template-land-complete 完成）
- 不改真實 Tauri IPC 命令的格式（只修 mock 層）
- 不做成屋版的實價登錄接通（本次只修土地版流程）

## Success Criteria

1. Step 2 拉完 API 後，地號/建號欄位自動填入 mock 值
2. Step 4 預覽 PDF 的第 3 頁（一、標示及權利範圍）顯示地積、地目、使用分區等真實 mock 值，而非全部「待補」
3. Step 4 預覽 PDF 的第 9 頁（七、其他重要事項）的「近期成交均價」和「近期成交案件數」有實價登錄數值
4. Step 2 不再顯示 raw JSON 區塊
5. PDF 封面不再顯示 JSON.stringify 的 raw data
6. `npm run build` 和現有測試通過

## Impact

- Affected specs: `pdf-api-autofill`（delta — mock handler 回傳格式）、`dossier-land-document`（delta — assembleDossierData 呼叫路徑）
- Affected code:
  - Modified: `src/lib/mock-backend.ts`（landRegistryPullData 回傳值、新增 queryRealPrice mock handler）
  - Modified: `src/lib/pdf-engine/assemble-dossier-data.ts`（dev 模式用 mockInvoke 取代 invoke）
  - Modified: `src/components/PullParcelDataButton.tsx`（移除 debug JSON 區塊）
  - Modified: `src/components/case-wizard/CaseWizardStep2.tsx`（地號/建號回填邏輯）
  - Modified: `src/lib/pdf-themes/theme-a-minimal/index.tsx`（移除 Cover JSON.stringify）
  - Modified: `src/lib/pdf-themes/theme-b-professional/index.tsx`（移除 Cover JSON.stringify）
  - Modified: `src/lib/pdf-themes/theme-c-tech-elegant/index.tsx`（移除 Cover JSON.stringify）
- Dependencies 新增: 無
- 環境變數新增: 無
