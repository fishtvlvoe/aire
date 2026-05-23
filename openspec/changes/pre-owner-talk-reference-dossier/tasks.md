## 1. TDD 紅燈測試

- [x] 1.1 [P] `assembleDossierData` 測試：正式資料 > selected candidate > inferred reference > 單一土地候選；無可靠來源欄位保持空白。
- [x] 1.2 [P] PDF block 測試：候選/推測欄位顯示來源標記，取得日期、他項權利、抵押權欄位無資料時不顯示提示文字。
- [x] 1.3 [P] E2E 測試：裕農路地址匯出洽談前參考 PDF，`pdftotext` 驗證可談資料存在、不可推測欄位留白。
- [x] 1.4 [P] 圖資驗收：`pdfimages -list` 驗證位置圖、航拍圖、建物外觀不是 logo 或假圖。

## 2. 資料信任與組裝規則

- [x] 2.1 Decision: Treat the pre-owner-talk dossier as a separate trust mode；Requirement: Dossier assembly applies pre-owner-talk trust precedence：在 assembly 中保留正式、候選、推測與留白四種資料狀態，trusted 永遠優先。
- [x] 2.2 Decision: Auto-use single land candidate for pre-survey reference；Requirement: Address lookup supports pre-owner-talk reference candidates：只有一筆土地候選時，自動作為前期參考來源填入土地欄位與持分面積。
- [x] 2.3 Expand inferred reference mapping：同棟同尾碼推測可填附屬、共有、車位、用途、建材、完成日、屋齡、樓層、權利範圍與土地持分。
- [x] 2.4 Decision: Leave unreliable formal-rights fields blank；Requirement: Unreliable formal-rights fields remain blank：無正式謄本/權狀來源時，取得日期、他項權利、抵押權、權狀字號、擔保金額與存續期間保持空白。

## 3. PDF 與工作台呈現

- [x] 3.1 Requirement: Property data sheet supports pre-owner-talk reference values：物件資料表所有候選/推測值都顯示來源標記。
- [x] 3.2 Requirement: Candidate comparison summarizes reference fields：候選比較摘要包含登記、主建、附屬、共有、車位、用途、建材、完成日、樓層、權利範圍。
- [x] 3.3 Requirement: Pre-owner-talk PDF renders reference disclaimers and blanks：候選或推測版 PDF 固定顯示「地政資料，最終以正式謄本為主；本說明書不代表完整資訊。」
- [x] 3.4 Blank-print workflow：留白欄位在 PDF 上保持可手寫空間，不被提示文字佔滿。

## 4. 驗收與交付

- [x] 4.1 裕農路端到端驗收：建立案件、選候選、匯出 PDF，確認可談資料不是空白。
- [x] 4.2 PDF 值驗收：`pdftotext` 驗地段、地號、土地面積、持分、登記、主建、附屬、共有、車位、用途、建材、完成日、屋齡、樓層。
- [x] 4.3 PDF 留白驗收：`pdftotext` 驗取得日期、他項權利、抵押權相關無資料欄位沒有被提示文字填滿。
- [x] 4.4 Spectra gate：`spectra analyze pre-owner-talk-reference-dossier --json` clean 且 `spectra validate pre-owner-talk-reference-dossier` 通過。
