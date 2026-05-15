# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: license-verification.spec.ts >> 經紀人證號驗證：debounce + 三態 UI + 離線 fallback + 7 天 cache >> verified 態：合法證號應於 500ms debounce 後回 verified
- Location: e2e/license-verification.spec.ts:163:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:1420/
Call log:
  - navigating to "http://localhost:1420/", waiting until "load"

```

# Test source

```ts
  60  |                 ? `（最後驗證日期 ${lastVerified.value.verified_at}，目前離線中）`
  61  |                 : '（目前離線中，無歷史驗證紀錄）',
  62  |             };
  63  |           }
  64  | 
  65  |           // 線上：依測試指定回應
  66  |           const response = window.__VERIFY_RESPONSES__![license] ?? {
  67  |             status: 'not_found',
  68  |             license_number: license,
  69  |           };
  70  |           window.__CACHE__![license] = {
  71  |             cached_at: now,
  72  |             value: response,
  73  |           };
  74  |           window.__INVOKE_CALLS__!['__verify_api_call__'] =
  75  |             (window.__INVOKE_CALLS__!['__verify_api_call__'] ?? 0) + 1;
  76  |           return response;
  77  |         }
  78  | 
  79  |         return undefined;
  80  |       },
  81  |     };
  82  |   });
  83  | }
  84  | 
  85  | // ---------------------------------------------------------------------------
  86  | // 結果輸出
  87  | // ---------------------------------------------------------------------------
  88  | 
  89  | interface LicenseResult {
  90  |   spec: string;
  91  |   stage: string;
  92  |   scenarios: Array<{
  93  |     name: string;
  94  |     passed: boolean;
  95  |     note?: string;
  96  |   }>;
  97  |   summary: {
  98  |     total: number;
  99  |     passed: number;
  100 |     failed: number;
  101 |     executed_at: string;
  102 |   };
  103 | }
  104 | 
  105 | const RESULT_PATH = resolve(__dirname, 'results/license-verification.json');
  106 | const collected: LicenseResult = {
  107 |   spec: 'license-verification',
  108 |   stage: '#1d Stage 11.2',
  109 |   scenarios: [],
  110 |   summary: {
  111 |     total: 0,
  112 |     passed: 0,
  113 |     failed: 0,
  114 |     executed_at: new Date().toISOString(),
  115 |   },
  116 | };
  117 | 
  118 | function record(name: string, passed: boolean, note?: string): void {
  119 |   collected.scenarios.push({ name, passed, note });
  120 | }
  121 | 
  122 | test.afterAll(() => {
  123 |   collected.summary.total = collected.scenarios.length;
  124 |   collected.summary.passed = collected.scenarios.filter((s) => s.passed).length;
  125 |   collected.summary.failed = collected.summary.total - collected.summary.passed;
  126 |   collected.summary.executed_at = new Date().toISOString();
  127 | 
  128 |   mkdirSync(dirname(RESULT_PATH), { recursive: true });
  129 |   writeFileSync(RESULT_PATH, JSON.stringify(collected, null, 2), 'utf-8');
  130 | });
  131 | 
  132 | // ---------------------------------------------------------------------------
  133 | // debounce 模擬：在前端等 500ms 才觸發 invoke
  134 | // ---------------------------------------------------------------------------
  135 | 
  136 | const DEBOUNCE_MS = 500;
  137 | 
  138 | async function debouncedVerify(
  139 |   page: Page,
  140 |   licenseNumber: string
  141 | ): Promise<unknown> {
  142 |   return page.evaluate(
  143 |     async ({ license, delay }) => {
  144 |       await new Promise((r) => setTimeout(r, delay));
  145 |       return window.__TAURI__?.invoke('verify_broker_license', {
  146 |         license_number: license,
  147 |       });
  148 |     },
  149 |     { license: licenseNumber, delay: DEBOUNCE_MS }
  150 |   );
  151 | }
  152 | 
  153 | // ---------------------------------------------------------------------------
  154 | // 測試
  155 | // ---------------------------------------------------------------------------
  156 | 
  157 | test.describe('經紀人證號驗證：debounce + 三態 UI + 離線 fallback + 7 天 cache', () => {
  158 |   test.beforeEach(async ({ page }) => {
  159 |     await installInvokeMock(page);
> 160 |     await page.goto('/');
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:1420/
  161 |   });
  162 | 
  163 |   test('verified 態：合法證號應於 500ms debounce 後回 verified', async ({ page }) => {
  164 |     const license = 'REA-VALID-001';
  165 |     await page.evaluate(
  166 |       ({ key, value }) => {
  167 |         window.__VERIFY_RESPONSES__![key] = value;
  168 |       },
  169 |       {
  170 |         key: license,
  171 |         value: {
  172 |           status: 'verified',
  173 |           license_number: license,
  174 |           broker_name: '王大明',
  175 |           verified_at: '2026-05-14',
  176 |           expires_at: '2028-05-14',
  177 |         },
  178 |       }
  179 |     );
  180 | 
  181 |     const t0 = Date.now();
  182 |     const result = await debouncedVerify(page, license);
  183 |     const elapsed = Date.now() - t0;
  184 | 
  185 |     expect(elapsed).toBeGreaterThanOrEqual(DEBOUNCE_MS);
  186 |     expect(result).toMatchObject({
  187 |       status: 'verified',
  188 |       license_number: license,
  189 |       broker_name: '王大明',
  190 |     });
  191 | 
  192 |     record('verified 態 + 500ms debounce', true);
  193 |   });
  194 | 
  195 |   test('not_found 態：未登錄證號應回 not_found', async ({ page }) => {
  196 |     const license = 'REA-UNKNOWN-999';
  197 |     // 不註冊回應 → 預設為 not_found
  198 |     const result = await debouncedVerify(page, license);
  199 | 
  200 |     expect(result).toMatchObject({
  201 |       status: 'not_found',
  202 |       license_number: license,
  203 |     });
  204 | 
  205 |     record('not_found 態 UI 顯示', true);
  206 |   });
  207 | 
  208 |   test('expired 態：過期證號應回 expired', async ({ page }) => {
  209 |     const license = 'REA-EXPIRED-007';
  210 |     await page.evaluate(
  211 |       ({ key, value }) => {
  212 |         window.__VERIFY_RESPONSES__![key] = value;
  213 |       },
  214 |       {
  215 |         key: license,
  216 |         value: {
  217 |           status: 'expired',
  218 |           license_number: license,
  219 |           broker_name: '陳小華',
  220 |           verified_at: '2026-05-14',
  221 |           expires_at: '2024-03-01',
  222 |         },
  223 |       }
  224 |     );
  225 | 
  226 |     const result = await debouncedVerify(page, license);
  227 | 
  228 |     expect(result).toMatchObject({
  229 |       status: 'expired',
  230 |       license_number: license,
  231 |       expires_at: '2024-03-01',
  232 |     });
  233 | 
  234 |     record('expired 態 UI 顯示', true);
  235 |   });
  236 | 
  237 |   test('離線 fallback：應顯示「（最後驗證日期，目前離線中）」', async ({ page }) => {
  238 |     const license = 'REA-VALID-002';
  239 | 
  240 |     // 先在線上驗證一次留下 cache
  241 |     await page.evaluate(
  242 |       ({ key, value }) => {
  243 |         window.__VERIFY_RESPONSES__![key] = value;
  244 |       },
  245 |       {
  246 |         key: license,
  247 |         value: {
  248 |           status: 'verified',
  249 |           license_number: license,
  250 |           broker_name: '林美麗',
  251 |           verified_at: '2026-05-10',
  252 |           expires_at: '2028-05-10',
  253 |         },
  254 |       }
  255 |     );
  256 |     await debouncedVerify(page, license);
  257 | 
  258 |     // 切到離線狀態，並清掉 cache 強制走 offline 分支
  259 |     await page.evaluate((key) => {
  260 |       window.__OFFLINE__ = true;
```