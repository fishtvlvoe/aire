-- Migration 008: 新增 land_lots 欄位（多地號 JSON 陣列）
ALTER TABLE cases ADD COLUMN land_lots TEXT DEFAULT '[]';
