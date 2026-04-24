import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E 測試設定
 *
 * 預設使用 chromium headless，針對本機 dev server（port 3000）執行。
 * 跑測試前若 server 未啟動，Playwright 會自動以 `npm run dev` 啟動並等待就緒。
 */
export default defineConfig({
  testDir: './e2e',
  /* 每個測試最長等待時間 */
  timeout: 30 * 1000,
  expect: {
    /* assertion timeout */
    timeout: 10 * 1000,
  },
  /* 在 CI 環境不允許只跑單一測試（.only）*/
  forbidOnly: !!process.env.CI,
  /* CI 不重試，本機允許重試一次 */
  retries: process.env.CI ? 0 : 1,
  /* 並行 worker 數 */
  workers: process.env.CI ? 1 : undefined,
  /* 測試報告格式 */
  reporter: 'list',

  use: {
    /* 測試對象：本機 dev server */
    baseURL: 'http://localhost:3000',
    /* 失敗時截圖（只在 CI 保留） */
    screenshot: 'only-on-failure',
    /* 失敗時保留 trace（只在 CI 保留） */
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* 若 dev server 未啟動則自動啟動（本機用） */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 60 * 1000,
  },
});
