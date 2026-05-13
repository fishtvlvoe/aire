-- Migration: 003_add_extracted_data
-- Change: upload-first-autofill
-- Purpose: 新增 extracted_data TEXT 欄位，儲存 OCR/parser 解析結果（by_attachment + merged_fields）
-- Status: 自動由 src/lib/db/schema.ts:initDb() 執行，本檔僅作部署參考

ALTER TABLE listings ADD COLUMN extracted_data TEXT;
