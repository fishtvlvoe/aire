import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

function seedValidLicenseCache(): void {
  const cachePath = path.join(os.homedir(), '.three-ai', 'license-cache.json');
  fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  fs.writeFileSync(
    cachePath,
    JSON.stringify({
      valid: true,
      features: ['disclosure-document'],
      cachedAt: new Date().toISOString(),
      email: 'e2e@three-ai.local',
      licenseKey: 'LIC-E2E-001',
    })
  );
}

function createAdminUser(username: string, password: string): void {
  execFileSync('npx', ['tsx', 'scripts/create-admin.ts', '--username', username, '--password', password], {
    cwd: process.cwd(),
    stdio: 'pipe',
  });
}

test('首次安裝流程：License 啟用 → 建管理員 → 登入 → 存取受保護頁面', async ({ page }) => {
  const username = `e2e-admin-${Date.now()}`;
  const password = 'E2E_Admin_12345';

  seedValidLicenseCache();
  createAdminUser(username, password);

  await page.goto('/login');
  await page.fill('input[type="text"]', username);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');

  await page.waitForURL('**/listings', { timeout: 15000 });
  await expect(page).toHaveURL(/\/listings/);

  await page.goto('/listings/new');
  await expect(page).toHaveURL(/\/listings\/new/);
});
