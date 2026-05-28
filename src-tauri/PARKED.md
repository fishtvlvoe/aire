# Tauri Build Pipeline — PARKED（已暫停）

**Park 日期：** 2026-05-28
**決策依據：** openspec/changes/browser-local-runtime-mvp/design.md Decision 6

## 狀況說明

AIRE 已改用 **browser-local-runtime** 模式：
- Next.js 以 `standalone` 模式 build（產出 `.next/standalone/server.js`）
- 本機 Node runtime 在 `127.0.0.1` 啟動 Next standalone server
- 使用者用系統預設瀏覽器開啟 AIRE

因此：
- `next.config.ts` 的 `output` 已從 `"export"` 改為 `"standalone"`
- `out/` 目錄**不再產生**
- `tauri.conf.json` 的 `frontendDist: "../out"` 指向的目錄不存在
- `pnpm tauri:build` 在目前設定下**會失敗**

## src-tauri/ 狀態

**程式碼保留，未刪除。** Rust 命令層、SQLite migration、IPC handler 等保持原樣。

## GitHub Actions 狀態

| Workflow | 狀態 |
|----------|------|
| `.github/workflows/release.yml` | push tag trigger 已停用，只剩 workflow_dispatch |
| `.github/workflows/windows-runtime-smoke.yml` | 保留 workflow_dispatch，但執行必定失敗 |

## 恢復 Tauri Build 的步驟

1. 把 `next.config.ts` 的 `output` 改回 `"export"`（或改為 production 時走 export）
2. 確認 `tauri.conf.json` `frontendDist` 指向正確的 Next.js 產出目錄
3. 恢復 `release.yml` 中的 `push.tags` trigger（取消註解）
4. 恢復兩個 local API route 的 `force-static` 與 production guard
5. 刪除本檔與 release.yml/windows-runtime-smoke.yml 的 PARKED 說明區塊
