-- Migration 009: 格局圖手稿與轉換紀錄

CREATE TABLE IF NOT EXISTS floor_plan_sketches (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  original_asset_id TEXT NOT NULL,
  original_sha256 TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'field_sketch' CHECK (source_type IN ('field_sketch')),
  version INTEGER NOT NULL,
  upload_note TEXT,
  uploaded_by TEXT,
  uploaded_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_floor_plan_sketches_case_version
  ON floor_plan_sketches(case_id, version);

CREATE INDEX IF NOT EXISTS idx_floor_plan_sketches_case
  ON floor_plan_sketches(case_id);

CREATE TABLE IF NOT EXISTS floor_plan_conversions (
  id TEXT PRIMARY KEY,
  sketch_id TEXT NOT NULL REFERENCES floor_plan_sketches(id) ON DELETE CASCADE,
  case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('draft', 'needs_correction', 'approved', 'rejected', 'revoked')),
  extracted_json TEXT NOT NULL DEFAULT '{}',
  manual_edits_json TEXT NOT NULL DEFAULT '{}',
  uncertainty_json TEXT NOT NULL DEFAULT '[]',
  renderer_version TEXT,
  rendered_asset_id TEXT,
  approval_checklist_json TEXT NOT NULL DEFAULT '{}',
  approved_by TEXT,
  approved_at TEXT,
  model_provider TEXT,
  model_id TEXT,
  prompt_template_version TEXT,
  response_fingerprint TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_floor_plan_conversions_case_status
  ON floor_plan_conversions(case_id, status);

CREATE INDEX IF NOT EXISTS idx_floor_plan_conversions_sketch
  ON floor_plan_conversions(sketch_id);
