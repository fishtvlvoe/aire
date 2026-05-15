# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: data-portability.spec.ts >> 資料可攜性：跨機備份與還原 >> 跨機完整流程：建立 → 匯出 → 匯入 → 比對案件數一致
- Location: e2e/data-portability.spec.ts:138:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:1420/
Call log:
  - navigating to "http://localhost:1420/", waiting until "load"

```

# Test source

```ts
  1   | /**
  2   |  * E2E：跨機資料可攜性測試
  3   |  *
  4   |  * 情境：在「舊電腦」建立 3 個案件 → 匯出 .aire 備份檔 → 模擬「新電腦」匯入 → 解鎖 → 驗證案件數一致
  5   |  *
  6   |  * 注意：Tauri 桌面 App 尚未實作備份匯入 UI，本測試以 mock 模式驗證流程契約。
  7   |  * 當 Stage 6 實作完成後，移除 mock 並接通真實 Tauri invoke。
  8   |  */
  9   | 
  10  | import { test, expect, type Page } from '@playwright/test';
  11  | 
  12  | // ---------------------------------------------------------------------------
  13  | // Mock 輔助：模擬 Tauri invoke 回傳
  14  | // ---------------------------------------------------------------------------
  15  | 
  16  | async function mockTauriInvoke(
  17  |   page: Page,
  18  |   command: string,
  19  |   // eslint-disable-next-line @typescript-eslint/no-explicit-any
  20  |   returnValue: unknown
  21  | ): Promise<void> {
  22  |   await page.addInitScript(
  23  |     ({ cmd, val }: { cmd: string; val: unknown }) => {
  24  |       type InvokeHandler = (cmd: string, args?: unknown) => Promise<unknown>;
  25  | 
  26  |       if (!window.__TAURI__) {
  27  |         window.__TAURI__ = { invoke: async () => {} };
  28  |       }
  29  |       const original = window.__TAURI__.invoke as InvokeHandler;
  30  |       window.__TAURI__.invoke = async (c: string, args?: unknown) => {
  31  |         if (c === cmd) return val;
  32  |         return original(c, args);
  33  |       };
  34  |     },
  35  |     { cmd: command, val: returnValue }
  36  |   );
  37  | }
  38  | 
  39  | // ---------------------------------------------------------------------------
  40  | // 測試資料
  41  | // ---------------------------------------------------------------------------
  42  | 
  43  | const MASTER_PASSWORD = 'Test@1234';
  44  | 
  45  | const MOCK_CASES = [
  46  |   { id: 'case-001', title: '台北信義路一段物件', address: '台北市信義區信義路一段1號' },
  47  |   { id: 'case-002', title: '新北板橋江翠物件', address: '新北市板橋區文化路100號' },
  48  |   { id: 'case-003', title: '台中西區公益路物件', address: '台中市西區公益路88號' },
  49  | ];
  50  | 
  51  | const MOCK_EXPORT_PATH = '/tmp/aire-backup-20260514.aire';
  52  | 
  53  | // ---------------------------------------------------------------------------
  54  | // 測試：跨機資料可攜性
  55  | // ---------------------------------------------------------------------------
  56  | 
  57  | test.describe('資料可攜性：跨機備份與還原', () => {
  58  |   test.beforeEach(async ({ page }) => {
  59  |     // mock：建立 3 個案件
  60  |     await mockTauriInvoke(page, 'get_cases', MOCK_CASES);
  61  | 
  62  |     // mock：匯出備份成功
  63  |     await mockTauriInvoke(page, 'export_backup', {
  64  |       success: true,
  65  |       output_path: MOCK_EXPORT_PATH,
  66  |       case_count: MOCK_CASES.length,
  67  |       created_at: '2026-05-14T00:00:00Z',
  68  |     });
  69  | 
  70  |     // mock：匯入備份成功（模擬新電腦解鎖後載入）
  71  |     await mockTauriInvoke(page, 'import_backup', {
  72  |       success: true,
  73  |       cases: MOCK_CASES,
  74  |       case_count: MOCK_CASES.length,
  75  |     });
  76  | 
> 77  |     await page.goto('/');
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:1420/
  78  |   });
  79  | 
  80  |   test('舊電腦：建立 3 個案件後應顯示於案件清單', async ({ page }) => {
  81  |     // 注入 mock 資料模擬已建立 3 筆案件
  82  |     await page.evaluate((cases) => {
  83  |       window.__AIRE_TEST_CASES__ = cases;
  84  |     }, MOCK_CASES);
  85  | 
  86  |     // 驗證 mock 資料已注入
  87  |     const injectedCount = await page.evaluate(
  88  |       () => window.__AIRE_TEST_CASES__?.length ?? 0
  89  |     );
  90  |     expect(injectedCount).toBe(3);
  91  |   });
  92  | 
  93  |   test('匯出備份：應產生 .aire 檔案並回報案件數', async ({ page }) => {
  94  |     // 呼叫 mock export_backup
  95  |     const result = await page.evaluate(async () => {
  96  |       return window.__TAURI__?.invoke('export_backup', {
  97  |         password: 'Test@1234',
  98  |         output_path: '/tmp/aire-backup-20260514.aire',
  99  |       });
  100 |     });
  101 | 
  102 |     expect(result).toMatchObject({
  103 |       success: true,
  104 |       case_count: 3,
  105 |       output_path: MOCK_EXPORT_PATH,
  106 |     });
  107 |   });
  108 | 
  109 |   test('新電腦：匯入備份後案件數應與備份一致', async ({ page }) => {
  110 |     // 模擬「新電腦」：清空本機狀態
  111 |     await page.evaluate(() => {
  112 |       window.__AIRE_TEST_CASES__ = [];
  113 |     });
  114 | 
  115 |     // 呼叫 mock import_backup
  116 |     const importResult = await page.evaluate(async () => {
  117 |       return window.__TAURI__?.invoke('import_backup', {
  118 |         backup_path: '/tmp/aire-backup-20260514.aire',
  119 |         password: 'Test@1234',
  120 |       });
  121 |     });
  122 | 
  123 |     expect(importResult).toMatchObject({
  124 |       success: true,
  125 |       case_count: 3,
  126 |     });
  127 | 
  128 |     // 驗證案件數一致（舊電腦 3 筆 = 新電腦 3 筆）
  129 |     const importedCases = (importResult as { cases: typeof MOCK_CASES }).cases;
  130 |     expect(importedCases).toHaveLength(MOCK_CASES.length);
  131 | 
  132 |     // 驗證每筆案件 id 對應正確
  133 |     const importedIds = importedCases.map((c) => c.id).sort();
  134 |     const originalIds = MOCK_CASES.map((c) => c.id).sort();
  135 |     expect(importedIds).toEqual(originalIds);
  136 |   });
  137 | 
  138 |   test('跨機完整流程：建立 → 匯出 → 匯入 → 比對案件數一致', async ({ page }) => {
  139 |     // Step 1：取得舊電腦案件清單
  140 |     const originalCases = await page.evaluate(async () => {
  141 |       return window.__TAURI__?.invoke('get_cases');
  142 |     });
  143 |     const originalCount = (originalCases as typeof MOCK_CASES).length;
  144 |     expect(originalCount).toBe(3);
  145 | 
  146 |     // Step 2：匯出備份
  147 |     const exportResult = await page.evaluate(async () => {
  148 |       return window.__TAURI__?.invoke('export_backup', {
  149 |         password: 'Test@1234',
  150 |         output_path: '/tmp/aire-backup-20260514.aire',
  151 |       });
  152 |     });
  153 |     expect((exportResult as { success: boolean }).success).toBe(true);
  154 | 
  155 |     // Step 3：模擬新電腦環境
  156 |     await page.evaluate(() => {
  157 |       window.__AIRE_TEST_CASES__ = [];
  158 |     });
  159 | 
  160 |     // Step 4：匯入備份並解鎖
  161 |     const importResult = await page.evaluate(async (password) => {
  162 |       return window.__TAURI__?.invoke('import_backup', {
  163 |         backup_path: '/tmp/aire-backup-20260514.aire',
  164 |         password,
  165 |       });
  166 |     }, MASTER_PASSWORD);
  167 | 
  168 |     expect((importResult as { success: boolean }).success).toBe(true);
  169 | 
  170 |     // Step 5：比對案件數一致
  171 |     const importedCount = (importResult as { case_count: number }).case_count;
  172 |     expect(importedCount).toBe(originalCount);
  173 |   });
  174 | });
  175 | 
  176 | // ---------------------------------------------------------------------------
  177 | // 型別擴充（Tauri 全域 + 測試輔助）
```