import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '../listings/[id]/pdf/route';
import { db } from '@/lib/db';

const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAoMBgQm6qf0AAAAASUVORK5CYII=',
  'base64'
);

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

function ensureBackgrounds(): void {
  const dir = path.join(process.cwd(), 'public', 'branding', 'backgrounds');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'test-cover.png'), PNG_1X1);
  fs.writeFileSync(path.join(dir, 'test-content.png'), PNG_1X1);
}

describe('GET /api/listings/[id]/pdf', () => {
  beforeEach(() => {
    db.prepare('DELETE FROM listings').run();
    db.prepare('DELETE FROM users').run();
    db.prepare('DELETE FROM feature_flags').run();
    ensureBackgrounds();

    db.prepare(`
      INSERT INTO users (id, username, email, password_hash, display_name, role, is_active)
      VALUES (1, 'agent@example.com', 'agent@example.com', 'hash', 'Agent', 'agent', 1)
    `).run();

    db.prepare(`
      INSERT INTO listings (id, owner_id, propertyType, property_type, status, field_visit_data, supplementary_data, generated_documents)
      VALUES (3, 1, 'apartment', 'apartment', 'documents-ready', ?, ?, ?)
    `).run(
      JSON.stringify({ address: '台北市信義區' }),
      JSON.stringify({ property_name: '測試物件', company_name: '建安不動產' }),
      JSON.stringify({ disclosure_document: '# 不動產說明書\\n\\n中文內容測試' }),
    );

    db.prepare('INSERT OR REPLACE INTO feature_flags (key, enabled, value) VALUES (?, 1, ?)')
      .run('doc_bg_cover', '/branding/backgrounds/test-cover.png');
    db.prepare('INSERT OR REPLACE INTO feature_flags (key, enabled, value) VALUES (?, 1, ?)')
      .run('doc_bg_content', '/branding/backgrounds/test-content.png');
  });

  afterEach(() => {
    const dir = path.join(process.cwd(), 'public', 'branding', 'backgrounds');
    const testFiles = ['test-cover.png', 'test-content.png'];
    for (const file of testFiles) {
      const filePath = path.join(dir, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  });

  it('returns application/pdf for disclosure route', async () => {
    const req = new Request('http://localhost/api/listings/3/pdf?type=disclosure');
    const res = await GET(req as never, { params: Promise.resolve({ id: '3' }) });

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/pdf');

    const body = new Uint8Array(await res.arrayBuffer());
    expect(body.length).toBeGreaterThan(500);
    expect(Array.from(body.slice(0, 4))).toEqual([0x25, 0x50, 0x44, 0x46]);
  });
});
