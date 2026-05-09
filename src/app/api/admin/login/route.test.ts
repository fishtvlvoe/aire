import bcrypt from 'bcryptjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { POST } from './route';

describe('POST /api/admin/login', () => {
  beforeEach(() => {
    db.prepare('DELETE FROM users').run();
  });

  it('returns 200 for valid admin credentials', async () => {
    db.prepare(
      `INSERT INTO users (username, email, password_hash, display_name, role, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run('admin@aire.com', 'admin@aire.com', bcrypt.hashSync('admin123', 10), 'Admin', 'admin', 1);

    const request = new NextRequest('http://localhost/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@aire.com', password: 'admin123' }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request);
    const body = (await response.json()) as { ok: boolean };

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
  });

  it('returns 401 for wrong password', async () => {
    db.prepare(
      `INSERT INTO users (username, email, password_hash, display_name, role, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run('admin@aire.com', 'admin@aire.com', bcrypt.hashSync('admin123', 10), 'Admin', 'admin', 1);

    const request = new NextRequest('http://localhost/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@aire.com', password: 'wrong456' }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request);
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(401);
    expect(body.error).toBe('帳號或密碼錯誤');
  });

  it('returns 403 for non-admin user', async () => {
    db.prepare(
      `INSERT INTO users (username, email, password_hash, display_name, role, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run('agent@realty.com', 'agent@realty.com', bcrypt.hashSync('agent123', 10), 'Agent', 'agent', 1);

    const request = new NextRequest('http://localhost/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'agent@realty.com', password: 'agent123' }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request);
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(403);
    expect(body.error).toBe('無管理員權限');
  });
});
