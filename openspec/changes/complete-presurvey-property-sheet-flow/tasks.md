## 1. SR 與範圍固定

- [x] 1.1 整理 active/parked SR，標記此 SR 為 AIRE 物調表完成版的主線，避免與舊 UI SR 重複。
- [x] 1.2 將目前已驗收方向的 UI/UX 骨架列為 freeze boundary，只允許修正流程、狀態、對齊與互動缺口。
- [x] 1.3 跑 `spectra analyze complete-presurvey-property-sheet-flow --json` 與 `spectra validate complete-presurvey-property-sheet-flow`，修正 Critical/Warning，覆蓋 SR gates pass before handoff 與 verification。

## 2. 地政與物調表資料模型

- [x] 2.1 實作 Pre-survey property sheet can use available registry data 與 Land registry lookup SHALL return usable pre-survey status：物調表資料狀態包含已帶入、待確認、需補件、查詢失敗，並保留來源與費用。
- [x] 2.2 實作 Backend tests cover registry fallback and provenance 與 Disclosure output SHALL support pre-survey property sheet state：調整 PDF/preview assembly，地政有取得的資料先進物調表，未確認資料以待確認呈現，不填假資料。
- [x] 2.3 裕農路真實地址測試：確認地址、土地/建物候選資料、費用與查詢失敗原因不會卡住流程。

## 3. UI/UX 流程修正

- [x] 3.1 實作 Add case flow has one primary registry lookup path：新增案件流程只保留一個主要地政判斷動作，避免新增案件與地政查詢重複。
- [x] 3.2 物調表頁依 observable behavior 修正為案件摘要、地政資料、補件與現場必問、PDF 檢查的單一流程。
- [x] 3.3 實作 Supplement and field questions are one workflow：補件與現場必問合併成可填寫表單，支援地籍圖、空拍圖、格局圖、地標圖上傳與回寫。
- [x] 3.4 實作 Workbench controls are actionable：移除或改寫不能操作的假按鈕；所有看起來能點的控制都必須有行為。
- [x] 3.5 實作 Customer-facing copy hides engineering API names：修正欄位對齊、單位、狀態標籤與文案，不再出現工程用 API 名稱給客戶看。
- [x] 3.6 實作 Case pages do not duplicate navigation intent、Case management SHALL route each action to one clear destination、Settings SHALL separate personal, registry authorization, and plan upgrade：資料來源、費用紀錄、個人設定、方案升級與地政授權各自只顯示該頁應有內容。

## 4. PDF 與檔案輸出

- [x] 4.1 實作 PDF output represents missing data honestly：PDF 物調表輸出包含已帶入資料、待確認標示、本案費用摘要與查詢失敗原因。
- [x] 4.2 PDF 圖資區保留地籍圖、空拍圖、格局圖、地標圖空白框；未上傳或未產生時不得放假圖。
- [x] 4.3 匯出裕農路測試案 PDF 到 Downloads，檢查地址、資料來源、費用與圖資區是否正確。

## 5. OPCOS 授權與方案端口

- [x] 5.1 AIRE 端保留授權序號驗證、方案狀態與超級管理員開關端口。
- [x] 5.2 OPCOS 端確認未來可發序號與回傳方案狀態；本 SR 不實作付款。
- [x] 5.3 測試版所有功能可用；一般正式版未完成功能顯示目前正在開發中。

## 6. 完整驗收

- [x] 6.1 跑 frontend targeted tests 與 type-check。
- [x] 6.2 跑 Rust land-registry targeted tests，包含 NLSC/COP fallback。
- [x] 6.3 實作 Visible browser E2E covers the main property sheet flow：用可視化真實瀏覽器跑完整流程，登入、清舊資料、新增裕農路案件、物調表、補件、PDF 預覽與匯出。
- [x] 6.4 實作 PDF artifact is inspected for false or stale content：記錄所有 bug，能修的直接修；不能修的寫入 SR 剩餘風險。
- [x] 6.5 交付前跑 `git status`，列出本 SR 相關變更與未納入範圍的既有 dirty files。
