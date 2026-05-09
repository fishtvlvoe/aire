## Problem

Electron App（AI 不動產說明書）從 `/Applications/` symlink 開啟後，進入 crash loop：Dock 出現 20+ 個 Electron 實例圖示，App 完全無法使用。必須用 `kill -9` 才能停止。

**預期行為**：開啟 App → 單一實例啟動 → 顯示 UI
**實際行為**：開啟 App → 啟動失敗 → macOS Launch Services 重試 → 反覆產生新實例 → Dock 爆滿

## Root Cause

兩個問題疊加：

1. **缺少 Single Instance Lock**：`electron/main.ts` 沒有呼叫 `app.requestSingleInstanceLock()`，允許無限多個實例同時執行。正常 Electron App 應在啟動時檢查是否已有實例在跑，有就 focus 現有視窗而不是開新的。

2. **Production 模式啟動失敗**：`app.asar` 裡面沒有 `.next/standalone/` 目錄。`electron/launcher.ts` 的 `launchNextServer()` 嘗試啟動 `server.js` 時找不到檔案 → Promise reject → `main.ts` catch 後呼叫 `app.quit()` → macOS 對失敗的 App 可能觸發自動重開 → 循環。

## Proposed Solution

### Fix 1：加 Single Instance Lock（防多開）

在 `electron/main.ts` 的 `app.whenReady()` 之前加入：
- `app.requestSingleInstanceLock()` — 取得鎖
- 取得失敗 → `app.quit()` 不啟動
- 取得成功 → 監聽 `second-instance` 事件，focus 現有視窗

### Fix 2：修正 build 流程確保 standalone 被打包

檢查 `electron-builder.json` 的 `files` 設定，確認 `.next/standalone/` 被包含在 asar 或 unpacked 資源中。如果 build script 缺少 `next build`（生成 standalone），在 `electron:build` script 中補上。

## Success Criteria

1. 連續雙擊 App 圖示 3 次，Dock 上只出現 1 個實例
2. 第二次以後的雙擊 → focus 到已存在的視窗，不開新的
3. App 啟動後能正常顯示 UI（License 啟用頁或主頁）
4. `npm run electron:build` 產出的 App 內含 `.next/standalone/server.js`

## Impact

- Affected code:
  - Modified: electron/main.ts
  - Modified: electron-builder.json
  - Modified: package.json（electron:build script）
