import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CodexResult } from '../../codex-client';

vi.mock('../../codex-client', () => ({
  runCodex: vi.fn().mockResolvedValue({
    success: true,
    output: '# mock output',
    status: 'ready',
  } satisfies CodexResult),
  checkCodexStatus: vi.fn().mockResolvedValue('ready'),
}));

import { generateSurvey } from '../md/survey';
import { generateListing591 } from '../md/listing591';
import { generateDm } from '../md/dm';
import { generateSocialPosts } from '../md/social';
import { runCodex } from '../../codex-client';
import type { DocumentGeneratorInput } from '../types';

const INPUT: DocumentGeneratorInput = {
  property_type: 'apartment',
  field_visit_data: { address: '台南市', total_price: 1000 },
  supplementary_data: {},
};

describe('11.4 generate 與 regenerate 獨立性', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('一次 generate 呼叫 Codex 4 次（4 份 MD 文件）', async () => {
    await Promise.all([
      generateSurvey(INPUT),
      generateListing591(INPUT),
      generateDm(INPUT),
      generateSocialPosts(INPUT),
    ]);
    expect(vi.mocked(runCodex)).toHaveBeenCalledTimes(4);
  });

  it('單獨 regenerate survey 只呼叫 Codex 1 次', async () => {
    await generateSurvey(INPUT);
    expect(vi.mocked(runCodex)).toHaveBeenCalledTimes(1);
  });

  it('單獨 regenerate listing591 不影響 survey 的 mock 呼叫次數', async () => {
    await generateSurvey(INPUT);
    const countAfterSurvey = vi.mocked(runCodex).mock.calls.length;

    await generateListing591(INPUT);
    const countAfterListing = vi.mocked(runCodex).mock.calls.length;

    expect(countAfterListing - countAfterSurvey).toBe(1);
  });

  it('各文件函數回傳獨立字串，互不影響', async () => {
    vi.mocked(runCodex)
      .mockResolvedValueOnce({ success: true, output: 'survey output', status: 'ready' })
      .mockResolvedValueOnce({ success: true, output: 'listing591 output', status: 'ready' });

    const survey = await generateSurvey(INPUT);
    const listing = await generateListing591(INPUT);

    expect(survey).toBe('survey output');
    expect(listing).toBe('listing591 output');
    expect(survey).not.toBe(listing);
  });
});
