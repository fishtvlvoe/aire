-- land_registry cache table (Phase 3 #2a Stage 1)

CREATE TABLE IF NOT EXISTS land_registry_cache (
  cache_key TEXT PRIMARY KEY,
  parcel_id TEXT NOT NULL,
  api_id TEXT NOT NULL,
  query_date TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);

CREATE INDEX IF NOT EXISTS idx_land_registry_cache_parcel_date
  ON land_registry_cache(parcel_id, query_date);

CREATE INDEX IF NOT EXISTS idx_land_registry_cache_api
  ON land_registry_cache(api_id);
