## 1. 根因固定與防回歸

- [x] 1.1 建立 failing tests：有 `public_candidate` 但有屋主授權時，PDF assembly 必須嘗試正式 `land_registry_pull_data`，不得直接輸出空白。
- [ ] 1.2 建立 `0005` PDF artifact regression：檢查 PDF 不得只有候選地號與查詢失敗文字，且 `pdfimages -list` 對有圖資案件需有圖片。
- [ ] 1.3 建立 mock/native 邊界測試：browser mock 成功不得被視為正式 API 驗收。

## 2. 授權後正式地政 API 資料鏈

- [x] 2.1 實作 Create case flow：新增案件只保存地址候選資料，不寫入會阻斷正式 pull 的 failed ownership 終局狀態。
- [x] 2.2 實作 Authorized cases SHALL use formal registry pull before client PDF output：有屋主授權與姓名時，執行正式地政 pull，使用正式 API pull building/land ownership、registry、rights、mortgage、zoning/value 等資料。
- [x] 2.3 實作 Candidate registry data SHALL NOT block formal pull 與 Disclosure PDF SHALL use trusted registry data when available：persisted payload 只有 candidate/failed 時，仍可正式 pull；trusted payload 才可直接使用。
- [x] 2.4 修正 provenance schema：清楚分離 candidate、trusted、manual、mock，避免 candidate 覆蓋 trusted。
- [x] 2.5 修正錯誤與補件狀態：API key、授權、餘額、查無資料、權限不足要顯示不同處理方式。
- [x] 2.6 建物案件正式 pull SHALL 包含土地/分區資料鏈：`land_registry`、土地所有權/共同所有人、`zoning`、地價或可取得的建蔽率/容積率來源，避免建物 PDF 的土地區塊全空。
- [x] 2.7 地址 lookup 回傳若沒有正式建號/地號，工作台 SHALL 要求補建號/地號後再正式 pull，不得只用 `0001` 產正式 PDF。

## 3. PDF 謄本與圖資完整性

- [ ] 3.1 PDF 物件資料表、建物標示、所有權及他項權利頁使用 trusted registry 資料填入。
- [ ] 3.2 實作 Client PDF SHALL contain images when image bytes are available：有圖資 bytes 或使用者上傳圖資時，位置圖、空拍圖、街景/外觀圖必須嵌入 PDF。
- [x] 3.3 實作 Client PDF SHALL expose missing data honestly：無圖資或部分 API 失敗時，PDF 保留空白框、補件說明與失敗原因，不得默默沒有圖片頁或用假圖。
- [ ] 3.4 實價登錄與周邊資料沿用可查結果，但不得混入錯地址或 mock 測試資料。
- [ ] 3.5 實作 Property sheet SHALL map complete registry and manual fields：地段、地號、使用分區、土地面積、權利範圍、持分面積、建蔽率、容積率、所有權人、取得日期、建物面積、登記坪數、主建坪數、附屬建物、公共設施、車位坪數、法定用途、主要建材、建築完成日、屋齡、樓層都要從 trusted/manual 來源映射。
- [x] 3.6 對建物現況、格局、座向、管理費等非地政必回欄位，PDF SHALL 讀取補件/現場確認資料並標示來源。

## 4. 補件欄位與資料狀態

- [x] 4.1 實作 Missing registry items SHALL become actionable supplement fields：`需人工提供`、`待資料`、`查詢未成功` 來源列要生成可填欄位。
- [x] 4.2 補件欄位支援屋主提供/人工輸入/重新查詢三種來源，並把來源與時間寫回案件。
- [x] 4.3 補件儲存不得只寫入單一瀏覽器 localStorage；正式 path 需寫回案件權威資料 store。
- [x] 4.4 補件值 SHALL 回填工作台預覽、JSON export 與 PDF；PDF 需標示來源，不偽裝為 API 回傳。
- [x] 4.5 修正工作台欄位「修改/完成」：完成時要寫回案件或補件 store；屋主姓名修改 SHALL 更新 `owner_name` 並觸發姓名比對狀態重新計算。
- [x] 4.6 資料來源表格與補件表單 SHALL 使用同一份欄位 definition，避免資料來源顯示缺口但補件頁沒有對應欄位。

## 5. 設定與品牌欄位

- [x] 5.1 實作 Settings SHALL store fixed delivery profile：設定頁以全域欄位保存承辦人、經紀人、經紀人證號。
- [x] 5.2 設定頁新增並持久化：不動產經紀業、經紀業證號、公司地址、公司電話。
- [x] 5.3 修正 `/settings/branding` 入口與 label，使畫面欄位名稱與 PDF 欄位一致；不要用「業務員證號」等模糊名稱。
- [x] 5.4 實作 Disclosure PDF SHALL include complete configured brand and realtor fields：封面與簽章欄回填上述欄位，缺值時顯示待補，不只留空 label。
- [x] 5.5 既有 storage key 需相容或遷移，避免已保存的品牌/公司資料遺失。

## 6. Browser dev mock 邊界

- [x] 6.1 實作 Browser dev mock state SHALL be clearly disclosed：localhost browser mock mode 顯示「本瀏覽器本機測試資料」。
- [ ] 6.2 補上 browser mock 匯出/匯入或 reset 指引，協助兩個瀏覽器對齊測試資料。
- [ ] 6.3 驗收文件明確區分 browser mock、Tauri SQLite、共享 SaaS backend，避免用 mock-only 結果交付。

## 7. 法規內容補全

- [ ] 7.1 實作 Legal clauses PDF block SHALL render the complete configured legal set：盤點目前 PDF 法規來源與缺漏，定義法規 source of truth。
- [ ] 7.2 補齊 legal clauses cache / sync / fallback，使 PDF 法規告知不只列目前少量條文。
- [ ] 7.3 法規頁顯示版本或同步狀態，避免少列卻沒有警示。

## 8. 驗收

- [x] 8.1 跑 Spectra gate：`spectra analyze fix-authorized-registry-pdf-completeness --json` clean，`spectra validate fix-authorized-registry-pdf-completeness` 通過。
- [x] 8.2 跑 targeted Vitest 與 type-check。
- [ ] 8.3 跑 Rust land-registry/API targeted tests，包含授權後正式 pull。
- [ ] 8.4 用可視化瀏覽器跑新增/授權/正式查詢/PDF 預覽與匯出流程。
- [ ] 8.5 在設定頁輸入固定公司/經紀資料，驗證 PDF 封面與簽章欄一致回填。
- [ ] 8.6 對資料來源缺口填寫補件，驗證 JSON export、預覽與 PDF 都回填人工值。
- [ ] 8.7 對輸出 PDF 跑 `pdftotext` 與 `pdfimages -list`，確認資料、法規、品牌欄位與圖片存在。
- [ ] 8.8 commit + push，並列出仍未處理的既有 dirty files。
