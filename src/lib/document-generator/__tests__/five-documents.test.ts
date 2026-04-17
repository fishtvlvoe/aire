import { describe, it, expect, vi, afterEach } from 'vitest';
import type { CodexResult } from '../../codex-client';

// mock codex-client 讓文件生成器不實際呼叫 Codex
vi.mock('../../codex-client', () => ({
  runCodex: vi.fn().mockResolvedValue({
    success: true,
    output: '# 測試文件\n這是 mock 輸出',
    status: 'ready',
  } satisfies CodexResult),
  checkCodexStatus: vi.fn().mockResolvedValue('ready'),
}));

import { generateSurvey } from '../md/survey';
import { generateListing591 } from '../md/listing591';
import { generateDm } from '../md/dm';
import { generateSocialPosts } from '../md/social';
import { CodexDocumentGenerator } from '../codex-provider';
import type { DocumentGeneratorInput } from '../types';

const FIXTURE: DocumentGeneratorInput = {
  property_type: 'apartment',
  field_visit_data: {
    address: '台南市中西區民族路一段 123 號 5 樓',
    total_price: 1200,
    building_area: 32.5,
  },
  supplementary_data: {
    management_fee: 2000,
  },
};

const LAND_FIXTURE: DocumentGeneratorInput = {
  property_type: 'farmland',
  field_visit_data: {
    address: '台南市官田區隆本里',
    total_price: 800,
    land_area: 500,
  },
  supplementary_data: {},
};

// 使用中文 property_type，觸發 isLandType → generateLandDossier
const CHINESE_LAND_FIXTURE: DocumentGeneratorInput = {
  property_type: '農地',
  field_visit_data: {
    address: '台南市官田區隆本里',
    total_price: 800,
    land_area: 500,
  },
  supplementary_data: {},
};

describe('9.6 五份文件 integration（mock Codex）', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('generateSurvey 回傳非空字串', async () => {
    const result = await generateSurvey(FIXTURE);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('generateListing591 回傳非空字串', async () => {
    const result = await generateListing591(FIXTURE);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('generateDm 回傳非空字串', async () => {
    const result = await generateDm(FIXTURE);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('generateSocialPosts 回傳非空字串', async () => {
    const result = await generateSocialPosts(FIXTURE);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('土地類型也能生成文件', async () => {
    const survey = await generateSurvey(LAND_FIXTURE);
    expect(survey.length).toBeGreaterThan(0);
  });

  it('Codex 失敗時拋出 Error', async () => {
    const { runCodex } = await import('../../codex-client');
    vi.mocked(runCodex).mockResolvedValueOnce({
      success: false,
      error: 'mock failure',
      status: 'error',
    });
    await expect(generateSurvey(FIXTURE)).rejects.toThrow();
  });

  it('disclosure_document（建物）包含結構化章節標題且不含佔位符', async () => {
    // Arrange: mock runCodex 回傳含章節標題的結構化內容
    const { runCodex } = await import('../../codex-client');
    const structuredOutput =
      '#### 章節 1：封面\n- 物件編號：待補\n\n#### 章節 2：重要告知（以謄本為準/契約一部分）\n本說明書所載內容以登記謄本為準。';
    vi.mocked(runCodex).mockResolvedValue({
      success: true,
      output: structuredOutput,
      status: 'done',
    } satisfies CodexResult);

    // Act
    const generator = new CodexDocumentGenerator();
    const result = await generator.generate(FIXTURE);

    // Assert
    expect(result.disclosure_document).toContain('#### 章節 1：');
    expect(result.disclosure_document).not.toContain('[PDF 由任務 10 實作]');
  });

  it('disclosure_document（土地）包含結構化章節標題且不含佔位符', async () => {
    // Arrange: mock runCodex 回傳含章節標題的結構化內容
    const { runCodex } = await import('../../codex-client');
    const structuredOutput =
      '#### 章節 1：封面\n- 物件編號：待補\n\n#### 章節 2：重要告知（以謄本為準/契約一部分）\n本說明書所載內容以登記謄本為準。';
    vi.mocked(runCodex).mockResolvedValue({
      success: true,
      output: structuredOutput,
      status: 'done',
    } satisfies CodexResult);

    // Act: 使用中文土地類型，isLandType('農地') === true → generateLandDossier
    const generator = new CodexDocumentGenerator();
    const result = await generator.generate(CHINESE_LAND_FIXTURE);

    // Assert
    expect(result.disclosure_document).toContain('#### 章節 1：');
    expect(result.disclosure_document).not.toContain('[PDF 由任務 10 實作]');
  });
});
