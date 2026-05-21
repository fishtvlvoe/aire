## 1. 資料層：CaseDossierData 與 assembleDossierData

- [ ] [P] 1.1 為 `src/lib/pdf-engine/document.tsx` 的 `CaseDossierData` 介面新增 `floorPlanPhoto?: Uint8Array | null` 欄位。驗證：`npx tsc --noEmit` 0 errors，且所有現有使用 `CaseDossierData` 的元件無 TypeScript error（欄位為 optional，不需改呼叫端）。

- [ ] [P] 1.2 為 `assembleDossierData` 寫紅燈單元測試（`src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts`）：(a) IPC 成功時 `floorPlanPhoto` 為對應 `Uint8Array`；(b) IPC throw 且 `land_registry_data.floor_plan_photo.base64` 有值時 `floorPlanPhoto` 為解碼 `Uint8Array`；(c) 兩者皆無時 `floorPlanPhoto` 為 null。驗證：`npm test -- assemble-dossier-data` 三個測試紅燈。

- [ ] 1.3 在 `src/lib/pdf-engine/assemble-dossier-data.ts` 的 `assembleDossierData` 函式（`isLand` 和 `!isLand` 兩個分支）實作 `floorPlanPhoto` 讀取：先嘗試 `safeInvoke("get_floor_plan_photo", { case_id: caseRow.id })`，失敗後從 `caseRow.land_registry_data?.floor_plan_photo?.base64` 解碼，兩者皆無則 null。回傳的 dossier 物件包含 `floorPlanPhoto`。驗證：`npm test -- assemble-dossier-data` 三個測試綠燈。

## 2. PDF Block：FloorPlanPhotoPage

- [ ] [P] 2.1 寫紅燈測試（`src/lib/pdf-blocks/__tests__/floor-plan-photo-page.test.tsx`）：(a) `photo` 為有效 Uint8Array 時，render 不 throw；(b) `photo` 為 null 時，render 不 throw；(c) `title` prop 正確傳入（測試 "格局圖" 和 "土地規劃圖"）。驗證：`npm test -- floor-plan-photo-page` 紅燈。

- [ ] 2.2 新建 `src/lib/pdf-blocks/floor-plan-photo-page.tsx`：實作 `FloorPlanPhotoPage` 元件，props `{ photo: Uint8Array | null; title: string }`。有圖時用 `uint8ToDataUrl(photo)` 轉 data URL 傳給 `<Image>`；無圖時顯示佔位文字（中文，對應 title 的「請上傳格局圖」或「請上傳規劃圖」）。樣式與 `ExteriorPhotoPage` 一致（430px 高度框）。驗證：`npm test -- floor-plan-photo-page` 綠燈。

## 3. PdfDocument 插入圖頁

- [ ] 3.1 在 `src/lib/pdf-engine/document.tsx` 的 `BuildingPages` 中，於 `<ExteriorPhotoPage>` 之後插入 `<FloorPlanPhotoPage photo={data.floorPlanPhoto ?? null} title="格局圖" />`（unconditional render）。驗證：`npx tsc --noEmit` 0 errors；現有 `document.test.tsx` 建物版 render 測試通過。

- [ ] 3.2 在 `src/lib/pdf-engine/document.tsx` 的 `LandPages` 中，於 `<ExteriorPhotoPage>` 之後插入 `<FloorPlanPhotoPage photo={data.floorPlanPhoto ?? null} title="土地規劃圖" />`。驗證：`npx tsc --noEmit` 0 errors；現有 `document.test.tsx` 土地版 render 測試通過。

## 4. Wizard Step 3 上傳 UI

- [ ] [P] 4.1 寫紅燈測試（`src/components/case-wizard/__tests__/step3-photo-upload.test.tsx`）：(a) 建物版 Step 3 渲染 `data-testid="floor-plan-file-input"`；(b) 土地版 Step 3 渲染 `data-testid="planning-map-file-input"`；(c) 選擇 > 10MB 檔案後顯示 "圖片大小不超過 10MB" 錯誤訊息。驗證：`npm test -- step3-photo-upload` 紅燈。

- [ ] 4.2 在 `src/components/case-wizard/CaseWizardStep3.tsx` 加入 `PhotoUploadBlock` 子元件：根據 `propertyType` 顯示不同標籤（"格局圖上傳" 或 "規劃圖上傳"）；包含隱藏 file input（`accept="image/jpeg,image/png"`、對應 testid）；選檔後驗證大小（> 10MB 顯示錯誤）、讀取 `ArrayBuffer` 轉 `Uint8Array`、呼叫 `onPhotoChange(bytes, mime)` callback。驗證：`npm test -- step3-photo-upload` 三個測試綠燈。

- [ ] 4.3 在 `CaseWizardStep3.tsx` 的 `onPhotoChange` 回呼中，呼叫 `casesApi.update(caseId, { land_registry_data: { ...existing, floor_plan_photo: { base64: bytesToBase64(bytes), mime } } })` 持久化圖片。從 case data 初始化時讀取 `floor_plan_photo.base64` 還原 thumbnail URL（`URL.createObjectURL(new Blob([bytes], { type: mime }))`）。驗證：在 dev server 上傳圖片後刷新，縮圖仍顯示（`data-testid="floor-plan-preview"` 可見）。
