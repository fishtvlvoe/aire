## 1. TDD 紅燈測試

- [x] 1.1 [P] Address lookup returns candidate parcel options：新增 provenance/lookup 測試，輸入裕農路地址候選資料時必須回傳土地 `DC-1556-00700000` 與四筆建物候選；用 `pnpm vitest run src/lib/__tests__/registry-provenance.test.ts` 驗證。
- [x] 1.2 [P] Candidate options are comparable before confirmation：新增候選摘要測試，候選成功與 COP312 失敗都保留在同一清單且含 query_status；用 targeted Vitest 驗證。
- [x] 1.3 [P] Dossier assembly supports candidate pre-survey data 與 Candidate confirmation promotes one option：新增 `assembleDossierData` 測試，selected candidate 可填登記坪數/主建坪/用途/完成日/屋齡且 trusted 覆蓋 candidate；用 `pnpm vitest run src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts` 驗證。
- [x] 1.4 [P] Property data sheet displays candidate values with warnings、Candidate comparison appears in pre-survey PDF 與 Property data sheet displays inferred reference values：新增 PDF block 測試，PDF 文字含候選警示、候選欄位值、多候選比較表、推測資料來源，以及固定文案「地政資料，最終以正式謄本為主；本說明書不代表完整資訊。」；用 `pdftotext` 或 React PDF 測試輸出驗證。
- [x] 1.5 [P] Map images use candidate coordinates when address geocoding fails：新增圖資 fallback 測試，地址 geocode 空結果但 candidate coordinate 存在時仍產 location/aerial image bytes；用 targeted Vitest 與 `pdfimages -list` artifact 驗證。

## 2. 候選資料模型與查詢鏈

- [x] 2.1 Decision: Store all candidates in registry provenance JSON：在既有 `land_registry_data` provenance JSON 支援 `candidate_options`、`selected_candidate_ids`、`confirmed_parcel_ids`、`coordinate_source`，完成後 1.1 與 1.2 測試通過。
- [x] 2.2 Address lookup returns candidate parcel options：讓新增案件/資料來源重整保存所有候選土地與建物，不再只存單一 `0001`；用裕農路 mock fixture 驗證五筆候選都進案件 JSON。
- [x] 2.3 Candidate options are comparable before confirmation：對每筆候選執行可控的候選 probe 並保存 summary_fields、query_status、COP code、費用摘要；用 mock backend 與 Rust targeted tests 驗證成功/失敗候選都可比較。
- [x] 2.4 Decision: Infer reference values from same-suffix vertical units 與 Dossier assembly supports vertical unit reference estimates：在 provenance/assembly 支援 `inferred_reference`，同棟同尾碼戶別一致時產生 estimated_fields、confidence、source_units；用 `assembleDossierData` 測試驗證 `8樓之1` 可由 `3樓之1`、`5樓之1`、`7樓之1` 產生參考值。

## 3. 工作台候選清單與確認流程

- [x] 3.1 Decision: Candidate comparison is a first-class workbench section：在工作台資料來源或補件區顯示候選土地/建物比較表，完成後 Playwright 可看到裕農路一筆土地與四筆建物候選。
- [x] 3.2 Candidate confirmation promotes one option：新增「暫用」與「已確認」操作，暫用只影響前期 PDF，已確認會更新後續 formal pull parcel id；用 component test 驗證 state 與 persisted payload。
- [x] 3.3 候選流程錯誤揭露：COP317/COP312/COP305 顯示成可理解狀態與處理建議，完成後工作台不再只顯示泛用「查詢未成功」；用 component test 與 Playwright 斷言驗證。

## 4. PDF 與圖資輸出

- [x] 4.1 Decision: Candidate data can fill pre-survey fields with mandatory warnings：PDF assembly 使用 selected candidate 填物件資料表與產權調查表，且所有候選值顯示候選警示；用 1.3 與 1.4 測試驗證。
- [x] 4.2 Property data sheet displays candidate values with warnings：物件資料表在候選資料存在時不留空登記坪數、主建坪、用途、完成日、屋齡；用 `pdftotext` 檢查 PDF 實際值。
- [x] 4.3 Candidate comparison appears in pre-survey PDF：未選候選時 PDF 顯示全部候選比較表，已選候選時仍保留候選來源摘要；用 PDF regression artifact 驗證候選清單沒有被隱藏。
- [x] 4.4 Property data sheet displays inferred reference values：沒有 trusted/selected candidate 實值時，PDF 使用同棟同尾碼推測值填入參考欄位，並顯示「推測資料，非登記資料」與固定文案「地政資料，最終以正式謄本為主；本說明書不代表完整資訊。」；用 `pdftotext` 檢查實際文案與推測值。
- [x] 4.5 Decision: Use candidate coordinates for image generation fallback 與 Map images use candidate coordinates when address geocoding fails：PDF 圖資使用 `coordinate_source` 產位置圖與航拍圖，缺 Google Maps key 時街景頁顯示原因；用 `pdfimages -list` 與文字檢查驗證。

## 5. 瀏覽器驗收與審查

- [x] 5.1 裕農路端到端驗收：Playwright 建立裕農路前期物調，確認五筆候選可見、選定一筆候選或產生同尾碼推測、PDF 匯出含候選/推測警示、固定文案、候選欄位值與位置/航拍圖片；用 `pnpm exec playwright test e2e/candidate-parcel-options-presurvey.spec.ts --project=chromium-tauri --reporter=line` 驗證。
- [x] 5.2 PDF 值驗收：對輸出 PDF 跑 `pdftotext`，確認登記坪數、主建坪、用途、完成日、屋齡或推測參考值不是空白，且固定文案存在；跑 `pdfimages -list` 確認位置圖與航拍圖存在。
- [x] 5.3 Review 任務：指派 kimi MCP 或等效多檔 review 檢查候選資料不會混成正式資料，並用 `spectra analyze list-candidate-parcel-options-for-presurvey --json` 與 `spectra validate list-candidate-parcel-options-for-presurvey` 確認 CR 乾淨。
- [x] 5.4 commit + push：提交候選清單與 PDF 候選版實作，推送正確 branch，並列出仍未處理的既有 dirty files。

## 6. 2026-05-23 圖資回歸修正記錄

- [x] 6.1 Root cause：`e2e/candidate-parcel-options-presurvey.spec.ts` 與 `scripts/gen-yunong-candidate-pdf.mjs` 曾把 `src/assets/icon-light.png` 當成位置圖/航拍圖 fixture，導致 `/Users/fishtv/Downloads/AIRE-YUNONG-CANDIDATE-20260523-說明書.pdf` 第 14/15 頁顯示 logo 而非地圖。
- [x] 6.2 Fix：移除 E2E 的圖資 API 攔截，讓 `/api/location-map`、`/api/aerial-photo`、`/api/street-view` 走真實本機 API；手動 PDF 腳本改從同一組 API 取圖，並用 `jiti` 正式載入 TS/TSX PDF engine。
- [x] 6.3 Guardrail：E2E 新增 `pdfimages -list` 斷言，要求 PDF 內至少兩張非 logo 的 600x400 圖資；PDF image page 單元測試不再使用產品 logo 當測試圖。
- [x] 6.4 Verification：`pnpm vitest run src/lib/pdf-blocks/__tests__/registry-image-pages.test.tsx src/lib/pdf-blocks/__tests__/life-amenities.test.tsx`、`pnpm type-check`、`E2E_BASE_URL=http://localhost:3000 pnpm exec playwright test e2e/candidate-parcel-options-presurvey.spec.ts --project=chromium-tauri --reporter=line`、`E2E_BASE_URL=http://localhost:3000 pnpm exec playwright test e2e/complete-presurvey-property-sheet-flow.spec.ts --project=chromium-tauri --reporter=line`、`pdfimages -list /Users/fishtv/Downloads/AIRE-YUNONG-CANDIDATE-20260523-說明書.pdf` 均通過；PDF 第 14/15/16 頁為 600x400 位置圖、航拍圖、建物外觀圖。
- [x] 6.5 Follow-up：產權調查表—建物標示原本讀 root `buildingArea/buildingPurpose/constructionDate`，候選值只進 `propertySheet`，因此頁面空白；已同步 selected candidate 的登記坪數換算㎡、用途與完成日，並讓裕農路 E2E 檢查 `103.31`、`住家用`、`083/10/18`。
- [x] 6.6 Follow-up：手動 candidate PDF artifact 的實價登錄列原本只有 0 值，已補裕農路周邊成交列；E2E 追加檢查「附近地段實價登錄成交行情」與 `台南市東區裕農路123號`。
