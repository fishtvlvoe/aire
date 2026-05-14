## Summary

將 AIRE 及未來所有 SaaS 產品遷移至 Supastarter 統一底盤，統一 Auth、DB、計費、多租戶架構，搭配 GitHub + Zeabur + Cloudflare 三平台部署。

## Motivation

目前每個產品各自搞一套底層（AIRE 用 SQLite + NextAuth + 自建 License、MOLTOS 用 Supabase + 另一套 Auth），造成：

- **重複造輪子**：每個新產品都從零搭 Auth、DB、計費
- **維護成本高**：N 個產品 × M 套技術棧 = 無法統一升級
- **無法共用**：用戶系統、計費邏輯、多租戶管理各做各的
- **Electron 打包不穩**：AIRE 用 Next.js standalone + spawn server 架構，打包時 symlink、node_modules、架構衝突問題反覆出現

統一底盤後，新產品只需疊業務邏輯，底層全部共用。

## Proposed Solution

### 三平台架構

| 平台 | 職責 |
|------|------|
| **GitHub** | 代碼管理 + CI/CD（GitHub Actions）+ App 發佈（Releases） |
| **Zeabur** | 統一後端服務（Supastarter Web App + API + DB） |
| **Cloudflare** | R2 檔案儲存 + CDN 靜態資源加速 |

### 統一底盤組成（Supastarter 提供）

| 模組 | 現行做法 | 遷移後 |
|------|---------|--------|
| Auth | NextAuth（AIRE）/ 各產品自建 | Better-Auth（Supastarter 內建） |
| DB / ORM | better-sqlite3 原始 SQL | Drizzle ORM（PostgreSQL + SQLite adapter） |
| 多租戶 | 無 | Better-Auth Organization plugin + RBAC |
| 計費 | 無 | Stripe / Lemon Squeezy（Supastarter 內建） |
| Email | toSend API（AIRE 自建） | Supastarter Email template 系統 |
| License 管理 | 自建 License Server（Vercel） | 遷移至 Zeabur 上的統一後端，整合計費模組 |
| i18n | 無 | next-intl（Supastarter 內建） |

### AIRE 桌面版架構調整

**現行**：Electron spawn Next.js standalone server → BrowserWindow 連 localhost

**遷移後**：
- Electron 改為 `loadFile`（靜態 HTML）或連線 Zeabur 上的統一後端
- 本機只保留離線必要功能：PDF 產出（Puppeteer）、OCR（pdfjs-dist）
- Auth、License、用戶管理、檔案儲存全部走 Zeabur API
- auto-update 機制不變（GitHub Releases + electron-updater）

### 遷移順序

1. **Phase 0 — 底盤建置**：在 Zeabur 上架好 Supastarter，設定 DB、Auth、域名
2. **Phase 1 — License Server 遷移**：從 Vercel 搬到 Zeabur，整合 Supastarter 計費
3. **Phase 2 — AIRE Web 版遷移**：Auth、DB 層切換至 Supastarter
4. **Phase 3 — AIRE 桌面版重構**：Electron 改為連線統一後端，解決白畫面問題
5. **Phase 4 — 其他產品遷移**：MOLTOS 等產品逐個搬上統一底盤

## Non-Goals

- **不改 AIRE 的業務邏輯**：不動產文件生成、OCR、PDF 產出等核心功能不在本次範圍
- **不做 Supastarter 本身的客製化開發**：只用它的現有模組，不改它的源碼
- **不做資料遷移**：現有客戶資料遷移是另一個 change
- **不做 UI 改版**：前端 UI 保持現有設計，只換底層
- **不含 Codex/Claude/Gemini CLI 整合變更**：LLM adapter 層不在本次範圍

## Alternatives Considered

### 方案 A：只修 Electron 打包問題，不換底盤

**否決原因**：治標不治本。standalone server 架構的打包問題會反覆出現（symlink、node_modules、架構衝突），每次升級 Next.js 或 Electron 都可能踩新坑。且無法解決多產品技術棧分散的根本問題。

### 方案 B：自建統一底盤（不用 Supastarter）

**否決原因**：自建 Auth + 多租戶 + 計費需要 2-3 個月，Supastarter 一次性付費 ~$399 即可獲得經過驗證的實作。時間成本遠大於購買成本。

### 方案 C：用 Supabase 作為統一底盤

**否決原因**：Supabase 是 BaaS 不是應用框架，仍需自建 Auth UI、多租戶邏輯、計費整合。Supastarter 已經把這些都整合好了。

## Impact

- Affected specs: `user-auth`、`admin-session-auth`、`license-server`、`license-management`、`electron-packaging`、`desktop-launcher`、`auto-updater`、`codex-setup-flow`、`first-admin-setup`、`password-reset`
- Affected code:
  - Modified: `src/lib/db/index.ts`（SQLite → Drizzle）、`src/lib/auth/db.ts`（NextAuth → Better-Auth）、`electron/main.ts`（loadURL → loadFile 或遠端連線）、`electron/launcher.ts`（移除 standalone server spawn）、`next.config.ts`（output mode 變更）、`electron-builder.json`（打包設定簡化）、`.github/workflows/release.yml`（build 流程調整）
  - New: Supastarter 底盤專案目錄（獨立 repo 或 monorepo packages）、Zeabur 部署設定
  - Removed: `license-server/`（搬到統一後端）、standalone server 相關邏輯
- Dependencies 新增: `drizzle-orm`、`better-auth`、Supastarter 框架依賴
- 環境變數新增: Zeabur 部署相關（`DATABASE_URL`、`BETTER_AUTH_SECRET`）、Stripe/Lemon Squeezy key
