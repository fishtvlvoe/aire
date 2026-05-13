import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { initDb } from '../schema';

function makeDb() {
  const db = new Database(':memory:');
  initDb(db);
  return db;
}

function insertListing(db: Database.Database, status: string) {
  const stmt = db.prepare(
    `INSERT INTO listings (property_type, propertyType, status, field_visit_status)
     VALUES ('apartment', 'apartment', ?, 'draft')`
  );
  const result = stmt.run(status) as { lastInsertRowid: number };
  return result.lastInsertRowid as number;
}

describe('state machine: pre-commission → field-visit', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = makeDb();
  });

  it('pre-commission 狀態可轉換到 field-visit-complete', () => {
    const id = insertListing(db, 'pre-commission');
    db.prepare("UPDATE listings SET status = 'field-visit-complete' WHERE id = ?").run(id);
    const row = db.prepare('SELECT status FROM listings WHERE id = ?').get(id) as { status: string };
    expect(row.status).toBe('field-visit-complete');
  });

  it('draft 狀態存在', () => {
    const id = insertListing(db, 'draft');
    const row = db.prepare('SELECT status FROM listings WHERE id = ?').get(id) as { status: string };
    expect(row.status).toBe('draft');
  });

  it('pre_commission_data 欄位存在且可寫入 JSON', () => {
    const id = insertListing(db, 'pre-commission');
    const data = { owner_name: '王小明', owner_phone: '0912345678', address: '台南市中西區' };
    db.prepare('UPDATE listings SET pre_commission_data = ? WHERE id = ?').run(JSON.stringify(data), id);
    const row = db.prepare('SELECT pre_commission_data FROM listings WHERE id = ?').get(id) as { pre_commission_data: string };
    expect(JSON.parse(row.pre_commission_data)).toMatchObject({ owner_name: '王小明' });
  });

  it('完整狀態流程：pre-commission → field-visit-complete → ready-for-generation → documents-ready', () => {
    const id = insertListing(db, 'pre-commission');
    const transitions = ['field-visit-complete', 'ready-for-generation', 'documents-ready'];
    for (const next of transitions) {
      db.prepare('UPDATE listings SET status = ? WHERE id = ?').run(next, id);
      const row = db.prepare('SELECT status FROM listings WHERE id = ?').get(id) as { status: string };
      expect(row.status).toBe(next);
    }
  });
});
