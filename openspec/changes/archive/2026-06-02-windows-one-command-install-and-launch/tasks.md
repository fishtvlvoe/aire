## 1. Windows 一鍵命令（TDD）

- [x] 1.1 對應決策 2：先寫 failing tests，覆蓋 Requirement `Windows one-command install-and-launch SHALL be available from terminal` 與 `One-click flow SHALL stop on first failing step` 的 step 順序、dry-run 輸出與失敗即停止行為；驗證：`pnpm exec vitest run scripts/__tests__/windows-one-click.test.mjs --reporter=dot`。
- [x] 1.2 對應決策 1 與決策 3：實作 `windows:one-click` 腳本與 npm script，覆蓋 Requirement `Non-Windows execution SHALL fail fast with explicit message`，並讓 Windows 端以單一命令完成 install/build/launch；驗證：`pnpm exec vitest run scripts/__tests__/windows-one-click.test.mjs --reporter=dot` 與 `npm run windows:one-click -- --dry-run`。

## 2. 文件與收斂

- [x] 2.1 更新 README 的 Windows 一鍵入口與預期行為（首次執行會安裝並啟動）；驗證：內容 review + `spectra validate windows-one-command-install-and-launch` 通過。
