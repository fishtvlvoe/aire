import { describe, it, expect, vi } from 'vitest';
import type { CodexResult } from '@/lib/codex-client';

vi.mock('@/lib/codex-client', () => ({
  runCodex: vi.fn(),
}));

vi.mock('@/lib/trackers/algorithm-tracker', () => ({
  AlgorithmTracker: class {
    getLatestSummary() {
      return {
        platforms: [
          { platform: 'facebook', hashtag_count: 5, optimal_length: '300-500字', content_format: '長文+圖片', cta_style: '私訊', algorithm_focus: '互動', updated_at: new Date() },
          { platform: 'instagram', hashtag_count: 8, optimal_length: '短句', content_format: 'Reels+Carousel', cta_style: '留言', algorithm_focus: '完播率', updated_at: new Date() },
          { platform: 'threads', hashtag_count: 3, optimal_length: '100-200字', content_format: '短文', cta_style: '回覆', algorithm_focus: '討論', updated_at: new Date() },
          { platform: 'tiktok', hashtag_count: 6, optimal_length: '30-45秒', content_format: '短影音', cta_style: '追蹤', algorithm_focus: '完播率', updated_at: new Date() },
          { platform: 'youtube', hashtag_count: 5, optimal_length: '3-6分鐘', content_format: '長影音', cta_style: '訂閱', algorithm_focus: '停留', updated_at: new Date() },
        ],
        changed: false,
        surveyed_at: new Date(),
      };
    }
  },
}));

vi.mock('@/lib/generators/dm-brochure', () => ({
  generateDmBrochure: vi.fn().mockResolvedValue({
    content: 'content',
    ig_slides: ['1','2','3','4','5','6','7'],
    quality_score: 10,
  }),
}));

import { runCodex } from '@/lib/codex-client';
import { generateSocialMedia } from '@/lib/generators/social-media';
import type { PropertyDossier } from '@/lib/models/property-dossier';

function ok(output: string): CodexResult {
  return { success: true, output, status: 'ready' } as CodexResult;
}

describe('Task 8 — social-media', () => {
  it('returns 5 platform keys', async () => {
    vi.mocked(runCodex)
      .mockResolvedValueOnce(ok('F'.repeat(320))) // facebook
      .mockResolvedValueOnce(ok('IG reels script'))
      .mockResolvedValueOnce(ok('T'.repeat(120))) // threads
      .mockResolvedValueOnce(ok('0秒 ... 15秒 ...')) // tiktok
      .mockResolvedValueOnce(ok('YT title\nOUTLINE...'));

    const dossier: PropertyDossier = {
      property_type: '大樓',
      address: '台南市...',
      total_price: 998,
      public_facilities: [],
    };

    const r = await generateSocialMedia(dossier);
    expect(r).toHaveProperty('facebook');
    expect(r).toHaveProperty('instagram');
    expect(r).toHaveProperty('threads');
    expect(r).toHaveProperty('tiktok');
    expect(r).toHaveProperty('youtube');
  });

  it('Five Platform Output Specifications', async () => {
    vi.mocked(runCodex)
      .mockResolvedValueOnce(ok('F'.repeat(320)))
      .mockResolvedValueOnce(ok('IG reels script'))
      .mockResolvedValueOnce(ok('T'.repeat(120)))
      .mockResolvedValueOnce(ok('0秒 ... 15秒 ...'))
      .mockResolvedValueOnce(ok('YT title\nOUTLINE...'));

    const dossier: PropertyDossier = {
      property_type: '大樓',
      address: '台南市...',
      total_price: 998,
      public_facilities: [],
    };

    const r = await generateSocialMedia(dossier);

    expect(r.facebook.content.length).toBeGreaterThanOrEqual(300);
    expect(r.facebook.content.length).toBeLessThanOrEqual(500);

    expect(r.instagram.reels_script).toBeTruthy();
    expect(r.instagram.slides).toHaveLength(7);

    expect(r.threads.content.length).toBeGreaterThanOrEqual(100);
    expect(r.threads.content.length).toBeLessThanOrEqual(200);

    expect(r.tiktok.script).toContain('0秒');
    expect(r.tiktok.script).toContain('15秒');

    expect(r.youtube.title).toBeTruthy();
    expect(r.youtube.outline).toBeTruthy();
  });

  it('Shared Writing Rules: no banned phrases', async () => {
    vi.mocked(runCodex)
      .mockResolvedValueOnce(ok('不要寫房價會漲'))
      .mockResolvedValueOnce(ok('IG reels script'))
      .mockResolvedValueOnce(ok('不要寫投資必賺'))
      .mockResolvedValueOnce(ok('不要寫增值保證'))
      .mockResolvedValueOnce(ok('不要寫漲幅'));

    const dossier: PropertyDossier = {
      property_type: '大樓',
      address: '台南市...',
      total_price: 998,
      public_facilities: [],
    };

    const r = await generateSocialMedia(dossier);
    expect(JSON.stringify(r)).not.toContain('房價會漲');
    expect(JSON.stringify(r)).not.toContain('投資必賺');
    expect(JSON.stringify(r)).not.toContain('漲幅');
    expect(JSON.stringify(r)).not.toContain('增值保證');
  });

  it('Image Prompt Standard', async () => {
    vi.mocked(runCodex)
      .mockResolvedValueOnce(ok('F'.repeat(320)))
      .mockResolvedValueOnce(ok('IG reels script'))
      .mockResolvedValueOnce(ok('T'.repeat(120)))
      .mockResolvedValueOnce(ok('0秒 ... 15秒 ...'))
      .mockResolvedValueOnce(ok('YT title\nOUTLINE...'));

    const dossier: PropertyDossier = {
      property_type: '大樓',
      address: '台南市...',
      total_price: 998,
      public_facilities: [],
    };

    const r = await generateSocialMedia(dossier);
    expect(Array.isArray(r.facebook.image_prompts)).toBe(true);
    expect(Array.isArray(r.instagram.image_prompts)).toBe(true);
    expect(Array.isArray(r.tiktok.image_prompts)).toBe(true);
  });
});
