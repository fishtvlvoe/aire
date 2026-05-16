## Context

AIRE 的 dev 模式下，所有 Tauri IPC 呼叫走 `mock-backend.ts` 的 `MockStore`（透過 `tauri-bridge.ts` 的 `mockInvoke`）。但 `assembleDossierData` 直接 import `invoke` from `@tauri-apps/api/core`，繞過了 mock 層，導致 dev 模式下所有 API 呼叫拋錯被靜默 catch，欄位全部 undefined。

另一個 mock 入口是 `safe-invoke.ts`，但只有 `query_real_price` 一個 handler。

## Goals / Non-Goals

**Goals:**
- Mock 層回傳欄位結構與真實 API 一致，讓 mapping 邏輯可驗證
- dev 模式下 assembleDossierData 能取到 mock 資料
- 移除所有面向客戶的 debug 輸出

**Non-Goals:**
- 不改真實 Tauri IPC 格式
- 不改 assembleDossierData 的 mapping 邏輯（mapping 正確，只是沒餵到資料）
- 不統一 mockInvoke 與 safeInvoke 兩套 mock 機制（後續重構）

## Decisions

### D1：assembleDossierData 改用 mockInvoke

`assemble-dossier-data.ts` 頂部的 `import { invoke } from "@tauri-apps/api/core"` 改為 `import { safeInvoke as invoke } from "@/lib/tauri-bridge"`。`tauri-bridge.ts` 在 dev 模式已經會路由到 `MockStore`，不需改其他邏輯。函式簽名和外部介面不變。

### D2：mock-backend landRegistryPullData 回傳真實欄位

`MockStore.landRegistryPullData` 對每個 apiId 回傳對應欄位結構：

| apiId | 回傳欄位 |
|-------|---------|
| land_registry | `{ area: 125.8, purpose: "田", lot_number: "0456-0000" }` |
| zoning | `{ zoning_type: "住宅區", usage_category: "甲種建築用地" }` |
| land_value | `{ announced_value: 58000, assessed_value: 42000 }` |
| mortgages | `[{ creditor: "台灣銀行", amount: 3000000 }]` |
| building_registry | `{ area: 85.5, purpose: "住家用", construction_date: "2015-06-15" }` |
| building_ownership | `{ certificate_no: "北松字第012345號", ownership_date: "2015-08-20" }` |

### D3：mock-backend 新增 queryRealPrice handler

在 `MockStore` 新增 `queryRealPrice` 方法，回傳 2-3 筆含 `unit_price`、`total_price`、`area`、`address`、`date` 的紀錄。同時把 `safe-invoke.ts` 的重複 mock handler 移除，統一走 `mock-backend.ts`。

### D4：PullParcelDataButton 移除 debug JSON

移除「已儲存資料」（第 224-231 行區塊）和「結果預覽」（第 265-278 行區塊）的 `JSON.stringify` 渲染。替代方案：成功時顯示簡潔文字摘要（如「已取得 3 項地政資料，可在預覽頁查看」）。「確認儲存」按鈕保留，移到成功摘要區塊內。

### D5：Step 2 地號/建號回填

`CaseWizardStep2` 在 API 回傳後，從 `land_registry_data.land_registry.data.lot_number` 取值填入地號欄位。此邏輯在 `handlePullComplete` 回呼中處理，更新 `landLotNo` state。

### D6：Cover JSON.stringify 移除

三個主題的 Cover 元件移除 `{JSON.stringify(caseData)}` 的 `<pre>` 區塊，改為不渲染任何 caseData dump。封面只保留案件編號、地址、公司名稱等結構化欄位。

## Implementation Contract

**Behavior**：dev 模式下走 wizard Step 1 → 2 → 3 → 4，PDF 預覽的「一、標示及權利範圍」頁面顯示地積 125.8、地目「田」、使用分區「住宅區」等 mock 值。第 9 頁顯示近期成交均價（由 mock 紀錄算出）。Step 2 不再出現 raw JSON。

**Interface / data shape**：
- `MockStore.landRegistryPullData` 回傳格式不變（`{ results, total_cost }`），只改 `results[apiId].data` 的內容物
- `assembleDossierData` 的 import 路徑從 `@tauri-apps/api/core` 改為 `@/lib/tauri-bridge`，函式簽名不變
- `PullParcelDataButton` 移除 `persistedData` 和 `previewData` 的 JSON 渲染區塊

**Failure modes**：
- assembleDossierData 的所有 IPC 呼叫仍有 try-catch，mock 失敗 → 欄位降級為 undefined → PDF 顯示「待補」
- mockInvoke 找不到 handler → 拋 NotInTauriError → 被 catch → 不崩潰

**Acceptance criteria**：
- Step 4 PDF 第 3 頁至少 3 個欄位顯示非「待補」的 mock 值
- Step 4 PDF 第 9 頁「近期成交均價」顯示數值
- Step 2 無 raw JSON 顯示
- PDF 封面無 JSON dump
- `npm run build` 通過
- 現有 assemble-dossier-data.test.ts 測試通過
