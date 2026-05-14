CREATE TABLE IF NOT EXISTS branding (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  logo_blob BLOB,
  logo_mime TEXT CHECK (logo_mime IN ('image/png', 'image/jpeg')),
  logo_uploaded_at TEXT,
  theme_id TEXT NOT NULL DEFAULT 'theme-a-minimal',
  updated_at TEXT NOT NULL
);

-- 預設 row（singleton）
INSERT OR IGNORE INTO branding (id, theme_id, updated_at)
VALUES (1, 'theme-a-minimal', datetime('now'));
