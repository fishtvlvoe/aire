## 1. 根因固定與防回歸

- [ ] 1.1 建立 failing tests：有 `public_candidate` 但有屋主授權時，PDF assembly 必須嘗試正式 `land_registry_pull_data`，不得直接輸出空白。
- [ ] 1.2 建立 `0005` PDF artifact regression：檢查 PDF 不得只有候選地號與查詢失敗文字，且 `pdfimages -list` 對有圖資案件需有圖片。
- [ ] 1.3 建立 mock/native 邊界測試：browser mock 成功不得被視為正式 API 驗收。

## 2. 授權後正式地政 API 資料鏈

- [ ] 2.1 實作 Create case flow：新增案件只保存地址候選資料，不寫入會阻斷正式 pull 的 failed ownership 終局狀態。
- [ ] 2.2 實作 Authorized cases SHALL use formal registry pull before client PDF output：有屋主授權與姓名時，執行正式地政 pull，使用正式 API pull building/land ownership、registry、rights、mortgage、zoning/value 等資料。
- [ ] 2.3 實作 Candidate registry data SHALL NOT block formal pull 與 Disclosure PDF SHALL use trusted registry data when available：persisted payload 只有 candidate/failed 時，仍可正式 pull；trusted payload 才可直接使用。
- [ ] 2.4 修正 provenance schema：清楚分離 candidate、trusted、manual、mock，避免 candidate 覆蓋 trusted。
- [ ] 2.5 修正錯誤與補件狀態：API key、授權、餘額、查無資料、權限不足要顯示不同處理方式。

## 3. PDF 謄本與圖資完整性

- [ ] 3.1 PDF 物件資料表、建物標示、所有權及他項權利頁使用 trusted registry 資料填入。
- [ ] 3.2 實作 Client PDF SHALL contain images when image bytes are available：有圖資 bytes 或使用者上傳圖資時，位置圖、空拍圖、街景/外觀圖必須嵌入 PDF。
- [ ] 3.3 實作 Client PDF SHALL expose missing data honestly：無圖資或部分 API 失敗時，PDF 保留空白框、補件說明與失敗原因，不得默默沒有圖片頁或用假圖。
- [ ] 3.4 實價登錄與周邊資料沿用可查結果，但不得混入錯地址或 mock 測試資料。

## 4. 設定與品牌欄位

- [ ] 4.1 實作 Settings SHALL store full realtor and company profile：設定頁新增並持久化承辦人、經紀人、經紀人證號。
- [ ] 4.2 設定頁新增並持久化：不動產業者、經紀業者編號、公司地址、公司電話。
- [ ] 4.3 實作 Disclosure PDF SHALL include complete configured brand and realtor fields：封面與簽章欄回填上述欄位，缺值時顯示待補，不只留空 label。

## 5. 法規內容補全

- [ ] 5.1 實作 Legal clauses PDF block SHALL render the complete configured legal set：盤點目前 PDF 法規來源與缺漏，定義法規 source of truth。
- [ ] 5.2 補齊 legal clauses cache / sync / fallback，使 PDF 法規告知不只列目前少量條文。
- [ ] 5.3 法規頁顯示版本或同步狀態，避免少列卻沒有警示。

## 6. 驗收

- [ ] 6.1 跑 Spectra gate：`spectra analyze fix-authorized-registry-pdf-completeness --json` clean，`spectra validate fix-authorized-registry-pdf-completeness` 通過。
- [ ] 6.2 跑 targeted Vitest 與 type-check。
- [ ] 6.3 跑 Rust land-registry/API targeted tests，包含授權後正式 pull。
- [ ] 6.4 用可視化瀏覽器跑新增/授權/正式查詢/PDF 預覽與匯出流程。
- [ ] 6.5 對輸出 PDF 跑 `pdftotext` 與 `pdfimages -list`，確認資料、法規、品牌欄位與圖片存在。
- [ ] 6.6 commit + push，並列出仍未處理的既有 dirty files。
