-- Migration: 001_add_market_summary
-- Change: external-market-lookup
-- Purpose: 新增 market_summary 欄位，儲存業務人工填寫的「周邊行情摘要」（最多 500 字元）
-- Status: 自動由 src/lib/db/schema.ts:initDb() 執行，本檔僅作部署參考

ALTER TABLE listings ADD COLUMN market_summary TEXT;
