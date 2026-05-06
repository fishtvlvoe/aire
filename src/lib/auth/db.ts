import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

const BCRYPT_COST = 12;

export interface AuthUser {
  id: number;
  username: string;
  password_hash: string;
}

export interface RefreshTokenRecord {
  id: number;
  user_id: number;
  token_hash: string;
  expires_at: string;
  revoked: number;
}

export class DuplicateUsernameError extends Error {
  constructor() {
    super('duplicate-username');
    this.name = 'DuplicateUsernameError';
  }
}

function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function getUserByUsername(username: string): AuthUser | null {
  const row = db
    .prepare('SELECT id, username, password_hash FROM users WHERE username = ? LIMIT 1')
    .get(username) as AuthUser | undefined;
  return row ?? null;
}

export async function createUser(username: string, password: string): Promise<AuthUser> {
  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  const columns = (db.pragma('table_info(users)') as Array<{ name: string }>).map((column) => column.name);
  const hasEmail = columns.includes('email');
  const hasDisplayName = columns.includes('display_name');
  const hasRole = columns.includes('role');

  const insertColumns = ['username', 'password_hash'];
  const insertValues: Array<string | number> = [username, passwordHash];

  if (hasEmail) {
    insertColumns.push('email');
    insertValues.push(`${username}@local`);
  }
  if (hasDisplayName) {
    insertColumns.push('display_name');
    insertValues.push(username);
  }
  if (hasRole) {
    insertColumns.push('role');
    insertValues.push('admin');
  }

  const placeholders = insertColumns.map(() => '?').join(', ');
  const selectUsernameExpr = columns.includes('username') ? 'username' : 'email';

  try {
    const inserted = db
      .prepare(
        `INSERT INTO users (${insertColumns.join(', ')}) VALUES (${placeholders}) RETURNING id, ${selectUsernameExpr} as username, password_hash`
      )
      .get(...insertValues) as AuthUser | undefined;

    if (!inserted) {
      throw new Error('user-not-created');
    }

    return inserted;
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      (error.message.includes('UNIQUE constraint failed: users.username')
      || error.message.includes('UNIQUE constraint failed: users.email'))
    ) {
      throw new DuplicateUsernameError();
    }
    throw error;
  }
}

export function createRefreshToken(userId: number, rawToken: string, expiresAt: string): RefreshTokenRecord {
  const inserted = db
    .prepare('INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?) RETURNING *')
    .get(userId, hashRefreshToken(rawToken), expiresAt) as RefreshTokenRecord | undefined;

  if (!inserted) {
    throw new Error('refresh-token-not-created');
  }

  return inserted;
}

export function revokeRefreshToken(rawToken: string): void {
  db.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE token_hash = ?').run(hashRefreshToken(rawToken));
}

export function getValidRefreshToken(rawToken: string): RefreshTokenRecord | null {
  const row = db
    .prepare(
      "SELECT id, user_id, token_hash, expires_at, revoked FROM refresh_tokens WHERE token_hash = ? AND revoked = 0 AND expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now') LIMIT 1"
    )
    .get(hashRefreshToken(rawToken)) as RefreshTokenRecord | undefined;

  return row ?? null;
}

export function generateRefreshToken(): string {
  return randomBytes(48).toString('base64url');
}
