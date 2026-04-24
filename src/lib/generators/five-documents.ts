import { parseTranscript, type TranscriptParseResult } from '@/lib/parsers/transcript-parser';
import { mergeDataLayers } from '@/lib/models/property-sheet';
import type { PropertyDossier } from '@/lib/models/property-dossier';
import { generatePropertySheet } from '@/lib/generators/property-sheet';
import { generateListing591 } from '@/lib/generators/listing-591';
import { generateDmBrochure, type DmBrochureResult } from '@/lib/generators/dm-brochure';
import { generateDisclosureDocument, type DisclosureDocumentResult } from '@/lib/generators/disclosure-document';
import { generateSocialMedia, type SocialMediaResult } from '@/lib/generators/social-media';

export interface FiveDocumentsInput {
  property_type: string;
  field_visit_data: Record<string, unknown>;
  supplementary_data: Record<string, unknown>;
  transcript_path?: string; // 可選，有則解析
  /** 業務人工填寫的周邊行情摘要（external-market-lookup 來源） */
  market_summary?: string | null;
  /** 周邊行情附件路徑（type='market_research'，由 listing.attachments 篩選後傳入） */
  market_research_attachments?: string[];
}

export interface FiveDocumentsResult {
  property_sheet: string;
  listing_591: string;
  dm_brochure: DmBrochureResult;
  disclosure_document: DisclosureDocumentResult;
  social_media: SocialMediaResult;
  generated_at: Date;
  data_sources: string[];
}

function v(x: unknown): string {
  if (x === null || x === undefined) return '待補';
  if (typeof x === 'string') return x.trim() || '待補';
  return String(x);
}

function toDossier(input: FiveDocumentsInput, transcript?: TranscriptParseResult): PropertyDossier {
  const merged = mergeDataLayers(input.field_visit_data, {}, input.supplementary_data);

  const address = merged.fields.find((f) => f.key === 'address')?.display_value ?? '待補';
  const total_price_raw = merged.fields.find((f) => f.key === 'total_price')?.value;
  const total_price = typeof total_price_raw === 'number' ? total_price_raw : Number(total_price_raw) || 0;

  const pfRaw = merged.fields.find((f) => f.key === 'public_facilities')?.value;
  const public_facilities = Array.isArray(pfRaw) ? (pfRaw as any[]) : [];

  return {
    property_type: input.property_type,
    address: address === '待補' ? '待補' : String(address).replace(/\s*萬元$/, ''),
    total_price,
    public_facilities,
    transcript,
  };
}

function sourcesFromMerged(input: FiveDocumentsInput, transcript?: TranscriptParseResult): string[] {
  const merged = mergeDataLayers(input.field_visit_data, {}, input.supplementary_data);
  const used = new Set(merged.fields.map((f) => f.source).filter((s) => s !== 'pending'));
  const sources: string[] = [...used];
  if (transcript) sources.push('L1_transcript');
  // generators will (best-effort) call scrapers
  sources.push('L2_system');
  return [...new Set(sources)].sort();
}

function placeholderDm(): DmBrochureResult {
  return { content: '待補', ig_slides: Array(7).fill('待補'), quality_score: 0 };
}

function placeholderDisclosure(): DisclosureDocumentResult {
  return {
    pages: Array.from({ length: 14 }, (_, i) => ({ page_number: i + 1, title: '待補', content: '待補' })),
    toc_checkboxes: {},
  };
}

function placeholderSocial(): SocialMediaResult {
  return {
    facebook: { content: '待補', image_prompts: [] },
    instagram: { reels_script: '待補', slides: Array(7).fill('待補'), image_prompts: [] },
    threads: { content: '待補' },
    tiktok: { script: '待補', image_prompts: [] },
    youtube: { title: '待補', outline: '待補' },
  };
}

export async function generateFiveDocuments(
  input: FiveDocumentsInput,
  options?: { regenerate?: Array<keyof FiveDocumentsResult> }
): Promise<FiveDocumentsResult> {
  const generated_at = new Date();

  let transcript: TranscriptParseResult | undefined;
  if (input.transcript_path) {
    try {
      transcript = await parseTranscript(input.transcript_path);
    } catch {
      transcript = undefined;
    }
  }

  const dossier = toDossier(input, transcript);
  const data_sources = sourcesFromMerged(input, transcript);

  const regen = new Set(options?.regenerate ?? []);
  const only = regen.size > 0;

  const tasks = {
    property_sheet: async () => generatePropertySheet(dossier, transcript),
    listing_591: async () => generateListing591(dossier, transcript),
    dm_brochure: async () => generateDmBrochure(dossier),
    disclosure_document: async () =>
      generateDisclosureDocument(dossier, transcript, {
        field_visit_data: input.field_visit_data,
        market_summary: input.market_summary,
        market_research_attachments: input.market_research_attachments,
      }),
    social_media: async () => generateSocialMedia(dossier),
  } as const;

  async function runOrPending<K extends keyof typeof tasks>(key: K): Promise<any> {
    if (only && !regen.has(key as any)) {
      // no cached previous version in this orchestrator layer
      return key === 'property_sheet' || key === 'listing_591' ? '待補' : key === 'dm_brochure' ? placeholderDm() : key === 'disclosure_document' ? placeholderDisclosure() : placeholderSocial();
    }

    try {
      return await tasks[key]();
    } catch {
      return key === 'property_sheet' || key === 'listing_591' ? '待補' : key === 'dm_brochure' ? placeholderDm() : key === 'disclosure_document' ? placeholderDisclosure() : placeholderSocial();
    }
  }

  const [property_sheet, listing_591, dm_brochure, disclosure_document, social_media] = await Promise.all([
    runOrPending('property_sheet'),
    runOrPending('listing_591'),
    runOrPending('dm_brochure'),
    runOrPending('disclosure_document'),
    runOrPending('social_media'),
  ]);

  return {
    property_sheet,
    listing_591,
    dm_brochure,
    disclosure_document,
    social_media,
    generated_at,
    data_sources,
  };
}
