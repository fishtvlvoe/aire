import bcrypt from 'bcryptjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

const sendPasswordResetEmailMock = vi.fn(async () => undefined);
vi.mock('@/lib/email', () => ({
  sendPasswordResetEmail: (...args: unknown[]) => sendPasswordResetEmailMock(...args),
}));

import { POST } from './route';

describe('POST /api/auth/forgot-password', () => {
  beforeEach(() => {
    db.prepare('DELETE FROM users').run();
    sendPasswordResetEmailMock.mockReset();
    process.env.NEXTAUTH_SECRET = 'dev-secret-for-testing-only';
    process.env.NEXTAUTH_URL = 'http://localhost:3000';

    const hash = bcrypt.hashSync('pass123', 10);
    db.prepare(
      `INSERT INTO users (username, email, password_hash, display_name, role, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run('agent@realty.com', 'agent@realty.com', hash, 'Agent', 'agent', 1);
  });

  it('returns 200 and sends email when account exists', async () => {
    const request = new NextRequest('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'agent@realty.com' }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request);
    const body = (await response.json()) as { message: string };

    expect(response.status).toBe(200);
    expect(body.message).toBe('如果帳號存在，重設連結已發送至您的信箱');
    expect(sendPasswordResetEmailMock).toHaveBeenCalledTimes(1);
    expect(sendPasswordResetEmailMock.mock.calls[0]?.[0]).toBe('agent@realty.com');
    expect(String(sendPasswordResetEmailMock.mock.calls[0]?.[1] ?? '')).toContain('/reset-password?token=');
  });

  it('returns same 200 response and does not send email when account does not exist', async () => {
    const request = new NextRequest('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'nobody@example.com' }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request);
    const body = (await response.json()) as { message: string };

    expect(response.status).toBe(200);
    expect(body.message).toBe('如果帳號存在，重設連結已發送至您的信箱');
    expect(sendPasswordResetEmailMock).not.toHaveBeenCalled();
  });

  it('returns 400 when email is missing', async () => {
    const request = new NextRequest('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request);
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(body.error).toBe('請輸入 Email');
  });
});
