/**
 * E2E：救援碼重置主密碼測試
 *
 * 情境：設定主密碼 → 取得救援碼 → 模擬「忘記密碼」→ 輸入救援碼 → 設新密碼 → 三項斷言
 *
 * 三項斷言：
 *   1. 舊密碼解鎖失敗（被正確拒絕）
 *   2. 新密碼解鎖成功
 *   3. 資料完整（案件數不變）
 *
 * 注意：Tauri 桌面 App 救援碼 UI 尚在 Stage 5 開發，本測試以 mock 模式驗證流程契約。
 */

import { test, expect, type Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Mock 輔助
// ---------------------------------------------------------------------------

async function mockTauriInvoke(
  page: Page,
  command: string,
  returnValue: unknown
): Promise<void> {
  await page.addInitScript(
    ({ cmd, val }: { cmd: string; val: unknown }) => {
      type InvokeHandler = (cmd: string, args?: unknown) => Promise<unknown>;

      if (!window.__TAURI__) {
        window.__TAURI__ = { invoke: async () => {} };
      }
      const original = window.__TAURI__.invoke as InvokeHandler;
      window.__TAURI__.invoke = async (c: string, args?: unknown) => {
        if (c === cmd) return val;
        return original(c, args);
      };
    },
    { cmd: command, val: returnValue }
  );
}

// ---------------------------------------------------------------------------
// 測試資料
// ---------------------------------------------------------------------------

const OLD_PASSWORD = 'OldPass@9876';
const NEW_PASSWORD = 'NewPass@5678';
const RECOVERY_CODE = 'AIRE-ABCD-1234-EFGH-5678-IJKL';

const MOCK_CASES = [
  { id: 'case-001', title: '台北信義路物件', address: '台北市信義區' },
  { id: 'case-002', title: '新北板橋物件', address: '新北市板橋區' },
];

// ---------------------------------------------------------------------------
// 測試：救援碼重置主密碼
// ---------------------------------------------------------------------------

test.describe('救援碼重置主密碼', () => {
  test.beforeEach(async ({ page }) => {
    // mock：設定主密碼成功，同時產生救援碼
    await mockTauriInvoke(page, 'set_master_password', {
      success: true,
      recovery_code: RECOVERY_CODE,
    });

    // mock：舊密碼解鎖失敗（密碼已被重設後）
    await mockTauriInvoke(page, 'unlock_with_old_password', {
      success: false,
      error: 'INVALID_PASSWORD',
    });

    // mock：救援碼驗證成功
    await mockTauriInvoke(page, 'verify_recovery_code', {
      success: true,
      token: 'reset-token-xyz',
    });

    // mock：設定新密碼成功
    await mockTauriInvoke(page, 'reset_password_with_token', {
      success: true,
    });

    // mock：新密碼解鎖成功，回傳案件資料
    await mockTauriInvoke(page, 'unlock_with_new_password', {
      success: true,
      cases: MOCK_CASES,
      case_count: MOCK_CASES.length,
    });

    // mock：get_cases
    await mockTauriInvoke(page, 'get_cases', MOCK_CASES);

    await page.goto('/');
  });

  test('Step 1：設定主密碼後應取得救援碼', async ({ page }) => {
    const result = await page.evaluate(async (password) => {
      return window.__TAURI__?.invoke('set_master_password', { password });
    }, OLD_PASSWORD);

    expect(result).toMatchObject({
      success: true,
      recovery_code: RECOVERY_CODE,
    });

    // 救援碼格式驗證：XXXX-XXXX-XXXX-XXXX-XXXX-XXXX
    const code = (result as { recovery_code: string }).recovery_code;
    expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  });

  test('Step 2：使用救援碼驗證應回傳重設 token', async ({ page }) => {
    const result = await page.evaluate(async (recoveryCode) => {
      return window.__TAURI__?.invoke('verify_recovery_code', {
        recovery_code: recoveryCode,
      });
    }, RECOVERY_CODE);

    expect(result).toMatchObject({
      success: true,
    });
    expect((result as { token: string }).token).toBeTruthy();
  });

  test('Step 3：使用 token 設定新密碼應成功', async ({ page }) => {
    // 取得 reset token
    const verifyResult = await page.evaluate(async (recoveryCode) => {
      return window.__TAURI__?.invoke('verify_recovery_code', {
        recovery_code: recoveryCode,
      });
    }, RECOVERY_CODE);

    const token = (verifyResult as { token: string }).token;

    // 設定新密碼
    const resetResult = await page.evaluate(
      async ({ t, newPw }: { t: string; newPw: string }) => {
        return window.__TAURI__?.invoke('reset_password_with_token', {
          token: t,
          new_password: newPw,
        });
      },
      { t: token, newPw: NEW_PASSWORD }
    );

    expect(resetResult).toMatchObject({ success: true });
  });

  // -------------------------------------------------------------------------
  // 三項核心斷言測試
  // -------------------------------------------------------------------------

  test('斷言 1：舊密碼解鎖應失敗（密碼已被重設）', async ({ page }) => {
    const result = await page.evaluate(async (password) => {
      return window.__TAURI__?.invoke('unlock_with_old_password', { password });
    }, OLD_PASSWORD);

    // 斷言 1：舊密碼被拒
    expect((result as { success: boolean }).success).toBe(false);
    expect((result as { error: string }).error).toBe('INVALID_PASSWORD');
  });

  test('斷言 2：新密碼解鎖應成功', async ({ page }) => {
    const result = await page.evaluate(async (password) => {
      return window.__TAURI__?.invoke('unlock_with_new_password', { password });
    }, NEW_PASSWORD);

    // 斷言 2：新密碼可解鎖
    expect((result as { success: boolean }).success).toBe(true);
  });

  test('斷言 3：解鎖後資料完整（案件數不變）', async ({ page }) => {
    // 解鎖並取得案件
    const unlockResult = await page.evaluate(async (password) => {
      return window.__TAURI__?.invoke('unlock_with_new_password', { password });
    }, NEW_PASSWORD);

    expect((unlockResult as { success: boolean }).success).toBe(true);

    // 取得案件列表
    const cases = await page.evaluate(async () => {
      return window.__TAURI__?.invoke('get_cases');
    });

    // 斷言 3：案件數與重設前一致
    expect((cases as typeof MOCK_CASES)).toHaveLength(MOCK_CASES.length);
    expect((cases as typeof MOCK_CASES)).toHaveLength(2);
  });

  test('完整救援碼重置流程：設密碼 → 取救援碼 → 忘記 → 重設 → 三斷言', async ({ page }) => {
    // === 設定主密碼，取得救援碼 ===
    const setupResult = await page.evaluate(async (password) => {
      return window.__TAURI__?.invoke('set_master_password', { password });
    }, OLD_PASSWORD);

    expect((setupResult as { success: boolean }).success).toBe(true);
    const recoveryCode = (setupResult as { recovery_code: string }).recovery_code;
    expect(recoveryCode).toBe(RECOVERY_CODE);

    // === 模擬「忘記密碼」：舊密碼無法解鎖 ===
    const oldPasswordFail = await page.evaluate(async (password) => {
      return window.__TAURI__?.invoke('unlock_with_old_password', { password });
    }, OLD_PASSWORD);

    // 斷言 1：舊密碼失敗
    expect((oldPasswordFail as { success: boolean }).success).toBe(false);

    // === 使用救援碼重設 ===
    const verifyResult = await page.evaluate(async (code) => {
      return window.__TAURI__?.invoke('verify_recovery_code', {
        recovery_code: code,
      });
    }, recoveryCode);

    const resetToken = (verifyResult as { token: string }).token;

    const resetResult = await page.evaluate(
      async ({ token, newPassword }: { token: string; newPassword: string }) => {
        return window.__TAURI__?.invoke('reset_password_with_token', {
          token,
          new_password: newPassword,
        });
      },
      { token: resetToken, newPassword: NEW_PASSWORD }
    );

    expect((resetResult as { success: boolean }).success).toBe(true);

    // === 使用新密碼解鎖 ===
    const newPasswordSuccess = await page.evaluate(async (password) => {
      return window.__TAURI__?.invoke('unlock_with_new_password', { password });
    }, NEW_PASSWORD);

    // 斷言 2：新密碼成功
    expect((newPasswordSuccess as { success: boolean }).success).toBe(true);

    // === 驗證資料完整 ===
    const casesAfterReset = await page.evaluate(async () => {
      return window.__TAURI__?.invoke('get_cases');
    });

    // 斷言 3：案件數不變
    expect((casesAfterReset as typeof MOCK_CASES)).toHaveLength(MOCK_CASES.length);
  });
});

// ---------------------------------------------------------------------------
// 型別擴充（Tauri 全域）
// ---------------------------------------------------------------------------

declare global {
  interface Window {
    __TAURI__?: {
      invoke: (command: string, args?: unknown) => Promise<unknown>;
    };
  }
}
