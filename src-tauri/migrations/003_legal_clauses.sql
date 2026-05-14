CREATE TABLE IF NOT EXISTS legal_clauses (
  law_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content_markdown TEXT NOT NULL,
  version_date TEXT NOT NULL,
  fetched_at TEXT NOT NULL,
  source_url TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS realtor_licenses (
  license_number TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('verified','not_found','expired')),
  verified_at TEXT NOT NULL,
  cache_expires_at TEXT NOT NULL
);
