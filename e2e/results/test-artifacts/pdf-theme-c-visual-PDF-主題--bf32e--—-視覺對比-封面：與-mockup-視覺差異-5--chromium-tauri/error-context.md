# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: pdf-theme-c-visual.spec.ts >> PDF 主題 C：科技優雅 Tech Elegant — 視覺對比 >> 封面：與 mockup 視覺差異 < 5%
- Location: e2e/pdf-theme-c-visual.spec.ts:112:7

# Error details

```
Error: A snapshot doesn't exist at /Users/fishtv/Development/products/AIRE/e2e/pdf-theme-c-visual.spec.ts-snapshots/theme-c-cover-chromium-tauri-darwin.png, writing actual.
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e8]: AI
  - generic [ref=e9]:
    - generic [ref=e11]:
      - generic [ref=e12]: 不動產說明書
      - generic [ref=e13]: 不動產說明書
      - generic [ref=e14]: REAL ESTATE INFORMATION
    - generic [ref=e16]:
      - generic [ref=e17]:
        - generic [ref=e18]: 物件編號
        - generic [ref=e19]: A0004
      - generic [ref=e20]: 大林新城三房平車，坐擁未來增值力
      - generic [ref=e21]:
        - generic [ref=e22]: 物件摘要
        - generic [ref=e23]:
          - generic [ref=e24]:
            - generic [ref=e25]: 登記坪數
            - generic [ref=e26]: 43.797 坪
          - generic [ref=e27]:
            - generic [ref=e28]: 停車方式
            - generic [ref=e29]: 平面車位
          - generic [ref=e30]:
            - generic [ref=e31]: 樓層規劃
            - generic [ref=e32]: 地上 14 層
          - generic [ref=e33]:
            - generic [ref=e34]: 格局
            - generic [ref=e35]: 3 房 2 廳 2 衛
          - generic [ref=e36]:
            - generic [ref=e37]: 方位
            - generic [ref=e38]: 坐北朝南
          - generic [ref=e39]:
            - generic [ref=e40]: 銷售樓層
            - generic [ref=e41]: 10 樓
          - generic [ref=e42]:
            - generic [ref=e43]: 用途
            - generic [ref=e44]: 住宅
          - generic [ref=e45]:
            - generic [ref=e46]: 建築完成日
            - generic [ref=e47]: 2008 年 12 月
          - generic [ref=e48]:
            - generic [ref=e49]: 建設公司
            - generic [ref=e50]: 大林建設股份有限公司
          - generic [ref=e51]:
            - generic [ref=e52]: 社區大樓
            - generic [ref=e53]: 大林新城
    - generic [ref=e55]:
      - generic [ref=e56]: 客戶 LOGO（80 × 30mm）
      - table [ref=e58]:
        - rowgroup [ref=e59]:
          - row "承辦人 店長 經紀人 經紀人證號" [ref=e60]:
            - columnheader "承辦人" [ref=e61]
            - columnheader "店長" [ref=e62]
            - columnheader "經紀人" [ref=e63]
            - columnheader "經紀人證號" [ref=e64]
        - rowgroup [ref=e65]:
          - row "王小明 陳美玲 林志豪 （108）北市字第 00123 號" [ref=e66]:
            - cell "王小明" [ref=e67]
            - cell "陳美玲" [ref=e68]
            - cell "林志豪" [ref=e69]
            - cell "（108）北市字第 00123 號" [ref=e70]
    - generic [ref=e71]:
      - generic [ref=e72]:
        - generic [ref=e73]: 信義房屋台中大里加盟店
        - generic [ref=e74]:
          - text: 信義不動產股份有限公司
          - text: 台中市大里區中興路 100 號｜電話：04-2496-XXXX
      - generic [ref=e75]:
        - text: 製作日期
        - text: 2026 年 05 月 14 日
```

# Test source

```ts
  17  | 
  18  | import { test, expect, type Page } from '@playwright/test';
  19  | import path from 'node:path';
  20  | import { pathToFileURL } from 'node:url';
  21  | 
  22  | // ---------------------------------------------------------------------------
  23  | // Mock 輔助
  24  | // ---------------------------------------------------------------------------
  25  | 
  26  | async function mockTauriInvoke(
  27  |   page: Page,
  28  |   command: string,
  29  |   returnValue: unknown
  30  | ): Promise<void> {
  31  |   await page.addInitScript(
  32  |     ({ cmd, val }: { cmd: string; val: unknown }) => {
  33  |       type InvokeHandler = (cmd: string, args?: unknown) => Promise<unknown>;
  34  | 
  35  |       if (!window.__TAURI__) {
  36  |         window.__TAURI__ = { invoke: async () => {} };
  37  |       }
  38  |       const original = window.__TAURI__.invoke as InvokeHandler;
  39  |       window.__TAURI__.invoke = async (c: string, args?: unknown) => {
  40  |         if (c === cmd) return val;
  41  |         return original(c, args);
  42  |       };
  43  |     },
  44  |     { cmd: command, val: returnValue }
  45  |   );
  46  | }
  47  | 
  48  | // ---------------------------------------------------------------------------
  49  | // Mock 資料：theme-c 渲染所需 case data + logo + theme settings
  50  | // ---------------------------------------------------------------------------
  51  | 
  52  | const MOCK_CASE = {
  53  |   id: 'C0007',
  54  |   property_id: 'C0007',
  55  |   title: '新北板橋江翠物件',
  56  |   address: '新北市板橋區文化路100號',
  57  |   building_type: '電梯華廈',
  58  |   area_ping: 42.8,
  59  |   floor: '12/20',
  60  |   price: 2980,
  61  |   agent_name: '陳大華',
  62  |   agent_phone: '0987-654-321',
  63  |   created_at: '2026-05-14T00:00:00Z',
  64  | };
  65  | 
  66  | const MOCK_LOGO = {
  67  |   data_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  68  |   width_mm: 25,
  69  |   height_mm: 15,
  70  | };
  71  | 
  72  | const MOCK_THEME_SETTINGS = {
  73  |   theme_id: 'theme-c-tech-elegant',
  74  |   primary_color: '#1A2332',
  75  |   accent_color: '#4A9EFF',
  76  |   font_family: 'Noto Sans TC',
  77  | };
  78  | 
  79  | // 視覺對比容差：5%
  80  | const MAX_DIFF_PIXEL_RATIO = 0.05;
  81  | 
  82  | // ---------------------------------------------------------------------------
  83  | // 路徑：mockup HTML
  84  | // ---------------------------------------------------------------------------
  85  | 
  86  | const THEME_DIR = path.resolve(__dirname, '..', 'mockups', 'pdf-themes', 'theme-c-tech-elegant');
  87  | const COVER_URL = pathToFileURL(path.join(THEME_DIR, 'cover.html')).toString();
  88  | const CONTENT_URL = pathToFileURL(path.join(THEME_DIR, 'content.html')).toString();
  89  | 
  90  | // ---------------------------------------------------------------------------
  91  | // 測試
  92  | // ---------------------------------------------------------------------------
  93  | 
  94  | test.describe('PDF 主題 C：科技優雅 Tech Elegant — 視覺對比', () => {
  95  |   test.beforeEach(async ({ page }) => {
  96  |     // 注入 mock Tauri invoke：case data / logo / theme settings
  97  |     await mockTauriInvoke(page, 'get_case', MOCK_CASE);
  98  |     await mockTauriInvoke(page, 'get_logo', MOCK_LOGO);
  99  |     await mockTauriInvoke(page, 'get_theme_settings', MOCK_THEME_SETTINGS);
  100 | 
  101 |     // 注入 mock case 至 window 以供樣板（若有）讀取
  102 |     await page.addInitScript((data) => {
  103 |       window.__AIRE_MOCK_CASE__ = data.caseData;
  104 |       window.__AIRE_MOCK_LOGO__ = data.logo;
  105 |       window.__AIRE_MOCK_THEME__ = data.theme;
  106 |     }, { caseData: MOCK_CASE, logo: MOCK_LOGO, theme: MOCK_THEME_SETTINGS });
  107 | 
  108 |     // PDF 頁面尺寸：A4 794×1123 @ 96dpi
  109 |     await page.setViewportSize({ width: 794, height: 1123 });
  110 |   });
  111 | 
  112 |   test('封面：與 mockup 視覺差異 < 5%', async ({ page }) => {
  113 |     await page.goto(COVER_URL);
  114 |     await page.waitForLoadState('networkidle');
  115 |     await page.evaluate(() => document.fonts?.ready);
  116 | 
> 117 |     await expect(page).toHaveScreenshot('theme-c-cover.png', {
      |     ^ Error: A snapshot doesn't exist at /Users/fishtv/Development/products/AIRE/e2e/pdf-theme-c-visual.spec.ts-snapshots/theme-c-cover-chromium-tauri-darwin.png, writing actual.
  118 |       maxDiffPixelRatio: MAX_DIFF_PIXEL_RATIO,
  119 |       fullPage: true,
  120 |       animations: 'disabled',
  121 |     });
  122 |   });
  123 | 
  124 |   test('基本資訊頁：與 mockup 視覺差異 < 5%', async ({ page }) => {
  125 |     await page.goto(CONTENT_URL);
  126 |     await page.waitForLoadState('networkidle');
  127 |     await page.evaluate(() => document.fonts?.ready);
  128 | 
  129 |     await expect(page).toHaveScreenshot('theme-c-basic-info.png', {
  130 |       maxDiffPixelRatio: MAX_DIFF_PIXEL_RATIO,
  131 |       fullPage: true,
  132 |       animations: 'disabled',
  133 |     });
  134 |   });
  135 | 
  136 |   test('現況照片頁：與 mockup 視覺差異 < 5%', async ({ page }) => {
  137 |     // 現況照片頁共用 content.html 樣板（同一 layout，照片區塊為動態插入）
  138 |     await page.goto(CONTENT_URL);
  139 |     await page.waitForLoadState('networkidle');
  140 |     await page.evaluate(() => document.fonts?.ready);
  141 | 
  142 |     // 模擬照片區塊存在（樣板中以 placeholder 呈現）
  143 |     await page.evaluate(() => {
  144 |       const photoSection = document.querySelector('.photo-section, .content-photos, [data-photo-grid]');
  145 |       if (photoSection) {
  146 |         photoSection.setAttribute('data-mock-photos', '6');
  147 |       }
  148 |     });
  149 | 
  150 |     await expect(page).toHaveScreenshot('theme-c-photos.png', {
  151 |       maxDiffPixelRatio: MAX_DIFF_PIXEL_RATIO,
  152 |       fullPage: true,
  153 |       animations: 'disabled',
  154 |     });
  155 |   });
  156 | });
  157 | 
  158 | // ---------------------------------------------------------------------------
  159 | // 型別擴充
  160 | // ---------------------------------------------------------------------------
  161 | 
  162 | declare global {
  163 |   interface Window {
  164 |     __TAURI__?: {
  165 |       invoke: (command: string, args?: unknown) => Promise<unknown>;
  166 |     };
  167 |     __AIRE_MOCK_CASE__?: typeof MOCK_CASE;
  168 |     __AIRE_MOCK_LOGO__?: typeof MOCK_LOGO;
  169 |     __AIRE_MOCK_THEME__?: typeof MOCK_THEME_SETTINGS;
  170 |   }
  171 | }
  172 | 
```