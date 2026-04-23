import { describe, it, expect, vi, afterEach } from 'vitest';
import puppeteer from 'puppeteer';

import { TaxCalculator, TaxScraperError, clearTaxCache, type TaxInput } from '@/lib/scrapers/tax-calculator';

vi.mock('puppeteer', () => ({
  default: {
    launch: vi.fn(),
  },
}));

describe('Task 2 — TaxCalculator', () => {
  afterEach(() => {
    clearTaxCache();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('has retry logic (max 3, exponential backoff)', async () => {
    vi.useFakeTimers();

    const input: TaxInput = { announced_land_value: 1000000, previous_transfer_value: 800000, area: 30 };

    vi.mocked(puppeteer.launch)
      .mockRejectedValueOnce(new Error('fail-1'))
      .mockRejectedValueOnce(new Error('fail-2'))
      .mockResolvedValueOnce({
        newPage: vi.fn().mockResolvedValue({
          goto: vi.fn(),
          waitForSelector: vi.fn(),
        }),
        close: vi.fn(),
      } as any);

    const calc = new TaxCalculator();
    const p = calc.calculate(input);

    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(2000);

    const result = await p;
    expect(result.source).toBeTruthy();
    expect(vi.mocked(puppeteer.launch)).toHaveBeenCalledTimes(3);
  });

  it('cache hit within 24h should not re-scrape', async () => {
    const input: TaxInput = { announced_land_value: 1000000, previous_transfer_value: 800000, area: 30 };

    vi.mocked(puppeteer.launch).mockResolvedValue({
      newPage: vi.fn().mockResolvedValue({
        goto: vi.fn(),
        waitForSelector: vi.fn(),
      }),
      close: vi.fn(),
    } as any);

    const now = 1_700_000_000_000;
    vi.spyOn(Date, 'now').mockReturnValue(now);

    const calc = new TaxCalculator();
    await calc.calculate(input);

    vi.spyOn(Date, 'now').mockReturnValue(now + 60 * 60 * 1000); // +1h
    await calc.calculate(input);

    expect(vi.mocked(puppeteer.launch)).toHaveBeenCalledTimes(1);
  });

  it('selector failure should throw TaxScraperError', async () => {
    const input: TaxInput = { announced_land_value: 1000000, previous_transfer_value: 800000, area: 30 };

    vi.mocked(puppeteer.launch).mockResolvedValue({
      newPage: vi.fn().mockResolvedValue({
        goto: vi.fn(),
        waitForSelector: vi.fn().mockRejectedValue(new Error('TimeoutError')),
      }),
      close: vi.fn(),
    } as any);

    const calc = new TaxCalculator();
    await expect(calc.calculate(input)).rejects.toBeInstanceOf(TaxScraperError);
  });
});
