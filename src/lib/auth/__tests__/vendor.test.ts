/**
 * vendor.test.ts
 *
 * 測試範圍：
 *   4.1 provisionVendorAccount — 建立 / 更新 vendor 帳號
 *   4.2 用戶列表排除 vendor — SQL WHERE 過濾
 *   4.3 hasUsers 考量 — vendor 存在時 COUNT(*) > 0
 *   4.4 vendor 登入 — authorizeCredentials 可通過
 */

import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { generateKeyPairSync, sign } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// mock next/headers（必須在頂層宣告，Vitest hoisting 才能正確攔截）
const mockCookiesSet = vi.fn();
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ set: mockCookiesSet }),
}));

// ─── 建立 in-memory DB 並初始化 schema ──────────────────────────────────────

function buildTestDb(): Database.Database {
  const db = new Database(':memory:');

  // users 表（與 production schema 對應，含所有欄位）
  db.exec(`
    CREATE TABLE users (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      username     TEXT    UNIQUE NOT NULL,
      email        TEXT    UNIQUE NOT NULL,
      password_hash TEXT   NOT NULL,
      display_name TEXT    NOT NULL DEFAULT '',
      role         TEXT    NOT NULL CHECK(role IN ('admin','agent')) DEFAULT 'agent',
      is_active    INTEGER NOT NULL DEFAULT 1,
      is_vendor    INTEGER NOT NULL DEFAULT 0,
      created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // refresh_tokens 表（4.4 authorizeCredentials 需要）
  db.exec(`
    CREATE TABLE refresh_tokens (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL REFERENCES users(id),
      token_hash TEXT    NOT NULL UNIQUE,
      expires_at TEXT    NOT NULL,
      revoked    INTEGER NOT NULL DEFAULT 0,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // sessions 表（authorizeCredentials 現在也建立自建 session）
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id         TEXT    PRIMARY KEY,
      user_id    INTEGER NOT NULL REFERENCES users(id),
      expires_at TEXT    NOT NULL,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);

  return db;
}

// ─── mock @/lib/db，讓各模組共用同一個 test DB ──────────────────────────────

let testDb: Database.Database;

vi.mock('@/lib/db', () => ({
  get db() {
    return testDb;
  },
}));

// ─── 動態 import（必須在 mock 宣告後才 import，讓 hoisting 正確運作）─────────

const { provisionVendorAccount } = await import('@/lib/auth/vendor');
const { getUserByUsername, createRefreshToken, generateRefreshToken } = await import('@/lib/auth/db');
const { authorizeCredentials } = await import('@/app/api/auth/[...nextauth]/route');

const keyPair = generateKeyPairSync('ed25519');
const publicKeyPem = keyPair.publicKey.export({ type: 'spki', format: 'pem' }).toString();
const privateKeyPem = keyPair.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();

function createLicenseKey(expires: string): string {
  const payload = Buffer.from(
    JSON.stringify({ company: 'AIRE', expires, version: 1 }),
    'utf8'
  ).toString('base64url');
  const signature = sign(null, Buffer.from(payload, 'utf8'), privateKeyPem);
  return `${payload}.${Buffer.from(signature).toString('base64url')}`;
}

// ─── 每個 describe 前重建乾淨的 DB ──────────────────────────────────────────

beforeEach(() => {
  testDb = buildTestDb();
  process.env.LICENSE_PUBLIC_KEY = publicKeyPem;
});

// ════════════════════════════════════════════════════════════════════════════
// 4.1  provisionVendorAccount
// ════════════════════════════════════════════════════════════════════════════

describe('4.1 provisionVendorAccount', () => {
  const credentials = {
    username: 'vendor_test',
    passwordHash: 'hashed_pw_v1',
    displayName: '測試廠商',
  };

  it('(a) 首次呼叫 → 建立 vendor 帳號，欄位值正確', () => {
    provisionVendorAccount(credentials);

    const row = testDb
      .prepare('SELECT * FROM users WHERE username = ?')
      .get(credentials.username) as Record<string, unknown> | undefined;

    expect(row).toBeDefined();
    expect(row!.is_vendor).toBe(1);
    expect(row!.role).toBe('admin');
    expect(row!.email).toBe(`${credentials.username}@vendor.AIRE.app`);
    expect(row!.password_hash).toBe(credentials.passwordHash);
    expect(row!.display_name).toBe(credentials.displayName);
  });

  it('(a) 首次呼叫 → users 表只有一筆紀錄', () => {
    provisionVendorAccount(credentials);

    const count = (
      testDb.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }
    ).c;

    expect(count).toBe(1);
  });

  it('(b) 同 username 第二次呼叫 → 更新密碼與顯示名稱，不產生重複紀錄', () => {
    // 第一次建立
    provisionVendorAccount(credentials);

    // 第二次更新
    const updated = {
      ...credentials,
      passwordHash: 'hashed_pw_v2',
      displayName: '廠商（改名）',
    };
    provisionVendorAccount(updated);

    // 仍只有一筆
    const count = (
      testDb.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }
    ).c;
    expect(count).toBe(1);

    // 欄位已更新
    const row = testDb
      .prepare('SELECT * FROM users WHERE username = ?')
      .get(credentials.username) as Record<string, unknown>;

    expect(row.password_hash).toBe('hashed_pw_v2');
    expect(row.display_name).toBe('廠商（改名）');
    // email / role / is_vendor 不應改變
    expect(row.email).toBe(`${credentials.username}@vendor.AIRE.app`);
    expect(row.role).toBe('admin');
    expect(row.is_vendor).toBe(1);
  });

  it('(c) 不呼叫時 users 表無 vendor 帳號（基線驗證）', () => {
    const rows = testDb
      .prepare('SELECT * FROM users WHERE is_vendor = 1')
      .all();

    expect(rows).toHaveLength(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 4.2  用戶列表排除 vendor
// ════════════════════════════════════════════════════════════════════════════

describe('4.2 用戶列表 SQL 排除 vendor', () => {
  beforeEach(() => {
    // 插入一般帳號
    testDb
      .prepare(
        "INSERT INTO users (username, email, password_hash, display_name, role, is_vendor) VALUES (?, ?, ?, ?, 'agent', 0)"
      )
      .run('normal_user', 'normal@example.com', 'hash', '一般用戶');

    // 插入 vendor 帳號
    testDb
      .prepare(
        "INSERT INTO users (username, email, password_hash, display_name, role, is_vendor) VALUES (?, ?, ?, ?, 'admin', 1)"
      )
      .run('vendor_acc', 'vendor_acc@vendor.AIRE.app', 'hash', '廠商帳號');

    // 插入 is_vendor IS NULL（舊資料，視同一般帳號）
    testDb
      .prepare(
        "INSERT INTO users (username, email, password_hash, display_name, role) VALUES (?, ?, ?, ?, 'agent')"
      )
      .run('legacy_user', 'legacy@example.com', 'hash', '舊版用戶');
  });

  it('WHERE (is_vendor = 0 OR is_vendor IS NULL) 只回傳非 vendor 帳號', () => {
    const rows = testDb
      .prepare(
        'SELECT id, username, email FROM users WHERE (is_vendor = 0 OR is_vendor IS NULL) ORDER BY created_at ASC'
      )
      .all() as Array<{ username: string }>;

    const usernames = rows.map((r) => r.username);

    expect(usernames).toContain('normal_user');
    expect(usernames).toContain('legacy_user');
    expect(usernames).not.toContain('vendor_acc');
    expect(rows).toHaveLength(2);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 4.3  hasUsers 考量
// ════════════════════════════════════════════════════════════════════════════

describe('4.3 hasUsers — 只有 vendor 帳號時應回傳 true', () => {
  /**
   * middleware.ts 的 hasUsers() 直接用 COUNT(*) 不過濾 is_vendor，
   * 因此只要 users 表有任何一筆紀錄（含 vendor）就回傳 true。
   * 此測試直接驗證 SQL 邏輯，不 import middleware（避免 next/server 依賴）。
   */
  function hasUsers(): boolean {
    const row = testDb
      .prepare('SELECT COUNT(*) as count FROM users')
      .get() as { count: number } | undefined;
    return (row?.count ?? 0) > 0;
  }

  it('空表 → false', () => {
    expect(hasUsers()).toBe(false);
  });

  it('只有 vendor 帳號 → true（不重導到 first-admin-setup）', () => {
    provisionVendorAccount({
      username: 'vendor_only',
      passwordHash: 'some_hash',
      displayName: '唯一廠商',
    });

    expect(hasUsers()).toBe(true);
  });

  it('一般帳號 + vendor 帳號 → true', () => {
    testDb
      .prepare(
        "INSERT INTO users (username, email, password_hash, display_name, role, is_vendor) VALUES ('agent1', 'agent1@ex.com', 'h', 'Agent', 'agent', 0)"
      )
      .run();

    provisionVendorAccount({
      username: 'vendor_mix',
      passwordHash: 'some_hash',
      displayName: '廠商混合',
    });

    expect(hasUsers()).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 4.4  vendor 登入 — authorizeCredentials
// ════════════════════════════════════════════════════════════════════════════

describe('4.4 vendor 帳號可通過 authorizeCredentials 登入', () => {
  const PLAIN_PASSWORD = 'Secret123!';
  const VENDOR_USERNAME = 'vendor_login_test';

  beforeEach(() => {
    // 建立已雜湊密碼的 vendor 帳號
    const hash = bcrypt.hashSync(PLAIN_PASSWORD, 10);
    provisionVendorAccount({
      username: VENDOR_USERNAME,
      passwordHash: hash,
      displayName: '登入測試廠商',
    });
  });

  it('正確密碼 → 回傳 { id, name }', async () => {
    const result = await authorizeCredentials({
      username: VENDOR_USERNAME,
      password: PLAIN_PASSWORD,
      licenseKey: createLicenseKey('2027-12-31T00:00:00+08:00'),
      mode: 'customer',
    });

    expect(result).not.toBeNull();
    expect(result!.name).toBe(VENDOR_USERNAME);
    expect(typeof result!.id).toBe('string');
  });

  it('錯誤密碼 → 回傳 null', async () => {
    const result = await authorizeCredentials({
      username: VENDOR_USERNAME,
      password: 'wrong_password',
      licenseKey: createLicenseKey('2027-12-31T00:00:00+08:00'),
      mode: 'customer',
    });

    expect(result).toBeNull();
  });

  it('不存在的 username → 回傳 null', async () => {
    const result = await authorizeCredentials({
      username: 'non_existent_vendor',
      password: PLAIN_PASSWORD,
      licenseKey: createLicenseKey('2027-12-31T00:00:00+08:00'),
      mode: 'customer',
    });

    expect(result).toBeNull();
  });

  it('credentials 為 undefined → 回傳 null', async () => {
    const result = await authorizeCredentials(undefined);

    expect(result).toBeNull();
  });
});
