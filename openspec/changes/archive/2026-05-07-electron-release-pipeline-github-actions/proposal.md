# Electron Release Pipeline → GitHub Actions + GitHub Releases

> 狀態：已完成（v0.1.2 release 成功）
> 歸檔日期：2026-05-07
> 類型：基礎設施（CI/CD）

## 動機

需要把 three-ai 桌面版安裝檔交付給客戶（Mac + Windows）。先前只能在本機 Mac 手動 build arm64 dmg；缺：

1. Windows 安裝檔（本機沒有 Windows runner）
2. Intel Mac 安裝檔
3. 自動化打包與分發流程
4. App 自動更新通道

## 範圍

| 變動 | 檔案 |
|---|---|
| 切換 publish 目標：`generic` → `github` | `electron-builder.json`、`package.json` |
| Updater feed URL 同步切換 | `electron/updater.ts` |
| Release workflow 改用 GitHub Releases，移除 R2 | `.github/workflows/release.yml` |
| Mac dmg artifactName 區分 arch | `electron-builder.json` |
| 修 generate-license CLI 對齊 license server API | `scripts/generate-license.ts` |

不變：license server 邏輯、license activation flow、Electron app 內部行為。

## 結果

GitHub Releases v0.1.2 含：
- `three-ai-0.1.2-arm64.dmg`（M 系列 Mac, 378 MB）
- `three-ai-0.1.2-x64.dmg`（Intel Mac, 383 MB）
- `three-ai-setup-0.1.2.exe`（Windows, 348 MB）
- `latest-mac.yml` / `latest.yml`（electron-updater 中繼）

新工作流程：
```
git commit → bump package.json version → git tag vX.Y.Z → git push origin vX.Y.Z
→ GitHub Actions 8-12 分鐘 → Release 自動冒出 → 客戶 App 自動偵測新版
```

## 踩坑與修法（v0.1.1 經 4 次失敗才到 v0.1.2 成功）

| # | 失敗階段 | 根因 | 修法 | Lesson |
|---|---|---|---|---|
| 1 | `npm ci` | `next-auth@4.24.11` peer 限定 next ^12-15，本機用 next@16 | 加 `--legacy-peer-deps` | — |
| 2 | `npm run build` | `--ignore-scripts` 殺掉 better-sqlite3 prebuild 安裝 | 移除 `--ignore-scripts`，改用 `PUPPETEER_SKIP_*` env 精準擋 chromium | L062 |
| 3 | electron-builder packaging | pdfjs-dist 在 `.next/standalone/.next/node_modules/` 是 symlink，stat ENOENT | 在 packaging 前跑 `scripts/materialize-standalone-symlinks.js` | L063 |
| 4 | GitHub Releases upload | mac arm64 + x64 兩個 dmg 同名導致後 build 覆蓋前 build | `mac.artifactName: "${name}-${version}-${arch}.${ext}"` | L064 |

## 待辦（不在本次範圍）

- next-auth v5 升級（消除 `--legacy-peer-deps` 警告，可選）
- App icon（目前用 Electron 預設 icon，build log 警告 `default Electron icon is used`）
- Code signing（Apple Developer ID + Windows EV cert，現用 ad-hoc 簽名，使用者第一次開要手動「仍要開啟」）

## 相關 commits

```
fix(license-script): align generate-license CLI with current API schema
feat(release): switch packaging pipeline to GitHub Releases + electron-updater
fix(ci): use --legacy-peer-deps to bypass next-auth peer conflict
fix(ci): allow native module compile (better-sqlite3) while skipping puppeteer
fix(ci): materialize standalone symlinks before packaging
fix(release): differentiate Mac arm64/x64 dmg filenames + bump 0.1.2
```
