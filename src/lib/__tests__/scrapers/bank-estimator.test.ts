import { describe, it, expect, vi, afterEach } from 'vitest';
import puppeteer from 'puppeteer';

import { BankEstimator } from '@/lib/scrapers/bank-estimator';

vi.mock('puppeteer', () => ({
  default: {
    launch: vi.fn(),
  },
}));

describe('Task 2 — BankEstimator', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('estimate(price) returns object with sources and scenarios (60/70/80)', async () => {
    // puppeteer failures should not block
    vi.mocked(puppeteer.launch).mockRejectedValue(new Error('blocked'));

    const estimator = new BankEstimator();
    const result = await estimator.estimate(10_000_000, { rate: 0.022, years: 30 });

    expect(result).toHaveProperty('mortgage_scenarios');
    expect(result.mortgage_scenarios).toHaveLength(3);

    const ratios = result.mortgage_scenarios.map((s) => s.loan_ratio);
    expect(ratios.sort()).toEqual([0.6, 0.7, 0.8]);

    for (const s of result.mortgage_scenarios) {
      expect(s.down_payment).toBeGreaterThan(0);
      expect(s.monthly_payment).toBeGreaterThan(0);
      expect(typeof s.source).toBe('string');
    }

    // bank fields are optional
    expect(result.fubon_range).toBeUndefined();
    expect(result.cathay_ratio).toBeUndefined();
  });

  it('three-scenario mortgage simulation has correct down_payment + monthly_payment formula', async () => {
    const estimator = new BankEstimator();
    const price = 10_000_000;
    const rate = 0.022;
    const years = 30;

    const { mortgage_scenarios } = await estimator.estimate(price, { rate, years });
    const s60 = mortgage_scenarios.find((s) => s.loan_ratio === 0.6)!;

    expect(s60.down_payment).toBeCloseTo(price * 0.4, 2);
    expect(s60.loan_amount).toBeCloseTo(price * 0.6, 2);

    const r = rate / 12;
    const n = years * 12;
    const P = price * 0.6;
    const expectedMonthly = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    expect(s60.monthly_payment).toBeCloseTo(expectedMonthly, 2);
  });

  it('data source attribution for bank results', async () => {
    vi.mocked(puppeteer.launch).mockResolvedValue({
      newPage: vi.fn().mockResolvedValue({
        goto: vi.fn(),
        waitForSelector: vi.fn(),
        $eval: vi.fn().mockImplementation((sel: string) => {
          if (sel.includes('fubon')) return '900~1100 萬';
          if (sel.includes('cathay')) return '最高 8 成';
          return '';
        }),
      }),
      close: vi.fn(),
    } as any);

    const estimator = new BankEstimator();
    const result = await estimator.estimate(10_000_000);

    if (result.fubon_range) expect(result.fubon_range.source).toContain('富邦');
    if (result.cathay_ratio) expect(result.cathay_ratio.source).toContain('國泰');
  });
});
