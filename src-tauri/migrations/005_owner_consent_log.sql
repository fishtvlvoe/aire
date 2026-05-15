CREATE TABLE IF NOT EXISTS owner_consent_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id TEXT NOT NULL,
  timestamp TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  user_email TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_consent_case_id
  ON owner_consent_log(case_id);
