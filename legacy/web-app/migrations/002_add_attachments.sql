-- Migration: 002_add_attachments
-- Change: external-market-lookup
-- Purpose: 新增 attachments JSON 欄位，儲存附件 metadata（市調截圖、其他輔助文件）
--          欄位內容範例：[{"id":"att_1","filename":"591.png","type":"market_research","path":"...","size":2300000,"uploaded_at":"2026-04-24T..."}]
-- Status: 自動由 src/lib/db/schema.ts:initDb() 執行，本檔僅作部署參考

ALTER TABLE listings ADD COLUMN attachments TEXT;
