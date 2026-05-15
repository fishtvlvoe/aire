# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: legal-clauses-sync.spec.ts >> 法規條款同步：OPCOS → 桌面 App DB → PDF 渲染 >> 觸發 sync_legal_clauses 後應回報同步成功與版本日期
- Location: e2e/legal-clauses-sync.spec.ts:184:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:1420/
Call log:
  - navigating to "http://localhost:1420/", waiting until "load"

```

# Test source

```ts
  66  |     body: '消費者於簽約前至少有五日審閱期，業者不得以任何方式縮短或要求消費者拋棄此權利。',
  67  |     version_date: NEW_VERSION_DATE,
  68  |     category: 'review-period',
  69  |   },
  70  |   {
  71  |     id: 'clause-003',
  72  |     code: 'REA-2026-03',
  73  |     title: '履約保證機制（強制納入）',
  74  |     body: '成交價款應透過第三方履約保證機構保管，買賣雙方任一方不得自行管理交易款項。',
  75  |     version_date: NEW_VERSION_DATE,
  76  |     category: 'escrow',
  77  |   },
  78  | ];
  79  | 
  80  | // ---------------------------------------------------------------------------
  81  | // 測試結果輸出
  82  | // ---------------------------------------------------------------------------
  83  | 
  84  | interface LegalSyncResult {
  85  |   spec: string;
  86  |   stage: string;
  87  |   scenarios: Array<{
  88  |     name: string;
  89  |     passed: boolean;
  90  |     note?: string;
  91  |   }>;
  92  |   summary: {
  93  |     total: number;
  94  |     passed: number;
  95  |     failed: number;
  96  |     executed_at: string;
  97  |   };
  98  | }
  99  | 
  100 | const RESULT_PATH = resolve(__dirname, 'results/legal-sync.json');
  101 | const collected: LegalSyncResult = {
  102 |   spec: 'legal-clauses-sync',
  103 |   stage: '#1d Stage 11.1',
  104 |   scenarios: [],
  105 |   summary: {
  106 |     total: 0,
  107 |     passed: 0,
  108 |     failed: 0,
  109 |     executed_at: new Date().toISOString(),
  110 |   },
  111 | };
  112 | 
  113 | function record(name: string, passed: boolean, note?: string): void {
  114 |   collected.scenarios.push({ name, passed, note });
  115 | }
  116 | 
  117 | test.afterAll(() => {
  118 |   collected.summary.total = collected.scenarios.length;
  119 |   collected.summary.passed = collected.scenarios.filter((s) => s.passed).length;
  120 |   collected.summary.failed = collected.summary.total - collected.summary.passed;
  121 |   collected.summary.executed_at = new Date().toISOString();
  122 | 
  123 |   mkdirSync(dirname(RESULT_PATH), { recursive: true });
  124 |   writeFileSync(RESULT_PATH, JSON.stringify(collected, null, 2), 'utf-8');
  125 | });
  126 | 
  127 | // ---------------------------------------------------------------------------
  128 | // 測試：法規條款同步
  129 | // ---------------------------------------------------------------------------
  130 | 
  131 | test.describe('法規條款同步：OPCOS → 桌面 App DB → PDF 渲染', () => {
  132 |   test.beforeEach(async ({ page }) => {
  133 |     // mock OPCOS 後端回新版三條法規
  134 |     await mockTauriInvoke(page, 'fetch_opcos_legal_clauses', {
  135 |       success: true,
  136 |       version_date: NEW_VERSION_DATE,
  137 |       clauses: NEW_LEGAL_CLAUSES,
  138 |     });
  139 | 
  140 |     // mock：sync_legal_clauses IPC（寫入本地 DB）
  141 |     await mockTauriInvoke(page, 'sync_legal_clauses', {
  142 |       success: true,
  143 |       version_date: NEW_VERSION_DATE,
  144 |       synced_count: NEW_LEGAL_CLAUSES.length,
  145 |       previous_version_date: PREVIOUS_VERSION_DATE,
  146 |     });
  147 | 
  148 |     // mock：取得本地 DB 中的法規（同步完成後狀態）
  149 |     await mockTauriInvoke(page, 'get_local_legal_clauses', {
  150 |       version_date: NEW_VERSION_DATE,
  151 |       clauses: NEW_LEGAL_CLAUSES,
  152 |     });
  153 | 
  154 |     // mock：PDF 渲染（將法規 body 嵌入 PDF 輸出）
  155 |     await mockTauriInvoke(page, 'render_disclosure_pdf', {
  156 |       success: true,
  157 |       pdf_path: '/tmp/aire-disclosure-20260514.pdf',
  158 |       embedded_clauses: NEW_LEGAL_CLAUSES.map((c) => ({
  159 |         code: c.code,
  160 |         body: c.body,
  161 |         version_date: c.version_date,
  162 |       })),
  163 |       version_date: NEW_VERSION_DATE,
  164 |     });
  165 | 
> 166 |     await page.goto('/');
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:1420/
  167 |   });
  168 | 
  169 |   test('OPCOS endpoint 應回傳新版三條法規與版本日期', async ({ page }) => {
  170 |     const remote = await page.evaluate(async () => {
  171 |       return window.__TAURI__?.invoke('fetch_opcos_legal_clauses');
  172 |     });
  173 | 
  174 |     expect(remote).toMatchObject({
  175 |       success: true,
  176 |       version_date: NEW_VERSION_DATE,
  177 |     });
  178 |     const clauses = (remote as { clauses: typeof NEW_LEGAL_CLAUSES }).clauses;
  179 |     expect(clauses).toHaveLength(3);
  180 | 
  181 |     record('OPCOS endpoint 回新版三條法規', true);
  182 |   });
  183 | 
  184 |   test('觸發 sync_legal_clauses 後應回報同步成功與版本日期', async ({ page }) => {
  185 |     const syncResult = await page.evaluate(async () => {
  186 |       return window.__TAURI__?.invoke('sync_legal_clauses', {
  187 |         force: true,
  188 |       });
  189 |     });
  190 | 
  191 |     expect(syncResult).toMatchObject({
  192 |       success: true,
  193 |       synced_count: 3,
  194 |       version_date: NEW_VERSION_DATE,
  195 |     });
  196 |     expect((syncResult as { previous_version_date: string }).previous_version_date)
  197 |       .toBe(PREVIOUS_VERSION_DATE);
  198 | 
  199 |     record('sync_legal_clauses IPC 回報同步成功', true);
  200 |   });
  201 | 
  202 |   test('同步後本地 DB 應含三條法規且版本日期為新版', async ({ page }) => {
  203 |     // 觸發同步
  204 |     await page.evaluate(async () => {
  205 |       return window.__TAURI__?.invoke('sync_legal_clauses', { force: true });
  206 |     });
  207 | 
  208 |     // 讀取本地 DB 狀態
  209 |     const local = await page.evaluate(async () => {
  210 |       return window.__TAURI__?.invoke('get_local_legal_clauses');
  211 |     });
  212 | 
  213 |     expect((local as { version_date: string }).version_date).toBe(NEW_VERSION_DATE);
  214 |     const localClauses = (local as { clauses: typeof NEW_LEGAL_CLAUSES }).clauses;
  215 |     expect(localClauses).toHaveLength(3);
  216 | 
  217 |     const expectedCodes = NEW_LEGAL_CLAUSES.map((c) => c.code).sort();
  218 |     const actualCodes = localClauses.map((c) => c.code).sort();
  219 |     expect(actualCodes).toEqual(expectedCodes);
  220 | 
  221 |     // 每一條法規版本日期均為新版
  222 |     for (const clause of localClauses) {
  223 |       expect(clause.version_date).toBe(NEW_VERSION_DATE);
  224 |     }
  225 | 
  226 |     record('本地 DB 含三條法規 + 版本日期', true);
  227 |   });
  228 | 
  229 |   test('PDF 渲染應嵌入新版法規條文與版本日期', async ({ page }) => {
  230 |     // 先同步法規
  231 |     await page.evaluate(async () => {
  232 |       return window.__TAURI__?.invoke('sync_legal_clauses', { force: true });
  233 |     });
  234 | 
  235 |     // 渲染 PDF
  236 |     const pdfResult = await page.evaluate(async () => {
  237 |       return window.__TAURI__?.invoke('render_disclosure_pdf', {
  238 |         case_id: 'case-001',
  239 |       });
  240 |     });
  241 | 
  242 |     expect((pdfResult as { success: boolean }).success).toBe(true);
  243 |     expect((pdfResult as { version_date: string }).version_date).toBe(NEW_VERSION_DATE);
  244 | 
  245 |     const embedded = (pdfResult as {
  246 |       embedded_clauses: Array<{ code: string; body: string; version_date: string }>;
  247 |     }).embedded_clauses;
  248 | 
  249 |     expect(embedded).toHaveLength(3);
  250 | 
  251 |     // 比對每一條 body 是否為新版內容
  252 |     for (const expectedClause of NEW_LEGAL_CLAUSES) {
  253 |       const found = embedded.find((e) => e.code === expectedClause.code);
  254 |       expect(found).toBeDefined();
  255 |       expect(found?.body).toBe(expectedClause.body);
  256 |       expect(found?.version_date).toBe(NEW_VERSION_DATE);
  257 |     }
  258 | 
  259 |     record('PDF 渲染含新版法規內文與版本日期', true);
  260 |   });
  261 | 
  262 |   test('完整流程：fetch → sync → DB → PDF 全鏈一致', async ({ page }) => {
  263 |     // Step 1：fetch
  264 |     const remote = await page.evaluate(async () => {
  265 |       return window.__TAURI__?.invoke('fetch_opcos_legal_clauses');
  266 |     });
```