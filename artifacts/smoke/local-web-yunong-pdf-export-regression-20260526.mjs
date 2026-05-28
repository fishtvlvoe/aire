import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';

const baseURL = 'http://localhost:1420';
const outDir = '/Users/fishtv/Development/products/AIRE/artifacts/smoke';
const runId = Date.now();
const pdfPath = `${outDir}/local-web-yunong-pdf-export-regression-${runId}.pdf`;
const textPath = `${outDir}/local-web-yunong-pdf-export-regression-${runId}.txt`;
const caseJsonPath = `${outDir}/local-web-yunong-pdf-export-regression-${runId}.json`;
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ acceptDownloads: true, viewport: { width: 1440, height: 1200 } });
const page = await context.newPage();
page.setDefaultTimeout(90_000);

await page.goto(`${baseURL}/login`, { waitUntil: 'domcontentloaded' });
await page.evaluate(() => {
  window.localStorage.setItem('aire-mock-store', JSON.stringify({
    sessionUser: { email: 'admin@test.aire', role: 'admin' },
    appSettings: {
      landApi: { clientId: 'mock-client-id', secret: 'mock-client-secret' },
      premium: { subscribed: false, plan: null, expiresAt: null },
      premiumUnlocked: false,
    },
    trialState: { plan: 'trial', status: 'active', startedAt: '2026-05-01T00:00:00.000Z', endsAt: '2026-06-24T00:00:00.000Z' },
  }));
});

await page.goto(`${baseURL}/cases/new`, { waitUntil: 'networkidle' });
await page.getByLabel('地址 *').fill('台南市東區裕農路288巷17號8樓之1');
await page.getByLabel('所有權人（選填）').fill('余啟彰');
await page.getByLabel('案件名稱（選填）').fill('裕農路 PDF 回歸測試');
await page.getByLabel('案件編號（選填）').fill(`PDF-YUNONG-${runId}`);
await page.getByRole('button', { name: '查詢物件資料', exact: true }).click();
await page.getByRole('button', { name: '建立案件', exact: true }).waitFor({ state: 'visible' });
await page.getByRole('button', { name: '建立案件', exact: true }).click();
await page.waitForURL(/\/cases\//, { timeout: 30_000 });

const created = await page.evaluate((caseNo) => {
  const store = JSON.parse(window.localStorage.getItem('aire-mock-store') || '{}');
  return store.cases?.find((row) => row.case_no === caseNo);
}, `PDF-YUNONG-${runId}`);
if (!created?.id) throw new Error('created case not found');

await page.goto(`${baseURL}/cases/_?caseId=${encodeURIComponent(created.id)}&tab=sources`, { waitUntil: 'networkidle' });
await page.getByRole('tab', { name: '資料來源' }).click();
await page.getByRole('button', { name: '正式資料匯入（付費）' }).click();
await page.getByLabel('客戶已書面授權查詢不動產資料').check();
await page.getByRole('button', { name: '確認', exact: true }).click();
await page.getByText('預估費用').waitFor({ state: 'visible' });
const confirmText = await page.locator('body').innerText();
if (!confirmText.includes('NT$20')) throw new Error(`expected NT$20 estimate, got: ${confirmText}`);
await page.getByRole('button', { name: '確定，開始查詢' }).click();
await page.getByText('已寫入案件資料預覽').waitFor({ state: 'visible' });

await page.getByRole('tab', { name: '補件/現場' }).click();
await page.getByLabel('建物現況回答').selectOption('正常使用');
await page.getByLabel('格局補件值').selectOption('3房2廳2衛');
await page.getByLabel('座向補件值').selectOption('坐東朝西');
await page.getByLabel('管理費（元/月）補件值').selectOption('1000-3000 元');
if (!(await page.getByText('檔案').first().isVisible())) throw new Error('short upload label not visible');
if (await page.getByText('選擇地籍圖檔案').count()) throw new Error('long upload label still visible');

await page.getByRole('link', { name: '預覽 PDF' }).click();
await page.waitForURL(/\/cases\/(?:[0-9a-f-]+\/preview|_\/preview\?caseId=[0-9a-f-]+)/, { timeout: 30_000 });
await page.getByRole('heading', { name: 'PDF 預覽' }).waitFor({ state: 'visible' });
await page.getByTitle('PDF 預覽').waitFor({ state: 'visible', timeout: 90_000 });
const downloadPromise = page.waitForEvent('download');
await page.getByRole('button', { name: '匯出 PDF' }).click();
const download = await downloadPromise;
await download.saveAs(pdfPath);

const finalStore = await page.evaluate(() => JSON.parse(window.localStorage.getItem('aire-mock-store') || '{}'));
const finalCase = finalStore.cases?.find((row) => row.id === created.id);
await fs.writeFile(caseJsonPath, JSON.stringify(finalCase, null, 2));
await browser.close();

const pdfText = execFileSync('pdftotext', ['-layout', pdfPath, '-'], { encoding: 'utf8' });
await fs.writeFile(textPath, pdfText);
const imageList = execFileSync('pdfimages', ['-list', pdfPath], { encoding: 'utf8' });
const imageRows = imageList.split('\n').filter((line) => /\bimage\b/.test(line));

for (const expected of ['民國080年08月29日', '住家用', '25.29坪', '34 年', '八層', '3房2廳2衛', '正常使用']) {
  if (!pdfText.includes(expected)) throw new Error(`PDF missing expected text: ${expected}`);
}
if (imageRows.length < 2) {
  throw new Error(`PDF has fewer than 2 image objects. pdfimages:\n${imageList}`);
}
if (finalCase?.land_registry_data?.totalCost !== 20) {
  throw new Error(`expected saved totalCost 20, got ${finalCase?.land_registry_data?.totalCost}`);
}

console.log(JSON.stringify({ ok: true, caseId: created.id, pdfPath, textPath, caseJsonPath, imageRows: imageRows.length }, null, 2));
