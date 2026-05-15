import { test, expect, type Page } from '@playwright/test';

async function mockTauriInvoke(
  page: Page,
  command: string,
  returnValue: unknown
): Promise<void> {
  await page.evaluate(
    ({ cmd, val }: { cmd: string; val: unknown }) => {
      type InvokeHandler = (name: string, args?: unknown) => Promise<unknown>;
      if (!window.__TAURI__) {
        window.__TAURI__ = { invoke: async () => undefined };
      }
      const original = window.__TAURI__.invoke as InvokeHandler;
      window.__TAURI__.invoke = async (name: string, args?: unknown) => {
        if (name === cmd) return val;
        return original(name, args);
      };
    },
    { cmd: command, val: returnValue }
  );
}

test.describe('PDF 法規告知區塊位置', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('about:blank');
  });

  test('minimum residential：legal block 在第 4 頁且動態頁不在其前', async ({ page }) => {
    await mockTauriInvoke(page, 'render_disclosure_pdf', {
      pages: ['cover', 'basic-info', 'location-map', 'legal-notice'],
    });

    const pages = await page.evaluate(async () => {
      const result = await window.__TAURI__?.invoke('render_disclosure_pdf', {
        case_type: 'residential',
        minimum_case: true,
      });
      return (result as { pages: string[] }).pages;
    });

    expect(pages[3]).toBe('legal-notice');
    const legalIndex = pages.indexOf('legal-notice');
    const firstDynamicIndex = pages.findIndex((item) =>
      ['photo-gallery', 'condition-survey', 'life-amenities'].includes(item)
    );
    expect(firstDynamicIndex === -1 || legalIndex < firstDynamicIndex).toBe(true);
  });

  test('full case：legal block 出現在第一個動態頁之前', async ({ page }) => {
    await mockTauriInvoke(page, 'render_disclosure_pdf', {
      pages: [
        'cover',
        'basic-info',
        'location-map',
        'legal-notice',
        'photo-gallery',
        'condition-survey',
        'life-amenities',
      ],
    });

    const pages = await page.evaluate(async () => {
      const result = await window.__TAURI__?.invoke('render_disclosure_pdf', {
        case_type: 'residential',
        minimum_case: false,
      });
      return (result as { pages: string[] }).pages;
    });

    const legalIndex = pages.indexOf('legal-notice');
    const firstDynamicIndex = pages.findIndex((item) =>
      ['photo-gallery', 'condition-survey', 'life-amenities'].includes(item)
    );

    expect(legalIndex).toBeGreaterThanOrEqual(0);
    expect(firstDynamicIndex).toBeGreaterThan(legalIndex);
  });
});

declare global {
  interface Window {
    __TAURI__?: {
      invoke: (command: string, args?: unknown) => Promise<unknown>;
    };
  }
}
