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
  field_visit_status TEXT NOT NULL DEFAULT 'draft',
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
  // SQLite does not support ADD COLUMN IF NOT EXISTS; check pragma_table_info first
  const columns = (db.pragma('table_info(listings)') as Array<{ name: string }>).map((c) => c.name);
  if (!columns.includes('pre_commission_data')) {
    try {
      db.exec('ALTER TABLE listings ADD COLUMN pre_commission_data TEXT');
    } catch {
      // column was added by a concurrent process; safe to ignore
    }
  }
  if (!columns.includes('market_summary')) {
    try {
      db.exec('ALTER TABLE listings ADD COLUMN market_summary TEXT');
    } catch {
      // column was added by a concurrent process; safe to ignore
    }
  }
  if (!columns.includes('attachments')) {
    try {
      db.exec('ALTER TABLE listings ADD COLUMN attachments TEXT');
    } catch {
      // column was added by a concurrent process; safe to ignore
    }
  }
}
