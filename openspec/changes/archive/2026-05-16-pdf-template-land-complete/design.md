## Context

AIRE 的土地版 PDF 目前由 `src/lib/pdf-engine/document.tsx` 的 `LandPages` 函式產生 7 頁：封面、法規告知、土地標示、所有權及他項權利、基地現況、稅費、成交行情。章節命名和欄位佈局與內政部 105 年函頒「土地不動產說明書格式範例」差距大，缺整段且現有段落欄位不完整。

**現有元件架構**：
- `react-pdf-components.tsx` 提供共用元件：`PdfCover`、`PdfPageHeader`、`PdfPageFooter`、`PdfSection`、`PdfFieldTable`（含 `PENDING = "待補"` 自動填充邏輯）
- `document.tsx` 的 `LandPages` 組裝各頁（封面 + 內容頁）
- `CaseDossierData` interface 定義所有資料欄位
- `assemble.ts` 的 `assembleDossierData()` 將 CaseRow 轉為 CaseDossierData
- `mock-backend.ts` 提供測試資料

**政府格式七大段**：一（標示及權利範圍）、二（所有權人）、三（權利種類及登記狀態）、四（目前管理與使用情況）、五（使用管制內容）、六（重要交易條件）、七（其他重要事項）＋簽章欄。

## Goals / Non-Goals

**Goals:**

- 將 `LandPages` 章節結構對齊政府格式七大段 + 簽章欄
- 所有政府格式要求的欄位在 PDF 都有對應位置
- 未填入的欄位自動顯示「待補」（複用現有 PdfFieldTable 的 PENDING 邏輯）
- 擴充 `CaseDossierData` 加入新段落所需的 optional 欄位

**Non-Goals:**

- 不改建物版 `BuildingPages`（另開 change）
- 不改五個主題的 Cover/Header/Footer 元件外觀
- 不改 `PdfFieldTable` 元件介面
- 不做表單 UI（wizard/補件表單的欄位擴充另開 change）
- 不做 API 串接

## Decisions

### D1：章節對應關係

| 政府段落 | PDF 頁面標題 | 現有狀態 | 處理方式 |
|---------|------------|---------|---------|
| 一、標示及權利範圍 | 一、標示及權利範圍 | 現「二、產權調查表—土地標示」部分涵蓋 | 改標題 + 補欄位（權利範圍、持分比例、面積等） |
| 二、所有權人及其基本資料 | 二、所有權人及其基本資料 | 現「三、產權調查表—所有權及他項權利」部分涵蓋 | 拆分：所有權人獨立一段，他項權利移到第三段 |
| 三、權利種類及登記狀態 | 三、權利種類及登記狀態 | **缺** | 新增：限制登記、他項權利明細、信託、預告登記 |
| 四、目前管理與使用情況 | 四、目前管理與使用情況 | **缺** | 新增：出租/占用/分管/既成道路/其他使用狀況 |
| 五、使用管制內容 | 五、使用管制內容 | **缺** | 新增：都市計畫/非都市/容積率/建蔽率/特定區域 |
| 六、重要交易條件 | 六、重要交易條件 | 現「五、稅費╱規費」+ 部分「六、成交行情」 | 改寫：交易總價、付款方式、稅費負擔、解約條款 |
| 七、其他重要事項 | 七、其他重要事項 | **缺** | 新增：環境影響、鄰近設施、重大事故、周遭行情 |
| 簽章欄 | 簽章欄 | **缺** | 新增：經紀業/經紀人/買方/賣方四欄 |

### D2：頁面數量

原 7 頁 → 改為 9 頁：封面 (1) + 法規告知 (1) + 七大段各 1 頁 (7) = 9 頁。第六段「重要交易條件」欄位較多可能需跨頁，但先控制在 1 頁內，字體縮小或欄位壓縮處理。加簽章欄放在第七段之後（同頁或獨立頁），若第七段欄位少則合併同頁，否則獨立第 10 頁。初始實作以 10 頁（含獨立簽章頁）為準，後續根據實際版面微調。

### D3：新增共用元件 — PdfSignatureBlock

在 `react-pdf-components.tsx` 新增 `PdfSignatureBlock` 元件，接收 `tokens: PdfTokens` 參數，渲染四欄簽名區塊（經紀業 / 經紀人 / 買方 / 賣方），每欄含簽名線和職稱文字。此元件為純展示，不接收資料。

### D4：CaseDossierData 擴充策略

所有新欄位皆為 `optional`（加 `?`），不破壞現有程式碼。欄位命名用 camelCase，前綴區分段落：
- 第三段：`restrictionRegistration`、`trustRegistration`、`cautionRegistration`、`otherRightsDetail` 等
- 第四段：`currentRentalStatus`、`currentOccupation`、`sharedManagement`、`existingRoad` 等
- 第五段：`urbanPlanZone`、`nonUrbanLandCategory`、`floorAreaRatio`、`buildingCoverageRatio`、`specialDesignatedArea` 等
- 第六段：`transactionTotalPrice`、`paymentMethod`、`taxBurdenAgreement`、`penaltyClause` 等
- 第七段：`environmentalImpact`、`majorIncident`、`nearbyPublicFacilities`、`surroundingTransactionPrice` 等

### D5：mock-backend 測試資料

`assembleDossierData()` 對新欄位不特別處理（CaseRow 沒有這些欄位，optional 就是 undefined → PdfFieldTable 自動顯示「待補」）。`mock-backend.ts` 中補充少量範例值供開發預覽用。

### D6：不動 LegalPage

現有「法規告知」頁保留為第 2 頁，內容不變。政府格式中法規告知不是七大段之一，是獨立附件。

## Implementation Contract

**Behavior**：使用者在 Step 4 預覽或匯出土地版 PDF 時，看到 10 頁文件：封面 → 法規告知 → 一～七段 → 簽章欄。所有欄位有值顯示值，無值顯示灰色「待補」文字。

**Interface / data shape**：

`CaseDossierData` 新增欄位（全部 optional string 或 number，詳見 spec）：
- 第三段群組：`restrictionRegistration?: string`、`trustRegistration?: string`、`cautionRegistration?: string`、`otherRightsDetail?: string`
- 第四段群組：`currentRentalStatus?: string`、`currentOccupation?: string`、`sharedManagement?: string`、`existingRoad?: string`、`otherUsageStatus?: string`
- 第五段群組：`urbanPlanZone?: string`、`nonUrbanLandCategory?: string`、`floorAreaRatio?: string`、`buildingCoverageRatio?: string`、`specialDesignatedArea?: string`
- 第六段群組：`transactionTotalPrice?: string`、`paymentMethod?: string`、`taxBurdenAgreement?: string`、`penaltyClause?: string`
- 第七段群組：`environmentalImpact?: string`、`majorIncident?: string`、`nearbyPublicFacilities?: string`、`surroundingTransactionPrice?: string`

`PdfSignatureBlock` 元件：`(props: { tokens: PdfTokens }) => React.ReactElement`，四欄橫排，每欄含「職稱 + 簽名線 + 日期線」。

`LandPages` 的 `totalPages` 從 7 改為 10。

**Failure modes**：
- CaseDossierData 所有新欄位為 optional，缺值 → PdfFieldTable 顯示「待補」，不拋錯
- 頁面溢出（單頁欄位太多）→ react-pdf 自動換頁，不會截斷

**Acceptance criteria**：
- 土地版 PDF 產出 10 頁，章節標題依序為封面 / 法規告知 / 一～七 / 簽章欄
- 每段的欄位名稱與政府格式對齊
- 未填入欄位顯示灰色「待補」
- `PdfSignatureBlock` 渲染經紀業、經紀人、買方、賣方四欄
- 建物版 `BuildingPages` 不受影響（無變更）
- `npm run build` 通過、無 TypeScript 錯誤
