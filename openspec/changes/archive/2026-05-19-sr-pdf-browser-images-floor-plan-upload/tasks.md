## 1. SR 紀錄與 artifact 品質

- [x] 1.1 Requirement: Browser PDF image pages render actual images / Step 3 floor-plan upload persists one image / Floor-plan photo appears in dossier data / Floor-plan photo page renders in PDF：建立本 SR 的 proposal、design、spec、tasks，並以 `spectra analyze sr-pdf-browser-images-floor-plan-upload --json` 確認沒有 Critical finding。驗證：analysis 可解釋所有 warning/suggestion；本 tasks.md 成為後續唯一執行清單。

## 2. PDF 瀏覽器圖片驗證

- [x] [P] 2.1 Requirement: Browser PDF image pages render actual images / Decision: Shared browser-safe image data URL helper / C1: Browser PDF image helper：新增 `src/lib/pdf-blocks/image-data-url.ts` 並把 `uint8ToDataUrl()` 從 `location-map.tsx`、`aerial-photo-page.tsx`、`exterior-photo-page.tsx` 抽到共用 helper。驗證：`npm test -- uint8-to-data-url` 先紅燈後綠燈，PNG/JPEG prefix 皆正確。

- [x] [P] 2.2 Requirement: Browser PDF image pages render actual images / C5: PDF export validation：用 case `b24e336a-46db-4cf4-845d-cbd95abee3f8` 驗證瀏覽器/dev PDF 匯出。驗證：匯出的 PDF 三個圖片頁至少一頁顯示實際圖片，且驗證紀錄說明 `locationMapImage`、`aerialPhoto`、`exteriorPhoto` 是否為非 null `Uint8Array`。

## 3. Dossier 資料層

- [x] [P] 3.1 Requirement: Floor-plan photo appears in dossier data / Decision: Dossier assembly reads IPC first, then web/mock fallback / C2: Dossier data shape：在 `src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts` 新增紅燈測試：(a) IPC 成功時 `floorPlanPhoto` 為對應 `Uint8Array`；(b) IPC throw 且 `land_registry_data.floor_plan_photo.base64` 有值時可解碼；(c) 兩者皆無時為 `null`。驗證：`npm test -- assemble-dossier-data` 紅燈只來自新增 expectations。

- [x] 3.2 Requirement: Floor-plan photo appears in dossier data / Decision: Dossier assembly reads IPC first, then web/mock fallback / C2: Dossier data shape：在 `CaseDossierData` 加入 `floorPlanPhoto?: Uint8Array | null`，並在 `assembleDossierData` 的 land/residential 回傳物件包含 `floorPlanPhoto`。驗證：`npm test -- assemble-dossier-data` 綠燈。

## 4. PDF 圖頁

- [x] [P] 4.1 Requirement: Floor-plan photo page renders in PDF / Decision: PDF page is unconditional for this SR / C3: FloorPlanPhotoPage：新增 `src/lib/pdf-blocks/__tests__/floor-plan-photo-page.test.tsx` 紅燈測試：有圖 render 不 throw、無圖 render 不 throw、title `格局圖` 與 `土地規劃圖` 皆可傳入。驗證：`npm test -- floor-plan-photo-page` 紅燈只來自缺少元件。

- [x] 4.2 Requirement: Floor-plan photo page renders in PDF / Decision: Shared browser-safe image data URL helper / C3: FloorPlanPhotoPage：新增 `src/lib/pdf-blocks/floor-plan-photo-page.tsx`，支援 `{ photo, title }`、430px 圖框、title-specific 佔位文字，並使用共用 `uint8ToDataUrl()`。驗證：`npm test -- floor-plan-photo-page` 綠燈。

- [x] 4.3 Requirement: Floor-plan photo page renders in PDF / Decision: PDF page is unconditional for this SR / Decision: Existing fieldSketchFloorPlan remains separate / C3: FloorPlanPhotoPage：在 `document.tsx` 的 BuildingPages 於 `ExteriorPhotoPage` 後、`FieldSketchFloorPlanPage` 前插入 `FloorPlanPhotoPage title="格局圖"`；LandPages 於 `ExteriorPhotoPage` 後插入 `FloorPlanPhotoPage title="土地規劃圖"`。驗證：`npm test -- document.test.tsx` 通過；`npm run type-check` 不新增相關 TypeScript error。

## 5. Wizard Step 3 上傳與持久化

- [x] [P] 5.1 Requirement: Step 3 floor-plan upload persists one image / Decision: Existing Step 3 disclosure component is the upload surface / C4: Step 3 upload block：新增 `src/components/case-wizard/__tests__/step3-photo-upload.test.tsx` 紅燈測試：建物版有 `floor-plan-file-input`、土地版有 `planning-map-file-input`、超過 10MB 顯示 `圖片大小不超過 10MB` 且不持久化。驗證：`npm test -- step3-photo-upload` 紅燈只來自缺少上傳 UI。

- [x] 5.2 Requirement: Step 3 floor-plan upload persists one image / Decision: Existing Step 3 disclosure component is the upload surface / Decision: Web/mock persistence uses land_registry_data / C4: Step 3 upload block：在 `CaseWizardStep3Disclosure.tsx` 加入 `PhotoUploadBlock`，支援 JPG/PNG、10MB 驗證、`Uint8Array` 轉 base64、`casesApi.update(caseId, { land_registry_data: { ...existing, floor_plan_photo } })`、即時縮圖。驗證：`npm test -- step3-photo-upload` 綠燈。

- [x] 5.3 Requirement: Step 3 floor-plan upload persists one image / Decision: Web/mock persistence uses land_registry_data / C4: Step 3 upload block：Step 3 mount 時從 `caseData.land_registry_data.floor_plan_photo` 還原 preview。驗證：`npm test -- step3-photo-upload` 覆蓋 `floor-plan-preview`；dev server 手動刷新後縮圖仍顯示。

## 6. 收尾驗證與封存

- [x] 6.1 Requirement: Browser PDF image pages render actual images / Floor-plan photo appears in dossier data / Floor-plan photo page renders in PDF：跑 focused test suite：`npm test -- uint8-to-data-url assemble-dossier-data floor-plan-photo-page step3-photo-upload document.test.tsx`。驗證：通過或明確列出 unrelated failure。

- [x] 6.2 Requirement: Browser PDF image pages render actual images / Step 3 floor-plan upload persists one image：跑 `npm run type-check`、`spectra validate sr-pdf-browser-images-floor-plan-upload`、`spectra instructions apply --change sr-pdf-browser-images-floor-plan-upload --json`。驗證：所有 tasks 勾選後 state 為 `all_done`，再封存本 SR。
