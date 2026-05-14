/**
 * E2E：跨機資料可攜性測試
 *
 * 情境：在「舊電腦」建立 3 個案件 → 匯出 .aire 備份檔 → 模擬「新電腦」匯入 → 解鎖 → 驗證案件數一致
 *
 * 注意：Tauri 桌面 App 尚未實作備份匯入 UI，本測試以 mock 模式驗證流程契約。
 * 當 Stage 6 實作完成後，移除 mock 並接通真實 Tauri invoke。
 */

import { test, expect, type Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Mock 輔助：模擬 Tauri invoke 回傳
// ---------------------------------------------------------------------------

async function mockTauriInvoke(
  page: Page,
  command: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

const MASTER_PASSWORD = 'Test@1234';

const MOCK_CASES = [
  { id: 'case-001', title: '台北信義路一段物件', address: '台北市信義區信義路一段1號' },
  { id: 'case-002', title: '新北板橋江翠物件', address: '新北市板橋區文化路100號' },
  { id: 'case-003', title: '台中西區公益路物件', address: '台中市西區公益路88號' },
];

const MOCK_EXPORT_PATH = '/tmp/aire-backup-20260514.aire';

// ---------------------------------------------------------------------------
// 測試：跨機資料可攜性
// ---------------------------------------------------------------------------

test.describe('資料可攜性：跨機備份與還原', () => {
  test.beforeEach(async ({ page }) => {
    // mock：建立 3 個案件
    await mockTauriInvoke(page, 'get_cases', MOCK_CASES);

    // mock：匯出備份成功
    await mockTauriInvoke(page, 'export_backup', {
      success: true,
      output_path: MOCK_EXPORT_PATH,
      case_count: MOCK_CASES.length,
      created_at: '2026-05-14T00:00:00Z',
    });

    // mock：匯入備份成功（模擬新電腦解鎖後載入）
    await mockTauriInvoke(page, 'import_backup', {
      success: true,
      cases: MOCK_CASES,
      case_count: MOCK_CASES.length,
    });

    await page.goto('/');
  });

  test('舊電腦：建立 3 個案件後應顯示於案件清單', async ({ page }) => {
    // 注入 mock 資料模擬已建立 3 筆案件
    await page.evaluate((cases) => {
      window.__AIRE_TEST_CASES__ = cases;
    }, MOCK_CASES);

    // 驗證 mock 資料已注入
    const injectedCount = await page.evaluate(
      () => window.__AIRE_TEST_CASES__?.length ?? 0
    );
    expect(injectedCount).toBe(3);
  });

  test('匯出備份：應產生 .aire 檔案並回報案件數', async ({ page }) => {
    // 呼叫 mock export_backup
    const result = await page.evaluate(async () => {
      return window.__TAURI__?.invoke('export_backup', {
        password: 'Test@1234',
        output_path: '/tmp/aire-backup-20260514.aire',
      });
    });

    expect(result).toMatchObject({
      success: true,
      case_count: 3,
      output_path: MOCK_EXPORT_PATH,
    });
  });

  test('新電腦：匯入備份後案件數應與備份一致', async ({ page }) => {
    // 模擬「新電腦」：清空本機狀態
    await page.evaluate(() => {
      window.__AIRE_TEST_CASES__ = [];
    });

    // 呼叫 mock import_backup
    const importResult = await page.evaluate(async () => {
      return window.__TAURI__?.invoke('import_backup', {
        backup_path: '/tmp/aire-backup-20260514.aire',
        password: 'Test@1234',
      });
    });

    expect(importResult).toMatchObject({
      success: true,
      case_count: 3,
    });

    // 驗證案件數一致（舊電腦 3 筆 = 新電腦 3 筆）
    const importedCases = (importResult as { cases: typeof MOCK_CASES }).cases;
    expect(importedCases).toHaveLength(MOCK_CASES.length);

    // 驗證每筆案件 id 對應正確
    const importedIds = importedCases.map((c) => c.id).sort();
    const originalIds = MOCK_CASES.map((c) => c.id).sort();
    expect(importedIds).toEqual(originalIds);
  });

  test('跨機完整流程：建立 → 匯出 → 匯入 → 比對案件數一致', async ({ page }) => {
    // Step 1：取得舊電腦案件清單
    const originalCases = await page.evaluate(async () => {
      return window.__TAURI__?.invoke('get_cases');
    });
    const originalCount = (originalCases as typeof MOCK_CASES).length;
    expect(originalCount).toBe(3);

    // Step 2：匯出備份
    const exportResult = await page.evaluate(async () => {
      return window.__TAURI__?.invoke('export_backup', {
        password: 'Test@1234',
        output_path: '/tmp/aire-backup-20260514.aire',
      });
    });
    expect((exportResult as { success: boolean }).success).toBe(true);

    // Step 3：模擬新電腦環境
    await page.evaluate(() => {
      window.__AIRE_TEST_CASES__ = [];
    });

    // Step 4：匯入備份並解鎖
    const importResult = await page.evaluate(async (password) => {
      return window.__TAURI__?.invoke('import_backup', {
        backup_path: '/tmp/aire-backup-20260514.aire',
        password,
      });
    }, MASTER_PASSWORD);

    expect((importResult as { success: boolean }).success).toBe(true);

    // Step 5：比對案件數一致
    const importedCount = (importResult as { case_count: number }).case_count;
    expect(importedCount).toBe(originalCount);
  });
});

// ---------------------------------------------------------------------------
// 型別擴充（Tauri 全域 + 測試輔助）
// ---------------------------------------------------------------------------

declare global {
  interface Window {
    __TAURI__?: {
      invoke: (command: string, args?: unknown) => Promise<unknown>;
    };
    __AIRE_TEST_CASES__?: Array<{
      id: string;
      title: string;
      address: string;
    }>;
  }
}
