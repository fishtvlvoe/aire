import { test, expect, type Page } from '@playwright/test';

const BASE = 'http://localhost:3000';

async function login(page: Page) {
  await page.goto(`${BASE}/login`);
  await page.waitForLoadState('networkidle');
  await page.locator('input[type="text"]').fill('admin@local');
  await page.locator('input[type="password"]').fill('admin123');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/(listings|admin)/, { timeout: 10000 });
}

test.describe('License Admin E2E (Task 9.2)', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('序號列表頁面 API 回應', async ({ page }) => {
    page.on('response', async (response) => {
      if (response.url().includes('/api/admin/licenses')) {
        const body = await response.text().catch(() => 'cannot read');
        console.log(`API: ${response.status()} ${response.url()} → ${body.substring(0, 300)}`);
      }
    });

    await page.goto(`${BASE}/admin/licenses`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/tmp/e2e-license-list2.png' });
  });

  test('序號列表頁面載入，顯示五欄表格', async ({ page }) => {
    await page.goto(`${BASE}/admin/licenses`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const headers = await page.$$eval('th', (ths: Element[]) =>
      ths.map(th => th.textContent?.trim())
    );
    console.log('Table headers:', JSON.stringify(headers));
    expect(headers).toEqual(expect.arrayContaining(['編號', '序號 (Key)', '狀態', '使用者', '操作']));
  });

  test('搜尋功能', async ({ page }) => {
    await page.goto(`${BASE}/admin/licenses`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const searchInput = page.locator('input[placeholder*="搜尋"]');
    expect(await searchInput.count()).toBe(1);
    await searchInput.fill('THREE');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: '/tmp/e2e-license-search.png' });
  });
});
