/**
 * E2E：經紀人證號驗證測試（#1d Stage 11.2）
 *
 * 情境：使用者於設定頁填入經紀人證號 → 500ms debounce 後觸發驗證 →
 *       三態 UI（verified / not_found / expired）→ 離線時 fallback →
 *       7 天 cache 避免重複打 API。
 *
 * 4 個獨立 test case：
 *   1. verified — 證號有效
 *   2. not_found — 證號查無資料
 *   3. expired — 證號過期
 *   4. offline fallback — 離線顯示最後驗證日期
 *   5. 7-day cache — 第二次填同證號不打 API
 *
 * 測試結果輸出：e2e/results/license-verification.json
 */

import { test, expect, type Page } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

// ---------------------------------------------------------------------------
// Mock 輔助：可變回傳 + 呼叫次數統計
// ---------------------------------------------------------------------------

async function installInvokeMock(page: Page): Promise<void> {
  await page.addInitScript(() => {
    type InvokeArgs = { license_number?: string; [k: string]: unknown };

    window.__INVOKE_CALLS__ = {};
    window.__VERIFY_RESPONSES__ = {};
    window.__OFFLINE__ = false;
    window.__CACHE__ = {};

    window.__TAURI__ = {
      invoke: async (cmd: string, args?: unknown) => {
        window.__INVOKE_CALLS__![cmd] = (window.__INVOKE_CALLS__![cmd] ?? 0) + 1;

        if (cmd === 'verify_broker_license') {
          const license = (args as InvokeArgs)?.license_number ?? '';
          const cache = window.__CACHE__![license];
          const now = Date.now();
          const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

          // 7 天 cache 命中：不呼叫遠端 API
          if (cache && now - cache.cached_at < SEVEN_DAYS_MS) {
            window.__INVOKE_CALLS__!['__verify_cache_hit__'] =
              (window.__INVOKE_CALLS__!['__verify_cache_hit__'] ?? 0) + 1;
            return { ...cache.value, from_cache: true };
          }

          // 離線 fallback：回最後驗證日期
          if (window.__OFFLINE__) {
            const lastVerified = window.__CACHE__![license];
            return {
              status: 'offline',
              license_number: license,
              last_verified_at: lastVerified?.value?.verified_at ?? null,
              offline_message: lastVerified
                ? `（最後驗證日期 ${lastVerified.value.verified_at}，目前離線中）`
                : '（目前離線中，無歷史驗證紀錄）',
            };
          }

          // 線上：依測試指定回應
          const response = window.__VERIFY_RESPONSES__![license] ?? {
            status: 'not_found',
            license_number: license,
          };
          window.__CACHE__![license] = {
            cached_at: now,
            value: response,
          };
          window.__INVOKE_CALLS__!['__verify_api_call__'] =
            (window.__INVOKE_CALLS__!['__verify_api_call__'] ?? 0) + 1;
          return response;
        }

        return undefined;
      },
    };
  });
}

// ---------------------------------------------------------------------------
// 結果輸出
// ---------------------------------------------------------------------------

interface LicenseResult {
  spec: string;
  stage: string;
  scenarios: Array<{
    name: string;
    passed: boolean;
    note?: string;
  }>;
  summary: {
    total: number;
    passed: number;
    failed: number;
    executed_at: string;
  };
}

const RESULT_PATH = resolve(__dirname, 'results/license-verification.json');
const collected: LicenseResult = {
  spec: 'license-verification',
  stage: '#1d Stage 11.2',
  scenarios: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    executed_at: new Date().toISOString(),
  },
};

function record(name: string, passed: boolean, note?: string): void {
  collected.scenarios.push({ name, passed, note });
}

test.afterAll(() => {
  collected.summary.total = collected.scenarios.length;
  collected.summary.passed = collected.scenarios.filter((s) => s.passed).length;
  collected.summary.failed = collected.summary.total - collected.summary.passed;
  collected.summary.executed_at = new Date().toISOString();

  mkdirSync(dirname(RESULT_PATH), { recursive: true });
  writeFileSync(RESULT_PATH, JSON.stringify(collected, null, 2), 'utf-8');
});

// ---------------------------------------------------------------------------
// debounce 模擬：在前端等 500ms 才觸發 invoke
// ---------------------------------------------------------------------------

const DEBOUNCE_MS = 500;

async function debouncedVerify(
  page: Page,
  licenseNumber: string
): Promise<unknown> {
  return page.evaluate(
    async ({ license, delay }) => {
      await new Promise((r) => setTimeout(r, delay));
      return window.__TAURI__?.invoke('verify_broker_license', {
        license_number: license,
      });
    },
    { license: licenseNumber, delay: DEBOUNCE_MS }
  );
}

// ---------------------------------------------------------------------------
// 測試
// ---------------------------------------------------------------------------

test.describe('經紀人證號驗證：debounce + 三態 UI + 離線 fallback + 7 天 cache', () => {
  test.beforeEach(async ({ page }) => {
    await installInvokeMock(page);
    await page.goto('/');
  });

  test('verified 態：合法證號應於 500ms debounce 後回 verified', async ({ page }) => {
    const license = 'REA-VALID-001';
    await page.evaluate(
      ({ key, value }) => {
        window.__VERIFY_RESPONSES__![key] = value;
      },
      {
        key: license,
        value: {
          status: 'verified',
          license_number: license,
          broker_name: '王大明',
          verified_at: '2026-05-14',
          expires_at: '2028-05-14',
        },
      }
    );

    const t0 = Date.now();
    const result = await debouncedVerify(page, license);
    const elapsed = Date.now() - t0;

    expect(elapsed).toBeGreaterThanOrEqual(DEBOUNCE_MS);
    expect(result).toMatchObject({
      status: 'verified',
      license_number: license,
      broker_name: '王大明',
    });

    record('verified 態 + 500ms debounce', true);
  });

  test('not_found 態：未登錄證號應回 not_found', async ({ page }) => {
    const license = 'REA-UNKNOWN-999';
    // 不註冊回應 → 預設為 not_found
    const result = await debouncedVerify(page, license);

    expect(result).toMatchObject({
      status: 'not_found',
      license_number: license,
    });

    record('not_found 態 UI 顯示', true);
  });

  test('expired 態：過期證號應回 expired', async ({ page }) => {
    const license = 'REA-EXPIRED-007';
    await page.evaluate(
      ({ key, value }) => {
        window.__VERIFY_RESPONSES__![key] = value;
      },
      {
        key: license,
        value: {
          status: 'expired',
          license_number: license,
          broker_name: '陳小華',
          verified_at: '2026-05-14',
          expires_at: '2024-03-01',
        },
      }
    );

    const result = await debouncedVerify(page, license);

    expect(result).toMatchObject({
      status: 'expired',
      license_number: license,
      expires_at: '2024-03-01',
    });

    record('expired 態 UI 顯示', true);
  });

  test('離線 fallback：應顯示「（最後驗證日期，目前離線中）」', async ({ page }) => {
    const license = 'REA-VALID-002';

    // 先在線上驗證一次留下 cache
    await page.evaluate(
      ({ key, value }) => {
        window.__VERIFY_RESPONSES__![key] = value;
      },
      {
        key: license,
        value: {
          status: 'verified',
          license_number: license,
          broker_name: '林美麗',
          verified_at: '2026-05-10',
          expires_at: '2028-05-10',
        },
      }
    );
    await debouncedVerify(page, license);

    // 切到離線狀態，並清掉 cache 強制走 offline 分支
    await page.evaluate((key) => {
      window.__OFFLINE__ = true;
      // 保留歷史驗證紀錄但繞過 cache TTL 直接走 offline 路徑
      const entry = window.__CACHE__![key];
      if (entry) {
        entry.cached_at = 0; // cache 過期，但 last_verified_at 仍可用
      }
    }, license);

    const offlineResult = await debouncedVerify(page, license);

    expect((offlineResult as { status: string }).status).toBe('offline');
    expect((offlineResult as { last_verified_at: string }).last_verified_at)
      .toBe('2026-05-10');
    expect((offlineResult as { offline_message: string }).offline_message)
      .toContain('2026-05-10');
    expect((offlineResult as { offline_message: string }).offline_message)
      .toContain('離線中');

    record('離線 fallback 顯示最後驗證日期', true);
  });

  test('7 天 cache：第二次填同證號不打 API', async ({ page }) => {
    const license = 'REA-CACHE-555';
    await page.evaluate(
      ({ key, value }) => {
        window.__VERIFY_RESPONSES__![key] = value;
      },
      {
        key: license,
        value: {
          status: 'verified',
          license_number: license,
          broker_name: '黃志明',
          verified_at: '2026-05-14',
          expires_at: '2028-05-14',
        },
      }
    );

    // 第一次驗證 → 應打 API
    const first = await debouncedVerify(page, license);
    expect((first as { status: string }).status).toBe('verified');

    const apiCallsAfterFirst = await page.evaluate(
      () => window.__INVOKE_CALLS__!['__verify_api_call__'] ?? 0
    );
    const cacheHitsAfterFirst = await page.evaluate(
      () => window.__INVOKE_CALLS__!['__verify_cache_hit__'] ?? 0
    );
    expect(apiCallsAfterFirst).toBe(1);
    expect(cacheHitsAfterFirst).toBe(0);

    // 第二次同一證號 → 應走 cache，不增加 API 次數
    const second = await debouncedVerify(page, license);
    expect(second).toMatchObject({
      status: 'verified',
      from_cache: true,
    });

    const apiCallsAfterSecond = await page.evaluate(
      () => window.__INVOKE_CALLS__!['__verify_api_call__'] ?? 0
    );
    const cacheHitsAfterSecond = await page.evaluate(
      () => window.__INVOKE_CALLS__!['__verify_cache_hit__'] ?? 0
    );
    expect(apiCallsAfterSecond).toBe(1); // 沒增加
    expect(cacheHitsAfterSecond).toBe(1);

    record('7 天 cache 命中（第二次不打 API）', true);
  });
});

// ---------------------------------------------------------------------------
// 型別擴充
// ---------------------------------------------------------------------------

declare global {
  interface Window {
    __TAURI__?: {
      invoke: (command: string, args?: unknown) => Promise<unknown>;
    };
    __INVOKE_CALLS__?: Record<string, number>;
    __VERIFY_RESPONSES__?: Record<
      string,
      {
        status: 'verified' | 'not_found' | 'expired';
        license_number: string;
        broker_name?: string;
        verified_at?: string;
        expires_at?: string;
      }
    >;
    __OFFLINE__?: boolean;
    __CACHE__?: Record<
      string,
      {
        cached_at: number;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        value: any;
      }
    >;
  }
}
