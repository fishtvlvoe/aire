-- Migration: 005_vendor_account
-- Purpose: 新增 is_vendor 欄位，用於識別廠商帳號（系統自動佈建，不對一般用戶開放）

ALTER TABLE users ADD COLUMN is_vendor INTEGER NOT NULL DEFAULT 0;
