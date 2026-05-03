## Tasks

### Wave 1: API 層修復

- [x] 1.1 Expanded ALLOWED_TYPES for OCR document uploads — 實作 design 第 1 節「attachments API — 擴充 ALLOWED_TYPES」，加入 `transcript`、`title-deed`、`contract`、`cadastral-map` [Tool: copilot-codex]

  **檔案**：`src/app/api/listings/[id]/attachments/route.ts`

  將：
  ```typescript
  const ALLOWED_TYPES = ['market_research', 'field_visit'];
  ```
  改為：
  ```typescript
  const ALLOWED_TYPES = [
    'market_research',
    'field_visit',
    'transcript',
    'title-deed',
    'contract',
    'cadastral-map',
  ];
  ```

  不動其他邏輯。跑 `npm run build` 確認 0 errors。

### Wave 2: UI 層修復

- [x] 2.1 File category mapping for attachment type — 實作 design 第 2 節「PhotoUploadClassifier — 加 listingId + 上傳邏輯」，依 MIME 對應 transcript/market_research [Tool: copilot-codex]

  **檔案**：`src/components/PhotoUploadClassifier.tsx`

  1. 在 props interface 加入 `listingId?: number`
  2. 找到 file change handler（`onChange` 或 `onClassified` 等），在其中加入：
     ```typescript
     if (listingId) {
       const formData = new FormData();
       formData.append('file', file);
       formData.append('type', file.type === 'application/pdf' ? 'transcript' : 'market_research');
       fetch(`/api/listings/${listingId}/attachments`, {
         method: 'POST',
         body: formData,
       }).catch(console.error);
     }
     ```
  3. 上傳為 fire-and-forget，不 await，不 block UI，失敗只 `console.error`

  跑 `npm run build` 確認 0 errors。

- [x] 2.2 listingId propagation to upload component — 實作 design 第 3 節「FieldVisitForm — 傳入 listingId」 [Tool: copilot-codex]

  **檔案**：`src/components/forms/FieldVisitForm.tsx`

  1. 確認 FieldVisitForm 已有 `listingId` prop 或可從 context/URL 取得
  2. 在 `<PhotoUploadClassifier>` 加入 `listingId={listingId}`
  3. 若 FieldVisitForm 本身沒有 `listingId` prop，先加入 prop 並往上追溯確認傳入來源（通常來自 fill page）

  跑 `npm run build` 確認 0 errors。

### Wave 3: 驗收

- [x] 3.1 Photo and document tab uploads wire through to attachments API — 跑 Playwright E2E 確認 extract API 被觸發 [Tool: sonnet]

  執行：`npx playwright test e2e/autofill-upload.spec.ts --reporter=line`

  預期：原本失敗的「上傳謄本 PDF → extract API 被觸發」和「extract 完成後 merged_fields 有值」兩個測試通過。
  
  若失敗，回報實際錯誤訊息，不自行猜測修法。
