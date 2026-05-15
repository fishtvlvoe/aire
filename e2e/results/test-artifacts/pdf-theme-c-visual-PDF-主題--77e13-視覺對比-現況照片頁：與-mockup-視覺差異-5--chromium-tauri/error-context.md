# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: pdf-theme-c-visual.spec.ts >> PDF 主題 C：科技優雅 Tech Elegant — 視覺對比 >> 現況照片頁：與 mockup 視覺差異 < 5%
- Location: e2e/pdf-theme-c-visual.spec.ts:136:7

# Error details

```
Error: A snapshot doesn't exist at /Users/fishtv/Development/products/AIRE/e2e/pdf-theme-c-visual.spec.ts-snapshots/theme-c-photos-chromium-tauri-darwin.png, writing actual.
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - text: 客戶 LOGO
      - text: 25×15mm
    - generic [ref=e5]: 不動產說明書 — 房屋現況調查表
    - generic [ref=e6]: AI
  - generic [ref=e7]:
    - generic [ref=e8]: 壹、房屋現況（建物基本資料）
    - table [ref=e9]:
      - rowgroup [ref=e10]:
        - row "項目 現況 備註" [ref=e11]:
          - columnheader "項目" [ref=e12]
          - columnheader "現況" [ref=e13]
          - columnheader "備註" [ref=e14]
      - rowgroup [ref=e15]:
        - row "建物用途 住宅 依謄本" [ref=e16]:
          - cell "建物用途" [ref=e17]
          - cell "住宅" [ref=e18]
          - cell "依謄本" [ref=e19]
        - row "樓層 10 樓 / 地上 14 層" [ref=e20]:
          - cell "樓層" [ref=e21]
          - cell "10 樓 / 地上 14 層" [ref=e22]
          - cell [ref=e23]
        - row "主要構造 鋼筋混凝土（RC） 依謄本" [ref=e24]:
          - cell "主要構造" [ref=e25]
          - cell "鋼筋混凝土（RC）" [ref=e26]
          - cell "依謄本" [ref=e27]
        - row "登記建坪 43.797 坪（含公設 15.12 坪） 依謄本" [ref=e28]:
          - cell "登記建坪" [ref=e29]
          - cell "43.797 坪（含公設 15.12 坪）" [ref=e30]
          - cell "依謄本" [ref=e31]
        - row "主要建材 鋼筋混凝土" [ref=e32]:
          - cell "主要建材" [ref=e33]
          - cell "鋼筋混凝土" [ref=e34]
          - cell [ref=e35]
        - row "屋齡 約 15 年（2008 年完工）" [ref=e36]:
          - cell "屋齡" [ref=e37]
          - cell "約 15 年（2008 年完工）" [ref=e38]
          - cell [ref=e39]
        - row "格局 3 房 2 廳 2 衛浴" [ref=e40]:
          - cell "格局" [ref=e41]
          - cell "3 房 2 廳 2 衛浴" [ref=e42]
          - cell [ref=e43]
        - row "方位 坐北朝南 以現場確認為準" [ref=e44]:
          - cell "方位" [ref=e45]
          - cell "坐北朝南" [ref=e46]
          - cell "以現場確認為準" [ref=e47]
    - generic [ref=e49]: 貳、現況說明
    - table [ref=e50]:
      - rowgroup [ref=e51]:
        - row "項目 現況 備註" [ref=e52]:
          - columnheader "項目" [ref=e53]
          - columnheader "現況" [ref=e54]
          - columnheader "備註" [ref=e55]
      - rowgroup [ref=e56]:
        - row "現況使用 自用住宅（空屋）" [ref=e57]:
          - cell "現況使用" [ref=e58]
          - cell "自用住宅（空屋）" [ref=e59]
          - cell [ref=e60]
        - row "漏水情形 目前無漏水 買方自行確認" [ref=e61]:
          - cell "漏水情形" [ref=e62]
          - cell "目前無漏水" [ref=e63]
          - cell "買方自行確認" [ref=e64]
        - row "違建情形 無" [ref=e65]:
          - cell "違建情形" [ref=e66]
          - cell "無" [ref=e67]
          - cell [ref=e68]
        - row "裝修狀況 輕裝修（廚具、衛浴設備保留） 現況交屋" [ref=e69]:
          - cell "裝修狀況" [ref=e70]
          - cell "輕裝修（廚具、衛浴設備保留）" [ref=e71]
          - cell "現況交屋" [ref=e72]
        - row "車位 平面車位 1 位（地下 1 層） 含於售價" [ref=e73]:
          - cell "車位" [ref=e74]
          - cell "平面車位 1 位（地下 1 層）" [ref=e75]
          - cell "含於售價" [ref=e76]
  - generic [ref=e79]:
    - generic [ref=e80]: 第 2 頁 / 共 12 頁
    - generic [ref=e81]: 信義不動產股份有限公司｜台中市大里區中興路 100 號｜04-2496-XXXX
```

# Test source

```ts
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
  117 |     await expect(page).toHaveScreenshot('theme-c-cover.png', {
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
> 150 |     await expect(page).toHaveScreenshot('theme-c-photos.png', {
      |     ^ Error: A snapshot doesn't exist at /Users/fishtv/Development/products/AIRE/e2e/pdf-theme-c-visual.spec.ts-snapshots/theme-c-photos-chromium-tauri-darwin.png, writing actual.
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