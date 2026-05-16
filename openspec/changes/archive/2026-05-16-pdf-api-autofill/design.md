## Context

AIRE 後端已有完整的地政 API 串接（`land_registry_pull_data` IPC）及實價登錄（`query_real_price`）、法規條文（`get_legal_clause_ipc`）。PDF 產出使用 `@react-pdf/renderer`，`CaseDossierData` 介面定義於 `src/lib/pdf-engine/document.tsx`，由預覽頁傳入 `PdfDocument` 元件渲染。

目前問題：`CaseDossierData` 只有封面資料（caseNo、address、ownerName 等），頁 2-7 所有欄位寫死為空字串。建物版顯示「建置中」placeholder，完全無法使用。

`land_registry_pull_data(parcel_id, api_ids)` 回傳 `PullResult { results: HashMap<api_id, ApiResult>, total_cost }`，每個 `ApiResult.data` 是 `serde_json::Value`（已序列化為 JSON，JS 端解析為物件）。

## Goals / Non-Goals

**Goals:**
- 擴充 `CaseDossierData` 接受地政 API 所有可用欄位
- 建立 `assemble-dossier-data.ts` 作為資料組裝層，隔離 IPC 呼叫邏輯
- 土地版頁 3-7 顯示真實 API 資料
- 建物版從 placeholder 改為完整 7 頁
- 法規告知條文改為動態（IPC）
- 使用分區/水土保持/建築線根據 zoning_type 靜態 lookup

**Non-Goals:**
- 不修改 Tauri Rust 後端
- 不做快取（每次預覽重新呼叫 IPC）
- 不實作手填欄位（承辦人、交易條件）
- 建物版管委會欄位留空（無對應 API）

## Decisions

### 擴充 CaseDossierData 使用 optional 欄位

所有 API 資料欄位設為 optional（`?:`），原因：
1. 地政 API 可能因 consent 未給或 API key 未設定而失敗，PDF 仍需可產出
2. 不同 propertyType 使用不同欄位子集，不需交叉存在
3. 空值顯示為空行，與現有行為一致

替代方案：分拆為 `LandDossierData` 和 `BuildingDossierData`。拒絕原因：`PdfDocument` 已接受 `data: CaseDossierData`，分拆會破壞 engine.ts 介面。

### 建立獨立 assemble-dossier-data.ts

把 IPC 呼叫和資料映射集中在一個模組，預覽頁保持簡潔。好處：可獨立測試組裝邏輯（mock invoke）；未來快取可插入此層而不動 UI。

函式簽名：
```typescript
export async function assembleDossierData(
  caseRow: CaseRow,
  themeId: string
): Promise<CaseDossierData>
```

內部流程（土地版）：
1. `invoke("land_registry_pull_data", { parcelId: caseRow.land_lot_no, apiIds: ["land_registry","zoning","land_value","mortgages"] })`
2. `invoke("query_real_price", { district: extractDistrict(caseRow.address), keyword: caseRow.land_lot_no, limit: 5 })`
3. `invoke("get_legal_clause")` — 取所有條文
4. 映射至 CaseDossierData 欄位

內部流程（建物版）：
1. `invoke("land_registry_pull_data", { parcelId: caseRow.land_lot_no, apiIds: ["building_registry","building_ownership","mortgages"] })`
2. `invoke("query_real_price", { district: extractDistrict(caseRow.address), keyword: caseRow.address, limit: 5 })`
3. `invoke("get_legal_clause")`

### 使用分區 → 法規限制 lookup table

使用分區（zoning_type）為行政法規明文，對應限制為靜態。在 `assemble-dossier-data.ts` 內維護：

```typescript
const ZONING_RESTRICTIONS: Record<string, { soilConservation: string; buildingLine: string }> = {
  "農業區": { soilConservation: "受水土保持法規範，申請開發須送審", buildingLine: "依農業用地相關規定辦理" },
  "保護區": { soilConservation: "禁止開發，限自用農舍", buildingLine: "不得申請建築線指定" },
  "住宅區": { soilConservation: "無特別限制", buildingLine: "依都市計畫法申請建築線" },
  // ... 其他分區
}
```

找不到對應分區時顯示「依主管機關規定辦理」。

### 建物版 7 頁結構

頁碼對應：
- 頁 1：封面（同土地版）
- 頁 2：法規告知（同土地版動態條文）
- 頁 3：建物標示（building_registry：面積、用途、建造日期）
- 頁 4：所有權/他項權利（building_ownership + mortgages）
- 頁 5：建物現況調查（全空格，手填欄）
- 頁 6：管理組織（全空格，管委會欄，標注「請洽管理委員會確認」）
- 頁 7：成交行情（query_real_price）

## Implementation Contract

### 擴充後的 CaseDossierData 介面

```typescript
export interface CaseDossierData {
  // 現有欄位（不變）
  caseNo: string;
  address: string;
  propertyType: "land" | "building";
  landLotNo: string;
  ownerName: string;
  companyName: string;
  generatedAt: string;
  logoBytes?: number[];

  // 新增：地政 API 資料（皆為 optional）
  landArea?: number;           // 土地面積（㎡）
  landPurpose?: string;        // 地目
  zoningType?: string;         // 使用分區
  usageCategory?: string;      // 使用地類別
  soilConservation?: string;   // 水土保持（由 zoning lookup 產生）
  buildingLineNote?: string;   // 建築線指定（由 zoning lookup 產生）
  announcedLandValue?: number; // 公告現值（元/㎡）
  assessedLandValue?: number;  // 評估地價（元/㎡）
  mortgages?: Array<{ creditor: string; amount: number }>; // 他項權利

  // 建物版欄位
  buildingArea?: number;       // 建物面積（㎡）
  buildingPurpose?: string;    // 建物用途
  constructionDate?: string;   // 建造日期
  buildingCertificateNo?: string; // 權狀字號
  buildingOwnershipDate?: string; // 登記日期

  // 共用
  recentSalePricePerSqm?: number;  // 近期成交均價（元/㎡）
  recentSaleCount?: number;        // 近期成交案件數
  legalClauses?: string[];         // 法規告知條文（由 get_legal_clause_ipc 取得）
}
```

### assembleDossierData 行為

- `invoke("land_registry_pull_data")` 任一 API 失敗時，對應欄位設為 `undefined`（不中斷整個組裝）
- `invoke("query_real_price")` 失敗時，成交行情欄位設為 `undefined`
- 法規條文 IPC 失敗時，回退至空陣列（PDF 法規頁顯示空白）
- 函式保證一定回傳 `CaseDossierData`，不拋例外

### PdfDocument 渲染行為

- 有值的欄位：顯示對應內容
- `undefined` 欄位：顯示空字串（同現有行為，保留行/格子位置）
- 建物版：`propertyType === "building"` 渲染建物版 7 頁，不再顯示 placeholder
- 成交均價計算：取 `query_real_price` 回傳陣列的 `unit_price` 欄位平均值

### 接受標準

1. 執行 `npm test src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts`（新建）：mock invoke，驗證欄位映射正確
2. 執行 `npm test src/lib/pdf-engine/__tests__/document.test.tsx`：現有測試全綠（不引入回歸）
3. 在 dev 環境啟動 AIRE，開啟一個 propertyType="land" 案件的 PDF 預覽，頁 3 顯示地號而非空格
4. 開啟一個 propertyType="building" 案件的 PDF 預覽，頁 3 顯示建物面積，不再是「建置中」

## Risks / Trade-offs

- [Risk] `land_registry_pull_data` 需要 consent 及 API key → Mitigation：組裝層捕捉錯誤，欄位降級為 undefined，PDF 仍產出（不中斷預覽）
- [Risk] `query_real_price` 回傳 JSON 結構不穩定（Value 型別）→ Mitigation：用 optional chaining 取 unit_price，失敗時 undefined
- [Risk] 建物版 7 頁加上土地版 7 頁，document.tsx 會變很長 → Mitigation：抽出 `LandPages` 和 `BuildingPages` 兩個子元件，主 PdfDocument 只做 dispatch
