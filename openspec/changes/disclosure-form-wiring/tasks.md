## 1. 前置準備：Schema 工具函式與 PDF 座標表

- [x] [P] 1.1 在 `src/lib/disclosure-schema-residential.ts` 匯出 `getRequiredFields("residential"): RequiredField[]`，回傳所有 required 欄位的 `{ key, label, fieldType }` 陣列；在 `src/lib/disclosure-schema-land.ts` 匯出 `getRequiredFields("land"): RequiredField[]`；兩者共用 `type RequiredField = { key: string; label: string; fieldType: "text" | "number" | "boolean" }`。驗收：`getRequiredFields("residential").length > 0` 且每筆含 `key`, `label`, `fieldType` 三個欄位
- [x] [P] 1.2 新建 `src/lib/pdf-field-coords.ts`，匯出 `PDF_FIELD_COORDS: Record<string, { page: number; x: number; y: number; w: number; h: number }>`，包含封面頁三個欄位的座標：`agent_name`（承辦人）、`broker_name`（經紀人）、`property_name`（物件名稱）。座標以 99% zoom（scale=0.99）的像素值標定。驗收：`Object.keys(PDF_FIELD_COORDS)` 包含 `agent_name`, `broker_name`, `property_name`

## 2. Wizard 步驟重組

- [x] 2.1 將 `src/components/case-wizard/CaseWizardStep3.tsx` 重命名為 `CaseWizardStep4.tsx`，`CaseWizardStep4.tsx` 重命名為 `CaseWizardStep5.tsx`；用 grep 確認並更新所有 import（包含 `CaseWizard.tsx` 和任何 test 檔案）。設計決策：D2：Wizard 步驟插入位置 — step 3（原 step 3/4 順延）。驗收：`grep -r "CaseWizardStep3\b" src/` 回傳零筆（只有新建的 `CaseWizardStep3Disclosure` 除外）；`npm run build` 0 錯誤
- [x] 2.2 新建 `src/components/case-wizard/CaseWizardStep3Disclosure.tsx`：依 `caseData.property_type` 選擇渲染 `DisclosureFormResidential` 或 `DisclosureFormLand`（需求：Step rendering by property type）；mount 時呼叫 `invoke("get_draft", { caseId })` 取得 `initialPayload`（需求：Draft load on mount）；透過 `use-draft-autosave` 在 `onChange` 觸發後 1 秒自動呼叫 `save_draft`（需求：Autosave on field change）；提供「上一步」（→ Step 2）和「下一步」（→ Step 4）按鈕，導航前先 flush 存檔，按鈕在欄位全空時不 disabled（需求：Navigation does not block on empty fields）。設計決策：D1：不新增 migration，沿用 `disclosure_drafts.payload_json`；D2：Wizard 步驟插入位置 — step 3（原 step 3/4 順延）。驗收：成屋案件顯示 `DisclosureFormResidential`，土地案件顯示 `DisclosureFormLand`；填值後離開再回來，值仍存在
- [x] 2.3 更新 `src/components/case-wizard/CaseWizard.tsx`：step 總數改為 5（需求：Step count and ordering）；在 steps 陣列 index 2 插入 `{ label: "揭露資料", component: CaseWizardStep3Disclosure }`；匯入並移除舊 Step3/Step4 import，換成新 Step4/Step5。設計決策：D2：Wizard 步驟插入位置 — step 3（原 step 3/4 順延）。驗收：Wizard 進度條顯示 5 個步驟，第 3 步標籤為「揭露資料」

## 3. 揭露表單元件介面接線

- [x] [P] 3.1 修改 `src/components/disclosure-form-residential.tsx` props 介面，新增 `initialPayload?: Record<string, unknown>` 和 `onChange?: (payload: Record<string, unknown>) => void`（需求：Integration with CaseWizard Step 3）；mount 時用 `initialPayload` 填充所有欄位初始值；每個欄位 onChange 時呼叫外部 `onChange` 並傳入完整 payload（包含所有已填欄位）。不得移除元件現有的 standalone 使用能力（props 為 optional）。驗收：傳入 `initialPayload = { building_area: "50" }` 時，建物面積欄位顯示 "50"；修改任一欄位後 `onChange` 被呼叫且 payload 包含所有欄位的當前值
- [x] [P] 3.2 同上，修改 `src/components/disclosure-form-land.tsx` 加入相同 `initialPayload` 和 `onChange` props 介面（需求：Integration with CaseWizard Step 3）。驗收：傳入 `initialPayload = { land_area: "100" }` 時，土地面積欄位顯示 "100"；修改任一欄位後 `onChange` 被呼叫

## 4. 後補 Dialog 揭露欄位偵測與補填

- [x] 4.1 修改 `src/components/CaseSupplementDialog.tsx`（需求：Disclosure field completeness detection）：在 dialog open 時，平行呼叫 `invoke("get_draft", { caseId })` 和 `getRequiredFields(propertyType)`；計算 `payload_json` 中值為空字串、null 或 undefined 的 required 欄位（設計決策：D3：Supplement dialog — 讀 schema + diff payload 找空值必填欄位）；在「缺少必填欄位」區塊下方渲染這些欄位的 label + `<Input>` 元件；保留原有的 owner/address/case_name 三個欄位偵測邏輯不變。驗收：案件有 5 個空的 required 揭露欄位時，dialog 顯示至少 5 個可填寫的 input（加上原有基本欄位）；已填寫的揭露欄位不出現在列表
- [x] 4.2 修改 `CaseSupplementDialog` 的「儲存」handler（需求：Save patched disclosure payload）：將用戶填入的揭露欄位值 merge 進現有 `payload_json`（淺層合併，不覆蓋用戶未動的欄位）後呼叫 `invoke("save_draft", { caseId, payload: mergedPayload, schemaVersion: 1 })`（設計決策：D1：不新增 migration，沿用 `disclosure_drafts.payload_json`；D3：Supplement dialog — 讀 schema + diff payload 找空值必填欄位）；成功後關閉 dialog；失敗時顯示 toast "儲存失敗，請重試" 並保持 dialog 開啟。驗收：填入補件欄位後按「儲存」→ dialog 關閉 → 再次開啟 ⊕ → 剛才填的欄位不再出現在缺漏清單

## 5. PDF Inline Edit Overlay

- [x] 5.1 修改 `src/components/PdfPreviewer.tsx`（需求：Overlay input layer in PdfPreviewer；Scale-aware coordinate adjustment）：在 PDF canvas 的父容器上設定 `position: relative`（設計決策：D4：PDF inline edit — overlay div 絕對定位蓋在 PDF canvas 上）；疊加一個 `position: absolute; inset: 0; pointer-events: none` 的 overlay div；在 overlay 內，依 `PDF_FIELD_COORDS` 中的座標渲染 `<input>` 元件，座標乘以當前 scale 值（預設 0.99）以對應 Scale-aware coordinate adjustment；每個 input 設定 `pointer-events: auto`、`background: transparent`、`border: none`、`outline: none`（focused 時顯示底線）。驗收：PDF 封面頁載入後，承辦人/經紀人/物件名稱三個位置可被點擊並出現文字游標
- [x] 5.2 為 overlay 每個 input 加入 `onBlur` handler（需求：Blur saves and re-renders）：blur 時以 `fieldKey` 為 key、當前 input value 為值，patch 現有 payload 後呼叫 `invoke("save_draft", ...)`（設計決策：D1：不新增 migration，沿用 `disclosure_drafts.payload_json`；D4：PDF inline edit — overlay div 絕對定位蓋在 PDF canvas 上）；save 成功後觸發 PDF re-render（呼叫現有 `regeneratePdf()` 或等效方法）；save 失敗時顯示 toast "預覽更新失敗"。驗收：在承辦人 input 輸入「王大明」後點擊 PDF 其他位置 → PDF re-render → 封面頁承辦人欄位顯示「王大明」

## 6. 驗收測試

- [ ] [P] 6.1 在 `src/components/case-wizard/__tests__/` 新增 `CaseWizardStep3Disclosure.test.tsx`：測試成屋案件渲染 `DisclosureFormResidential`（`property_type = "residential"`）；測試土地案件渲染 `DisclosureFormLand`（`property_type = "land"`）；測試「下一步」按鈕在欄位全空時不被 disabled。驗收：`npm test -- CaseWizardStep3Disclosure` 全部通過
- [ ] [P] 6.2 在 `src/lib/__tests__/` 新增 `disclosure-schema.test.ts`：測試 `getRequiredFields("residential")` 回傳陣列長度 > 0 且每筆含 `key`, `label`, `fieldType`；同上測試 `getRequiredFields("land")`。驗收：`npm test -- disclosure-schema` 全部通過
- [ ] [P] 6.3 在 `src/components/__tests__/` 新增 `CaseSupplementDialog.disclosure.test.tsx`：mock `get_draft` 回傳有空值欄位的 payload，驗證 dialog 顯示對應的 input；mock `get_draft` 回傳全填 payload，驗證 dialog 不顯示多餘 input。驗收：`npm test -- CaseSupplementDialog.disclosure` 全部通過
