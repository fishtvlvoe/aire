## Context

Wizard 四步流程（基本資料 → 地政資料 → 實價登錄 → 預覽匯出）是 AIRE 的核心使用路徑。Step 4 預覽匯出目前只有匯出按鈕，沒有接入 `PdfPreviewer` 元件。`PdfPreviewer` 在獨立頁面 `/cases/[id]/preview` 已正常運作，但該元件頂層直接 import `@tauri-apps/api/core` 和 `@tauri-apps/plugin-dialog`，在瀏覽器 dev 模式下（無 Tauri runtime）會 import 失敗。

步驟圓圈（①②③④）目前是純顯示，不可點擊。最後一步「下一步」按鈕雖然 disabled 但仍然渲染。

## Goals / Non-Goals

**Goals:**

- Step 4 內嵌 PDF 預覽 iframe + 下載按鈕
- `PdfPreviewer` 的 Tauri 依賴改為延遲載入（dynamic import），瀏覽器 dev 模式正常運作
- Step 4 隱藏「下一步」按鈕
- 步驟圓圈可點擊跳轉到已完成的步驟

**Non-Goals:**

- 不改 PDF 內容結構（封面/章節/欄位）
- 不處理 Step 3 實價登錄
- 不擴充補件表單欄位

## Decisions

### D1：PdfPreviewer Tauri import 改延遲載入

現有 `PdfPreviewer.tsx` 頂層有兩個 Tauri import：
- `import { invoke } from "@tauri-apps/api/core"`
- `import { save as saveDialog } from "@tauri-apps/plugin-dialog"`

這兩個只在 `handleDownload` 的 `inTauri` 分支使用。改法：移除頂層 import，在 `handleDownload` 函式內用 `const { invoke } = await import("@tauri-apps/api/core")` 延遲載入。這與 `src/lib/tauri-bridge.ts` 已有的模式一致。

### D2：Step 4 接入 PdfPreviewer

`CaseWizardStep4` 接收 `caseId` prop。需要額外呼叫 `assembleDossierData()` 把 `CaseRow` 轉成 `CaseDossierData` 再傳給 `PdfPreviewer`。參考 `/cases/[id]/preview/page.tsx` 已有的轉換邏輯。

CaseWizard 已持有 `caseData: CaseRow`，直接傳入 Step 4 即可，Step 4 內部呼叫 `assembleDossierData(caseData)` 取得 `CaseDossierData`。

### D3：步驟圓圈可點擊

CaseWizard 的步驟指示器從純 `<div>` 改為可點擊元素。規則：
- 已完成的步驟（`step < currentStep`）：可點擊，點擊後跳轉
- 當前步驟：不可點擊（已在此步）
- 未到達的步驟（`step > currentStep`）：不可點擊（灰色）

### D4：Step 4 隱藏「下一步」

`currentStep === 4` 時，「下一步」按鈕不渲染（不是 disabled，是完全不顯示）。

## Implementation Contract

### 行為契約

1. 使用者走到 Step 4 時，看到 PDF 預覽（iframe）+ 下載按鈕 + 匯出按鈕
2. 在瀏覽器 dev 模式（無 Tauri）下，`PdfPreviewer` 正常渲染預覽，下載用瀏覽器原生 `<a>` download
3. 步驟圓圈：點擊已完成步驟的數字可跳轉；未到達步驟不可點
4. Step 4 畫面不顯示「下一步」按鈕

### 驗證方式

- 瀏覽器 dev 模式跑 `npm run dev`，新建案件走完 4 步，Step 4 出現 PDF 預覽
- Console 無 Tauri import 錯誤
- 點擊步驟 ① 可跳回基本資料
- Step 4 畫面無「下一步」按鈕
