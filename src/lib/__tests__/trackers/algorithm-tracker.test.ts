import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import type { CodexResult } from '@/lib/codex-client';

vi.mock('@/lib/codex-client', () => ({
  runCodex: vi.fn(),
}));

import { AlgorithmTracker, resetTrackerState } from '@/lib/trackers/algorithm-tracker';
import { runCodex } from '@/lib/codex-client';

function mockOk(output: string): CodexResult {
  return { success: true, output, status: 'ready' } as CodexResult;
}

describe('Task 3 — AlgorithmTracker', () => {
  beforeEach(() => {
    resetTrackerState();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('survey() returns PlatformStrategySummary with 5 platforms', async () => {
    vi.mocked(runCodex).mockResolvedValueOnce(
      mockOk(
        JSON.stringify({
          platforms: [
            { platform: 'facebook', hashtag_count: 5, optimal_length: '300-500字', content_format: '長文+圖片', cta_style: '私訊', algorithm_focus: '互動', },
            { platform: 'instagram', hashtag_count: 8, optimal_length: '短句', content_format: 'Reels+Carousel', cta_style: '留言', algorithm_focus: '完播率', },
            { platform: 'threads', hashtag_count: 3, optimal_length: '100-200字', content_format: '短文', cta_style: '回覆', algorithm_focus: '討論', },
            { platform: 'tiktok', hashtag_count: 6, optimal_length: '30-45秒', content_format: '短影音', cta_style: '追蹤', algorithm_focus: '完播率', },
            { platform: 'youtube', hashtag_count: 5, optimal_length: '3-6分鐘', content_format: '長影音', cta_style: '訂閱', algorithm_focus: '停留', },
          ],
        })
      )
    );

    const tracker = new AlgorithmTracker();
    const summary = await tracker.survey();

    expect(summary.platforms).toHaveLength(5);
    expect(summary.platforms.map((p) => p.platform).sort()).toEqual([
      'facebook',
      'instagram',
      'threads',
      'tiktok',
      'youtube',
    ]);
  });

  it('changed=true when different from last survey', async () => {
    vi.mocked(runCodex)
      .mockResolvedValueOnce(mockOk(JSON.stringify({ platforms: [{ platform: 'facebook', hashtag_count: 5, optimal_length: '300-500字', content_format: '長文', cta_style: '私訊', algorithm_focus: '互動' }] })))
      .mockResolvedValueOnce(mockOk(JSON.stringify({ platforms: [{ platform: 'facebook', hashtag_count: 10, optimal_length: '300-500字', content_format: '長文', cta_style: '私訊', algorithm_focus: '互動' }] })));

    const tracker = new AlgorithmTracker();
    const s1 = await tracker.survey();
    const s2 = await tracker.survey();

    expect(s1.changed).toBe(false);
    expect(s2.changed).toBe(true);
  });

  it('on failure returns last cache with staleness=true', async () => {
    vi.mocked(runCodex)
      .mockResolvedValueOnce(mockOk(JSON.stringify({ platforms: [{ platform: 'facebook', hashtag_count: 5, optimal_length: '300-500字', content_format: '長文', cta_style: '私訊', algorithm_focus: '互動' }] })))
      .mockRejectedValueOnce(new Error('network'));

    const tracker = new AlgorithmTracker();
    const s1 = await tracker.survey();
    const s2 = await tracker.survey();

    expect(s2.staleness).toBe(true);
    expect(s2.platforms).toEqual(s1.platforms);
  });

  it('getLatestSummary() returns cached value without calling LLM', async () => {
    vi.mocked(runCodex).mockResolvedValueOnce(mockOk(JSON.stringify({ platforms: [{ platform: 'facebook', hashtag_count: 5, optimal_length: '300-500字', content_format: '長文', cta_style: '私訊', algorithm_focus: '互動' }] })));

    const tracker = new AlgorithmTracker();
    await tracker.survey();

    vi.mocked(runCodex).mockClear();
    const latest = tracker.getLatestSummary();
    expect(latest).not.toBeNull();
    expect(vi.mocked(runCodex)).not.toHaveBeenCalled();
  });
});
