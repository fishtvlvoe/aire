import puppeteer from 'puppeteer';

export interface TaxInput {
  announced_land_value: number;
  previous_transfer_value: number;
  area: number; // 土地面積
}

export interface TaxResult {
  land_value_increment_tax_general: number;
  land_value_increment_tax_self_use: number;
  house_assessed_value?: number;
  cached_at?: Date;
  source: string;
}

export class TaxScraperError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'TaxScraperError';
  }
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const cache = new Map<string, { result: TaxResult; timestamp: number }>();

export function clearTaxCache(): void {
  cache.clear();
}

function cacheKey(input: TaxInput): string {
  return `${input.announced_land_value}|${input.previous_transfer_value}|${input.area}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function scrapeTax(input: TaxInput): Promise<TaxResult> {
  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();

    // 土增稅
    await page.goto('https://www.etax.nat.gov.tw/etwmain/etw158w/51', {
      waitUntil: 'domcontentloaded',
    });
    try {
      await page.waitForSelector('body', { timeout: 5000 });
    } catch (e) {
      throw new TaxScraperError('Selector timeout (土增稅頁面)', e);
    }

    // 房屋評定現值（可選）
    await page.goto('https://www.etax.nat.gov.tw/etwmain/etw158w/53', {
      waitUntil: 'domcontentloaded',
    });
    try {
      await page.waitForSelector('body', { timeout: 5000 });
    } catch (e) {
      throw new TaxScraperError('Selector timeout (房屋評定現值頁面)', e);
    }

    // TODO: 尚未實際填寫財政部網頁表單，目前為本地試算公式（×10%/×8%）。
    const general = Math.max(0, Math.round(input.previous_transfer_value * 0.1));
    const selfUse = Math.max(0, Math.round(input.previous_transfer_value * 0.08));

    return {
      land_value_increment_tax_general: general,
      land_value_increment_tax_self_use: selfUse,
      house_assessed_value: undefined,
      source: '試算值（公告現值比例估算，待接財政部實際試算）',
    };
  } finally {
    await browser.close();
  }
}

export class TaxCalculator {
  async calculate(input: TaxInput): Promise<TaxResult> {
    const key = cacheKey(input);
    const cached = cache.get(key);
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return {
        ...cached.result,
        cached_at: new Date(cached.timestamp),
      };
    }

    let lastError: unknown;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = await scrapeTax(input);
        cache.set(key, { result, timestamp: now });
        return result;
      } catch (e) {
        lastError = e;
        if (e instanceof TaxScraperError) throw e;
        if (attempt >= 3) break;
        await sleep(1000 * Math.pow(2, attempt - 1)); // 1s / 2s / 4s
      }
    }

    throw lastError instanceof Error ? lastError : new Error('TaxCalculator failed');
  }
}
