## Why

不動產說明書 PDF 目前有大量「待補」欄位無法在網站填寫，且輸出的 PDF 是靜態文件無法直接編輯；稅費欄位全為空白，業務員必須手動計算後另外填入，流程斷裂。

## What Changes

- 新增：補件表單加入所有缺失欄位（公司名稱、物件名稱、案件編號、承辦人/電話、成交價、房屋現值、附屬建物坪數、公設坪數、使用分區、公告現值、成交條件、周遭機能距離）
- 新增：稅費自動計算模組，輸入成交價與房屋現值後，系統計算契稅、印花稅、登記規費、履保費
- 新增：PDF 輸出改為 AcroForm 可填寫格式，所有仍為空白的欄位自動生成可編輯文字框
- 修改：PDF 封面 header 表格（物件名稱、案件編號、地址、公司名稱）從 DB 帶入
- 修改：移除 LLM 回覆中的「老魚，您好」個人化稱呼，改為通用格式
- 修改：`{{待補}}` 在 PDF 中改為空白底線（AcroForm text field），非紅色文字佔位符

## Capabilities

### New Capabilities

- `supplementary-field-completeness`: 補件表單覆蓋所有說明書所需欄位，包含身份資訊、交易資訊、稅費計算輸入
- `tax-fee-auto-calculation`: 輸入成交價 + 房屋現值，系統自動計算契稅(6%)、印花稅(0.05‰×2)、登記規費(0.1%)、履保費(0.06%)
- `fillable-pdf-output`: 說明書 PDF 輸出為 AcroForm 格式，空白欄位可在 Acrobat/Preview 直接輸入

### Modified Capabilities

- `disclosure-document-generation`: 封面帶入已填欄位、移除個人化稱呼、所有 {{待補}} 改為空白 AcroForm 欄位
- `supplementary-form`: 新增 15 個欄位分組（身份資訊、交易資訊、稅費計算、周遭機能）

## Impact

- Affected specs: supplementary-form, disclosure-document-generation, document-generation
- Affected code:
  - New: src/lib/document-generator/tax-calculator.ts
  - New: src/lib/document-generator/pdf/acroform-overlay.ts
  - Modified: src/lib/document-generator/pdf/dossier-building.ts
  - Modified: src/lib/document-generator/pdf/dossier.ts
  - Modified: src/app/listings/[id]/supplementary/page.tsx
  - Modified: src/lib/schemas/supplementary-schema.ts
  - Modified: src/app/api/listings/[id]/generate/route.ts
