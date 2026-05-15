## Why

目前 PDF 預覽只輸出 5 行純文字（案件編號/地址/屋主），完全不符合不動產說明書的法規格式要求。3 個設計主題（theme-a/b/c）已有設計 token 但元件是 HTML div，無法在 `@react-pdf/renderer` 內使用。Fish 在 SDD 已定義完整的章節結構（`docs/dossier-chapter-structure.md` + `docs/dossier-implementation-spec.md`），本次把規格接上實作。

## What Changes

- 新增 React-PDF 基底元件（View/Text 版本的 Cover、PageHeader、PageFooter、Section、FieldTable）
- 將 theme-a/b/c 的 token 接入 React-PDF 元件，主題切換改變色彩/字型，不改變章節結構
- 實作土地版 7 章節（封面、法規告知、產權調查表－土地標示、產權調查表－權利/他項權利、基地/土地現況調查表、稅費/規費、成交行情/周遭設施）
- 修改 `document.tsx` 從 stub 改為接收 `CaseData` 並輸出對應版別（property_type = 'land'）的完整頁面
- 修改 `engine.ts` 改用 `PdfDocument` 取代目前的 inline 單頁 render
- 修改 preview/page.tsx 傳入完整 `CaseData`（從 SQLite CaseRow 組裝）
- 缺值一律顯示「待補」，不臆測

## Non-Goals

- 建物版（成屋）16 章節 — 獨立 change
- 稅費自動計算（目前欄位顯示「待補」）
- AI 摘要欄位（章節 3 物件摘要文字）
- PDF 加密/AcroForm 填寫欄位
- 主題 B、C 的視覺差異（token 接入，但 Phase 1 以 theme-a 為主測試）

## Capabilities

### New Capabilities

- `dossier-react-pdf-components`: React-PDF 基底元件庫（Cover、PageHeader、PageFooter、Section、FieldTable），消費主題 token，供所有主題共用
- `dossier-land-document`: 土地版 7 章節文件組裝，從 CaseRow 填入資料，缺值標「待補」

### Modified Capabilities

- `react-pdf-render-engine`: engine.ts 改用 PdfDocument（有 theme/caseData），取代 inline 單頁 Text render

## Impact

- Affected specs: dossier-react-pdf-components（新）、dossier-land-document（新）、react-pdf-render-engine（修改）
- Affected code:
  - New: `src/lib/pdf-engine/react-pdf-components.tsx`
  - Modified: `src/lib/pdf-engine/document.tsx`
  - Modified: `src/lib/pdf-engine/engine.ts`
  - Modified: `src/app/(dashboard)/cases/[id]/preview/page.tsx`
