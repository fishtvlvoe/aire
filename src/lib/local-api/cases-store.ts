/**
 * Node 本機 SQLite cases store
 *
 * 設計依據：
 *   openspec/changes/browser-local-runtime-mvp/design.md
 *   Decision 4（本機資料目錄）、Decision 5（Rust IPC 搬 Node）
 *
 * 資料庫：getDbDir()/aire.db（單檔 SQLite）
 * 欄位集：對齊 Rust migration 001_initial.sql + 006_case_fields.sql 最小集合
 *
 * ⚠️  此模組使用 better-sqlite3（同步 API），禁止前端 client bundle 引入。
 */

import path from "node:path";
import { randomUUID } from "node:crypto";
import type { CaseRow, CreateCaseInput, UpdateCaseInput } from "./contract";
import { getDbDir } from "./data-dir";

// ──────────────────────────────────────────────────────────────────────────────
// 資料庫初始化（lazy singleton）
// ──────────────────────────────────────────────────────────────────────────────

// 使用 require() 而非 import，避免 Next.js build 對 native addon 的靜態分析錯誤
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Database = require("better-sqlite3");

type BetterSqlite3Database = ReturnType<typeof Database>;

/** 模組層級資料庫連線（lazy init，reinitializeStore 可清除以模擬重啟） */
let _db: BetterSqlite3Database | null = null;

/**
 * 取得（或建立）資料庫連線，並確保 schema 已就緒。
 * 第一次呼叫時開啟 SQLite 檔、建表；後續呼叫回傳已開啟的連線。
 */
function getDb(): BetterSqlite3Database {
  if (_db) return _db;

  const dbPath = path.join(getDbDir(), "aire.db");
  _db = new Database(dbPath);

  // WAL 模式提升並發讀取效能
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");

  // 建立 cases 表（對齊 001_initial.sql + 006_case_fields.sql）
  _db.exec(`
    CREATE TABLE IF NOT EXISTS cases (
      id             TEXT PRIMARY KEY,
      case_no        TEXT,
      case_name      TEXT,
      property_type  TEXT NOT NULL CHECK(property_type IN ('residential','land','other')),
      land_lot_no    TEXT NOT NULL,
      building_lot_no TEXT,
      address        TEXT NOT NULL,
      owner_name     TEXT,
      status         TEXT NOT NULL CHECK(status IN ('draft','keyin','completed','exported')) DEFAULT 'draft',
      land_lots_json TEXT NOT NULL DEFAULT '[]',
      land_registry_json TEXT,
      current_step   INTEGER,
      asking_price   INTEGER,
      created_at     INTEGER NOT NULL,
      updated_at     INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_cases_updated_at ON cases(updated_at DESC);
  `);

  return _db;
}

// ──────────────────────────────────────────────────────────────────────────────
// 內部型別（SQLite 列原始格式）
// ──────────────────────────────────────────────────────────────────────────────

interface CaseDbRow {
  id: string;
  case_no: string | null;
  case_name: string | null;
  property_type: string;
  land_lot_no: string;
  building_lot_no: string | null;
  address: string;
  owner_name: string | null;
  status: string;
  land_lots_json: string;
  land_registry_json: string | null;
  current_step: number | null;
  asking_price: number | null;
  created_at: number;
  updated_at: number;
}

/** 將 DB 列轉換為前端 CaseRow 型別 */
function toRow(r: CaseDbRow): CaseRow {
  return {
    id: r.id,
    case_no: r.case_no,
    case_name: r.case_name,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    property_type: r.property_type as any,
    land_lot_no: r.land_lot_no,
    building_lot_no: r.building_lot_no,
    address: r.address,
    owner_name: r.owner_name,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    status: r.status as any,
    land_lots: r.land_lots_json ? (JSON.parse(r.land_lots_json) as string[]) : [],
    land_registry_data: r.land_registry_json
      ? (JSON.parse(r.land_registry_json) as Record<string, unknown>)
      : null,
    current_step: r.current_step ?? undefined,
    asking_price: r.asking_price,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

/** 取得目前 Unix timestamp（秒） */
function nowSec(): number {
  return Math.floor(Date.now() / 1000);
}

// ──────────────────────────────────────────────────────────────────────────────
// 公開 API
// ──────────────────────────────────────────────────────────────────────────────

/** 建立新案件並寫入 SQLite */
export async function createCase(input: CreateCaseInput): Promise<CaseRow> {
  const db = getDb();
  const now = nowSec();
  const id = randomUUID();

  const stmt = db.prepare(`
    INSERT INTO cases (
      id, case_no, case_name, property_type, land_lot_no, building_lot_no,
      address, owner_name, status, land_lots_json, land_registry_json,
      current_step, asking_price, created_at, updated_at
    ) VALUES (
      @id, @case_no, @case_name, @property_type, @land_lot_no, @building_lot_no,
      @address, @owner_name, 'draft', @land_lots_json, @land_registry_json,
      @current_step, @asking_price, @created_at, @updated_at
    )
  `);

  stmt.run({
    id,
    case_no: input.case_no ?? null,
    case_name: input.case_name ?? null,
    property_type: input.property_type,
    land_lot_no: input.land_lot_no,
    building_lot_no: input.building_lot_no ?? null,
    address: input.address,
    owner_name: input.owner_name ?? null,
    land_lots_json: JSON.stringify(input.land_lots ?? []),
    land_registry_json: input.land_registry_data
      ? JSON.stringify(input.land_registry_data)
      : null,
    current_step: input.current_step ?? null,
    asking_price: input.asking_price ?? null,
    created_at: now,
    updated_at: now,
  });

  // 重讀確保回傳值與 DB 狀態一致
  const created = db.prepare("SELECT * FROM cases WHERE id = ?").get(id) as CaseDbRow;
  return toRow(created);
}

/** 依 ID 讀取案件，找不到回傳 null */
export async function getCase(id: string): Promise<CaseRow | null> {
  const db = getDb();
  const row = db.prepare("SELECT * FROM cases WHERE id = ?").get(id) as CaseDbRow | undefined;
  return row ? toRow(row) : null;
}

/** 列出所有案件（依 updated_at 降序） */
export async function listCases(): Promise<CaseRow[]> {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM cases ORDER BY updated_at DESC").all() as CaseDbRow[];
  return rows.map(toRow);
}

/** 更新案件欄位（部分更新） */
export async function updateCase(id: string, input: UpdateCaseInput): Promise<CaseRow | null> {
  const db = getDb();

  // 先確認案件存在
  const existing = db.prepare("SELECT * FROM cases WHERE id = ?").get(id) as CaseDbRow | undefined;
  if (!existing) return null;

  const now = nowSec();

  // 動態組合 SET 子句（只更新有傳入的欄位）
  const sets: string[] = ["updated_at = @updated_at"];
  const params: Record<string, unknown> = { id, updated_at: now };

  if (input.case_no !== undefined) { sets.push("case_no = @case_no"); params.case_no = input.case_no; }
  if (input.case_name !== undefined) { sets.push("case_name = @case_name"); params.case_name = input.case_name; }
  if (input.property_type !== undefined) { sets.push("property_type = @property_type"); params.property_type = input.property_type; }
  if (input.land_lot_no !== undefined) { sets.push("land_lot_no = @land_lot_no"); params.land_lot_no = input.land_lot_no; }
  if (input.building_lot_no !== undefined) { sets.push("building_lot_no = @building_lot_no"); params.building_lot_no = input.building_lot_no; }
  if (input.address !== undefined) { sets.push("address = @address"); params.address = input.address; }
  if (input.owner_name !== undefined) { sets.push("owner_name = @owner_name"); params.owner_name = input.owner_name; }
  if (input.status !== undefined) { sets.push("status = @status"); params.status = input.status; }
  if (input.land_lots !== undefined) { sets.push("land_lots_json = @land_lots_json"); params.land_lots_json = JSON.stringify(input.land_lots); }
  if (input.land_registry_data !== undefined) { sets.push("land_registry_json = @land_registry_json"); params.land_registry_json = input.land_registry_data ? JSON.stringify(input.land_registry_data) : null; }
  if (input.current_step !== undefined) { sets.push("current_step = @current_step"); params.current_step = input.current_step; }
  if (input.asking_price !== undefined) { sets.push("asking_price = @asking_price"); params.asking_price = input.asking_price; }

  db.prepare(`UPDATE cases SET ${sets.join(", ")} WHERE id = @id`).run(params);

  const updated = db.prepare("SELECT * FROM cases WHERE id = ?").get(id) as CaseDbRow;
  return toRow(updated);
}

/**
 * 模擬 store 重啟（清記憶體連線，保留 SQLite 持久化資料）。
 * 測試用：呼叫後 getDb() 會重新開啟同一個 SQLite 檔，資料仍在。
 */
export async function reinitializeStore(): Promise<void> {
  if (_db) {
    _db.close();
    _db = null;
  }
}
