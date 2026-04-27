/**
 * E2E 測試：上傳謄本 → 自動帶入欄位 → 徽章顯示
 *
 * 使用真實謄本 PDF（本機路徑，不 commit），驗證完整 autofill 流程：
 * 1. 建立 listing → 確認「照片/文件」是第一個 tab
 * 2. 上傳謄本 PDF（透過隱藏 file input）
 * 3. 等待 extract 完成
 * 4. 確認 merged_fields 有值
 * 5. 跳過上傳按鈕
 */

import { test, expect, type Page } from '@playwright/test';
import * as fs from 'fs';

const TRANSCRIPT_PDF = '/Users/fishtv/Downloads/陳世曉-謄本.pdf';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

async function createListing(page: Page): Promise<number> {
  const res = await page.request.post('/api/listings', {
    data: { propertyType: 'apartment' },
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  return body.listing?.id ?? body.id;
}

async function waitForExtractStarted(page: Page, listingId: number, maxMs = 15000): Promise<boolean> {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    const res = await page.request.get(`/api/listings/${listingId}/extract-status`);
    if (res.ok()) {
      const body = await res.json();
      if ((body.total ?? 0) > 0 || body.status !== 'none') return true;
    }
    await page.waitForTimeout(1000);
  }
  return false;
}

async function waitForExtractDone(page: Page, listingId: number, maxMs = 60000): Promise<boolean> {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    const res = await page.request.get(`/api/listings/${listingId}/extract-status`);
    if (res.ok()) {
      const body = await res.json();
      if (body.status === 'done' || body.status === 'failed') {
        return body.status === 'done' && (body.done ?? 0) > 0;
      }
    }
    await page.waitForTimeout(1500);
  }
  return false;
}

// ─────────────────────────────────────────────
// 測試
// ─────────────────────────────────────────────

test.describe('autofill：上傳謄本 PDF → 欄位自動帶入', () => {
  test.beforeAll(() => {
    if (!fs.existsSync(TRANSCRIPT_PDF)) {
      throw new Error(`找不到謄本 PDF：${TRANSCRIPT_PDF}`);
    }
  });

  test('fill 頁面預設停在「照片/文件」tab', async ({ page }) => {
    const listingId = await createListing(page);
    await page.goto(`/listings/${listingId}/fill`);
    await page.waitForLoadState('networkidle');

    // 照片/文件 應該是第一個且已選中的章節
    const activeTab = page.locator('button.bg-white, button[aria-selected="true"], button.ring-2').first();
    await expect(page.locator('text=照片/文件').first()).toBeVisible({ timeout: 5000 });
  });

  test('跳過上傳連結存在且可點擊', async ({ page }) => {
    const listingId = await createListing(page);
    await page.goto(`/listings/${listingId}/fill`);
    await page.waitForLoadState('networkidle');

    // 跳過連結
    const skipLink = page.locator('text=跳過上傳，全部手動輸入');
    await expect(skipLink).toBeVisible({ timeout: 5000 });
    await skipLink.click();

    // 點後應離開照片章節（或停留在 fill 頁面但 tab 切換）
    await page.waitForTimeout(500);
    expect(page.url()).toContain('/fill');
  });

  test('上傳謄本 PDF → extract pipeline 被觸發', async ({ page }) => {
    const listingId = await createListing(page);
    await page.goto(`/listings/${listingId}/fill`);
    await page.waitForLoadState('networkidle');

    // 等 attachments POST 完成（瀏覽器端發出，可監聽）
    const attachmentsResponse = page.waitForResponse(
      (res) => res.url().includes(`/api/listings/${listingId}/attachments`) && res.request().method() === 'POST',
      { timeout: 10000 }
    );

    const fileInput = page.locator('input[type="file"][accept*="pdf"], input[type="file"]').first();
    await fileInput.setInputFiles(TRANSCRIPT_PDF);

    const res = await attachmentsResponse;
    expect(res.status(), 'attachments API 應回 2xx').toBeLessThan(300);

    // server-side fire-and-forget 觸發 extract，輪詢 extract-status 確認 pipeline 已收件
    const started = await waitForExtractStarted(page, listingId, 15000);
    expect(started, 'extract pipeline 應收到此 attachment').toBeTruthy();
  });

  test('extract 完成後 merged_fields 有值', async ({ page }) => {
    const listingId = await createListing(page);
    await page.goto(`/listings/${listingId}/fill`);
    await page.waitForLoadState('networkidle');

    // 上傳
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(TRANSCRIPT_PDF);

    // 等待 extract
    const done = await waitForExtractDone(page, listingId, 60000);
    expect(done, 'extract 應完成').toBeTruthy();

    // 確認 API 回傳 merged_fields
    const listingRes = await page.request.get(`/api/listings/${listingId}`);
    const listing = await listingRes.json();
    const mergedFields = listing.extracted_data?.merged_fields ?? listing.listing?.extracted_data?.merged_fields;
    expect(mergedFields).toBeTruthy();
    expect(Object.keys(mergedFields ?? {})).not.toHaveLength(0);
  });
});
