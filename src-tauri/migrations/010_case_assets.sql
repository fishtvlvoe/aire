-- Migration 010: 案件本機資產（bridge：格局圖 / 土地規劃圖 raster）

CREATE TABLE IF NOT EXISTS case_assets (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('floor_plan')),
  source TEXT NOT NULL CHECK (source IN ('manual_upload', 'legacy_floor_plan_photo')),
  trust_tier TEXT NOT NULL CHECK (trust_tier IN ('assistant_uploaded', 'legacy_import')),
  review_status TEXT NOT NULL DEFAULT 'approved' CHECK (review_status IN ('approved')),
  is_primary INTEGER NOT NULL DEFAULT 1 CHECK (is_primary IN (0, 1)),
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL CHECK (mime_type IN ('image/png', 'image/jpeg', 'image/webp')),
  size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
  storage_path TEXT NOT NULL,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_case_assets_case_kind_primary
  ON case_assets(case_id, kind, is_primary, updated_at);

CREATE INDEX IF NOT EXISTS idx_case_assets_case_kind_status
  ON case_assets(case_id, kind, review_status);

PRAGMA user_version = 7;
