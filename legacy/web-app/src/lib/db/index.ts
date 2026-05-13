import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { PROPERTY_TYPES, type PropertyType } from '../property-types';
import { executeListRecentListings } from './list-recent-helper';
import { initDb } from './schema';

const DB_PATH = process.env.DATABASE_PATH || process.env.DB_PATH || './data/listings.db';
const dbDir = path.dirname(DB_PATH);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(DB_PATH);

export function runAuthLicenseMigration(database: Database.Database): void {
  const migrationPath = path.join(process.cwd(), 'migrations', '004_auth_license.sql');
  const migrationSql = fs.readFileSync(migrationPath, 'utf-8');
  database.exec(migrationSql);

  const userColumns = (database.pragma('table_info(users)') as Array<{ name: string }>).map((column) => column.name);
  if (!userColumns.includes('username')) {
    database.exec('ALTER TABLE users ADD COLUMN username TEXT');
    database.exec("UPDATE users SET username = email WHERE username IS NULL");
    database.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username)');
  }
}

export function runVendorAccountMigration(database: Database.Database): void {
  // 檢查 users 表是否已有 is_vendor 欄位，避免重複 ALTER TABLE
  const userColumns = (database.pragma('table_info(users)') as Array<{ name: string }>).map((column) => column.name);
  if (!userColumns.includes('is_vendor')) {
    const migrationPath = path.join(process.cwd(), 'migrations', '005_vendor_account.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf-8');
    database.exec(migrationSql);
  }
}

// Run schema on initialization
initDb(db);
runAuthLicenseMigration(db);
runVendorAccountMigration(db);

// 建立 templates 表（若不存在）
const _tables = (db.pragma('table_list') as Array<{ name: string }>).map(t => t.name);
if (!_tables.includes('templates')) {
  db.exec(`
    CREATE TABLE templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      doc_type TEXT NOT NULL DEFAULT 'disclosure',
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}

// Enable WAL mode for better concurrent read performance
// (WAL is not supported for in-memory DBs used in tests)
if (DB_PATH !== ':memory:') {
  db.pragma('journal_mode = WAL');
}

export { db };
export { PROPERTY_TYPES } from '../property-types';

export type { PropertyType };
export type ListingStatus = 'pre-commission' | 'draft' | 'field-visit-complete' | 'ready-for-generation' | 'documents-ready';
export type FieldVisitStatus = 'draft' | 'field-visit-incomplete' | 'field-visit-complete';

export interface Listing {
  id: number;
  property_type: PropertyType;
  field_visit_status: FieldVisitStatus;
  status: ListingStatus;
  field_visit_data: string | null;
  supplementary_data: string | null;
  generated_documents: string | null;
  pre_commission_data: string | null;
  /** 業務人工填寫的周邊行情摘要，最多 500 字元 */
  market_summary: string | null;
  /** JSON array of attachment metadata：`[{ id, filename, type, path, size, uploaded_at }]` */
  attachments: string | null;
  /** OCR 萃取結果 JSON（ExtractedDataPayload）；尚未萃取時為 null */
  extracted_data: string | null;
  /** 建立者 user_id（null = 系統建立或未認證前的資料） */
  owner_id: number | null;
  /** 所屬資料夾 id；null = 未分類 */
  folder_id: number | null;
  /** 封存時間；null = 未封存 */
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

/** 附件 metadata 結構（儲存於 listings.attachments JSON 字串內） */
export interface AttachmentMeta {
  id: string;
  filename: string;
  /** 附件分類（由 /api/listings/[id]/attachments 控制允許值） */
  type:
    | 'market_research'
    | 'field_visit'
    | 'transcript'
    | 'title-deed'
    | 'contract'
    | 'cadastral-map';
  path: string;
  size: number;
  mime: string;
  uploaded_at: string;
}

export interface PreCommissionData {
  owner_name: string;
  owner_phone: string;
  parcel_number: string;
  [key: string]: unknown;
}

export function getListing(id: number): Listing | undefined {
  return db.prepare('SELECT * FROM listings WHERE id = ?').get(id) as Listing | undefined;
}

export function getAllListings(ownerId?: number): Listing[] {
  if (ownerId !== undefined) {
    return db.prepare('SELECT * FROM listings WHERE owner_id = ? ORDER BY created_at DESC').all(ownerId) as Listing[];
  }
  return db.prepare('SELECT * FROM listings ORDER BY created_at DESC').all() as Listing[];
}

/**
 * 側邊欄最近物件清單，排除純空 draft 以避免 UI 被測試殘留淹沒
 * listRecentListings
 */
export function listRecentListings(limit: number = 10, ownerId?: number): Listing[] {
  return executeListRecentListings<Listing>(db, limit, ownerId);
}

export interface SearchListingsParams {
  /** agent 限制：只查自己的物件 */
  ownerId?: number;
  /** 資料夾篩選：數字 = 特定資料夾；'none' = 未分類；undefined = 全部 */
  folderId?: number | 'none';
  /** 封存狀態：'false'（預設）= 未封存；'true' = 已封存；'all' = 全部 */
  archived?: 'false' | 'true' | 'all';
  /** FTS5 全文搜尋關鍵字 */
  q?: string;
  limit?: number;
}

export function searchListings(params: SearchListingsParams = {}): Listing[] {
  const { ownerId, folderId, archived = 'false', q, limit = 50 } = params;

  const conditions: string[] = [];
  const sqlParams: (string | number)[] = [];

  if (ownerId !== undefined) {
    conditions.push('l.owner_id = ?');
    sqlParams.push(ownerId);
  }

  if (folderId === 'none') {
    conditions.push('l.folder_id IS NULL');
  } else if (typeof folderId === 'number') {
    conditions.push('l.folder_id = ?');
    sqlParams.push(folderId);
  }

  if (archived === 'false') {
    conditions.push('l.archived_at IS NULL');
  } else if (archived === 'true') {
    conditions.push('l.archived_at IS NOT NULL');
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  if (q && q.trim()) {
    const ftsQuery = q.trim().replace(/['"*]/g, '') + '*';
    const ftsWhere = conditions.length
      ? `${where} AND fts.listings_fts MATCH ?`
      : `WHERE fts.listings_fts MATCH ?`;
    const ftsParams = [...sqlParams, ftsQuery, limit];
    return db.prepare(`
      SELECT l.* FROM listings l
      JOIN listings_fts fts ON fts.rowid = l.id
      ${ftsWhere}
      ORDER BY l.updated_at DESC LIMIT ?
    `).all(...ftsParams) as Listing[];
  }

  return db.prepare(`
    SELECT l.* FROM listings l
    ${where}
    ORDER BY l.updated_at DESC LIMIT ?
  `).all(...sqlParams, limit) as Listing[];
}

export function createListing(propertyType: string, initialStatus: ListingStatus = 'draft', ownerId?: number): Listing {
  const propertyInfo = Object.prototype.hasOwnProperty.call(PROPERTY_TYPES, propertyType)
    ? PROPERTY_TYPES[propertyType as PropertyType]
    : undefined;

  if (!propertyInfo) {
    throw new Error('invalid-property-type');
  }

  if (!propertyInfo.available) {
    throw new Error('type-not-available');
  }

  const result = db
    .prepare(
      'INSERT INTO listings (propertyType, property_type, status, field_visit_status, owner_id) VALUES (?, ?, ?, ?, ?) RETURNING *'
    )
    .get(propertyType, propertyType, initialStatus, 'draft', ownerId ?? null) as Listing;
  writeAuditLog({
    action: 'create_listing',
    targetType: 'listing',
    targetId: result.id,
    userId: ownerId,
    detail: `建立物件：${propertyType}`,
  });
  return result;
}

export interface CreatePreCommissionInput {
  address?: string;
  property_type: string;
  owner_name: string;
  owner_phone: string;
  parcel_number: string;
}

export function createPreCommissionListing(data: CreatePreCommissionInput): Listing {
  const propertyInfo = Object.prototype.hasOwnProperty.call(PROPERTY_TYPES, data.property_type)
    ? PROPERTY_TYPES[data.property_type as PropertyType]
    : undefined;

  if (!propertyInfo) {
    throw new Error('invalid-property-type');
  }

  const preCommissionData: PreCommissionData = {
    owner_name: data.owner_name,
    owner_phone: data.owner_phone,
    parcel_number: data.parcel_number,
  };

  const result = db
    .prepare(
      `INSERT INTO listings (propertyType, property_type, status, field_visit_status, pre_commission_data)
       VALUES (?, ?, 'pre-commission', 'draft', ?) RETURNING *`
    )
    .get(
      data.property_type,
      data.property_type,
      JSON.stringify(preCommissionData)
    ) as Listing;
  return result;
}

export function advanceToFieldVisit(id: number): void {
  const listing = getListing(id);
  if (!listing) {
    throw new Error('listing-not-found');
  }
  if (listing.status !== 'pre-commission') {
    throw { code: 'invalid-transition', current: listing.status, expected: 'pre-commission' };
  }
  db.prepare("UPDATE listings SET status = 'field-visit-complete', field_visit_status = 'field-visit-complete' WHERE id = ?").run(id);
}

export function updateListingFieldVisit(
  id: number,
  data: Record<string, unknown>,
  status: FieldVisitStatus,
  userId?: number,
): void {
  const result = db.prepare(
    'UPDATE listings SET field_visit_data = ?, field_visit_status = ?, status = ? WHERE id = ?'
  ).run(JSON.stringify(data), status, status === 'field-visit-complete' ? 'field-visit-complete' : 'draft', id);
  if (result.changes > 0) {
    writeAuditLog({
      action: 'update_field_visit',
      targetType: 'listing',
      targetId: id,
      userId,
      detail: `現勘狀態：${status}`,
    });
  }
}

export function updateSupplementaryData(
  id: number,
  data: Record<string, unknown>,
  userId?: number,
): void {
  const result = db.prepare(
    'UPDATE listings SET supplementary_data = ?, status = ? WHERE id = ?'
  ).run(JSON.stringify(data), 'ready-for-generation', id);
  if (result.changes > 0) {
    writeAuditLog({
      action: 'update_supplementary',
      targetType: 'listing',
      targetId: id,
      userId,
      detail: '更新補充資料',
    });
  }
}

export function updateDocuments(
  id: number,
  docs: Record<string, unknown>
): void {
  db.prepare(
    'UPDATE listings SET generated_documents = ?, status = ? WHERE id = ?'
  ).run(JSON.stringify(docs), 'documents-ready', id);
}

export function updateStatus(id: number, status: ListingStatus): void {
  db.prepare('UPDATE listings SET status = ? WHERE id = ?').run(status, id);
}

/** 更新周邊行情摘要欄位（500 字元上限由 caller 驗證） */
export function updateMarketSummary(id: number, summary: string | null, userId?: number): void {
  const result = db.prepare('UPDATE listings SET market_summary = ? WHERE id = ?').run(summary, id);
  if (result.changes > 0) {
    writeAuditLog({
      action: 'update_market_summary',
      targetType: 'listing',
      targetId: id,
      userId,
      detail: summary === null ? '清除周邊行情摘要' : '更新周邊行情摘要',
    });
  }
}

/** 取得物件附件清單（解析 JSON；無資料回空陣列） */
export function getAttachments(id: number): AttachmentMeta[] {
  const row = db.prepare('SELECT attachments FROM listings WHERE id = ?').get(id) as
    | { attachments: string | null }
    | undefined;
  if (!row?.attachments) return [];
  try {
    const parsed = JSON.parse(row.attachments) as unknown;
    return Array.isArray(parsed) ? (parsed as AttachmentMeta[]) : [];
  } catch {
    return [];
  }
}

/** 整批寫入附件清單（覆蓋既有；caller 負責保留先前項目） */
export function setAttachments(id: number, attachments: AttachmentMeta[]): void {
  db.prepare('UPDATE listings SET attachments = ? WHERE id = ?').run(
    JSON.stringify(attachments),
    id,
  );
}

/** 新增單一附件（保留現有項目） */
export function addAttachment(id: number, attachment: AttachmentMeta): void {
  const current = getAttachments(id);
  setAttachments(id, [...current, attachment]);
}

/** 移除單一附件（依 id），回傳是否找到並刪除 */
export function removeAttachment(id: number, attachmentId: string): boolean {
  const current = getAttachments(id);
  const next = current.filter((a) => a.id !== attachmentId);
  if (next.length === current.length) return false;
  setAttachments(id, next);
  return true;
}

export function deleteListing(id: number): boolean {
  // Backward-compatible alias: public listing deletion must preserve the row.
  return archiveListing(id);
}

// ─── Folders ─────────────────────────────────────────────────────────────────

export interface Folder {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface FolderWithCount extends Folder {
  listing_count: number;
}

export function createFolder(name: string): Folder {
  try {
    const result = db.prepare(
      "INSERT INTO folders (name) VALUES (?)"
    ).run(name);
    return db.prepare('SELECT * FROM folders WHERE id = ?').get(result.lastInsertRowid) as Folder;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('UNIQUE constraint')) throw new Error('資料夾名稱已存在');
    throw err;
  }
}

export function getFolder(id: number): Folder | undefined {
  return db.prepare('SELECT * FROM folders WHERE id = ?').get(id) as Folder | undefined;
}

export function getAllFolders(): FolderWithCount[] {
  return db.prepare(`
    SELECT f.*, COUNT(l.id) as listing_count
    FROM folders f
    LEFT JOIN listings l ON l.folder_id = f.id AND l.archived_at IS NULL
    GROUP BY f.id
    ORDER BY f.name ASC
  `).all() as FolderWithCount[];
}

export function renameFolder(id: number, name: string): boolean {
  try {
    const result = db.prepare(
      "UPDATE folders SET name = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(name, id);
    return result.changes > 0;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('UNIQUE constraint')) throw new Error('資料夾名稱已存在');
    throw err;
  }
}

export function deleteFolder(id: number): boolean {
  // ON DELETE SET NULL 已在 schema 定義，直接刪除即可
  const result = db.prepare('DELETE FROM folders WHERE id = ?').run(id);
  return result.changes > 0;
}

export function moveListingToFolder(listingId: number, folderId: number | null): boolean {
  const result = db.prepare(
    "UPDATE listings SET folder_id = ? WHERE id = ?"
  ).run(folderId, listingId);
  return result.changes > 0;
}

// ─── Audit Log ──────────────────────────────────────────────────────────────

export function writeAuditLog(entry: {
  action: string;
  targetType: string;
  targetId?: number;
  userId?: number;
  detail?: string;
}): void {
  db.prepare(
    "INSERT INTO audit_logs (action, target_type, target_id, user_id, detail) VALUES (?, ?, ?, ?, ?)"
  ).run(entry.action, entry.targetType, entry.targetId ?? null, entry.userId ?? null, entry.detail ?? null);
}

// ─── Archive / Restore ───────────────────────────────────────────────────────

export function archiveListing(id: number, userId?: number): boolean {
  const result = db.prepare(
    "UPDATE listings SET archived_at = datetime('now') WHERE id = ? AND archived_at IS NULL"
  ).run(id);
  if (result.changes > 0) {
    writeAuditLog({ action: "archive_listing", targetType: "listing", targetId: id, userId, detail: `封存物件 #${id}` });
  }
  return result.changes > 0;
}

export function restoreListing(id: number, userId?: number): boolean {
  const result = db.prepare(
    "UPDATE listings SET archived_at = NULL WHERE id = ? AND archived_at IS NOT NULL"
  ).run(id);
  if (result.changes > 0) {
    writeAuditLog({ action: "restore_listing", targetType: "listing", targetId: id, userId, detail: `還原封存物件 #${id}` });
  }
  return result.changes > 0;
}

// ─── Templates ───────────────────────────────────────────────────────────────

export interface Template {
  id: number;
  name: string;
  description: string | null;
  doc_type: string;
  is_default: number;
  created_at: string;
  updated_at: string;
}

/** 依 id 取得單一模板 */
export function getTemplate(id: number): Template | undefined {
  return db.prepare('SELECT * FROM templates WHERE id = ?').get(id) as Template | undefined;
}

/** 取得所有模板，可依 doc_type 篩選 */
export function getAllTemplates(docType?: string): Template[] {
  if (docType) {
    return db.prepare('SELECT * FROM templates WHERE doc_type = ? ORDER BY created_at DESC').all(docType) as Template[];
  }
  return db.prepare('SELECT * FROM templates ORDER BY created_at DESC').all() as Template[];
}

/** 建立新模板記錄 */
export function createTemplate(meta: { name: string; description?: string; doc_type: string }): Template {
  const result = db.prepare(
    'INSERT INTO templates (name, description, doc_type) VALUES (?, ?, ?) RETURNING *'
  ).get(meta.name, meta.description ?? null, meta.doc_type) as Template;
  return result;
}

/** 刪除模板，回傳是否成功 */
export function deleteTemplate(id: number): boolean {
  const result = db.prepare('DELETE FROM templates WHERE id = ?').run(id);
  return result.changes > 0;
}

/** 將指定模板設為該 doc_type 的預設（同時清除同類型其他預設） */
export function setDefaultTemplate(id: number, docType: string): void {
  db.prepare('UPDATE templates SET is_default = 0 WHERE doc_type = ?').run(docType);
  db.prepare('UPDATE templates SET is_default = 1 WHERE id = ?').run(id);
}
