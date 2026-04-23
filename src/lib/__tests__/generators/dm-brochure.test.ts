import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CodexResult } from '@/lib/codex-client';

vi.mock('@/lib/codex-client', () => ({
  runCodex: vi.fn(),
}));

import { runCodex } from '@/lib/codex-client';
import { generateDmBrochure } from '@/lib/generators/dm-brochure';
import type { PropertyDossier } from '@/lib/models/property-dossier';

function ok(output: string): CodexResult {
  return { success: true, output, status: 'ready' } as CodexResult;
}

describe('Task 6 — dm-brochure', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('Landing Page 5-Zone Structure', async () => {
    const dossier: PropertyDossier = {
      property_type: '大樓',
      address: '台南市中西區...',
      total_price: 998,
      public_facilities: [],
    };

    vi.mocked(runCodex)
      .mockResolvedValueOnce(ok('## 鉤子\nA\n## 痛點\nB\n## 解決方案\nC\n## 強調\nD\n## CTA\nE'))
      .mockResolvedValueOnce(ok(JSON.stringify(['1','2','3','4','5','6','7'])));

    const r = await generateDmBrochure(dossier);
    expect(r.content).toContain('鉤子');
    expect(r.content).toContain('痛點');
    expect(r.content).toContain('解決方案');
    expect(r.content).toContain('強調');
    expect(r.content).toContain('CTA');
  });

  it('乘法模型：persona 會注入 prompt', async () => {
    const dossier: PropertyDossier = {
      property_type: '大樓',
      address: '台南市中西區...',
      total_price: 998,
      public_facilities: [],
    };

    vi.mocked(runCodex)
      .mockResolvedValueOnce(ok('content'))
      .mockResolvedValueOnce(ok(JSON.stringify(['1','2','3','4','5','6','7'])));

    await generateDmBrochure(dossier, { persona: '新婚小家庭' });
    const firstPrompt = vi.mocked(runCodex).mock.calls[0]?.[0] ?? '';
    expect(firstPrompt).toContain('新婚小家庭');
  });

  it('Property Type Adaptation', async () => {
    const dossier: PropertyDossier = {
      property_type: '透天',
      address: '台南市...',
      total_price: 998,
      public_facilities: [],
    };

    vi.mocked(runCodex)
      .mockResolvedValueOnce(ok('content'))
      .mockResolvedValueOnce(ok(JSON.stringify(['1','2','3','4','5','6','7'])));

    await generateDmBrochure(dossier);
    const firstPrompt = vi.mocked(runCodex).mock.calls[0]?.[0] ?? '';
    expect(firstPrompt).toContain('一樓停車直接上樓');
  });

  it('IG Carousel Derivation: ig_slides length = 7', async () => {
    const dossier: PropertyDossier = {
      property_type: '大樓',
      address: '台南市...',
      total_price: 998,
      public_facilities: [],
    };

    vi.mocked(runCodex)
      .mockResolvedValueOnce(ok('content'))
      .mockResolvedValueOnce(ok(JSON.stringify(['1','2','3','4','5','6','7'])));

    const r = await generateDmBrochure(dossier);
    expect(r.ig_slides).toHaveLength(7);
  });

  it('No emoji stacking (>=2 emoji in a row) & quality_score >= 0', async () => {
    const dossier: PropertyDossier = {
      property_type: '大樓',
      address: '台南市...',
      total_price: 998,
      public_facilities: [],
    };

    vi.mocked(runCodex)
      .mockResolvedValueOnce(ok('## 鉤子\n😀😀 好房\n## 痛點\n...\n## 解決方案\n...\n## 強調\n...\n## CTA\n...'))
      .mockResolvedValueOnce(ok(JSON.stringify(['1','2','3','4','5','6','7'])));

    const r = await generateDmBrochure(dossier);
    expect(r.content).not.toMatch(/\p{Extended_Pictographic}{2,}/u);
    expect(r.quality_score).toBeGreaterThanOrEqual(0);
  });
});
