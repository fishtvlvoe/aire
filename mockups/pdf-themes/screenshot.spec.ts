import { test } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const THEMES = [
  { id: 'a', dir: 'theme-a-minimal' },
  { id: 'b', dir: 'theme-b-corporate' },
  { id: 'c', dir: 'theme-c-tech-elegant' },
];

const PAGES = [
  { name: 'cover', file: 'cover.html' },
  { name: 'content', file: 'content.html' },
];

const OUTPUT_DIR = '/tmp/aire-mockups';

test.beforeAll(() => {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
});

for (const theme of THEMES) {
  for (const page of PAGES) {
    test(`theme-${theme.id}-${page.name}`, async ({ page: pw }) => {
      const htmlPath = path.resolve(
        __dirname,
        theme.dir,
        page.file
      );
      await pw.setViewportSize({ width: 827, height: 1169 });
      await pw.goto(`file://${htmlPath}`);
      // 等待 Google Fonts 載入（最多 3 秒）
      await pw.waitForTimeout(2000);
      const outputPath = `${OUTPUT_DIR}/theme-${theme.id}-${page.name}.png`;
      await pw.screenshot({
        path: outputPath,
        fullPage: false,
      });
      console.log(`截圖儲存：${outputPath}`);
    });
  }
}
