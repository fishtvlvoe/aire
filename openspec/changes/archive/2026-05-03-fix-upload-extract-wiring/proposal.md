## Why

`PhotoUploadClassifier` 選完檔案後只把 metadata 存進 React state，沒有實際把二進位檔案 POST 到 server。導致 `attachments` 表永遠空白，`extract` 流程無法從 UI 觸發，自動帶入欄位功能形同虛設。

## What Changes

- 新增 `listingId` prop 至 `PhotoUploadClassifier`，選檔後立刻 `fetch POST /api/listings/[id]/attachments` 上傳二進位
- 擴充 `src/app/api/listings/[id]/attachments/route.ts` 的 `ALLOWED_TYPES`，加入 `transcript | title-deed | contract | cadastral-map`
- 修改 `src/components/forms/FieldVisitForm.tsx`，把 `listingId` 傳入 `PhotoUploadClassifier`
- 上傳成功後，既有的 `task 1.8` fire-and-forget extract 觸發邏輯自動接手（不需另外修改）

## Non-Goals

- 不修改 extract pipeline 本身（OCR/LLM Vision 邏輯已在 upload-first-autofill change 實作）
- 不加批次上傳（一次只傳一個檔案）
- 不改 `useExtractStatus` polling 邏輯（已正常運作）
- 不做上傳進度條 UI（上傳中顯示 loading state 即可）

## Capabilities

### New Capabilities

- `listing-attachments-api`：擴充 attachments API 支援 OCR 文件類型（謄本、權狀、合約、地籍圖）

### Modified Capabilities

- `field-visit-form`：檔案選取後須立即觸發 server-side 上傳，`PhotoUploadClassifier` 需知道 `listingId`
- `listing-ui-flow`：照片/文件 tab 的上傳行為須與後端 attachments API 接通

## Impact

- Affected specs: `field-visit-form`、`listing-ui-flow`
- Affected code:
  - Modified: `src/components/PhotoUploadClassifier.tsx`
  - Modified: `src/components/forms/FieldVisitForm.tsx`
  - Modified: `src/app/api/listings/[id]/attachments/route.ts`
