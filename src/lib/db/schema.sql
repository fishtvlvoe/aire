CREATE TABLE IF NOT EXISTS listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_type TEXT NOT NULL CHECK (property_type IN ('residential', 'farmland')),
  field_visit_status TEXT NOT NULL DEFAULT 'draft' CHECK (
    field_visit_status IN ('draft', 'field-visit-incomplete', 'field-visit-complete')
  ),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'field-visit-complete', 'ready-for-generation', 'documents-ready')
  ),
  field_visit_data TEXT,
  supplementary_data TEXT,
  generated_documents TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TRIGGER IF NOT EXISTS update_listings_updated_at
  AFTER UPDATE ON listings
  FOR EACH ROW
BEGIN
  UPDATE listings SET updated_at = datetime('now') WHERE id = OLD.id;
END;
