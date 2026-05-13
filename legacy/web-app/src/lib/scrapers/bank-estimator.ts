import { launchBrowser } from '../pdf-generator/chromium-launcher';

export interface MortgageScenario {
  loan_ratio: 0.6 | 0.7 | 0.8;
  down_payment: number;
  loan_amount: number;
  monthly_payment: number;
  source: string;
}

export interface BankEstimateResult {
  fubon_range?: { min: number; max: number; source: string };
  cathay_ratio?: { max_ratio: number; source: string };
  mortgage_scenarios: MortgageScenario[];
}

function parseRangeToMinMax(text: string): { min: number; max: number } | null {
  const m = text.replace(/,/g, '').match(/(\d+(?:\.\d+)?)\s*[~\-－—]\s*(\d+(?:\.\d+)?)/);
  if (!m) return null;
  return { min: Number(m[1]), max: Number(m[2]) };
}

function parseMaxRatio(text: string): number | null {
  // e.g. "最高 8 成" → 0.8
  const m = text.match(/(\d)\s*成/);
  if (m) return Number(m[1]) / 10;
  const p = text.match(/(\d{1,2})\s*%/);
  if (p) return Number(p[1]) / 100;
  return null;
}

function monthlyPayment(P: number, annualRate: number, years: number): number {
  const r = annualRate / 12;
  const n = years * 12;
  if (r === 0) return P / n;
  const pow = Math.pow(1 + r, n);
  return (P * r * pow) / (pow - 1);
}

async function scrapeFubonRange(): Promise<{ min: number; max: number } | undefined> {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.goto('https://www.fubon.com/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('body', { timeout: 3000 });
    const raw = (await page.$eval('div[data-testid="fubon-range"]', (el) => (el as HTMLElement).innerText)) as string;
    const mm = parseRangeToMinMax(raw);
    return mm ?? undefined;
  } finally {
    await browser.close();
  }
}

async function scrapeCathayRatio(): Promise<number | undefined> {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.goto('https://www.cathaybk.com.tw/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('body', { timeout: 3000 });
    const raw = (await page.$eval('div[data-testid="cathay-ratio"]', (el) => (el as HTMLElement).innerText)) as string;
    const ratio = parseMaxRatio(raw);
    return ratio ?? undefined;
  } finally {
    await browser.close();
  }
}

export class BankEstimator {
  async estimate(price: number, options?: { rate?: number; years?: number }): Promise<BankEstimateResult> {
    const rate = options?.rate ?? 0.022;
    const years = options?.years ?? 30;

    const mortgage_scenarios: MortgageScenario[] = ([0.6, 0.7, 0.8] as const).map((loan_ratio) => {
      const loan_amount = price * loan_ratio;
      return {
        loan_ratio,
        down_payment: price - loan_amount,
        loan_amount,
        monthly_payment: monthlyPayment(loan_amount, rate, years),
        source: '試算公式',
      };
    });

    const result: BankEstimateResult = {
      mortgage_scenarios,
    };

    // 抓取銀行資料：失敗不阻擋
    try {
      const mm = await scrapeFubonRange();
      if (mm) result.fubon_range = { ...mm, source: '富邦' };
    } catch {
      // ignore
    }

    try {
      const ratio = await scrapeCathayRatio();
      if (ratio != null) result.cathay_ratio = { max_ratio: ratio, source: '國泰' };
    } catch {
      // ignore
    }

    return result;
  }
}
