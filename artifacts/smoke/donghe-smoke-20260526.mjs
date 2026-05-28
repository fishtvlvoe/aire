import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const baseURL = 'http://localhost:1420';
const outDir = '/Users/fishtv/Development/products/AIRE/artifacts/smoke';
const pdfPath = `${outDir}/local-web-donghe-formal-button-images-20260526.pdf`;
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ acceptDownloads: true, viewport: { width: 1440, height: 1100 } });
const page = await context.newPage();
page.setDefaultTimeout(90_000);

await page.goto(`${baseURL}/cases/new`, { waitUntil: 'networkidle' });
await page.getByLabel('地址 *').fill('台南市東區東和路47號3樓');
await page.getByLabel('所有權人（選填）').fill('蔡國卿');
await page.getByLabel('案件名稱（選填）').fill('東和路47');
await page.getByLabel('案件編號（選填）').fill(`AIRE-DONGHE-IMG-${Date.now()}`);
await page.getByRole('button', { name: '查詢物件資料', exact: true }).click();
await page.getByRole('button', { name: '建立案件', exact: true }).waitFor({ state: 'visible' });
await page.getByRole('button', { name: '建立案件', exact: true }).click();
await page.waitForURL(/\/cases\/(?:[0-9a-f-]+|_\?caseId=[0-9a-f-]+)$/);
await page.getByRole('tab', { name: '資料來源' }).click();
const sourceRegion = page.getByRole('region', { name: '欄位資料來源' });
await sourceRegion.waitFor({ state: 'visible' });
const sourceText = await sourceRegion.textContent();
if (!sourceText.includes('已找到建號 03045000') && !sourceText.includes('已找到建號 00084000')) {
  throw new Error(`source missing plain building number: ${sourceText}`);
}
if (sourceText.includes('候選建號')) {
  throw new Error('source still contains 候選建號');
}
await sourceRegion.getByRole('button', { name: '正式資料匯入（付費）' }).waitFor({ state: 'visible' });
await page.screenshot({ path: `${outDir}/local-web-donghe-formal-button-source-20260526.png`, fullPage: true });

await page.getByRole('link', { name: '預覽 PDF' }).click();
await page.waitForURL(/\/cases\/(?:[0-9a-f-]+\/preview|_\/preview\?caseId=[0-9a-f-]+)$/);
await page.getByRole('heading', { name: 'PDF 預覽' }).waitFor({ state: 'visible' });
await page.getByTitle('PDF 預覽').waitFor({ state: 'visible', timeout: 90_000 });
const downloadPromise = page.waitForEvent('download');
await page.getByRole('button', { name: '匯出 PDF' }).click();
const download = await downloadPromise;
await download.saveAs(pdfPath);
await browser.close();

const pdfText = execFileSync('pdftotext', [pdfPath, '-'], { encoding: 'utf8' });
const imageList = execFileSync('pdfimages', ['-list', pdfPath], { encoding: 'utf8' });
const imageRows = imageList.split('\n').filter((line) => /\bimage\b/.test(line));
const mapImageRows = imageRows.filter((line) => /\b(500|600)\s+400\b/.test(line));
if (!pdfText.includes('民國081年09月14日') && !pdfText.includes('民國071年08月04日')) {
  throw new Error('PDF missing formatted ROC construction date');
}
if (mapImageRows.length < 1) {
  throw new Error(`PDF has no map/aerial images. pdfimages:\n${imageList}`);
}
console.log(JSON.stringify({ pdfPath, imageRows: imageRows.length, mapImageRows: mapImageRows.length }, null, 2));
