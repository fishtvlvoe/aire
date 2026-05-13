import bcrypt from 'bcryptjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import {
  createRefreshToken,
  createUser,
  getUserByUsername,
  getValidRefreshToken,
  revokeRefreshToken,
} from '@/lib/auth/db';

describe('auth db', () => {
  beforeEach(() => {
    db.prepare('DELETE FROM refresh_tokens').run();
    db.prepare('DELETE FROM users').run();
  });

  it('creates user with bcrypt cost 12 and fetches by username', async () => {
    const created = await createUser('admin', 'correct123');

    expect(created.username).toBe('admin');
    expect(created.password_hash).toContain('$12$');

    const loaded = getUserByUsername('admin');
    expect(loaded).not.toBeNull();
    expect(await bcrypt.compare('correct123', loaded!.password_hash)).toBe(true);
  });

  it('creates valid refresh token, then revokes it', async () => {
    const user = await createUser('admin', 'secret123');
    createRefreshToken(user.id, 'RT-001', '2999-01-01T00:00:00.000Z');

    const validToken = getValidRefreshToken('RT-001');
    expect(validToken).not.toBeNull();
    expect(validToken!.revoked).toBe(0);
    expect(validToken!.token_hash).not.toBe('RT-001');

    revokeRefreshToken('RT-001');
    const revokedToken = getValidRefreshToken('RT-001');
    expect(revokedToken).toBeNull();
  });
});

