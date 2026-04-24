## ADDED Requirements

### Requirement: Three-layer OCR pipeline

系統 SHALL 對上傳的 PDF / 圖片執行三層 OCR pipeline，平衡精度與成本：

- **Layer 1 (PDF 文字層)**：對有文字層的 PDF 直接抽文字（pdfjs-dist），規則 parser 抽欄位
- **Layer 2 (本地 OCR)**：對影像 PDF / jpg / png 跑 PaddleOCR（首選）或 Tesseract.js（fallback）
- **Layer 3 (LLM Vision)**：Layer 1+2 信心度低時，透過 LLM_BACKEND 補強（業務 opt-in，需設定 API key）

每層執行後，系統 SHALL 評估信心度；達標即停，不繼續往下層。

#### Scenario: 電子檔謄本 PDF 走 Layer 1

- **WHEN** 業務上傳由地政事務所核發的電子檔謄本 PDF
- **THEN** 系統 SHALL 用 pdfjs-dist 抽取文字層
- **AND** 規則 parser SHALL 抽出欄位（地段地號、面積、所有權人...）
- **AND** 信心度 ≥ 0.95 → 不啟動 Layer 2/3

#### Scenario: 影像 PDF 或權狀照片走 Layer 2

- **WHEN** 業務上傳手機拍攝的權狀照片，或影像版謄本（無文字層）
- **THEN** Layer 1 抽出空文字 → 觸發 Layer 2 OCR（PaddleOCR / Tesseract.js）
- **AND** 信心度 ≥ 0.80 → 完成
- **AND** 信心度 < 0.80 且業務有 Layer 3 opt-in → 走 Layer 3

#### Scenario: LLM Vision 補強時業務 opt-in

- **WHEN** Layer 1+2 失敗且業務未設定 LLM_BACKEND vision API key
- **THEN** 系統 SHALL 標記為「無法解析，請手動輸入」
- **AND** SHALL NOT 自動發送資料到外部 API（保護客戶隱私）

#### Scenario: LLM Vision 啟用時業務見明確同意提示

- **WHEN** 業務首次啟用 LLM Vision Layer 3
- **THEN** UI SHALL 顯示「將傳送您的文件影像至 {provider} 解析」確認對話框
- **AND** 業務確認後才觸發 API call

### Requirement: Extracted result schema

OCR 抽取結果 SHALL 儲存於 `listings.extracted_data` 欄位，採用統一 JSON schema：

```json
{
  "by_attachment": {
    "<attachmentId>": {
      "filename": "...",
      "category": "transcript|land-title|contract|cadastral-map|other",
      "extracted_at": "<ISO timestamp>",
      "ocr_layer": "1|2|3",
      "fields": {
        "<fieldKey>": { "value": "...", "confidence": 0.0-1.0 }
      },
      "raw_text": "<截斷至 5000 字元的 OCR 原文>"
    }
  },
  "merged_fields": {
    "<fieldKey>": { "value": "...", "from": "<attachmentId>", "confidence": 0.0-1.0 }
  }
}
```

#### Scenario: 多份同類文件 conflict 解決

- **WHEN** 業務上傳 2 份謄本，皆抽出 `address` 欄位
- **THEN** `merged_fields.address` SHALL 取信心度較高那份
- **AND** 信心度相同時取較新上傳那份
- **AND** UI 顯示「另有 1 份來源（{舊 attachment 檔名}）的值為 X，是否切換」下拉

#### Scenario: 業務手動覆蓋自動帶入

- **WHEN** 自動帶入後業務手動修改該欄位
- **THEN** `field_visit_data.<key>` SHALL 更新為業務值
- **AND** `merged_fields.<key>` SHALL 保留原始 OCR 值（不刪）
- **AND** UI 徽章 SHALL 從「📄 已從文件帶入」改為「✏️ 已手動修改」

### Requirement: extract API endpoint

系統 SHALL 提供 `POST /api/listings/{id}/extract` endpoint 觸發指定 attachment 或所有未解析 attachment 的 OCR。

#### Scenario: 觸發單一 attachment 解析

- **WHEN** 客戶端 POST `/api/listings/36/extract?attachmentId=att_abc`
- **THEN** server SHALL 載入該 attachment 檔案、執行 OCR pipeline、寫入 `extracted_data.by_attachment.att_abc`
- **AND** 重新計算 `merged_fields`
- **AND** 回應 `{ extracted: { fields, confidence }, merged_fields }`

#### Scenario: 觸發所有未解析 attachment 解析

- **WHEN** 客戶端 POST `/api/listings/36/extract`（無 query）
- **THEN** server SHALL 對所有未在 `extracted_data.by_attachment` 中的 attachment 執行 OCR
- **AND** 回應總數量與解析結果
