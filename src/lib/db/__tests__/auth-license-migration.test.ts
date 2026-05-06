import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';
import { initDb } from '../schema';
import { runAuthLicenseMigration } from '../index';

describe('auth license migration', () => {
  it('creates refresh_tokens table and users.username column', () => {
    const db = new Database(':memory:');
    initDb(db);

    runAuthLicenseMigration(db);

    const userColumns = db.pragma('table_info(users)') as Array<{ name: string }>;
    expect(userColumns.some((column) => column.name === 'username')).toBe(true);

    const refreshTokenColumns = db.pragma('table_info(refresh_tokens)') as Array<{ name: string }>;
    expect(refreshTokenColumns.length).toBeGreaterThan(0);
    expect(refreshTokenColumns.some((column) => column.name === 'token_hash')).toBe(true);

    db.close();
  });
});
