# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: recovery-reset.spec.ts >> 救援碼重置主密碼 >> Step 3：使用 token 設定新密碼應成功
- Location: e2e/recovery-reset.spec.ts:125:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:1420/
Call log:
  - navigating to "http://localhost:1420/", waiting until "load"

```

# Test source

```ts
  1   | /**
  2   |  * E2E：救援碼重置主密碼測試
  3   |  *
  4   |  * 情境：設定主密碼 → 取得救援碼 → 模擬「忘記密碼」→ 輸入救援碼 → 設新密碼 → 三項斷言
  5   |  *
  6   |  * 三項斷言：
  7   |  *   1. 舊密碼解鎖失敗（被正確拒絕）
  8   |  *   2. 新密碼解鎖成功
  9   |  *   3. 資料完整（案件數不變）
  10  |  *
  11  |  * 注意：Tauri 桌面 App 救援碼 UI 尚在 Stage 5 開發，本測試以 mock 模式驗證流程契約。
  12  |  */
  13  | 
  14  | import { test, expect, type Page } from '@playwright/test';
  15  | 
  16  | // ---------------------------------------------------------------------------
  17  | // Mock 輔助
  18  | // ---------------------------------------------------------------------------
  19  | 
  20  | async function mockTauriInvoke(
  21  |   page: Page,
  22  |   command: string,
  23  |   returnValue: unknown
  24  | ): Promise<void> {
  25  |   await page.addInitScript(
  26  |     ({ cmd, val }: { cmd: string; val: unknown }) => {
  27  |       type InvokeHandler = (cmd: string, args?: unknown) => Promise<unknown>;
  28  | 
  29  |       if (!window.__TAURI__) {
  30  |         window.__TAURI__ = { invoke: async () => {} };
  31  |       }
  32  |       const original = window.__TAURI__.invoke as InvokeHandler;
  33  |       window.__TAURI__.invoke = async (c: string, args?: unknown) => {
  34  |         if (c === cmd) return val;
  35  |         return original(c, args);
  36  |       };
  37  |     },
  38  |     { cmd: command, val: returnValue }
  39  |   );
  40  | }
  41  | 
  42  | // ---------------------------------------------------------------------------
  43  | // 測試資料
  44  | // ---------------------------------------------------------------------------
  45  | 
  46  | const OLD_PASSWORD = 'OldPass@9876';
  47  | const NEW_PASSWORD = 'NewPass@5678';
  48  | const RECOVERY_CODE = 'AIRE-ABCD-1234-EFGH-5678-IJKL';
  49  | 
  50  | const MOCK_CASES = [
  51  |   { id: 'case-001', title: '台北信義路物件', address: '台北市信義區' },
  52  |   { id: 'case-002', title: '新北板橋物件', address: '新北市板橋區' },
  53  | ];
  54  | 
  55  | // ---------------------------------------------------------------------------
  56  | // 測試：救援碼重置主密碼
  57  | // ---------------------------------------------------------------------------
  58  | 
  59  | test.describe('救援碼重置主密碼', () => {
  60  |   test.beforeEach(async ({ page }) => {
  61  |     // mock：設定主密碼成功，同時產生救援碼
  62  |     await mockTauriInvoke(page, 'set_master_password', {
  63  |       success: true,
  64  |       recovery_code: RECOVERY_CODE,
  65  |     });
  66  | 
  67  |     // mock：舊密碼解鎖失敗（密碼已被重設後）
  68  |     await mockTauriInvoke(page, 'unlock_with_old_password', {
  69  |       success: false,
  70  |       error: 'INVALID_PASSWORD',
  71  |     });
  72  | 
  73  |     // mock：救援碼驗證成功
  74  |     await mockTauriInvoke(page, 'verify_recovery_code', {
  75  |       success: true,
  76  |       token: 'reset-token-xyz',
  77  |     });
  78  | 
  79  |     // mock：設定新密碼成功
  80  |     await mockTauriInvoke(page, 'reset_password_with_token', {
  81  |       success: true,
  82  |     });
  83  | 
  84  |     // mock：新密碼解鎖成功，回傳案件資料
  85  |     await mockTauriInvoke(page, 'unlock_with_new_password', {
  86  |       success: true,
  87  |       cases: MOCK_CASES,
  88  |       case_count: MOCK_CASES.length,
  89  |     });
  90  | 
  91  |     // mock：get_cases
  92  |     await mockTauriInvoke(page, 'get_cases', MOCK_CASES);
  93  | 
> 94  |     await page.goto('/');
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:1420/
  95  |   });
  96  | 
  97  |   test('Step 1：設定主密碼後應取得救援碼', async ({ page }) => {
  98  |     const result = await page.evaluate(async (password) => {
  99  |       return window.__TAURI__?.invoke('set_master_password', { password });
  100 |     }, OLD_PASSWORD);
  101 | 
  102 |     expect(result).toMatchObject({
  103 |       success: true,
  104 |       recovery_code: RECOVERY_CODE,
  105 |     });
  106 | 
  107 |     // 救援碼格式驗證：XXXX-XXXX-XXXX-XXXX-XXXX-XXXX
  108 |     const code = (result as { recovery_code: string }).recovery_code;
  109 |     expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  110 |   });
  111 | 
  112 |   test('Step 2：使用救援碼驗證應回傳重設 token', async ({ page }) => {
  113 |     const result = await page.evaluate(async (recoveryCode) => {
  114 |       return window.__TAURI__?.invoke('verify_recovery_code', {
  115 |         recovery_code: recoveryCode,
  116 |       });
  117 |     }, RECOVERY_CODE);
  118 | 
  119 |     expect(result).toMatchObject({
  120 |       success: true,
  121 |     });
  122 |     expect((result as { token: string }).token).toBeTruthy();
  123 |   });
  124 | 
  125 |   test('Step 3：使用 token 設定新密碼應成功', async ({ page }) => {
  126 |     // 取得 reset token
  127 |     const verifyResult = await page.evaluate(async (recoveryCode) => {
  128 |       return window.__TAURI__?.invoke('verify_recovery_code', {
  129 |         recovery_code: recoveryCode,
  130 |       });
  131 |     }, RECOVERY_CODE);
  132 | 
  133 |     const token = (verifyResult as { token: string }).token;
  134 | 
  135 |     // 設定新密碼
  136 |     const resetResult = await page.evaluate(
  137 |       async ({ t, newPw }: { t: string; newPw: string }) => {
  138 |         return window.__TAURI__?.invoke('reset_password_with_token', {
  139 |           token: t,
  140 |           new_password: newPw,
  141 |         });
  142 |       },
  143 |       { t: token, newPw: NEW_PASSWORD }
  144 |     );
  145 | 
  146 |     expect(resetResult).toMatchObject({ success: true });
  147 |   });
  148 | 
  149 |   // -------------------------------------------------------------------------
  150 |   // 三項核心斷言測試
  151 |   // -------------------------------------------------------------------------
  152 | 
  153 |   test('斷言 1：舊密碼解鎖應失敗（密碼已被重設）', async ({ page }) => {
  154 |     const result = await page.evaluate(async (password) => {
  155 |       return window.__TAURI__?.invoke('unlock_with_old_password', { password });
  156 |     }, OLD_PASSWORD);
  157 | 
  158 |     // 斷言 1：舊密碼被拒
  159 |     expect((result as { success: boolean }).success).toBe(false);
  160 |     expect((result as { error: string }).error).toBe('INVALID_PASSWORD');
  161 |   });
  162 | 
  163 |   test('斷言 2：新密碼解鎖應成功', async ({ page }) => {
  164 |     const result = await page.evaluate(async (password) => {
  165 |       return window.__TAURI__?.invoke('unlock_with_new_password', { password });
  166 |     }, NEW_PASSWORD);
  167 | 
  168 |     // 斷言 2：新密碼可解鎖
  169 |     expect((result as { success: boolean }).success).toBe(true);
  170 |   });
  171 | 
  172 |   test('斷言 3：解鎖後資料完整（案件數不變）', async ({ page }) => {
  173 |     // 解鎖並取得案件
  174 |     const unlockResult = await page.evaluate(async (password) => {
  175 |       return window.__TAURI__?.invoke('unlock_with_new_password', { password });
  176 |     }, NEW_PASSWORD);
  177 | 
  178 |     expect((unlockResult as { success: boolean }).success).toBe(true);
  179 | 
  180 |     // 取得案件列表
  181 |     const cases = await page.evaluate(async () => {
  182 |       return window.__TAURI__?.invoke('get_cases');
  183 |     });
  184 | 
  185 |     // 斷言 3：案件數與重設前一致
  186 |     expect((cases as typeof MOCK_CASES)).toHaveLength(MOCK_CASES.length);
  187 |     expect((cases as typeof MOCK_CASES)).toHaveLength(2);
  188 |   });
  189 | 
  190 |   test('完整救援碼重置流程：設密碼 → 取救援碼 → 忘記 → 重設 → 三斷言', async ({ page }) => {
  191 |     // === 設定主密碼，取得救援碼 ===
  192 |     const setupResult = await page.evaluate(async (password) => {
  193 |       return window.__TAURI__?.invoke('set_master_password', { password });
  194 |     }, OLD_PASSWORD);
```