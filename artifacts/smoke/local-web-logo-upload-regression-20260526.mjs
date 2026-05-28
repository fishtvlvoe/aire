import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const baseURL = 'http://localhost:1420';
const outDir = 'artifacts/smoke';
const logoPath = `${outDir}/logo-upload-smoke-20260526.svg`;
await fs.writeFile(logoPath, '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40"><rect width="120" height="40" fill="#0f172a"/><text x="12" y="26" font-size="18" fill="white">AIRE</text></svg>');

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.setDefaultTimeout(30000);
await page.goto(`${baseURL}/login`, { waitUntil: 'domcontentloaded' });
await page.evaluate(() => {
  window.localStorage.setItem('aire-mock-store', JSON.stringify({
    sessionUser: { email: 'admin@test.aire', role: 'admin' },
    appSettings: { landApi: { clientId: 'mock-client-id', secret: 'mock-client-secret' } },
  }));
});
await page.goto(`${baseURL}/settings/branding`, { waitUntil: 'networkidle' });
await page.getByTestId('logo-file-input').setInputFiles(logoPath);
await page.getByText('已保存 Logo').waitFor({ state: 'visible' });
await page.getByText('logo-upload-smoke-20260526.svg').waitFor({ state: 'visible' });
await page.reload({ waitUntil: 'networkidle' });
await page.getByText('已保存 Logo').waitFor({ state: 'visible' });
await page.getByText('logo-upload-smoke-20260526.svg').waitFor({ state: 'visible' });
await page.screenshot({ path: `${outDir}/local-web-logo-upload-persisted-20260526.png`, fullPage: true });
await browser.close();
console.log(JSON.stringify({ ok: true, logo: 'logo-upload-smoke-20260526.svg' }, null, 2));
