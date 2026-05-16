## Why

Wizard 第 4 步「預覽匯出」目前只顯示一顆匯出按鈕，沒有 PDF 預覽畫面；步驟圓圈（①②③④）不能點擊跳轉；最後一步仍顯示灰色「下一步」按鈕。使用者無法在 Wizard 內確認 PDF 外觀就直接匯出，且導航體驗不完整。

## What Changes

- 修改 `CaseWizardStep4` 元件，接入現有的 `PdfPreviewer` 顯示 PDF 即時預覽
- 修改 `PdfPreviewer` 將頂層 `@tauri-apps/api/core` 和 `@tauri-apps/plugin-dialog` 改為延遲載入，確保瀏覽器 dev 模式不報錯
- 修改 `CaseWizard` 導航邏輯：Step 4 時隱藏「下一步」按鈕
- 修改 `CaseWizard` 步驟指示器：已走過的步驟圓圈可點擊跳轉

## Non-Goals

- 不改動 PDF 內容頁面結構（封面、各章節欄位）
- 不處理 Step 3 實價登錄功能
- 不擴充補件（Supplement）表單欄位
- 不新增 spec — 所有改動都是既有能力的修正

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `case-wizard-flow`: 步驟圓圈新增點擊跳轉行為，最後一步隱藏下一步按鈕
- `pdf-live-preview`: 預覽元件移除頂層 Tauri import，改為延遲載入以相容瀏覽器 dev 模式

## Impact

- Affected specs: `case-wizard-flow`、`pdf-live-preview`
- Affected code:
  - Modified: `src/components/case-wizard/CaseWizardStep4.tsx`、`src/components/case-wizard/CaseWizard.tsx`、`src/components/PdfPreviewer.tsx`
- Dependencies 新增：無
- 環境變數新增：無
