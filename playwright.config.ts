import { defineConfig } from '@playwright/test';

// AIRE E2E 配置
// Phase 5 真機驗收 + visual parity 比對使用
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Tauri 桌面 App 單一 instance，避免並行
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // 桌面 App 單 worker
  reporter: [
    ['list'],
    ['html', { outputFolder: 'e2e/results/playwright-report', open: 'never' }],
    ['json', { outputFile: 'e2e/results/results.json' }],
  ],
  use: {
    baseURL: 'http://localhost:1420', // Tauri dev server 預設 port
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium-tauri',
      use: { browserName: 'chromium' },
    },
  ],
  outputDir: 'e2e/results/test-artifacts',
});
