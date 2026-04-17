## Why

客戶（建安不動產）現場簽委託時，必須當場交付完整的「不動產說明書」（16 章 A4 PDF），這是內政部規定的法定文件。目前系統產出的 `disclosure_document` 欄位只含純文字佔位符，無法生成符合格式要求的 PDF，是現場交件的直接阻礙。

## What Changes

- 新增 AI prompt，依 `field_visit_data`、`supplementary_data`、`pre_commission_data` 生成 16 章 Markdown，每章名稱固定（供 parser 使用）
- 新增 HTML/CSS 模板，將 16 章 Markdown 轉成 A4 版面（頁眉/頁腳/表格/LOGO）
- 修改 `/api/listings/[id]/pdf` route，改用新 HTML 模板，支援建物版（7 類）與土地版（6 類）
- 修改 `generateDocuments` 邏輯，將 `disclosure_document` 的 AI prompt 從佔位符替換為真正的 16 章生成 prompt
- 稅費計算（系統計算欄位）在此版本標為 `待補`，不由 AI 計算

## Non-Goals

- 稅費自動計算（`system_computed`：土地增值稅、地價稅、契稅、房屋稅）—— 另開 change
- 照片縮圖嵌入 PDF（章節 15）—— 另開 change
- 電子簽章（章節 16）—— 另開 change
- 實價登錄外部資料串接（章節 13）—— 另開 change

## Capabilities

### New Capabilities

- `disclosure-document-generation`: 依物件類型（建物版/土地版）產生 16 章 Markdown 格式的不動產說明書，供 PDF 轉換使用

### Modified Capabilities

- `property-dossier`: 修改 `disclosure_document` 的 AI 生成 prompt，從佔位符改為真正的 16 章結構化 prompt；修改 PDF 路由使用新 HTML 模板

## Impact

- 新增規格：`disclosure-document-generation`
- 修改的程式碼：
  - `src/app/api/listings/[id]/pdf/route.ts` — 新增 16 章 HTML 模板
  - `src/lib/llm/generateDocuments.ts`（或對應的文件生成邏輯）— 替換 `disclosure_document` prompt
  - `src/lib/templates/disclosure-html.ts`（新增）— HTML/CSS A4 模板
