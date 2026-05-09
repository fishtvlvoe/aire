import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PATCH } from '../documents/disclosure-preview/save/route';
import { db } from '@/lib/db';

vi.mock('@/lib/auth/resolve-user', () => ({
  resolveCurrentUser: vi.fn(async () => ({
    id: 1,
    username: 'agent@example.com',
    email: 'agent@example.com',
    role: 'agent',
    password_hash: 'hash',
    is_active: 1,
  })),
}));

vi.mock('next/server', () => ({
  NextResponse: {
    json: (data: unknown, options?: { status?: number }) => ({
      data,
      status: options?.status ?? 200,
    }),
  },
}));

describe('PATCH /api/documents/disclosure-preview/save', () => {
  beforeEach(() => {
    db.prepare('DELETE FROM audit_logs').run();
    db.prepare('DELETE FROM listings').run();
    db.prepare('DELETE FROM users').run();
    db.prepare(`
      INSERT INTO users (id, username, email, password_hash, display_name, role, is_active)
      VALUES (1, 'agent@example.com', 'agent@example.com', 'hash', 'Agent', 'agent', 1)
    `).run();
    db.prepare(`
      INSERT INTO listings (id, owner_id, propertyType, property_type, status, generated_documents)
      VALUES (42, 1, 'apartment', 'apartment', 'documents-ready', ?)
    `).run(JSON.stringify({ disclosure_document: 'demo' }));
  });

  it('strips html tags and persists disclosure_overrides', async () => {
    const request = new Request('http://localhost/api/documents/disclosure-preview/save', {
      method: 'PATCH',
      body: JSON.stringify({
        listingId: 42,
        fieldKey: 'object-name',
        value: '信義路三段100號<b>5樓</b>',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await PATCH(request as never);
    expect(response.status).toBe(200);
    expect(response.data.ok).toBe(true);

    const row = db.prepare('SELECT generated_documents FROM listings WHERE id = 42').get() as { generated_documents: string };
    const docs = JSON.parse(row.generated_documents) as Record<string, unknown>;
    const overrides = docs.disclosure_overrides as Record<string, string>;
    expect(overrides['object-name']).toBe('信義路三段100號5樓');
  });

  it('rejects fieldKey outside whitelist', async () => {
    const request = new Request('http://localhost/api/documents/disclosure-preview/save', {
      method: 'PATCH',
      body: JSON.stringify({
        listingId: 42,
        fieldKey: 'not-allowed-key',
        value: 'xxx',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await PATCH(request as never);
    expect(response.status).toBe(400);
    expect(response.data.code).toBe('INVALID_FIELD');
  });
});

