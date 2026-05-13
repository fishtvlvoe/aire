import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/parsers/transcript-parser', () => ({
  parseTranscript: vi.fn().mockResolvedValue({
    source_format: 'yaml',
    confidence: 1,
    fields: { registered_area: 23.37 },
    additional: {},
  }),
}));

vi.mock('@/lib/generators/property-sheet', () => ({
  generatePropertySheet: vi.fn().mockResolvedValue('# sheet'),
}));
vi.mock('@/lib/generators/listing-591', () => ({
  generateListing591: vi.fn().mockResolvedValue('# listing'),
}));
vi.mock('@/lib/generators/dm-brochure', () => ({
  generateDmBrochure: vi.fn().mockResolvedValue({ content: 'dm', ig_slides: Array(7).fill('x'), quality_score: 10 }),
}));
vi.mock('@/lib/generators/disclosure-document', () => ({
  generateDisclosureDocument: vi.fn().mockResolvedValue({
    pages: Array.from({ length: 14 }, (_, i) => ({ page_number: i + 1, title: 't', content: 'c' })),
    toc_checkboxes: {},
  }),
}));
vi.mock('@/lib/generators/social-media', () => ({
  generateSocialMedia: vi.fn().mockResolvedValue({
    facebook: { content: 'fb', image_prompts: [] },
    instagram: { reels_script: 'ig', slides: Array(7).fill('x'), image_prompts: [] },
    threads: { content: 'th' },
    tiktok: { script: 'tk', image_prompts: [] },
    youtube: { title: 'yt', outline: 'o' },
  }),
}));

import { generatePropertySheet } from '@/lib/generators/property-sheet';
import { generateListing591 } from '@/lib/generators/listing-591';
import { generateDmBrochure } from '@/lib/generators/dm-brochure';
import { generateDisclosureDocument } from '@/lib/generators/disclosure-document';
import { generateSocialMedia } from '@/lib/generators/social-media';
import { generateFiveDocuments } from '@/lib/generators/five-documents';

describe('Task 9 — generateFiveDocuments orchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('calls all 5 sub generators', async () => {
    await generateFiveDocuments({
      property_type: '大樓',
      field_visit_data: { address: 'A', total_price: 998, public_facilities: [] },
      supplementary_data: {},
      transcript_path: 'docs/本/台南市中西區民權路三段400巷18號7樓_20260205.yaml.txt',
    });

    expect(vi.mocked(generatePropertySheet)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(generateListing591)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(generateDmBrochure)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(generateDisclosureDocument)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(generateSocialMedia)).toHaveBeenCalledTimes(1);
  });

  it('Missing Data Tolerance: transcript undefined should not throw and uses 待補', async () => {
    const r = await generateFiveDocuments({
      property_type: '大樓',
      field_visit_data: { address: '', total_price: 998, public_facilities: [] },
      supplementary_data: {},
    });

    expect(r).toHaveProperty('listing_591');
  });

  it('partial regenerate: only listing_591', async () => {
    vi.mocked(generatePropertySheet).mockClear();
    vi.mocked(generateListing591).mockClear();
    vi.mocked(generateDmBrochure).mockClear();
    vi.mocked(generateDisclosureDocument).mockClear();
    vi.mocked(generateSocialMedia).mockClear();

    await generateFiveDocuments(
      {
        property_type: '大樓',
        field_visit_data: { address: 'A', total_price: 998, public_facilities: [] },
        supplementary_data: {},
      },
      { regenerate: ['listing_591'] }
    );

    expect(vi.mocked(generateListing591)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(generatePropertySheet)).toHaveBeenCalledTimes(0);
    expect(vi.mocked(generateDmBrochure)).toHaveBeenCalledTimes(0);
    expect(vi.mocked(generateDisclosureDocument)).toHaveBeenCalledTimes(0);
    expect(vi.mocked(generateSocialMedia)).toHaveBeenCalledTimes(0);
  });

  it('Three-Layer Data Priority: supplementary overrides empty field_visit_data', async () => {
    await generateFiveDocuments({
      property_type: '大樓',
      field_visit_data: { address: '', total_price: 998, public_facilities: [] },
      supplementary_data: { address: '補上的地址' },
    });

    const dossierArg = vi.mocked(generateListing591).mock.calls[0]?.[0];
    expect(dossierArg.address).toBe('補上的地址');
  });
});
