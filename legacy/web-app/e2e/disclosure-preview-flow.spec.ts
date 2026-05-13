import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { execFileSync } from 'node:child_process';
import { expect, test, type Page } from '@playwright/test';

const OUT = '/tmp/disclosure-preview-flow';
const ADMIN_USERNAME = 'admin@local';
const ADMIN_PASSWORD = 'admin123';

function ensureAdminUser(): void {
  try {
    execFileSync('npx', ['tsx', 'scripts/create-admin.ts', '--username', ADMIN_USERNAME, '--password', ADMIN_PASSWORD], {
      cwd: process.cwd(),
      stdio: 'ignore',
    });
  } catch {
    // account may already exist
  }
}

function createListingFixture(): number {
  const dbPath = process.env.DB_PATH || './data/listings.db';
  const db = new Database(dbPath);
  const insert = db.prepare(`
    INSERT INTO listings (
      address,
      propertyType,
      property_type,
      status,
      field_visit_status,
      supplementary_data,
      generated_documents
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const result = insert.run(
    '台北市信義路三段100號',
    'apartment',
    'apartment',
    'documents-ready',
    'field-visit-complete',
    JSON.stringify({
      property_name: '信義路三段100號',
      owner_name: '王小明',
      store_name: '建安信義店',
      agent_name: '陳大華',
      company_name: '建安不動產',
      company_address: '台北市信義路三段100號',
      company_phone: '02-12345678',
    }),
    JSON.stringify({
      disclosure_document: '# test disclosure',
      disclosure_overrides: {},
    }),
  );
  db.close();
  return Number(result.lastInsertRowid);
}

async function loginAdmin(page: Page): Promise<void> {
  await page.goto('/admin/login');
  await page.locator('input[type="text"]').fill(ADMIN_USERNAME);
  await page.locator('input[type="password"]').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: '登入' }).click();
  await page.waitForURL('**/listings');
}

test('disclosure preview full flow with screenshots', async ({ page }) => {
  fs.mkdirSync(OUT, { recursive: true });
  ensureAdminUser();
  const listingId = createListingFixture();

  await loginAdmin(page);

  // (1) 管理員上傳封面背景圖
  await page.goto('/admin/templates');
  const png1x1 = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=',
    'base64',
  );
  await page.locator('input[id^="bg-upload-"]').first().setInputFiles({
    name: 'cover.png',
    mimeType: 'image/png',
    buffer: png1x1,
  });
  await expect(page.getByText('背景圖上傳成功')).toBeVisible({ timeout: 10000 });
  await page.screenshot({ path: `${OUT}/01-admin-upload-cover-bg.png`, fullPage: true });

  // (2)(3) fixture 已建立 listing 並注入 disclosure_document
  await page.goto(`/listings/${listingId}/documents`);
  await page.screenshot({ path: `${OUT}/02-listing-documents-page.png`, fullPage: true });

  // (4) 點預覽按鈕進入預覽頁
  await page.getByRole('button', { name: '預覽' }).first().click();
  await page.waitForURL(`**/listings/${listingId}/documents/preview`);
  await page.screenshot({ path: `${OUT}/03-preview-page-loaded.png`, fullPage: true });

  // (5) 確認背景圖和欄位疊加
  await expect(page.locator('img[alt="cover background"]')).toBeVisible();
  await expect(page.locator('[aria-label="物件名稱"]')).toBeVisible();
  await page.screenshot({ path: `${OUT}/04-overlay-visible.png`, fullPage: true });

  // (6)(7) 編輯欄位並 blur 儲存
  const objectName = page.locator('[aria-label="物件名稱"]');
  await objectName.click();
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
  await page.keyboard.type('信義路三段100號5樓');
  await page.locator('h1').click();
  await expect(page.getByText('✓')).toBeVisible({ timeout: 5000 });
  await page.screenshot({ path: `${OUT}/05-inline-edit-saved.png`, fullPage: true });

  // (8) reload 後確認持久化
  await page.reload();
  await expect(page.locator('[aria-label="物件名稱"]')).toContainText('信義路三段100號5樓');
  await page.screenshot({ path: `${OUT}/06-reload-persisted.png`, fullPage: true });
});

