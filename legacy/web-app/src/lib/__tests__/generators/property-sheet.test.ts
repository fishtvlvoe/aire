import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CodexResult } from '@/lib/codex-client';

vi.mock('@/lib/codex-client', () => ({
  runCodex: vi.fn().mockResolvedValue({ success: true, output: '優點...\n缺點...\n建議客群...', status: 'ready' } satisfies CodexResult),
}));

const taxCalculate = vi.fn().mockResolvedValue({
  land_value_increment_tax_general: 111,
  land_value_increment_tax_self_use: 88,
  source: '財政部稅務入口網',
});

vi.mock('@/lib/scrapers/tax-calculator', () => ({
  TaxCalculator: class {
    calculate = taxCalculate;
  },
  TaxScraperError: class extends Error {},
}));

const bankEstimate = vi.fn().mockResolvedValue({
  mortgage_scenarios: [
    { loan_ratio: 0.6, down_payment: 400, loan_amount: 600, monthly_payment: 1, source: '試算公式' },
    { loan_ratio: 0.7, down_payment: 300, loan_amount: 700, monthly_payment: 1, source: '試算公式' },
    { loan_ratio: 0.8, down_payment: 200, loan_amount: 800, monthly_payment: 1, source: '試算公式' },
  ],
});

vi.mock('@/lib/scrapers/bank-estimator', () => ({
  BankEstimator: class {
    estimate = bankEstimate;
  },
}));

import { mergeDataLayers } from '@/lib/models/property-sheet';
import type { PropertyDossier } from '@/lib/models/property-dossier';
import type { TranscriptParseResult } from '@/lib/parsers/transcript-parser';
import { generatePropertySheet } from '@/lib/generators/property-sheet';

describe('Task 4 — property-sheet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('Nine Area Fields map from TranscriptParseResult.fields', async () => {
    const transcript: TranscriptParseResult = {
      source_format: 'yaml',
      confidence: 1,
      fields: {
        registered_area: 23.37,
        land_area: 0,
        main_building_area: 77.26,
        accessory_building_area: 9.53,
        common_facility_area: 58.0,
        arcade_area: 0,
        parking_area: 39.63,
        parking_type: '地下',
        parking_space: '71',
      },
      additional: {},
    };

    const dossier: PropertyDossier = {
      property_type: '大樓',
      address: '台南市中西區...',
      total_price: 998,
      public_facilities: ['游泳池', '健身房'],
    };

    const md = await generatePropertySheet(dossier, transcript);
    expect(md).toContain('登記坪數');
    expect(md).toContain('23.37');
    expect(md).toContain('停車型式');
    expect(md).toContain('地下');
    expect(md).toContain('停車編號');
    expect(md).toContain('71');
  });

  it('Price Unit in Ten-Thousands', async () => {
    const dossier: PropertyDossier = {
      property_type: '大樓',
      address: '台南市中西區...',
      total_price: 998,
      public_facilities: [],
    };

    const md = await generatePropertySheet(dossier);
    expect(md).toContain('998 萬元');
  });

  it('Three-Layer Data Priority (mergeDataLayers)', () => {
    const r = mergeDataLayers(
      { a: 'L1', b: '' },
      { a: 'L2', b: 'L2' },
      { a: 'L3', b: 'L3' }
    );

    const a = r.fields.find((f) => f.key === 'a')!;
    const b = r.fields.find((f) => f.key === 'b')!;

    expect(a.value).toBe('L1');
    expect(a.source).toBe('L1_user');

    // b: L1 empty → L2 wins
    expect(b.value).toBe('L2');
    expect(b.source).toBe('L2_system');
  });

  it('Public Facilities Checkbox', async () => {
    const dossier: PropertyDossier = {
      property_type: '大樓',
      address: '台南市中西區...',
      total_price: 998,
      public_facilities: ['游泳池'],
    };

    const md = await generatePropertySheet(dossier);
    expect(md).toContain('- [x] 游泳池');
    expect(md).toContain('- [ ] 健身房');
  });

  it('Automated Tax Calculations calls TaxCalculator.calculate()', async () => {
    const transcript: TranscriptParseResult = {
      source_format: 'yaml',
      confidence: 1,
      fields: { land_area: 30 },
      additional: { announced_land_value: 100, previous_transfer_value: 80 },
    };

    const dossier: PropertyDossier = {
      property_type: '大樓',
      address: '台南市中西區...',
      total_price: 998,
      public_facilities: [],
    };

    await generatePropertySheet(dossier, transcript);
    expect(taxCalculate).toHaveBeenCalledTimes(1);
  });

  it('Three-Scenario Mortgage invokes estimator and contains 60/70/80', async () => {
    const dossier: PropertyDossier = {
      property_type: '大樓',
      address: '台南市中西區...',
      total_price: 998,
      public_facilities: [],
    };

    const md = await generatePropertySheet(dossier);
    expect(bankEstimate).toHaveBeenCalledTimes(1);
    expect(md).toContain('60%');
    expect(md).toContain('70%');
    expect(md).toContain('80%');
  });
});
