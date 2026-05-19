## Why

`disclosure-form-residential` 與 `disclosure-form-land` 兩個揭露表單元件已實作完成，但從未被任何路由或 Wizard 步驟引用，導致仲介助理無法透過 App 填寫不動產說明書的核心欄位（建物標示、權利範圍、稅費、現況等 30+ 欄位）。現行流程直接從地政資料（Step 2）跳到 PDF 預覽（Step 4），產出的說明書完全空白，無法交件。

## What Changes

- 新增 Wizard Step 3「揭露資料」：成屋案件載入 `disclosure-form-residential`，土地案件載入 `disclosure-form-land`；表單儲存欄位到 SQLite `disclosure_data` JSON 欄位
- 修改 `CaseWizard` 步驟計數從 4 步變 5 步（Step 3 插入，舊 Step 3 實價登錄變 Step 4，舊 Step 4 預覽變 Step 5）
- 修改 `CaseWizardStep3`（實價登錄）重命名為 `CaseWizardStep4`，`CaseWizardStep4`（預覽）重命名為 `CaseWizardStep5`
- 修改 `CaseSupplementDialog`：從 SQLite 讀取案件的揭露表單欄位，計算空值欄位後在「缺少必填欄位」區塊列出並允許直接補填，儲存時回寫 `disclosure_data`
- 修改 Step 5 PDF 預覽：在 PDF 上層疊 overlay input 層，點擊 PDF 欄位座標觸發可編輯文字框，blur 時呼叫 `updateDisclosureField(caseId, fieldKey, value)` 回寫 DB 並觸發 PDF re-render

## Non-Goals

- 地政 API 自動回填欄位（謄本資料回寫揭露表單）
- PDF 主題切換或多版面支援
- 授權驗證流程（已有獨立 spec）
- 揭露表單欄位的批次匯入（CSV/Excel 匯入）
- 多語言版本或英文說明書

## Capabilities

### New Capabilities

- `wizard-disclosure-step`：Wizard 第三步，依案件類型（成屋/土地）渲染對應揭露表單，並將欄位資料持久化到 SQLite

### Modified Capabilities

- `case-wizard-flow`：步驟數從 4 增為 5，Step 3 插入揭露資料，原 Step 3/4 順延
- `disclosure-form-residential`：從孤立元件接入 Wizard Step 3（成屋路徑），讀寫 SQLite `disclosure_data`
- `disclosure-form-land`：從孤立元件接入 Wizard Step 3（土地路徑），讀寫 SQLite `disclosure_data`
- `case-supplement`：後補 dialog 新增揭露表單缺漏欄位偵測與補填能力
- `disclosure-inline-edit`：從孤立元件接入 Step 5 PDF overlay，實現點擊欄位 → 編輯 → blur 存回 DB → re-render

## Impact

- Affected specs: wizard-disclosure-step（新建）、case-wizard-flow、disclosure-form-residential、disclosure-form-land、case-supplement、disclosure-inline-edit
- Affected code:
  - New: `src/components/case-wizard/CaseWizardStep3Disclosure.tsx`
  - Modified: `src/components/case-wizard/CaseWizard.tsx`
  - Modified: `src/components/case-wizard/CaseWizardStep1.tsx`
  - Modified: `src/components/case-wizard/CaseWizardStep2.tsx`
  - Modified: `src/components/case-wizard/CaseWizardStep3.tsx`（重命名為 CaseWizardStep4.tsx）
  - Modified: `src/components/case-wizard/CaseWizardStep4.tsx`（重命名為 CaseWizardStep5.tsx）
  - Modified: `src/components/CaseSupplementDialog.tsx`
  - Modified: `src/components/disclosure-form-residential.tsx`
  - Modified: `src/components/disclosure-form-land.tsx`
  - Modified: `src/components/PdfPreviewer.tsx`
  - New: `src-tauri/src/disclosure.rs`（updateDisclosureField Tauri command）
  - Modified: `src-tauri/migrations/`（新增 disclosure_data 欄位 migration，若尚未存在）
