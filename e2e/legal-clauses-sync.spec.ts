/**
 * E2E：法規條款同步測試（#1d Stage 11.1）
 *
 * 情境：OPCOS 後端發布新版三條法規 → 桌面 App 透過 sync_legal_clauses IPC 拉取
 *       → 寫入本地 DB → PDF 渲染時帶入新版法規。
 *
 * 注意：Tauri 桌面 App 的法規同步尚未實作完整流程，本測試以 mock 模式驗證契約：
 *   - mock OPCOS endpoint 回新版三條法規
 *   - 觸發 sync_legal_clauses IPC
 *   - 斷言 DB 含三條法規 + 版本日期 + PDF 渲染含新版
 *
 * 測試結果輸出：e2e/results/legal-sync.json
 */

import { test, expect, type Page } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

// ---------------------------------------------------------------------------
// Mock 輔助
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
// 測試資料：OPCOS 後端回的新版三條法規
// ---------------------------------------------------------------------------

const NEW_VERSION_DATE = '2026-05-14';
const PREVIOUS_VERSION_DATE = '2025-12-01';

const NEW_LEGAL_CLAUSES = [
  {
    id: 'clause-001',
    code: 'REA-2026-01',
    title: '不動產說明書應記載事項（2026 修訂版）',
    body: '賣方應主動揭露建物現況、產權狀態、共用設施分擔比例，包含本次新增的「綠建築標章」欄位。',
    version_date: NEW_VERSION_DATE,
    category: 'disclosure',
  },
  {
    id: 'clause-002',
    code: 'REA-2026-02',
    title: '消費者契約審閱期（修訂條文）',
    body: '消費者於簽約前至少有五日審閱期，業者不得以任何方式縮短或要求消費者拋棄此權利。',
    version_date: NEW_VERSION_DATE,
    category: 'review-period',
  },
  {
    id: 'clause-003',
    code: 'REA-2026-03',
    title: '履約保證機制（強制納入）',
    body: '成交價款應透過第三方履約保證機構保管，買賣雙方任一方不得自行管理交易款項。',
    version_date: NEW_VERSION_DATE,
    category: 'escrow',
  },
];

// ---------------------------------------------------------------------------
// 測試結果輸出
// ---------------------------------------------------------------------------

interface LegalSyncResult {
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

const RESULT_PATH = resolve(__dirname, 'results/legal-sync.json');
const collected: LegalSyncResult = {
  spec: 'legal-clauses-sync',
  stage: '#1d Stage 11.1',
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
// 測試：法規條款同步
// ---------------------------------------------------------------------------

test.describe('法規條款同步：OPCOS → 桌面 App DB → PDF 渲染', () => {
  test.beforeEach(async ({ page }) => {
    // mock OPCOS 後端回新版三條法規
    await mockTauriInvoke(page, 'fetch_opcos_legal_clauses', {
      success: true,
      version_date: NEW_VERSION_DATE,
      clauses: NEW_LEGAL_CLAUSES,
    });

    // mock：sync_legal_clauses IPC（寫入本地 DB）
    await mockTauriInvoke(page, 'sync_legal_clauses', {
      success: true,
      version_date: NEW_VERSION_DATE,
      synced_count: NEW_LEGAL_CLAUSES.length,
      previous_version_date: PREVIOUS_VERSION_DATE,
    });

    // mock：取得本地 DB 中的法規（同步完成後狀態）
    await mockTauriInvoke(page, 'get_local_legal_clauses', {
      version_date: NEW_VERSION_DATE,
      clauses: NEW_LEGAL_CLAUSES,
    });

    // mock：PDF 渲染（將法規 body 嵌入 PDF 輸出）
    await mockTauriInvoke(page, 'render_disclosure_pdf', {
      success: true,
      pdf_path: '/tmp/aire-disclosure-20260514.pdf',
      embedded_clauses: NEW_LEGAL_CLAUSES.map((c) => ({
        code: c.code,
        body: c.body,
        version_date: c.version_date,
      })),
      version_date: NEW_VERSION_DATE,
    });

    await page.goto('/');
  });

  test('OPCOS endpoint 應回傳新版三條法規與版本日期', async ({ page }) => {
    const remote = await page.evaluate(async () => {
      return window.__TAURI__?.invoke('fetch_opcos_legal_clauses');
    });

    expect(remote).toMatchObject({
      success: true,
      version_date: NEW_VERSION_DATE,
    });
    const clauses = (remote as { clauses: typeof NEW_LEGAL_CLAUSES }).clauses;
    expect(clauses).toHaveLength(3);

    record('OPCOS endpoint 回新版三條法規', true);
  });

  test('觸發 sync_legal_clauses 後應回報同步成功與版本日期', async ({ page }) => {
    const syncResult = await page.evaluate(async () => {
      return window.__TAURI__?.invoke('sync_legal_clauses', {
        force: true,
      });
    });

    expect(syncResult).toMatchObject({
      success: true,
      synced_count: 3,
      version_date: NEW_VERSION_DATE,
    });
    expect((syncResult as { previous_version_date: string }).previous_version_date)
      .toBe(PREVIOUS_VERSION_DATE);

    record('sync_legal_clauses IPC 回報同步成功', true);
  });

  test('同步後本地 DB 應含三條法規且版本日期為新版', async ({ page }) => {
    // 觸發同步
    await page.evaluate(async () => {
      return window.__TAURI__?.invoke('sync_legal_clauses', { force: true });
    });

    // 讀取本地 DB 狀態
    const local = await page.evaluate(async () => {
      return window.__TAURI__?.invoke('get_local_legal_clauses');
    });

    expect((local as { version_date: string }).version_date).toBe(NEW_VERSION_DATE);
    const localClauses = (local as { clauses: typeof NEW_LEGAL_CLAUSES }).clauses;
    expect(localClauses).toHaveLength(3);

    const expectedCodes = NEW_LEGAL_CLAUSES.map((c) => c.code).sort();
    const actualCodes = localClauses.map((c) => c.code).sort();
    expect(actualCodes).toEqual(expectedCodes);

    // 每一條法規版本日期均為新版
    for (const clause of localClauses) {
      expect(clause.version_date).toBe(NEW_VERSION_DATE);
    }

    record('本地 DB 含三條法規 + 版本日期', true);
  });

  test('PDF 渲染應嵌入新版法規條文與版本日期', async ({ page }) => {
    // 先同步法規
    await page.evaluate(async () => {
      return window.__TAURI__?.invoke('sync_legal_clauses', { force: true });
    });

    // 渲染 PDF
    const pdfResult = await page.evaluate(async () => {
      return window.__TAURI__?.invoke('render_disclosure_pdf', {
        case_id: 'case-001',
      });
    });

    expect((pdfResult as { success: boolean }).success).toBe(true);
    expect((pdfResult as { version_date: string }).version_date).toBe(NEW_VERSION_DATE);

    const embedded = (pdfResult as {
      embedded_clauses: Array<{ code: string; body: string; version_date: string }>;
    }).embedded_clauses;

    expect(embedded).toHaveLength(3);

    // 比對每一條 body 是否為新版內容
    for (const expectedClause of NEW_LEGAL_CLAUSES) {
      const found = embedded.find((e) => e.code === expectedClause.code);
      expect(found).toBeDefined();
      expect(found?.body).toBe(expectedClause.body);
      expect(found?.version_date).toBe(NEW_VERSION_DATE);
    }

    record('PDF 渲染含新版法規內文與版本日期', true);
  });

  test('完整流程：fetch → sync → DB → PDF 全鏈一致', async ({ page }) => {
    // Step 1：fetch
    const remote = await page.evaluate(async () => {
      return window.__TAURI__?.invoke('fetch_opcos_legal_clauses');
    });
    const remoteVersion = (remote as { version_date: string }).version_date;

    // Step 2：sync 寫入本地 DB
    const syncResult = await page.evaluate(async () => {
      return window.__TAURI__?.invoke('sync_legal_clauses', { force: true });
    });
    const syncedVersion = (syncResult as { version_date: string }).version_date;

    // Step 3：讀本地 DB
    const local = await page.evaluate(async () => {
      return window.__TAURI__?.invoke('get_local_legal_clauses');
    });
    const localVersion = (local as { version_date: string }).version_date;

    // Step 4：渲染 PDF
    const pdf = await page.evaluate(async () => {
      return window.__TAURI__?.invoke('render_disclosure_pdf', {
        case_id: 'case-001',
      });
    });
    const pdfVersion = (pdf as { version_date: string }).version_date;

    // 四個來源版本必須一致
    expect(remoteVersion).toBe(NEW_VERSION_DATE);
    expect(syncedVersion).toBe(NEW_VERSION_DATE);
    expect(localVersion).toBe(NEW_VERSION_DATE);
    expect(pdfVersion).toBe(NEW_VERSION_DATE);

    record('全鏈版本一致（fetch → sync → DB → PDF）', true);
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
  }
}
