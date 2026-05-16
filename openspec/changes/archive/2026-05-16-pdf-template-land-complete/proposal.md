## Why

現行土地版 PDF 只有 7 頁 6 章節（封面、法規告知、土地標示、所有權及他項權利、基地現況、稅費、成交行情），與內政部 105 年函頒「土地不動產說明書格式範例」差距甚大。政府格式要求一（標示及權利範圍）、二（所有權人及其基本資料）、三（權利種類及登記狀態）、四（目前管理與使用情況）、五（使用管制內容）、六（重要交易條件）、七（其他重要事項）共七大段加簽章欄，目前缺三、四、五整段，六和七內容不完整，也沒有簽章欄。不動產說明書缺漏任何法定欄位，仲介公司會被罰款，這是產品上線的阻擋項。

## What Changes

- 新增第三段「權利種類及登記狀態」PDF 頁面（限制登記、他項權利明細、信託登記、預告登記等欄位）
- 新增第四段「目前管理與使用情況」PDF 頁面（出租、占用、共有分管、既成道路等欄位）
- 新增第五段「使用管制內容」PDF 頁面（都市計畫、非都市土地使用管制、容積率、建蔽率、特定區域等欄位）
- 修改第六段「重要交易條件」，從現行「成交行情╱周遭設施」改為政府格式（交易價金、付款方式、稅費負擔、違約處理等欄位）
- 修改第七段「其他重要事項」，從目前缺失狀態補齊（環境影響、重大事故、鄰近公共設施等欄位）
- 新增「簽章欄」PDF 區塊（經紀業、經紀人、買方、賣方簽名欄位）
- 擴充 `CaseDossierData` interface 加入對應新段落所需的 optional 欄位
- 所有未填入的欄位顯示「待補」placeholder 文字

## Non-Goals

- 不做成屋版（建物版）PDF 模板擴充（後續另開 change）
- 不做表單 UI 擴充（wizard/補件表單的欄位擴充是另一個 change）
- 不做真實 API 串接（只定義資料結構，資料來源為 CaseDossierData）
- 不改 PDF 主題系統架構（五個主題的 Cover/Header/Footer/Section/Table 元件不動）
- 不改 react-pdf-components.tsx 的共用元件介面（只新增內容頁面）

## Capabilities

### New Capabilities

- `land-disclosure-section-three`: 土地版第三段「權利種類及登記狀態」PDF 頁面的欄位定義與渲染規格
- `land-disclosure-section-four`: 土地版第四段「目前管理與使用情況」PDF 頁面的欄位定義與渲染規格
- `land-disclosure-section-five`: 土地版第五段「使用管制內容」PDF 頁面的欄位定義與渲染規格
- `land-disclosure-signature-block`: 土地版簽章欄（經紀業、經紀人、買方、賣方）的 PDF 渲染規格

### Modified Capabilities

- `dossier-land-document`: 擴充 CaseDossierData 欄位、調整 LandPages 章節結構（第六段改為「重要交易條件」、第七段改為「其他重要事項」、加簽章欄頁、總頁數調整）

## Impact

- Affected specs: `dossier-land-document`（delta）、`land-disclosure-section-three`（新）、`land-disclosure-section-four`（新）、`land-disclosure-section-five`（新）、`land-disclosure-signature-block`（新）
- Affected code:
  - Modified: `src/lib/pdf-engine/document.tsx`（LandPages 函式，新增頁面、改寫第六七段、加簽章頁）
  - Modified: `src/lib/pdf-engine/react-pdf-components.tsx`（可能新增 PdfSignatureBlock 共用元件）
  - Modified: `src/lib/pdf-engine/assemble.ts`（assembleDossierData 補新欄位的預設值）
  - Modified: `src/lib/mock-backend.ts`（mockCaseDossierData 補充新欄位的測試資料）
- Dependencies 新增: 無
- 環境變數新增: 無
