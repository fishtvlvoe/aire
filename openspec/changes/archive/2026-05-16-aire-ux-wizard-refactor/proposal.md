## Why

AIRE v0.1.0 第一輪測試發現 12 項 UX / 資料流問題（I-001 ~ I-016），核心痛點：案件詳情頁把所有功能塞在一頁、地政查詢資料只存 React state 不存 DB、PDF 匯出時重新呼叫 API 導致結果不一致、列表操作只有「查看」文字連結。這些問題讓用戶不知道操作順序、資料會丟失、匯出結果不可靠。

## What Changes

- **修改** 案件詳情頁從單頁改為 Wizard 向導式流程（Step 1 填資料 → Step 2 拉謄本 → Step 3 實價登錄(付費) → Step 4 預覽/匯出）
- **修改** 地政資料管線：查詢結果存入 DB（`cases` 表新增 `land_registry_data` 欄位），PDF 匯出讀 DB 而非重新呼叫 API
- **移除** 案件類型 dropdown，只保留 tab 切換（成屋資訊 / 土地資訊）
- **修改** 欄位命名統一：「屋主姓名」「物件名稱 / 屋主」統一為「所有權人」（法律正式用語）
- **修改** 案件列表欄位：「物件名稱」改為合併顯示（主行地址、副行所有權人）+ 新增可自訂案件名稱欄位
- **修改** 案件列表操作欄：從「查看」文字連結改為 5 個純 SVG 圖示按鈕（補件/查看/修改/刪除/下載），hover 顯示 tooltip
- **新增** 整列可點擊進入查看（操作按鈕區 stopPropagation）
- **新增** 刪除案件確認對話框
- **修改** 成屋案件地號/建號由 Wizard Step 2 拉謄本後自動帶入，不需用戶手動填
- **修改** 「其他備注事項」→「其他備註事項」（正體中文修正）
- **修改** 「查實價登錄」按鈕移入 Wizard Step 3（不再獨立於地政查詢卡片外）
- **新增**「補件」功能 = 上傳附件 + 補填欄位資料

## Non-Goals

- 不處理忘記密碼功能（I-012，尚無網域）
- 不處理設定頁 / sidebar 重構（另開 `aire-settings-polish` change）
- 不處理日誌頁 mock 資料、品牌設定主題（另開 change）
- 不處理 Electron/Tauri 桌面版功能
- 不重新設計 PDF 模板本身，只修正資料來源

## Capabilities

### New Capabilities

- `case-wizard-flow`: 案件詳情 Wizard 向導式流程（4 步驟切換、步驟狀態追蹤、條件式步驟顯示）
- `case-list-actions`: 案件列表操作欄重設計（5 個 SVG 圖示按鈕、整列可點擊、刪除確認框）
- `case-supplement`: 補件功能（上傳附件 + 補填缺少欄位資料）

### Modified Capabilities

- `case-management`: 欄位命名統一為「所有權人」、新增可自訂案件名稱、列表欄位合併顯示、`cases` 表新增 `land_registry_data` 欄位
- `disclosure-form-residential`: 移除案件類型 dropdown、地號/建號由拉謄本自動帶入、「備注」→「備註」
- `land-registry-parcel-apis`: 查詢結果持久化到 DB，PDF 匯出讀 DB 不重新呼叫 API

## Impact

- Affected specs: `case-management`, `disclosure-form-residential`, `land-registry-parcel-apis`（修改）；`case-wizard-flow`, `case-list-actions`, `case-supplement`（新增）
- Affected code:
  - New: `src/components/CaseWizard.tsx`, `src/components/CaseWizardStep1.tsx`, `src/components/CaseWizardStep2.tsx`, `src/components/CaseWizardStep3.tsx`, `src/components/CaseWizardStep4.tsx`, `src/components/CaseListActions.tsx`, `src/components/DeleteConfirmDialog.tsx`, `src/components/CaseSupplementDialog.tsx`
  - Modified: `src/app/(dashboard)/cases/[id]/page.tsx`, `src/app/(dashboard)/cases/page.tsx`, `src/app/(dashboard)/cases/new/page.tsx`, `src/components/PullParcelDataButton.tsx`, `src/components/disclosure-form-residential.tsx`, `src/components/disclosure-form-land.tsx`, `src/lib/mock-backend.ts`, `src/lib/cases-api.ts`, `src/lib/pdf-engine/assemble-dossier-data.ts`
  - Removed: 無（重構現有元件，不刪檔案）
- Dependencies 新增: 無
- 環境變數新增: 無
