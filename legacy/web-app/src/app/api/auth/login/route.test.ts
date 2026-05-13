import { generateKeyPairSync, sign } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { POST } from './route';

function createSerialKey(payload: Record<string, unknown>, privateKeyPem: string): string {
  const payloadBase64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = sign(null, Buffer.from(payloadBase64, 'utf8'), privateKeyPem);
  return `${payloadBase64}.${Buffer.from(signature).toString('base64url')}`;
}

describe('POST /api/auth/login', () => {
  const keyPair = generateKeyPairSync('ed25519');
  const publicKeyPem = keyPair.publicKey.export({ type: 'spki', format: 'pem' }).toString();
  const privateKeyPem = keyPair.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();

  beforeEach(() => {
    db.prepare('DELETE FROM users').run();
    process.env.LICENSE_PUBLIC_KEY = publicKeyPem;
  });

  it('returns 400 for malformed license key', async () => {
    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'agent@realty.com', password: 'pass123', licenseKey: 'invalid' }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request);
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(body.error).toBe('授權序號格式錯誤');
  });

  it('returns 403 for expired license key', async () => {
    const expiredKey = createSerialKey(
      { company: 'AIRE', expires: '2024-01-01T00:00:00+08:00', version: 1 },
      privateKeyPem,
    );

    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'agent@realty.com', password: 'pass123', licenseKey: expiredKey }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request);
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(403);
    expect(body.error).toBe('授權序號已過期');
  });

  it('returns 401 for wrong credentials when license is valid', async () => {
    const validKey = createSerialKey(
      { company: 'AIRE', expires: '2027-12-31T00:00:00+08:00', version: 1 },
      privateKeyPem,
    );

    const passwordHash = bcrypt.hashSync('correct123', 10);
    db.prepare(
      `INSERT INTO users (username, email, password_hash, display_name, role, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run('agent@realty.com', 'agent@realty.com', passwordHash, 'Agent', 'agent', 1);

    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'agent@realty.com', password: 'wrong456', licenseKey: validKey }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request);
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(401);
    expect(body.error).toBe('帳號或密碼錯誤');
  });

  it('returns 200 for valid license and credentials', async () => {
    const validKey = createSerialKey(
      { company: 'AIRE', expires: '2027-12-31T00:00:00+08:00', version: 1 },
      privateKeyPem,
    );

    const passwordHash = bcrypt.hashSync('pass123', 10);
    db.prepare(
      `INSERT INTO users (username, email, password_hash, display_name, role, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run('agent@realty.com', 'agent@realty.com', passwordHash, 'Agent', 'agent', 1);

    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'agent@realty.com', password: 'pass123', licenseKey: validKey }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request);
    const body = (await response.json()) as { ok: boolean };

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
  });
});
