import { test, expect } from '@playwright/test';

test.describe('同步狀態頁（立即同步流程）', () => {
  test('點立即同步後顯示 loading，完成後顯示新版日期', async ({ page }) => {
    await page.setContent(`
      <main>
        <button id="sync-btn">立即同步</button>
        <p id="state">idle</p>
        <p id="version">-</p>
      </main>
      <script>
        const latest = { version_date: '2026-05-15' };
        window.__TAURI__ = {
          invoke: async (cmd) => {
            if (cmd === 'sync_legal_clauses') {
              await new Promise((r) => setTimeout(r, 150));
              return { success: true };
            }
            if (cmd === 'list_legal_clauses') {
              return [latest];
            }
            return null;
          }
        };

        const state = document.getElementById('state');
        const version = document.getElementById('version');
        const button = document.getElementById('sync-btn');

        button.addEventListener('click', async () => {
          state.textContent = 'loading';
          await window.__TAURI__.invoke('sync_legal_clauses');
          const clauses = await window.__TAURI__.invoke('list_legal_clauses');
          version.textContent = clauses[0].version_date;
          state.textContent = 'done';
        });
      </script>
    `);

    await page.getByRole('button', { name: '立即同步' }).click();
    await expect(page.locator('#state')).toHaveText('loading');
    await expect(page.locator('#state')).toHaveText('done');
    await expect(page.locator('#version')).toHaveText('2026-05-15');
  });
});
