import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const baseURL = 'http://localhost:1420';
const outDir = 'artifacts/smoke';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
page.setDefaultTimeout(30000);

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
await page.getByLabel('案件名稱（選填）').fill('裕農路回歸測試');
await page.getByLabel('案件編號（選填）').fill('REG-20260526');
await page.getByRole('button', { name: '查詢物件資料' }).click();
await page.getByRole('button', { name: '建立案件' }).waitFor({ state: 'visible', timeout: 30000 });
await page.getByRole('button', { name: '建立案件' }).click();
await page.waitForURL(/\/cases\//, { timeout: 30000 });

const storedAfterCreate = await page.evaluate(() => JSON.parse(window.localStorage.getItem('aire-mock-store') || '{}'));
const created = storedAfterCreate.cases?.find((row) => row.case_no === 'REG-20260526');
if (!created?.id) throw new Error('created case not found in mock store');

await page.goto(`${baseURL}/cases/_?caseId=${encodeURIComponent(created.id)}&tab=sources`, { waitUntil: 'networkidle' });
await page.getByRole('tab', { name: '資料來源' }).click();
await page.getByRole('region', { name: '候選土地建物清單' }).waitFor({ state: 'visible' });
const formalButtons = await page.getByRole('button', { name: '正式資料匯入（付費）' }).count();
if (formalButtons !== 1) throw new Error(`expected one formal import button, got ${formalButtons}`);
await page.screenshot({ path: `${outDir}/local-web-yunong-formal-import-source-before-20260526.png`, fullPage: true });

await page.getByRole('button', { name: '正式資料匯入（付費）' }).click();
await page.getByLabel('客戶已書面授權查詢不動產資料').check();
await page.getByRole('button', { name: '確認', exact: true }).click();
await page.getByText('預估費用').waitFor({ state: 'visible' });
const chargeText = await page.locator('body').innerText();
if (!chargeText.includes('NT$20')) throw new Error('estimated charge did not show NT$20');
await page.getByRole('button', { name: '確定，開始查詢' }).click();
await page.getByText('已寫入案件資料預覽').waitFor({ state: 'visible', timeout: 30000 });
await page.getByText('已寫入案件，可用於預覽與 PDF').waitFor({ state: 'visible', timeout: 30000 });
await page.screenshot({ path: `${outDir}/local-web-yunong-formal-import-source-after-20260526.png`, fullPage: true });

const bodyText = await page.locator('body').innerText();
for (const expected of ['建物權利範圍', '地政已帶入', '本次費用', '20 元']) {
  if (!bodyText.includes(expected)) throw new Error(`missing expected UI text: ${expected}`);
}
if (bodyText.includes('取消\n確認')) throw new Error('single candidate still exposes cancel/confirm pair');

await page.getByRole('tab', { name: '補件/現場' }).click();
await page.getByLabel('建物現況回答').selectOption('有漏水或壁癌');
await page.getByLabel('格局補件值').selectOption('3房2廳2衛');
await page.getByLabel('座向補件值').selectOption('坐北朝南');
await page.getByLabel('管理費（元/月）補件值').selectOption('1000-3000 元');
if (!(await page.getByText('檔案').first().isVisible())) throw new Error('upload affordance not visible');
if (await page.getByText('選擇地籍圖檔案').count()) throw new Error('long upload label still visible');
await page.screenshot({ path: `${outDir}/local-web-yunong-supplement-selects-20260526.png`, fullPage: true });

await page.getByRole('tab', { name: 'PDF 檢查' }).click();
await page.getByRole('link', { name: '開啟 PDF 預覽' }).click();
await page.waitForURL(/\/cases\/_\/preview\?caseId=/, { timeout: 30000 });
await page.getByText(/Logo：/).waitFor({ state: 'visible', timeout: 30000 });
await page.screenshot({ path: `${outDir}/local-web-yunong-pdf-preview-after-formal-20260526.png`, fullPage: true });

const finalStore = await page.evaluate(() => JSON.parse(window.localStorage.getItem('aire-mock-store') || '{}'));
const finalCase = finalStore.cases?.find((row) => row.id === created.id);
await fs.writeFile(`${outDir}/local-web-yunong-formal-import-case-20260526.json`, JSON.stringify(finalCase, null, 2));
if (!finalCase?.land_registry_data?.entries?.building_registry?.trustedForPdf) throw new Error('building_registry not trusted in saved case');
if (!finalCase?.land_registry_data?.entries?.building_ownership?.trustedForPdf) throw new Error('building_ownership not trusted in saved case');
if (finalCase.land_registry_data.totalCost !== 20) throw new Error(`expected totalCost 20, got ${finalCase.land_registry_data.totalCost}`);

await browser.close();
console.log(JSON.stringify({ ok: true, caseId: created.id, totalCost: finalCase.land_registry_data.totalCost }, null, 2));
