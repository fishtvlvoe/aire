## Context

`disclosure-form-residential.tsx`（381 行）和 `disclosure-form-land.tsx` 兩個揭露表單元件已實作完成，但未被任何路由或 Wizard 步驟引用。

資料儲存層已就緒：
- SQLite `disclosure_drafts(case_id, payload_json, schema_version, saved_at)` 表已在 migration 001 建立
- `save_draft` / `get_draft` Tauri IPC command 已在 `src-tauri/src/commands/drafts.rs` 實作
- `src/lib/use-draft-autosave.ts` hook 已實作自動存草稿邏輯（debounce 1s）
- `src/lib/disclosure-schema-residential.ts` 和 `disclosure-schema-land.ts` 已定義欄位 schema

目前 CaseWizard 有 4 步：Step1（基本）→ Step2（地政）→ Step3（實價）→ Step4（預覽）。
`CaseSupplementDialog` 只偵測 3 個基本欄位缺漏（owner/address/case_name）。
`PdfPreviewer` 是純 PDF.js viewer，無互動層。

## Goals / Non-Goals

**Goals:**
- 將揭露表單插入 Wizard 為 Step 3，讀寫 `disclosure_drafts` via 既有 `use-draft-autosave`
- `CaseSupplementDialog` 從 `disclosure_drafts` 讀取欄位，偵測空值必填欄位並允許補填
- `PdfPreviewer` 疊加 overlay 輸入層，點擊欄位座標觸發 inline 編輯，blur 存回 DB 並 re-render

**Non-Goals:**
- 地政 API 資料自動回填揭露表單欄位
- PDF overlay 座標的視覺設計系統（只做功能接線，不做精準像素定位）
- 多角色權限（老闆/助理/業務員）對揭露表單的不同編輯許可權
- 揭露表單的列印預覽（Print CSS）

## Decisions

### D1：不新增 migration，沿用 `disclosure_drafts.payload_json`

`disclosure_drafts` 已存在且 `payload_json` 為 JSON 字串，可直接存各種 schema 的表單資料。無需新 migration 或新欄位。

替代方案：在 `cases` 表新增 `disclosure_data TEXT` 欄位 → 被拒，因 `disclosure_drafts` 已完整封裝草稿概念，重複建立資料存放點違反 SSOT。

### D2：Wizard 步驟插入位置 — Step 3（原 Step 3/4 順延）

新 Step 3「揭露資料」插入 Step 2 地政之後、原 Step 3 實價登錄之前。原理：地政資料是揭露表單的前置資料（謄本欄位 → 自動帶入部分揭露欄位），插在地政後才能讓用戶看到已帶入的值。

步驟對照：
```
舊: Step1 基本 | Step2 地政 | Step3 實價 | Step4 預覽
新: Step1 基本 | Step2 地政 | Step3 揭露 | Step4 實價 | Step5 預覽
```

檔案重命名：`CaseWizardStep3.tsx` → `CaseWizardStep4.tsx`，`CaseWizardStep4.tsx` → `CaseWizardStep5.tsx`，新增 `CaseWizardStep3Disclosure.tsx`。

### D3：Supplement Dialog — 讀 schema + diff payload 找空值必填欄位

從 `getRequiredFields(propertyType)` 取得 schema 的所有 required 欄位清單，從 `get_draft(caseId)` 取得 payload，比對出 `value === "" || value === null || value === undefined` 的必填欄位，渲染成可編輯 input，儲存時 patch payload 後呼叫 `save_draft`。

`getRequiredFields` 統一從 `disclosure-schema-residential.ts` 和 `disclosure-schema-land.ts` 匯出，回傳 `Array<{ key: string; label: string; type: "text"|"number"|"boolean" }>` 格式。

### D4：PDF Inline Edit — overlay div 絕對定位蓋在 PDF canvas 上

PdfPreviewer 在 PDF canvas 同層加一個 `position: absolute` 的透明 overlay div，依欄位座標（fieldKey → {page, x, y, w, h} 座標表）渲染 `<input>` 或 `<textarea>`。座標表存在 `src/lib/pdf-field-coords.ts`，初始版本只涵蓋封面頁（承辦人/經紀人/物件名稱）。點擊 overlay input → 直接可編輯，blur → 呼叫 `invoke("save_draft", ...)` → PDF re-render（呼叫既有 `regeneratePdf()` 或等效函式）。

替代方案：使用 PDF.js annotation layer 的 FreeTextAnnotation → 被拒，複雜度過高且需 PDF.js PRO 或自行 hack annotation layer API。

## Implementation Contract

**行為（用戶視角）：**
1. 案件編輯 Wizard 顯示 5 個步驟：基本資料、地政資料、揭露資料、實價登錄（跳過）、預覽匯出
2. 到 Step 3 時，成屋案件顯示建物揭露表單，土地案件顯示土地揭露表單；表單自動從 `disclosure_drafts` 讀取既有值
3. 表單每次欄位變更 1 秒後自動儲存（debounce via `use-draft-autosave`）
4. ⊕ 補件按鈕開啟 dialog，顯示揭露表單中空值的必填欄位，補填後按「儲存」回寫 `disclosure_drafts`
5. Step 5 PDF 預覽中，封面頁的承辦人/經紀人/物件名稱可點擊編輯，blur 後 PDF 自動 re-render

**IPC 介面（不得更改）：**
- `save_draft(caseId: string, payload: string, schemaVersion: number)` — 既有，不改 signature
- `get_draft(caseId: string)` — 既有，回傳 `{ payload_json: string } | null`

**新增函式 signature：**
- `getRequiredFields(propertyType: "residential" | "land"): RequiredField[]` — 從 schema 檔匯出
- `type RequiredField = { key: string; label: string; fieldType: "text" | "number" | "boolean" }`

**失敗模式：**
- `get_draft` 回傳 null（新案件尚無草稿）→ Step 3 顯示空白表單，不報錯
- `save_draft` 失敗 → toast "儲存失敗，請重試"，不清除表單現有值
- PDF re-render 失敗 → 保留上一版 PDF，toast "預覽更新失敗"

**驗收標準（每條可獨立驗證）：**
1. 新建一筆成屋案件 → 進入 Wizard → Step 3 出現建物揭露表單（至少含「建物面積」「屋齡」欄位）→ 填值 → 離開再回來 → 值仍存在
2. 同上，土地案件 → Step 3 出現土地揭露表單（至少含「地號」「地目」欄位）
3. 案件列表點 ⊕ → dialog 出現「缺少必填欄位」清單（已填的不出現）→ 補填後儲存 → 再開 dialog 該欄位消失
4. Step 5 PDF 封面 → 點「承辦人」欄位位置 → input 出現 → 輸入文字 → 點外部 → PDF re-render 後承辦人欄位顯示新值

## Risks / Trade-offs

- **PDF overlay 座標精準度**：PDF.js 縮放時座標需按 scale 比例調整，初始版本固定 99% zoom 下的座標。若用戶縮放 PDF，overlay 位置會偏移 → 後續 phase 再做 scale-aware 座標計算
- **步驟重命名**：`CaseWizardStep3.tsx` → `CaseWizardStep4.tsx` 需同步更新所有 import，遺漏會導致 build error → 用 grep 確認全部 import 後再重命名
