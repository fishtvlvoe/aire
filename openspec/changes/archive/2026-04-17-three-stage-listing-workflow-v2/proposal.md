## Why

建安不動產業務在取得物件委託後，需要針對 13 種物件類型填寫現場勘查資料與秘書後補資料，現行系統僅支援 2 種物件類型（住宅/農地），無法涵蓋實際業務需求。同時，AI 產生文件後需要輸出「物件調查表」作為物件履歷字典，供業務、主管、屋主查閱，目前系統缺乏此功能。

## What Changes

- **BREAKING** 物件類型從 2 種（`residential` / `farmland`）擴充為 13 種，DB schema 與 API 同步更新
- 新增「物件類型選擇」頁面，業務新增物件時先選類型（第一版支援 6 種優先類型）
- 資料填寫頁面重構為三層結構：共通欄位 / 類型專屬欄位 / 秘書後補欄位
- 新增「物件調查表」文件類型：系統將業務填寫資料 + 秘書後補資料整合，由 AI 輸出完整物件履歷 PDF
- 移除「不動產說明書」與「物件調查表（舊版）」出文件產生流程（成交後法律文件，不在此系統範圍）
- 新增 UI 頁面：新增物件選類型頁、AI 產生進度頁（共 5 頁完整流程）
- 表格 UI：物件列表頁新增篩選器（類型/狀態），資料填寫頁採 Tab 分群設計

## Non-Goals

- 不動產說明書（成交後法律文件）不在此系統範圍
- 第一版僅支援 6 種物件類型：農地、透天別墅、公寓、大樓華廈、建地/住宅地、農舍（其餘 7 種架構保留，之後補）
- 物件調查表不需要簽名功能，僅供查閱
- PDF 可填寫式表單（PDF Form）不在此版本範圍，採「系統填寫 → 輸出鎖定版 PDF」模式

## Capabilities

### New Capabilities

- `property-type-registry`: 13 種物件類型定義、欄位 schema、顯示名稱對照表
- `field-visit-form`: 依物件類型動態渲染的現場勘查表單（共通 + 類型專屬欄位）
- `supplementary-form`: 秘書後補表單（建物類共通 + 土地類共通 + 類型專屬欄位）
- `property-dossier`: 物件調查表文件產生器，整合所有資料輸出物件履歷 PDF
- `listing-ui-flow`: 完整 5 頁 UI 流程（列表 → 新增 → 填寫 → 產生中 → 文件輸出）

### Modified Capabilities

- `listing-workflow`: 物件狀態機新增 `type-selected` 狀態，支援 13 種類型路由

## Impact

- 受影響的程式碼：
  - `src/lib/db/schema.ts` — property_type enum 擴充
  - `src/lib/db/index.ts` — CRUD 函數更新
  - `src/lib/document-generator/types.ts` — GeneratedDocuments 新增 property_dossier
  - `src/lib/document-generator/codex-provider.ts` — 新增物件調查表 prompt
  - `src/app/api/listings/` — API routes 更新支援新類型
  - `src/app/` — 5 頁 Next.js UI 頁面（全新建立）
  - `openspec/specs/` — 新增 5 個 spec
