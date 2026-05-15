# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: pdf-theme-a-visual.spec.ts >> PDF 主題 A：淡雅 Minimal — 視覺對比 >> 封面：與 mockup 視覺差異 < 5%
- Location: e2e/pdf-theme-a-visual.spec.ts:112:7

# Error details

```
Error: A snapshot doesn't exist at /Users/fishtv/Development/products/AIRE/e2e/pdf-theme-a-visual.spec.ts-snapshots/theme-a-cover-chromium-tauri-darwin.png, writing actual.
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e4]: AI
  - generic [ref=e5]:
    - generic [ref=e6]: 不動產說明書
    - generic [ref=e7]: 不動產說明書
    - generic [ref=e8]: REAL ESTATE INFORMATION
  - generic [ref=e9]:
    - generic [ref=e10]: 物件編號
    - generic [ref=e11]: A0004
  - generic [ref=e12]:
    - generic [ref=e13]: 物件名稱
    - generic [ref=e14]: 大林新城三房平車，坐擁未來增值力
  - generic [ref=e15]:
    - generic [ref=e16]: 物件摘要
    - generic [ref=e17]:
      - generic [ref=e18]:
        - generic [ref=e19]: 登記坪數
        - generic [ref=e20]: 43.797 坪
      - generic [ref=e21]:
        - generic [ref=e22]: 停車方式
        - generic [ref=e23]: 平面車位
      - generic [ref=e24]:
        - generic [ref=e25]: 樓層規劃
        - generic [ref=e26]: 地上 14 層
      - generic [ref=e27]:
        - generic [ref=e28]: 格局
        - generic [ref=e29]: 3 房 2 廳 2 衛
      - generic [ref=e30]:
        - generic [ref=e31]: 方位
        - generic [ref=e32]: 坐北朝南
      - generic [ref=e33]:
        - generic [ref=e34]: 銷售樓層
        - generic [ref=e35]: 10 樓
      - generic [ref=e36]:
        - generic [ref=e37]: 用途
        - generic [ref=e38]: 住宅
      - generic [ref=e39]:
        - generic [ref=e40]: 建築完成日
        - generic [ref=e41]: 2008 年 12 月
      - generic [ref=e42]:
        - generic [ref=e43]: 建設公司
        - generic [ref=e44]: 大林建設股份有限公司
      - generic [ref=e45]:
        - generic [ref=e46]: 社區大樓
        - generic [ref=e47]: 大林新城
  - generic [ref=e48]:
    - generic [ref=e49]: 仲介公司
    - generic [ref=e50]: 客戶 LOGO（80 × 30mm）
    - table [ref=e51]:
      - rowgroup [ref=e52]:
        - row "承辦人 店長 經紀人 經紀人證號" [ref=e53]:
          - columnheader "承辦人" [ref=e54]
          - columnheader "店長" [ref=e55]
          - columnheader "經紀人" [ref=e56]
          - columnheader "經紀人證號" [ref=e57]
      - rowgroup [ref=e58]:
        - row "王小明 陳美玲 林志豪 （108）北市字第 00123 號" [ref=e59]:
          - cell "王小明" [ref=e60]
          - cell "陳美玲" [ref=e61]
          - cell "林志豪" [ref=e62]
          - cell "（108）北市字第 00123 號" [ref=e63]
  - generic [ref=e64]:
    - generic [ref=e65]:
      - generic [ref=e66]: 信義房屋台中大里加盟店
      - generic [ref=e67]: 信義不動產股份有限公司
      - generic [ref=e68]: 台中市大里區中興路 100 號
      - generic [ref=e69]: 電話：04-2496-XXXX
    - generic [ref=e70]:
      - generic [ref=e71]: 製作日期
      - generic [ref=e72]: 2026 年 05 月 14 日
```

# Test source

```ts
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
  49  | // Mock 資料：theme-a 渲染所需 case data + logo + theme settings
  50  | // ---------------------------------------------------------------------------
  51  | 
  52  | const MOCK_CASE = {
  53  |   id: 'A0004',
  54  |   property_id: 'A0004',
  55  |   title: '台北信義路一段物件',
  56  |   address: '台北市信義區信義路一段1號',
  57  |   building_type: '住宅大樓',
  58  |   area_ping: 35.5,
  59  |   floor: '8/15',
  60  |   price: 3580,
  61  |   agent_name: '王小明',
  62  |   agent_phone: '0912-345-678',
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
  73  |   theme_id: 'theme-a-minimal',
  74  |   primary_color: '#2C3E50',
  75  |   accent_color: '#E8B86D',
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
  86  | const THEME_DIR = path.resolve(__dirname, '..', 'mockups', 'pdf-themes', 'theme-a-minimal');
  87  | const COVER_URL = pathToFileURL(path.join(THEME_DIR, 'cover.html')).toString();
  88  | const CONTENT_URL = pathToFileURL(path.join(THEME_DIR, 'content.html')).toString();
  89  | 
  90  | // ---------------------------------------------------------------------------
  91  | // 測試
  92  | // ---------------------------------------------------------------------------
  93  | 
  94  | test.describe('PDF 主題 A：淡雅 Minimal — 視覺對比', () => {
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
  115 | 
  116 |     // 等待字型與樣式套用
  117 |     await page.evaluate(() => document.fonts?.ready);
  118 | 
> 119 |     await expect(page).toHaveScreenshot('theme-a-cover.png', {
      |     ^ Error: A snapshot doesn't exist at /Users/fishtv/Development/products/AIRE/e2e/pdf-theme-a-visual.spec.ts-snapshots/theme-a-cover-chromium-tauri-darwin.png, writing actual.
  120 |       maxDiffPixelRatio: MAX_DIFF_PIXEL_RATIO,
  121 |       fullPage: true,
  122 |       animations: 'disabled',
  123 |     });
  124 |   });
  125 | 
  126 |   test('基本資訊頁：與 mockup 視覺差異 < 5%', async ({ page }) => {
  127 |     await page.goto(CONTENT_URL);
  128 |     await page.waitForLoadState('networkidle');
  129 |     await page.evaluate(() => document.fonts?.ready);
  130 | 
  131 |     // 鎖定主體內容（content.html 即基本資訊頁樣板）
  132 |     await expect(page).toHaveScreenshot('theme-a-basic-info.png', {
  133 |       maxDiffPixelRatio: MAX_DIFF_PIXEL_RATIO,
  134 |       fullPage: true,
  135 |       animations: 'disabled',
  136 |     });
  137 |   });
  138 | 
  139 |   test('現況照片頁：與 mockup 視覺差異 < 5%', async ({ page }) => {
  140 |     // 現況照片頁共用 content.html 樣板（同一 layout，照片區塊為動態插入）
  141 |     await page.goto(CONTENT_URL);
  142 |     await page.waitForLoadState('networkidle');
  143 |     await page.evaluate(() => document.fonts?.ready);
  144 | 
  145 |     // 模擬照片區塊存在（樣板中以 placeholder 呈現）
  146 |     await page.evaluate(() => {
  147 |       const photoSection = document.querySelector('.photo-section, .content-photos, [data-photo-grid]');
  148 |       if (photoSection) {
  149 |         photoSection.setAttribute('data-mock-photos', '6');
  150 |       }
  151 |     });
  152 | 
  153 |     await expect(page).toHaveScreenshot('theme-a-photos.png', {
  154 |       maxDiffPixelRatio: MAX_DIFF_PIXEL_RATIO,
  155 |       fullPage: true,
  156 |       animations: 'disabled',
  157 |     });
  158 |   });
  159 | });
  160 | 
  161 | // ---------------------------------------------------------------------------
  162 | // 型別擴充
  163 | // ---------------------------------------------------------------------------
  164 | 
  165 | declare global {
  166 |   interface Window {
  167 |     __TAURI__?: {
  168 |       invoke: (command: string, args?: unknown) => Promise<unknown>;
  169 |     };
  170 |     __AIRE_MOCK_CASE__?: typeof MOCK_CASE;
  171 |     __AIRE_MOCK_LOGO__?: typeof MOCK_LOGO;
  172 |     __AIRE_MOCK_THEME__?: typeof MOCK_THEME_SETTINGS;
  173 |   }
  174 | }
  175 | 
```