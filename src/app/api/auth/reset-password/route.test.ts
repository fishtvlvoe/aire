import bcrypt from 'bcryptjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { createPasswordResetToken } from '@/lib/auth/password-reset-token';
import { POST } from './route';

describe('POST /api/auth/reset-password', () => {
  beforeEach(() => {
    db.prepare('DELETE FROM users').run();
    db.prepare('DELETE FROM audit_logs').run();
    process.env.NEXTAUTH_SECRET = 'dev-secret-for-testing-only';

    const hash = bcrypt.hashSync('old-password', 10);
    db.prepare(
      `INSERT INTO users (username, email, password_hash, display_name, role, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run('agent@realty.com', 'agent@realty.com', hash, 'Agent', 'agent', 1);
  });

  it('updates password for valid token and password', async () => {
    const token = createPasswordResetToken('agent@realty.com', process.env.NEXTAUTH_SECRET!, {
      expiresInSeconds: 900,
    });

    const request = new NextRequest('http://localhost/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password: 'MyNewPass456' }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request);
    const body = (await response.json()) as { message: string };

    expect(response.status).toBe(200);
    expect(body.message).toBe('密碼已重設，請重新登入');

    const row = db
      .prepare('SELECT password_hash FROM users WHERE email = ? LIMIT 1')
      .get('agent@realty.com') as { password_hash: string };
    expect(await bcrypt.compare('MyNewPass456', row.password_hash)).toBe(true);
  });

  it('returns 401 for expired token', async () => {
    const token = createPasswordResetToken('agent@realty.com', process.env.NEXTAUTH_SECRET!, {
      now: new Date('2026-05-09T00:00:00.000Z'),
      expiresInSeconds: 1,
    });

    const request = new NextRequest('http://localhost/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password: 'NewPass123' }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request);
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(401);
    expect(body.error).toBe('重設連結已過期，請重新申請');
  });

  it('returns 401 for invalid token', async () => {
    const request = new NextRequest('http://localhost/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: 'invalid.token.value', password: 'NewPass123' }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request);
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(401);
    expect(body.error).toBe('重設連結無效');
  });

  it('returns 401 when token email does not map to a user', async () => {
    const token = createPasswordResetToken('missing@realty.com', process.env.NEXTAUTH_SECRET!, {
      expiresInSeconds: 900,
    });

    const request = new NextRequest('http://localhost/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password: 'NewPass123' }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request);
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(401);
    expect(body.error).toBe('重設連結無效');
  });

  it('returns 400 when required fields are missing', async () => {
    const request = new NextRequest('http://localhost/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: '' }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request);
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(body.error).toBe('缺少必要欄位');
  });

  it('writes audit log on successful reset', async () => {
    const token = createPasswordResetToken('agent@realty.com', process.env.NEXTAUTH_SECRET!, {
      expiresInSeconds: 900,
    });

    const request = new NextRequest('http://localhost/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password: 'MyNewPass456' }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const audit = db.prepare(
      'SELECT action, target_type, target_id, detail FROM audit_logs ORDER BY id DESC LIMIT 1'
    ).get() as { action: string; target_type: string; target_id: number; detail: string };

    expect(audit.action).toBe('PASSWORD_RESET');
    expect(audit.target_type).toBe('user');
    expect(audit.target_id).toBeGreaterThan(0);
    expect(audit.detail).toContain('Forgot-password token flow');
  });
});
