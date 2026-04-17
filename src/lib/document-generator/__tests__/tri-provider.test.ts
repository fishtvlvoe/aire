import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TriProviderDocumentGenerator } from '../tri-provider';
import type {
  DocumentGeneratorInput,
  GeneratedDocuments,
  FormalDocumentGenerator,
  MarketingDocumentGenerator,
  SocialDocumentGenerator
} from '../types';

describe('TriProviderDocumentGenerator', () => {
  let formal: FormalDocumentGenerator;
  let marketing: MarketingDocumentGenerator;
  let social: SocialDocumentGenerator;
  let input: DocumentGeneratorInput;

  beforeEach(() => {
    input = {
      property_type: 'residential',
      field_visit_data: { foo: 'bar' },
      supplementary_data: { baz: 'qux' }
    };
    formal = { generate: vi.fn(async () => ({
      disclosure_document: 'disclosure',
      property_survey: 'survey'
    })) };
    marketing = { generate: vi.fn(async () => ({
      listing_591: '591',
      sales_dm: 'dm'
    })) };
    social = { generate: vi.fn(async () => ({
      social_posts: {
        facebook: 'fb',
        instagram: 'ig',
        threads: 'threads',
        tiktok: 'tt',
        youtube: 'yt'
      },
      short_video_script: 'script'
    })) };
  });

  it('generate() all providers succeed → merges and returns GeneratedDocuments', async () => {
    const gen = new TriProviderDocumentGenerator(formal, marketing, social);
    const result = await gen.generate(input);
    expect(result).toEqual({
      disclosure_document: 'disclosure',
      property_survey: 'survey',
      listing_591: '591',
      sales_dm: 'dm',
      social_posts: {
        facebook: 'fb',
        instagram: 'ig',
        threads: 'threads',
        tiktok: 'tt',
        youtube: 'yt'
      },
      short_video_script: 'script'
    });
  });

  it('generate() throws if any provider fails', async () => {
    (formal.generate as any).mockImplementationOnce(() => Promise.reject('fail'));
    const gen = new TriProviderDocumentGenerator(formal, marketing, social);
    await expect(gen.generate(input)).rejects.toThrow('Formal provider failed: fail');

    // Marketing fail
    (formal.generate as any).mockImplementationOnce(() => Promise.resolve({ disclosure_document: 'd', property_survey: 's' }));
    (marketing.generate as any).mockImplementationOnce(() => Promise.reject('fail2'));
    await expect(gen.generate(input)).rejects.toThrow('Marketing provider failed: fail2');

    // Social fail
    (marketing.generate as any).mockImplementationOnce(() => Promise.resolve({ listing_591: 'l', sales_dm: 'dm' }));
    (social.generate as any).mockImplementationOnce(() => Promise.reject('fail3'));
    await expect(gen.generate(input)).rejects.toThrow('Social provider failed: fail3');
  });
});

import * as docGenIndex from '../index';
describe('createDefaultGenerator', () => {
  it("DOCUMENT_GENERATOR_PROVIDER='all' returns TriProviderDocumentGenerator", () => {
    process.env.DOCUMENT_GENERATOR_PROVIDER = 'all';
    const gen = docGenIndex.createDefaultGenerator();
    expect(gen.constructor.name).toBe('TriProviderDocumentGenerator');
  });
});
