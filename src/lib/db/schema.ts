import type Database from 'better-sqlite3';

const USERS_SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin','agent')),
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

const SESSIONS_SCHEMA = `
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL
);
`;

const AUDIT_LOGS_SCHEMA = `
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id INTEGER,
  detail TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

const FOLDERS_SCHEMA = `
CREATE TABLE IF NOT EXISTS folders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

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
  db.exec(USERS_SCHEMA);
  db.exec(SESSIONS_SCHEMA);
  db.exec(AUDIT_LOGS_SCHEMA);
  db.exec(FOLDERS_SCHEMA);
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
  if (!columns.includes('extracted_data')) {
    try {
      db.exec('ALTER TABLE listings ADD COLUMN extracted_data TEXT');
    } catch {
      // column was added by a concurrent process; safe to ignore
    }
  }
  if (!columns.includes('owner_id')) {
    try {
      db.exec('ALTER TABLE listings ADD COLUMN owner_id INTEGER REFERENCES users(id)');
    } catch {
      // column was added by a concurrent process; safe to ignore
    }
  }
  if (!columns.includes('folder_id')) {
    try {
      db.exec('ALTER TABLE listings ADD COLUMN folder_id INTEGER REFERENCES folders(id) ON DELETE SET NULL');
    } catch {
      // safe to ignore
    }
  }
  if (!columns.includes('archived_at')) {
    try {
      db.exec('ALTER TABLE listings ADD COLUMN archived_at TEXT DEFAULT NULL');
    } catch {
      // safe to ignore
    }
  }

  // FTS5 虛擬表（搜尋用）
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS listings_fts USING fts5(
      address, property_type,
      content='listings', content_rowid='id'
    );
  `);
  // FTS5 同步觸發器
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS listings_fts_insert
      AFTER INSERT ON listings BEGIN
        INSERT INTO listings_fts(rowid, address, property_type)
        VALUES (new.id, COALESCE(new.address,''), COALESCE(new.property_type,''));
      END;
  `);
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS listings_fts_update
      AFTER UPDATE ON listings BEGIN
        INSERT INTO listings_fts(listings_fts, rowid, address, property_type)
        VALUES ('delete', old.id, COALESCE(old.address,''), COALESCE(old.property_type,''));
        INSERT INTO listings_fts(rowid, address, property_type)
        VALUES (new.id, COALESCE(new.address,''), COALESCE(new.property_type,''));
      END;
  `);
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS listings_fts_delete
      AFTER DELETE ON listings BEGIN
        INSERT INTO listings_fts(listings_fts, rowid, address, property_type)
        VALUES ('delete', old.id, COALESCE(old.address,''), COALESCE(old.property_type,''));
      END;
  `);

  // 不再自動建立預設 admin 帳號；改由 /setup/admin 流程建立首位管理員
}
