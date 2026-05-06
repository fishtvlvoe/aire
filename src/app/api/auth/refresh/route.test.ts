import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { createRefreshToken, createUser, getValidRefreshToken } from '@/lib/auth/db';
import { POST } from './route';

describe('POST /api/auth/refresh', () => {
  beforeEach(async () => {
    db.prepare('DELETE FROM refresh_tokens').run();
    db.prepare('DELETE FROM users').run();
    await createUser('admin', 'secret123');
  });

  it('returns 401 when refresh token is missing or invalid', async () => {
    const request = new Request('http://localhost/api/auth/refresh', { method: 'POST' });
    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it('rotates valid refresh token and sets secure cookie', async () => {
    const user = db.prepare('SELECT id FROM users WHERE username = ?').get('admin') as { id: number };
    createRefreshToken(user.id, 'RT-001', '2999-01-01T00:00:00.000Z');

    const request = new Request('http://localhost/api/auth/refresh', {
      method: 'POST',
      headers: { cookie: 'refresh_token=RT-001' },
    });
    const response = await POST(request);
    const setCookie = response.headers.get('set-cookie') ?? '';

    expect(response.status).toBe(200);
    expect(setCookie).toContain('refresh_token=');
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('Secure');
    expect(setCookie).toContain('SameSite=strict');

    const oldTokenValid = getValidRefreshToken('RT-001');
    expect(oldTokenValid).toBeNull();

    const revokedRows = db
      .prepare('SELECT COUNT(*) as total FROM refresh_tokens WHERE revoked = 1')
      .get() as { total: number };
    expect(revokedRows.total).toBe(1);
  });
});
