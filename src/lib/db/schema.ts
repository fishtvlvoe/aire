import bcrypt from 'bcryptjs';
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

  // 建立預設 admin 帳號（只在沒有 admin 時才 hash，避免每次初始化都跑 bcrypt）
  const adminRow = db.prepare("SELECT id FROM users WHERE email = 'admin@local' LIMIT 1").get();
  if (!adminRow) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare(
      "INSERT OR IGNORE INTO users (email, password_hash, display_name, role) VALUES (?, ?, ?, 'admin')"
    ).run('admin@local', hash, '系統管理員');
  }
}
