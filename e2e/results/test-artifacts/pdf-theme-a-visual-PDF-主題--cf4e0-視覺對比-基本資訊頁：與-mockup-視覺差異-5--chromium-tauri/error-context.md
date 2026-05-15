# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: pdf-theme-a-visual.spec.ts >> PDF 主題 A：淡雅 Minimal — 視覺對比 >> 基本資訊頁：與 mockup 視覺差異 < 5%
- Location: e2e/pdf-theme-a-visual.spec.ts:126:7

# Error details

```
Error: A snapshot doesn't exist at /Users/fishtv/Development/products/AIRE/e2e/pdf-theme-a-visual.spec.ts-snapshots/theme-a-basic-info-chromium-tauri-darwin.png, writing actual.
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - text: 客戶 LOGO
      - text: 25×15mm
    - generic [ref=e5]: 不動產說明書 — 房屋現況調查表
    - generic [ref=e7]: AI
  - generic [ref=e8]:
    - generic [ref=e9]: 壹、房屋現況（建物基本資料）
    - table [ref=e10]:
      - rowgroup [ref=e11]:
        - row "項目 現況 備註" [ref=e12]:
          - columnheader "項目" [ref=e13]
          - columnheader "現況" [ref=e14]
          - columnheader "備註" [ref=e15]
      - rowgroup [ref=e16]:
        - row "建物用途 住宅 依謄本" [ref=e17]:
          - cell "建物用途" [ref=e18]
          - cell "住宅" [ref=e19]
          - cell "依謄本" [ref=e20]
        - row "樓層 10 樓 / 地上 14 層" [ref=e21]:
          - cell "樓層" [ref=e22]
          - cell "10 樓 / 地上 14 層" [ref=e23]
          - cell [ref=e24]
        - row "主要構造 鋼筋混凝土（RC） 依謄本" [ref=e25]:
          - cell "主要構造" [ref=e26]
          - cell "鋼筋混凝土（RC）" [ref=e27]
          - cell "依謄本" [ref=e28]
        - row "登記建坪 43.797 坪（含公設 15.12 坪） 依謄本" [ref=e29]:
          - cell "登記建坪" [ref=e30]
          - cell "43.797 坪（含公設 15.12 坪）" [ref=e31]
          - cell "依謄本" [ref=e32]
        - row "主要建材 鋼筋混凝土" [ref=e33]:
          - cell "主要建材" [ref=e34]
          - cell "鋼筋混凝土" [ref=e35]
          - cell [ref=e36]
        - row "屋齡 約 15 年（2008 年完工）" [ref=e37]:
          - cell "屋齡" [ref=e38]
          - cell "約 15 年（2008 年完工）" [ref=e39]
          - cell [ref=e40]
        - row "格局 3 房 2 廳 2 衛浴" [ref=e41]:
          - cell "格局" [ref=e42]
          - cell "3 房 2 廳 2 衛浴" [ref=e43]
          - cell [ref=e44]
        - row "方位 坐北朝南 以現場確認為準" [ref=e45]:
          - cell "方位" [ref=e46]
          - cell "坐北朝南" [ref=e47]
          - cell "以現場確認為準" [ref=e48]
        - row "車位 平面車位 1 位（地下 1 層） 含於售價" [ref=e49]:
          - cell "車位" [ref=e50]
          - cell "平面車位 1 位（地下 1 層）" [ref=e51]
          - cell "含於售價" [ref=e52]
        - row "管理費 每月 NT$ 2,500 依社區公告" [ref=e53]:
          - cell "管理費" [ref=e54]
          - cell "每月 NT$ 2,500" [ref=e55]
          - cell "依社區公告" [ref=e56]
    - generic [ref=e57]:
      - generic [ref=e58]: 貳、現況說明
      - table [ref=e59]:
        - rowgroup [ref=e60]:
          - row "項目 現況 備註" [ref=e61]:
            - columnheader "項目" [ref=e62]
            - columnheader "現況" [ref=e63]
            - columnheader "備註" [ref=e64]
        - rowgroup [ref=e65]:
          - row "現況使用 自用住宅（空屋）" [ref=e66]:
            - cell "現況使用" [ref=e67]
            - cell "自用住宅（空屋）" [ref=e68]
            - cell [ref=e69]
          - row "漏水情形 目前無漏水 買方自行確認" [ref=e70]:
            - cell "漏水情形" [ref=e71]
            - cell "目前無漏水" [ref=e72]
            - cell "買方自行確認" [ref=e73]
          - row "違建情形 無" [ref=e74]:
            - cell "違建情形" [ref=e75]
            - cell "無" [ref=e76]
            - cell [ref=e77]
          - row "裝修狀況 輕裝修（廚具、衛浴設備保留） 現況交屋" [ref=e78]:
            - cell "裝修狀況" [ref=e79]
            - cell "輕裝修（廚具、衛浴設備保留）" [ref=e80]
            - cell "現況交屋" [ref=e81]
  - generic [ref=e82]:
    - generic [ref=e83]: 第 2 頁 / 共 12 頁
    - generic [ref=e84]: 信義不動產股份有限公司｜台中市大里區中興路 100 號｜04-2496-XXXX
```

# Test source

```ts
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
  119 |     await expect(page).toHaveScreenshot('theme-a-cover.png', {
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
> 132 |     await expect(page).toHaveScreenshot('theme-a-basic-info.png', {
      |     ^ Error: A snapshot doesn't exist at /Users/fishtv/Development/products/AIRE/e2e/pdf-theme-a-visual.spec.ts-snapshots/theme-a-basic-info-chromium-tauri-darwin.png, writing actual.
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