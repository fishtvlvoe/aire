/**
 * 截圖驗證腳本：external-market-lookup UI
 * 執行：npx playwright test e2e/screenshot-market-lookup.spec.ts
 */

import { test, type Page } from '@playwright/test';

const OUT = '/tmp';

async function createTestListing(page: Page): Promise<number> {
  const res = await page.request.post('/api/listings', { data: { propertyType: 'apartment' } });
  if (!res.ok()) throw new Error(`建立 listing 失敗 (${res.status()}): ${await res.text()}`);
  const { listing } = (await res.json()) as { listing: { id: number } };
  const id = listing.id;
  const fv = await page.request.post(`/api/listings/${id}/field-visit`, {
    data: {
      data: {
        address: '台北市信義區信義路五段7號',
        property_name: `截圖測試物件 #${id}`,
        total_price: 3000, building_area: 30,
        ownership_scope: '單獨所有', other_rights: '無',
        restriction_records: '無', public_acquisition: '無',
        nearby_facilities: '無', non_natural_death: '無', leak_damage: '無',
      },
      isComplete: true,
    },
  });
  if (!fv.ok()) throw new Error(`field-visit 失敗 (${fv.status()}): ${await fv.text()}`);
  return id;
}

async function createNoAddressListing(page: Page): Promise<number> {
  const res = await page.request.post('/api/listings', { data: { propertyType: 'apartment' } });
  if (!res.ok()) throw new Error(`建立 listing 失敗 (${res.status()})`);
  const { listing } = (await res.json()) as { listing: { id: number } };
  const id = listing.id;
  await page.request.post(`/api/listings/${id}/field-visit`, {
    data: { data: { property_name: '無地址截圖測試物件', total_price: 1000 }, isComplete: false },
  });
  return id;
}

test('市調面板 UI 截圖（全部 6 張）', async ({ page }) => {
  const listingId = await createTestListing(page);
  const url = `/listings/${listingId}/supplementary`;

  // ── 1. 完整頁面 ──────────────────────────────────────────────
  await page.goto(url, { waitUntil: 'networkidle' });
  try { await page.waitForSelector('h1,h2,h3,[class*="heading"]', { timeout: 10000 }); } catch {}
  await page.screenshot({ path: `${OUT}/market-1-full.png`, fullPage: true });

  // ── 2. 外連按鈕區域 ─────────────────────────────────────────
  await page.goto(url, { waitUntil: 'networkidle' });
  try {
    const link = page.locator('a[data-platform]').first();
    await link.waitFor({ timeout: 5000 });
    const box = await page.locator('a[data-platform]').first().locator('..').boundingBox();
    if (box) {
      await page.screenshot({
        path: `${OUT}/market-2-buttons.png`,
        clip: { x: Math.max(0, box.x - 20), y: Math.max(0, box.y - 80), width: Math.min(box.width + 40, 1280), height: box.height + 160 },
      });
    } else {
      await page.screenshot({ path: `${OUT}/market-2-buttons.png`, fullPage: true });
    }
  } catch {
    await page.screenshot({ path: `${OUT}/market-2-buttons.png`, fullPage: true });
  }

  // ── 3. textarea + 字元計數 ──────────────────────────────────
  await page.goto(url, { waitUntil: 'networkidle' });
  try {
    const ta = page.locator('#market-summary');
    await ta.waitFor({ timeout: 5000 });
    await ta.fill('同社區近三月成交 5 件，每坪 82 萬，待售 3 戶平均單價 85 萬。');
    await page.waitForTimeout(400);
    const box = await ta.boundingBox();
    await page.screenshot({
      path: `${OUT}/market-3-textarea.png`,
      clip: box
        ? { x: Math.max(0, box.x - 20), y: Math.max(0, box.y - 40), width: Math.min(box.width + 40, 1280), height: box.height + 120 }
        : undefined,
      ...(box ? {} : { fullPage: true }),
    });
  } catch {
    await page.screenshot({ path: `${OUT}/market-3-textarea.png`, fullPage: true });
  }

  // ── 4. 附件上傳區（mock 模擬已上傳） ───────────────────────
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.route(`/api/listings/${listingId}/attachments`, async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({
          attachment: { id: 'test-001', type: 'market_research', filename: 'market-screenshot.png', path: '/uploads/test/market-screenshot.png', size: 102400, created_at: new Date().toISOString() },
        }),
      });
    } else { await route.continue(); }
  });
  try {
    const fi = page.locator('#market-attachment-input');
    await fi.waitFor({ timeout: 5000 });
    await fi.setInputFiles({ name: 'market-screenshot.png', mimeType: 'image/png', buffer: Buffer.from('fake-png') });
    try { await page.waitForSelector('text=market-screenshot.png', { timeout: 5000 }); } catch {}
  } catch {}
  await page.screenshot({ path: `${OUT}/market-4-attachments.png`, fullPage: true });

  // ── 5. 無地址提示 ────────────────────────────────────────────
  const noAddressId = await createNoAddressListing(page);
  await page.goto(`/listings/${noAddressId}/supplementary`, { waitUntil: 'networkidle' });
  try { await page.waitForSelector('h1,h2,h3,[class*="heading"]', { timeout: 8000 }); } catch {}
  try {
    const txt = page.getByText(/無物件地址|先在.*階段填寫地址|尚未填寫.*地址|暫無地址/).first();
    await txt.waitFor({ timeout: 5000 });
    const box = await txt.boundingBox();
    if (box) {
      await page.screenshot({
        path: `${OUT}/market-5-no-address.png`,
        clip: { x: Math.max(0, box.x - 40), y: Math.max(0, box.y - 80), width: Math.min(box.width + 80, 1280), height: box.height + 160 },
      });
    } else {
      await page.screenshot({ path: `${OUT}/market-5-no-address.png`, fullPage: true });
    }
  } catch {
    await page.screenshot({ path: `${OUT}/market-5-no-address.png`, fullPage: true });
  }

  // ── 6. 法律邊界文案 ──────────────────────────────────────────
  await page.goto(url, { waitUntil: 'networkidle' });
  try { await page.waitForSelector('h1,h2,h3', { timeout: 8000 }); } catch {}
  try {
    const legal = page.getByText(/以下按鈕將在新分頁開啟外部網站|法律|免責|僅供參考/).first();
    await legal.waitFor({ timeout: 5000 });
    const box = await legal.boundingBox();
    if (box) {
      await page.screenshot({
        path: `${OUT}/market-6-legal.png`,
        clip: { x: Math.max(0, box.x - 40), y: Math.max(0, box.y - 60), width: Math.min(box.width + 80, 1280), height: box.height + 120 },
      });
    } else {
      await page.screenshot({ path: `${OUT}/market-6-legal.png`, fullPage: true });
    }
  } catch {
    await page.screenshot({ path: `${OUT}/market-6-legal.png`, fullPage: true });
  }

  console.log('\n截圖在 /tmp/market-*.png 請主對話驗證');
});
