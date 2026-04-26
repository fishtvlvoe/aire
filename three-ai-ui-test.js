const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(15000);

  const results = {};

  // ── Step 1: 進入填寫頁面 ────────────────────────────────────────
  console.log('[Step 1] 導航到 /listings/132/fill ...');
  try {
    await page.goto('http://localhost:3000/listings/132/fill', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/step1-fill-page.png', fullPage: true });

    // 取得所有 tab 標籤文字
    const tabs = await page.$$eval('[role="tab"], button[data-tab], .tab-button, nav button, [class*="tab"]', els =>
      els.map(el => el.textContent.trim()).filter(t => t.length > 0)
    );
    console.log('找到 tabs:', tabs);

    // 確認第一個 tab
    const firstTab = await page.$eval(
      '[role="tab"]:first-child, [role="tablist"] [role="tab"]:first-child, nav button:first-child',
      el => el.textContent.trim()
    ).catch(() => 'N/A');

    results.step1 = { success: true, tabs, firstTab };
    console.log('[Step 1] ✅ 截圖存到 /tmp/step1-fill-page.png，firstTab:', firstTab);
  } catch (e) {
    await page.screenshot({ path: '/tmp/step1-fill-page.png', fullPage: true }).catch(() => {});
    results.step1 = { success: false, error: e.message };
    console.log('[Step 1] ❌', e.message);
  }

  // ── Step 2: 找跳過按鈕 ─────────────────────────────────────────
  console.log('[Step 2] 找「跳過上傳，全部手動輸入」按鈕 ...');
  try {
    await page.screenshot({ path: '/tmp/step2-skip-button.png', fullPage: true });

    const skipBtn = await page.$('text=跳過上傳') ??
                    await page.$('text=跳過') ??
                    await page.$('[class*="skip"]') ??
                    await page.$('button:has-text("手動")');

    const allButtons = await page.$$eval('button', els =>
      els.map(el => el.textContent.trim()).filter(t => t.length > 0)
    );
    console.log('頁面上所有按鈕:', allButtons);

    results.step2 = {
      success: true,
      skipButtonFound: skipBtn !== null,
      allButtons
    };
    console.log('[Step 2]', skipBtn ? '✅ 找到跳過按鈕' : '⚠️ 找不到跳過按鈕');
  } catch (e) {
    await page.screenshot({ path: '/tmp/step2-skip-button.png', fullPage: true }).catch(() => {});
    results.step2 = { success: false, error: e.message };
    console.log('[Step 2] ❌', e.message);
  }

  // ── Step 3: 點擊跳過按鈕 ───────────────────────────────────────
  console.log('[Step 3] 點擊跳過按鈕 ...');
  try {
    const skipSelectors = [
      'text=跳過上傳，全部手動輸入',
      'text=跳過上傳',
      'text=全部手動輸入',
      'text=跳過',
      'button:has-text("手動")',
      '[class*="skip"]'
    ];

    let clicked = false;
    for (const sel of skipSelectors) {
      const btn = await page.$(sel).catch(() => null);
      if (btn) {
        await btn.click();
        clicked = true;
        console.log(`[Step 3] 點擊了 selector: ${sel}`);
        break;
      }
    }

    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/step3-after-skip.png', fullPage: true });

    // 確認當前 active tab
    const activeTab = await page.$eval(
      '[role="tab"][aria-selected="true"], [role="tab"].active, [class*="tab"][class*="active"]',
      el => el.textContent.trim()
    ).catch(() => 'N/A');

    results.step3 = { success: true, clicked, activeTabAfterSkip: activeTab };
    console.log('[Step 3]', clicked ? '✅ 點擊成功' : '⚠️ 找不到按鈕', '| active tab:', activeTab);
  } catch (e) {
    await page.screenshot({ path: '/tmp/step3-after-skip.png', fullPage: true }).catch(() => {});
    results.step3 = { success: false, error: e.message };
    console.log('[Step 3] ❌', e.message);
  }

  // ── Step 4: 逐一點擊各 tab ─────────────────────────────────────
  console.log('[Step 4] 逐一點擊各 tab ...');
  try {
    const tabLabels = [];
    const tabEls = await page.$$('[role="tab"], [role="tablist"] button');

    for (const tab of tabEls) {
      const label = await tab.textContent().then(t => t.trim()).catch(() => '');
      if (label) {
        tabLabels.push(label);
        await tab.click().catch(() => {});
        await page.waitForTimeout(300);
      }
    }

    await page.screenshot({ path: '/tmp/step4-tabs-overview.png', fullPage: true });
    results.step4 = { success: true, tabsFound: tabLabels };
    console.log('[Step 4] ✅ tabs:', tabLabels);
  } catch (e) {
    await page.screenshot({ path: '/tmp/step4-tabs-overview.png', fullPage: true }).catch(() => {});
    results.step4 = { success: false, error: e.message };
    console.log('[Step 4] ❌', e.message);
  }

  // ── Step 5: 呼叫 extract-status API ────────────────────────────
  console.log('[Step 5] 呼叫 extract-status API ...');
  try {
    const apiResult = await page.evaluate(async () => {
      try {
        const res = await fetch('http://localhost:3000/api/listings/132/extract-status');
        const data = await res.json();
        return { status: res.status, data };
      } catch (e) {
        return { error: e.message };
      }
    });
    results.step5 = { success: true, apiResult };
    console.log('[Step 5] ✅ API 回傳:', JSON.stringify(apiResult));
  } catch (e) {
    results.step5 = { success: false, error: e.message };
    console.log('[Step 5] ❌', e.message);
  }

  // ── Step 6: 回到照片/文件 tab ──────────────────────────────────
  console.log('[Step 6] 回到第一個 tab（照片/文件）...');
  try {
    const firstTabEl = await page.$('[role="tab"]:first-child, [role="tablist"] [role="tab"]:first-child');
    if (firstTabEl) {
      await firstTabEl.click();
    } else {
      // 試圖找照片/文件相關 tab
      const mediaTab = await page.$('text=照片') ?? await page.$('text=文件') ?? await page.$('text=媒體');
      if (mediaTab) await mediaTab.click();
    }

    await page.waitForTimeout(800);
    await page.screenshot({ path: '/tmp/step6-media-tab.png', fullPage: true });

    // 檢查上傳 UI
    const hasFileInput = await page.$('input[type="file"]').then(el => el !== null).catch(() => false);
    const hasDropzone = await page.$('[class*="dropzone"], [class*="upload"], [class*="drop"]').then(el => el !== null).catch(() => false);
    const hasUploadBtn = await page.$('button:has-text("上傳"), button:has-text("選擇"), button:has-text("選取")').then(el => el !== null).catch(() => false);

    results.step6 = { success: true, hasFileInput, hasDropzone, hasUploadBtn };
    console.log('[Step 6] ✅ file input:', hasFileInput, '| dropzone:', hasDropzone, '| upload btn:', hasUploadBtn);
  } catch (e) {
    await page.screenshot({ path: '/tmp/step6-media-tab.png', fullPage: true }).catch(() => {});
    results.step6 = { success: false, error: e.message };
    console.log('[Step 6] ❌', e.message);
  }

  // ── Step 7: 模擬 extract POST ───────────────────────────────────
  console.log('[Step 7] 呼叫 /api/listings/132/extract POST ...');
  try {
    const extractResult = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/listings/132/extract', { method: 'POST' });
        const data = await res.json();
        return { status: res.status, data };
      } catch (e) {
        return { error: e.message };
      }
    });
    console.log('[Step 7] extract API 回傳:', JSON.stringify(extractResult));

    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/step7-after-extract.png', fullPage: true });

    // 找徽章
    const badges = await page.$$eval(
      '[class*="badge"], [class*="Badge"], span[class*="tag"], [data-extracted]',
      els => els.map(el => el.textContent.trim())
    ).catch(() => []);

    results.step7 = { success: true, extractResult, badgesFound: badges };
    console.log('[Step 7] ✅ badges:', badges);
  } catch (e) {
    await page.screenshot({ path: '/tmp/step7-after-extract.png', fullPage: true }).catch(() => {});
    results.step7 = { success: false, error: e.message };
    console.log('[Step 7] ❌', e.message);
  }

  // ── 最終報告 ─────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════');
  console.log('FINAL_RESULTS:' + JSON.stringify(results, null, 2));
  console.log('══════════════════════════════════════════');

  await browser.close();
})();
