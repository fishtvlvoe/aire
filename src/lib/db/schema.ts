import type Database from 'better-sqlite3';

const LISTINGS_SCHEMA = `
CREATE TABLE IF NOT EXISTS listings (
  id INTEGER PRIMARY KEY,
  address TEXT,
  propertyType TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  field_visit_data TEXT,
  supplementary_data TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  property_type TEXT,
  field_visit_status TEXT,
  generated_documents TEXT
);

CREATE TRIGGER IF NOT EXISTS update_listings_updated_at
  AFTER UPDATE ON listings
  FOR EACH ROW
BEGIN
  UPDATE listings SET updated_at = datetime('now') WHERE id = OLD.id;
END;
`;

export function initDb(db: Database.Database): void {
  db.exec(LISTINGS_SCHEMA);
}
