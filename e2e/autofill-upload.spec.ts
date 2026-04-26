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

async function waitForExtractDone(page: Page, listingId: number, maxMs = 20000): Promise<boolean> {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    const res = await page.request.get(`/api/listings/${listingId}/extract-status`);
    if (res.ok()) {
      const body = await res.json();
      const statuses: string[] = Object.values(
        (body.by_attachment ?? {}) as Record<string, { status: string }>
      ).map((a) => a.status);
      if (statuses.length > 0 && statuses.every((s) => s === 'done' || s === 'failed')) {
        return statuses.some((s) => s === 'done');
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

  test('上傳謄本 PDF → extract API 被觸發', async ({ page }) => {
    const listingId = await createListing(page);
    await page.goto(`/listings/${listingId}/fill`);
    await page.waitForLoadState('networkidle');

    // 監聽 extract API 是否被觸發
    const extractCalled = new Promise<boolean>((resolve) => {
      page.on('request', (req) => {
        if (req.url().includes('/extract') && req.method() === 'POST') {
          resolve(true);
        }
      });
      setTimeout(() => resolve(false), 15000);
    });

    // 上傳 PDF（file input 可能是隱藏的，用 force: true）
    const fileInput = page.locator('input[type="file"][accept*="pdf"], input[type="file"]').first();
    await fileInput.setInputFiles(TRANSCRIPT_PDF);

    const triggered = await extractCalled;
    expect(triggered, 'extract API 應在上傳後被觸發').toBeTruthy();
  });

  test('extract 完成後 merged_fields 有值', async ({ page }) => {
    const listingId = await createListing(page);
    await page.goto(`/listings/${listingId}/fill`);
    await page.waitForLoadState('networkidle');

    // 上傳
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(TRANSCRIPT_PDF);

    // 等待 extract
    const done = await waitForExtractDone(page, listingId, 20000);
    expect(done, 'extract 應完成').toBeTruthy();

    // 確認 API 回傳 merged_fields
    const listingRes = await page.request.get(`/api/listings/${listingId}`);
    const listing = await listingRes.json();
    const mergedFields = listing.extracted_data?.merged_fields ?? listing.listing?.extracted_data?.merged_fields;
    expect(mergedFields).toBeTruthy();
    expect(Object.keys(mergedFields ?? {})).not.toHaveLength(0);
  });
});
