-- Migration 011: expand case_assets from floor_plan-only to MVP disclosure image slots.

PRAGMA foreign_keys = OFF;

CREATE TABLE IF NOT EXISTS case_assets_next (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (
    kind IN (
      'company_logo',
      'floor_plan',
      'exterior_photo',
      'location_map',
      'surrounding_map',
      'cadastral_map',
      'field_survey_photo',
      'other_site_photo'
    )
  ),
  source TEXT NOT NULL CHECK (
    source IN (
      'manual_upload',
      'legacy_floor_plan_photo',
      'auto_generated',
      'api_generated'
    )
  ),
  trust_tier TEXT NOT NULL CHECK (
    trust_tier IN (
      'assistant_uploaded',
      'legacy_import',
      'system_generated'
    )
  ),
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

INSERT OR IGNORE INTO case_assets_next (
  id,
  case_id,
  kind,
  source,
  trust_tier,
  review_status,
  is_primary,
  file_name,
  mime_type,
  size_bytes,
  storage_path,
  metadata_json,
  created_at,
  updated_at
)
SELECT
  id,
  case_id,
  kind,
  source,
  trust_tier,
  review_status,
  is_primary,
  file_name,
  mime_type,
  size_bytes,
  storage_path,
  metadata_json,
  created_at,
  updated_at
FROM case_assets;

DROP TABLE case_assets;
ALTER TABLE case_assets_next RENAME TO case_assets;

CREATE INDEX IF NOT EXISTS idx_case_assets_case_kind_primary
  ON case_assets(case_id, kind, is_primary, updated_at);

CREATE INDEX IF NOT EXISTS idx_case_assets_case_kind_status
  ON case_assets(case_id, kind, review_status);

PRAGMA foreign_keys = ON;

PRAGMA user_version = 8;
