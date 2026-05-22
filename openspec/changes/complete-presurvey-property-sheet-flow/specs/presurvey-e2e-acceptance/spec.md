## Purpose

定義 AIRE 完整驗收條件，確保 UI/UX、後端資料、地政查詢、補件與 PDF 輸出可以用真實流程驗證。

## ADDED Requirements

### Requirement: Visible browser E2E covers the main property sheet flow

系統 SHALL 使用可視化真實瀏覽器驗收主要流程，不得只用無頭模式或單元測試宣稱完成。

#### Scenario: Yunong Road acceptance run

- **GIVEN** 測試地址為 `台南市東區裕農路288巷17號8樓之1`
- **WHEN** 驗收流程執行
- **THEN** 測試 SHALL 涵蓋登入、清舊資料、新增案件、地政判斷、物調表、補件、PDF 預覽與匯出
- **AND** 驗收 SHALL 記錄失敗步驟與修復狀態

### Requirement: PDF artifact is inspected for false or stale content

輸出的 PDF SHALL 被檢查是否包含錯誤地址、錯誤屋主、假資料、舊測試資料或缺漏欄位。

#### Scenario: PDF is exported

- **GIVEN** 裕農路案件已產出 PDF
- **WHEN** PDF 檔案儲存到 Downloads
- **THEN** 驗收 SHALL 檢查地址、案件名稱、地政欄位、費用摘要、圖資空白框與待確認標示
- **AND** 若發現假資料或舊資料 SHALL 記錄為 bug 並修正

### Requirement: Backend tests cover registry fallback and provenance

系統 SHALL 以自動測試覆蓋地政查詢、fallback、來源狀態與 PDF assembly。

#### Scenario: Registry candidate data is used in pre-survey output

- **GIVEN** 地政或 fallback 回傳候選資料
- **WHEN** PDF/preview assembly 組合物調表資料
- **THEN** 系統 SHALL 允許候選資料出現在物調表
- **AND** 該欄位 SHALL 保留來源與待確認狀態

### Requirement: SR gates pass before handoff

交付前 SHALL 通過 Spectra 一致性與 validation。

#### Scenario: Handoff readiness

- **GIVEN** 實作完成
- **WHEN** 執行 SR gate
- **THEN** `spectra analyze complete-presurvey-property-sheet-flow --json` SHALL 沒有 Critical 或 Warning
- **AND** `spectra validate complete-presurvey-property-sheet-flow` SHALL 成功
