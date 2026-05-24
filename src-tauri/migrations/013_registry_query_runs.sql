-- 013_registry_query_runs.sql: product-visible registry lookup ledger.

CREATE TABLE IF NOT EXISTS registry_query_runs (
  id TEXT PRIMARY KEY,
  case_id TEXT,
  registry_key TEXT NOT NULL,
  input_kind TEXT NOT NULL,
  input_address TEXT,
  normalized_address TEXT,
  office_code TEXT,
  office_name TEXT,
  section_code TEXT,
  section_name TEXT,
  land_no TEXT,
  building_no TEXT,
  suggested_type TEXT,
  confirmed_type TEXT,
  confirmation_status TEXT NOT NULL,
  status TEXT NOT NULL,
  cache_hit INTEGER NOT NULL DEFAULT 0,
  source_run_id TEXT,
  total_cost_cents INTEGER NOT NULL DEFAULT 0,
  r02_payload_json TEXT,
  cop_payload_json TEXT,
  generated_json TEXT,
  error_summary_json TEXT,
  fetched_at INTEGER,
  expires_at INTEGER,
  confirmed_at INTEGER,
  created_at INTEGER NOT NULL,
  refresh_reason TEXT,
  FOREIGN KEY(source_run_id) REFERENCES registry_query_runs(id)
);

CREATE INDEX IF NOT EXISTS idx_registry_query_runs_registry_key ON registry_query_runs(registry_key);
CREATE INDEX IF NOT EXISTS idx_registry_query_runs_case_id ON registry_query_runs(case_id);
CREATE INDEX IF NOT EXISTS idx_registry_query_runs_created_at ON registry_query_runs(created_at);
CREATE INDEX IF NOT EXISTS idx_registry_query_runs_status ON registry_query_runs(status);

CREATE TABLE IF NOT EXISTS registry_query_api_calls (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  api_id TEXT NOT NULL,
  service_name TEXT,
  method TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  http_status INTEGER,
  cop_code TEXT,
  cop_message TEXT,
  transaction_id TEXT,
  cost_cents INTEGER NOT NULL DEFAULT 0,
  request_summary_json TEXT,
  response_summary_json TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY(run_id) REFERENCES registry_query_runs(id)
);

CREATE INDEX IF NOT EXISTS idx_registry_query_api_calls_run_id ON registry_query_api_calls(run_id);
CREATE INDEX IF NOT EXISTS idx_registry_query_api_calls_api_id ON registry_query_api_calls(api_id);
CREATE INDEX IF NOT EXISTS idx_registry_query_api_calls_cop_code ON registry_query_api_calls(cop_code);
