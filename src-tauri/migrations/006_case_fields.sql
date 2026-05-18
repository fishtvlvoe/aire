-- 006_case_fields.sql: 案件表單欄位擴充 + 品牌文字設定
-- migration 系統確保此檔只執行一次，不需 IF NOT EXISTS

ALTER TABLE cases ADD COLUMN case_name TEXT;
ALTER TABLE cases ADD COLUMN building_lot_no TEXT;
ALTER TABLE cases ADD COLUMN asking_price INTEGER;

-- 確保 branding 表存在（此 migration 可能先於 branding ensure_schema 執行）
CREATE TABLE IF NOT EXISTS branding (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  logo_blob BLOB,
  logo_mime TEXT CHECK (logo_mime IN ('image/png', 'image/jpeg')),
  logo_uploaded_at TEXT,
  theme_id TEXT NOT NULL DEFAULT 'theme-a-minimal',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT OR IGNORE INTO branding (id, theme_id, updated_at)
VALUES (1, 'theme-a-minimal', datetime('now'));

ALTER TABLE branding ADD COLUMN agent_name TEXT;
ALTER TABLE branding ADD COLUMN agent_cert_no TEXT;
ALTER TABLE branding ADD COLUMN company_name TEXT;
ALTER TABLE branding ADD COLUMN company_license_no TEXT;
ALTER TABLE branding ADD COLUMN company_address TEXT;
ALTER TABLE branding ADD COLUMN company_phone TEXT;
ALTER TABLE branding ADD COLUMN realtor_name TEXT;
