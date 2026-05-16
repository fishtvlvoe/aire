## 1. PdfPreviewer 延遲載入修正

- [x] 1.1 修改 `src/components/PdfPreviewer.tsx`：移除頂層 `import { invoke } from "@tauri-apps/api/core"` 和 `import { save as saveDialog } from "@tauri-apps/plugin-dialog"`，改為在 `handleDownload` 函式內使用 `const { invoke } = await import("@tauri-apps/api/core")` 和 `const { save: saveDialog } = await import("@tauri-apps/plugin-dialog")` 延遲載入。同時移除頂層 `import "@testing-library/jest-dom/vitest"`（不屬於 runtime code）。對應 spec requirement: Browser dev mode compatibility / design decision D1 [Tool: Copilot]

## 2. Step 4 接入 PDF 預覽

- [x] 2.1 修改 `src/components/case-wizard/CaseWizardStep4.tsx`：新增 `caseData: CaseRow` prop，呼叫 `assembleDossierData(caseData)` 取得 `CaseDossierData`，傳入 `PdfPreviewer` 元件渲染預覽。保留現有匯出按鈕，預覽在上方、匯出/下載按鈕在下方。對應 spec requirement: Step 4 displays PDF preview / design decision D2 [Tool: Copilot]
- [x] 2.2 修改 `src/components/case-wizard/CaseWizard.tsx` 的 `renderStepContent()` 函式：將 `caseData` prop 傳遞給 `CaseWizardStep4`（目前只傳 `caseId`）。對應 design decision D2 [Tool: Copilot]

## 3. Wizard 導航改善

- [x] [P] 3.1 修改 `src/components/case-wizard/CaseWizard.tsx` 的步驟指示器：將步驟數字圓圈從純 `<div>` 改為可點擊元素（已完成步驟 `step < currentStep` 加 `onClick` + `cursor-pointer`；未到達步驟保持灰色不可點；當前步驟顯示綠色但不可點）。對應 spec requirement: Step indicator navigation / design decision D3 [Tool: Copilot]
- [x] [P] 3.2 修改 `src/components/case-wizard/CaseWizard.tsx` 的導航按鈕區域：`currentStep === 4` 時不渲染「下一步」按鈕（用條件判斷移除，不是 disabled）。對應 spec requirement: Hide next button on final step / design decision D4 [Tool: Copilot]

## 4. 驗證

- [x] 4.1 執行 `npm run build` 確認編譯通過，無 TypeScript 錯誤 [Tool: Copilot]
- [x] 4.2 瀏覽器 dev 模式手動驗證：新建案件 → 走完 Step 1~4 → Step 4 出現 PDF 預覽 iframe → console 無 Tauri import 錯誤 → 步驟圓圈可點擊跳回 → Step 4 無「下一步」按鈕 [Tool: 主對話]
