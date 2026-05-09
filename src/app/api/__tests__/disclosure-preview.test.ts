import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '../documents/disclosure-preview/route';
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

describe('GET /api/documents/disclosure-preview', () => {
  beforeEach(() => {
    db.prepare('DELETE FROM audit_logs').run();
    db.prepare('DELETE FROM listings').run();
    db.prepare('DELETE FROM users').run();
    db.prepare(`
      INSERT INTO users (id, username, email, password_hash, display_name, role, is_active)
      VALUES (1, 'agent@example.com', 'agent@example.com', 'hash', 'Agent', 'agent', 1)
    `).run();
    db.prepare(`
      INSERT INTO listings (id, owner_id, propertyType, property_type, status, address, supplementary_data, generated_documents)
      VALUES (42, 1, 'apartment', 'apartment', 'documents-ready', '台北市信義路三段100號', ?, ?)
    `).run(
      JSON.stringify({
        property_name: '信義路三段100號',
        owner_name: '王小明',
        company_name: '建安不動產',
        company_phone: '02-12345678',
      }),
      JSON.stringify({
        disclosure_document: 'markdown',
        disclosure_overrides: {
          'object-name': '覆寫物件名稱',
        },
      }),
    );
    db.prepare('INSERT OR REPLACE INTO feature_flags (key, enabled, value) VALUES (?, 1, ?)').run('doc_bg_cover', '/branding/backgrounds/cover.png');
    db.prepare('INSERT OR REPLACE INTO feature_flags (key, enabled, value) VALUES (?, 1, ?)').run('doc_bg_content', '/branding/backgrounds/content.png');
  });

  it('returns fields and backgrounds with override priority', async () => {
    const request = new Request('http://localhost/api/documents/disclosure-preview?listingId=42');
    const response = await GET(request as never);

    expect(response.status).toBe(200);
    expect(response.data.listingId).toBe(42);
    expect(response.data.backgrounds.cover).toBe('/branding/backgrounds/cover.png');
    expect(response.data.fields).toHaveLength(10);

    const objectName = response.data.fields.find((field: { fieldKey: string }) => field.fieldKey === 'object-name');
    expect(objectName?.value).toBe('覆寫物件名稱');
  });

  it('returns 400 when listingId is invalid', async () => {
    const request = new Request('http://localhost/api/documents/disclosure-preview?listingId=abc');
    const response = await GET(request as never);

    expect(response.status).toBe(400);
    expect(response.data.code).toBe('INVALID_REQUEST');
  });
});

