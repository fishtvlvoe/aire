import { describe, it, expect, vi } from 'vitest';
import type { CodexResult } from '@/lib/codex-client';

vi.mock('@/lib/codex-client', () => ({
  runCodex: vi.fn(),
}));

vi.mock('@/lib/scrapers/tax-calculator', () => ({
  TaxCalculator: class {
    calculate = vi.fn().mockResolvedValue({
      land_value_increment_tax_general: 111,
      land_value_increment_tax_self_use: 88,
      source: '財政部稅務入口網',
    });
  },
}));

vi.mock('@/lib/scrapers/bank-estimator', () => ({
  BankEstimator: class {
    estimate = vi.fn().mockResolvedValue({
      mortgage_scenarios: [
        { loan_ratio: 0.6, down_payment: 400, loan_amount: 600, monthly_payment: 1, source: '試算公式' },
        { loan_ratio: 0.7, down_payment: 300, loan_amount: 700, monthly_payment: 1, source: '試算公式' },
        { loan_ratio: 0.8, down_payment: 200, loan_amount: 800, monthly_payment: 1, source: '試算公式' },
      ],
    });
  },
}));

import { runCodex } from '@/lib/codex-client';
import { generateDisclosureDocument } from '@/lib/generators/disclosure-document';
import type { PropertyDossier } from '@/lib/models/property-dossier';
import type { TranscriptParseResult } from '@/lib/parsers/transcript-parser';
import { buildTranscriptAppendix } from '@/lib/prompts/disclosure-document-prompt';

function ok(output: string): CodexResult {
  return { success: true, output, status: 'ready' } as CodexResult;
}

describe('Task 7 — disclosure-document', () => {
  it('14-Page Document Structure', async () => {
    vi.mocked(runCodex)
      .mockResolvedValueOnce(ok('物件摘要...'))
      .mockResolvedValueOnce(ok('他項權利白話說明...'));

    const dossier: PropertyDossier = {
      property_type: '大樓',
      address: '台南市...',
      total_price: 998,
      public_facilities: [],
    };

    const transcript: TranscriptParseResult = {
      source_format: 'yaml',
      confidence: 1,
      fields: { registered_area: 23.37 },
      additional: {
        encumbrances: [{ creditor: '第一商業銀行', amount: 3180000, registered_date: '民國090年07月13日' }],
      },
    };

    const result = await generateDisclosureDocument(dossier, transcript);
    expect(result.pages).toHaveLength(14);
    for (const p of result.pages) {
      expect(p).toHaveProperty('page_number');
      expect(p).toHaveProperty('title');
      expect(p).toHaveProperty('content');
    }
  });

  it('Transcript Appendix Formatting removes 注意：謄本列印完畢', () => {
    const yaml = 'AAA\n注意：謄本列印完畢\nBBB\n';
    const appendix = buildTranscriptAppendix(yaml);
    expect(appendix).not.toContain('注意：謄本列印完畢');
  });

  it('AI Plain-Language Interpretations is not empty', async () => {
    vi.mocked(runCodex)
      .mockResolvedValueOnce(ok('物件摘要...'))
      .mockResolvedValueOnce(ok('他項權利白話說明...'));

    const dossier: PropertyDossier = {
      property_type: '大樓',
      address: '台南市...',
      total_price: 998,
      public_facilities: [],
    };

    const transcript: TranscriptParseResult = {
      source_format: 'yaml',
      confidence: 1,
      fields: {},
      additional: {
        encumbrances: [{ creditor: '第一商業銀行', amount: 3180000, registered_date: '民國090年07月13日' }],
      },
    };

    const result = await generateDisclosureDocument(dossier, transcript);
    const page4 = result.pages.find((p) => p.page_number === 4)!;
    expect(page4.content).toContain('他項權利');
    expect(page4.content).toContain('白話');
  });

  it('Missing fields should include 待補', async () => {
    vi.mocked(runCodex)
      .mockResolvedValueOnce(ok('物件摘要...'))
      .mockResolvedValueOnce(ok('他項權利白話說明...'));

    const dossier: PropertyDossier = {
      property_type: '大樓',
      address: '',
      total_price: 998,
      public_facilities: [],
    };

    const result = await generateDisclosureDocument(dossier);
    expect(result.pages[0].content).toContain('待補');
  });

  it('TOC checkbox checked when attachments exist', async () => {
    vi.mocked(runCodex)
      .mockResolvedValueOnce(ok('物件摘要...'))
      .mockResolvedValueOnce(ok('他項權利白話說明...'));

    const dossier: PropertyDossier = {
      property_type: '大樓',
      address: '台南市...',
      total_price: 998,
      public_facilities: [],
    };

    const transcript: TranscriptParseResult = {
      source_format: 'yaml',
      confidence: 1,
      fields: {},
      additional: {},
    };

    const result = await generateDisclosureDocument(dossier, transcript);
    expect(Object.values(result.toc_checkboxes).some(Boolean)).toBe(true);
  });
});
