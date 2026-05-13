import { describe, it, expect, vi } from 'vitest';
import type { CodexResult } from '@/lib/codex-client';

vi.mock('@/lib/codex-client', () => ({
  runCodex: vi.fn(),
}));

import { runCodex } from '@/lib/codex-client';
import { generateListing591 } from '@/lib/generators/listing-591';
import type { PropertyDossier } from '@/lib/models/property-dossier';

function ok(output: string): CodexResult {
  return { success: true, output, status: 'ready' } as CodexResult;
}

describe('Task 5 — listing-591', () => {
  it('returns content with 10 section markers and word count 2500-3500', async () => {
    const dossier: PropertyDossier = {
      property_type: '大樓',
      address: '台南市中西區...',
      total_price: 998,
      public_facilities: [],
    };

    const body =
      [
        '## 1 物件亮點',
        '## 2 空間格局',
        '## 3 生活機能',
        '## 4 交通',
        '## 5 學區',
        '## 6 公園休閒',
        '## 7 社區管理',
        '## 8 未來發展',
        '## 9 受眾推薦',
        '## 10 聯絡資訊',
      ].join('\n') +
      '\n' +
      '字'.repeat(2800);

    vi.mocked(runCodex)
      .mockResolvedValueOnce(ok('500m 設施：A,B,C'))
      .mockResolvedValueOnce(ok('未來建設：X,Y'))
      .mockResolvedValueOnce(ok(body));

    const out = await generateListing591(dossier);
    const markers = out.match(/^##\s+/gm) ?? [];
    expect(markers.length).toBeGreaterThanOrEqual(10);
    expect(out.length).toBeGreaterThanOrEqual(2500);
    expect(out.length).toBeLessThanOrEqual(3500);
  });

  it('does not contain banned phrases', async () => {
    const dossier: PropertyDossier = {
      property_type: '大樓',
      address: '台南市中西區...',
      total_price: 998,
      public_facilities: [],
    };

    vi.mocked(runCodex)
      .mockResolvedValueOnce(ok('500m 設施：A'))
      .mockResolvedValueOnce(ok('未來建設：X'))
      .mockResolvedValueOnce(ok('這裡不寫房價會漲，也不寫投資必賺')); // should be stripped

    const out = await generateListing591(dossier);
    expect(out).not.toContain('房價會漲');
    expect(out).not.toContain('投資必賺');
    expect(out).not.toContain('漲幅');
    expect(out).not.toContain('增值保證');
  });

  it('Three-Layer Data Source Pipeline injects Layer2 facilities into prompt', async () => {
    const dossier: PropertyDossier = {
      property_type: '大樓',
      address: '', // missing
      total_price: 998,
      public_facilities: [],
    };

    vi.mocked(runCodex)
      .mockResolvedValueOnce(ok('500m 設施：便利商店/公園'))
      .mockResolvedValueOnce(ok('未來建設：捷運規劃'))
      .mockResolvedValueOnce(ok('## 1 物件亮點\n...'));

    await generateListing591(dossier);

    const lastPrompt = vi.mocked(runCodex).mock.calls.at(-1)?.[0] ?? '';
    expect(lastPrompt).toContain('500m 設施');
    expect(lastPrompt).toContain('便利商店');
  });

  it('Fixed Fields Auto-Population: missing fields include 「待補」', async () => {
    const dossier: PropertyDossier = {
      property_type: '大樓',
      address: '',
      total_price: 998,
      public_facilities: [],
    };

    vi.mocked(runCodex)
      .mockResolvedValueOnce(ok('500m 設施：A'))
      .mockResolvedValueOnce(ok('未來建設：X'))
      .mockResolvedValueOnce(ok('## 1 物件亮點\n...'));

    const out = await generateListing591(dossier);
    expect(out).toContain('待補');
  });
});
