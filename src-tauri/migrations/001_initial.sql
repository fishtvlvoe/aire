-- AIRE 桌面 App — 初始 SQLite schema
-- 依據：openspec/changes/aire-desktop-phase1/design.md D2
-- 時區一律 Asia/Taipei；時間欄位存 Unix timestamp（秒），顯示時前端轉換。

CREATE TABLE cases (
  id TEXT PRIMARY KEY,              -- UUID v4
  case_no TEXT,                     -- 案件編號（助理自填）
  property_type TEXT NOT NULL CHECK(property_type IN ('residential','land')),
  land_lot_no TEXT NOT NULL,        -- 地號
  address TEXT NOT NULL,            -- 地址
  owner_name TEXT,                  -- 屋主姓名
  status TEXT NOT NULL CHECK(status IN ('draft','completed','exported')) DEFAULT 'draft',
  created_at INTEGER NOT NULL,      -- Unix timestamp (秒)
  updated_at INTEGER NOT NULL
);
CREATE INDEX idx_cases_updated_at ON cases(updated_at DESC);

CREATE TABLE disclosure_drafts (
  case_id TEXT PRIMARY KEY REFERENCES cases(id) ON DELETE CASCADE,
  payload_json TEXT NOT NULL,       -- 表單欄位序列化（依 property_type 不同 schema）
  schema_version INTEGER NOT NULL DEFAULT 1,
  saved_at INTEGER NOT NULL
);

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
-- 預期 settings keys: license_status, license_key, license_verified_at,
--                     company_name, company_address, company_phone

CREATE TABLE operation_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  action TEXT NOT NULL,             -- 'license_verify','case_create','pdf_export', ...
  payload TEXT,                     -- JSON 附加資訊
  result TEXT NOT NULL CHECK(result IN ('ok','error'))
);
CREATE INDEX idx_op_log_ts ON operation_log(ts DESC);

PRAGMA user_version = 1;
