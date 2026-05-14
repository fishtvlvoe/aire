## Context

AIRE 目前是 Next.js standalone + Electron 的架構，每次打包都會遇到 symlink 破損、node_modules 漏包、native module 架構衝突等問題。同時，核流旗下多個 SaaS 產品各自使用不同的 Auth、DB、計費方案，無法共用基礎設施。

Fish 決定購入 Supastarter 作為所有產品的統一底盤，搭配 GitHub（CI/CD）+ Zeabur（後端）+ Cloudflare（儲存/CDN）三平台架構。本設計定義遷移的技術方案和執行順序。

## Goals / Non-Goals

**Goals:**

- 定義 Supastarter 統一底盤的技術架構
- 規劃 AIRE 從 standalone server 架構遷移到靜態 export + 遠端 API 的路徑
- 規劃 License Server 從 Vercel 遷移到 Zeabur 的路徑
- 確保 Electron auto-update 機制不受影響
- 建立可複用於其他產品的遷移 SOP

**Non-Goals:**

- 不改 AIRE 業務邏輯（文件生成、OCR、PDF）
- 不做資料遷移（現有客戶資料）
- 不改 LLM adapter 層
- 不做 UI 改版

## Decisions

### D1: 底盤部署平台選擇 Zeabur

**決策**：Supastarter 統一後端部署到 Zeabur，取代目前分散在 Vercel 的服務。

**Alternatives Considered**：
1. ~~繼續用 Vercel~~ — serverless 冷啟動問題影響 License 驗證速度；多個服務散落在不同 Vercel project 難管理
2. ~~用 Cloudflare Workers~~ — Workers 不支援 Node.js native module（better-sqlite3 等），且 Supastarter 沒有 Workers adapter

**Rationale**：Zeabur 支援持久容器 + 自動擴容，適合跑 Supastarter 的 Next.js 全棧應用。單一平台管理所有後端服務，運維成本最低。

### D2: AIRE 桌面版改為 Hybrid 架構

**決策**：Electron 改為「本機離線功能 + 遠端 API」混合架構。

- **本機保留**：PDF 產出（Puppeteer）、OCR（pdfjs-dist）、Codex CLI 呼叫
- **遠端連線**：Auth、License 驗證、用戶管理、檔案儲存（Cloudflare R2）、多租戶

**Alternatives Considered**：
1. ~~全部本機（現狀）~~ — standalone server 打包問題無解，每次升級都踩坑
2. ~~全部遠端（純 Web App）~~ — 客戶需要離線產出 PDF 和跑 OCR，純 Web 無法滿足

**Rationale**：Hybrid 架構讓 Electron 只負責「必須本機跑」的功能，大幅簡化打包。BrowserWindow 直接 loadFile 或連 Zeabur 後端，不再 spawn 本地 server。

### D3: Auth 遷移使用 Better-Auth

**決策**：所有產品統一使用 Supastarter 內建的 Better-Auth，取代 AIRE 的 NextAuth。

**Alternatives Considered**：
1. ~~保留 NextAuth~~ — 不支援多租戶，Organization plugin 需自建
2. ~~用 Clerk/Auth0~~ — 外部 SaaS 有月費，且 Supastarter 已整合 Better-Auth，額外引入等於白買

**Rationale**：Better-Auth 是 Supastarter 原生整合，內建 Passkey、2FA、Organization（多租戶）、RBAC。遷移成本最低。

### D4: DB 層遷移使用 Drizzle ORM

**決策**：所有產品統一使用 Drizzle ORM，取代 AIRE 的原始 SQL。

- Zeabur 後端用 PostgreSQL
- AIRE 桌面版本機資料（離線快取）仍用 SQLite，但透過 Drizzle SQLite adapter 統一介面

**Alternatives Considered**：
1. ~~保留原始 SQL~~ — 無型別安全，每個產品 SQL 寫法不同，無法共用 schema
2. ~~用 Prisma~~ — Prisma 的 schema-first 模式在 monorepo 多產品共用時較不靈活，且 Supastarter 用 Drizzle

**Rationale**：Drizzle 是 Supastarter 原生選擇，同時支援 PostgreSQL 和 SQLite，遷移後 AIRE 的離線功能仍可用 SQLite。

### D5: License 系統整合 Supastarter 計費模組

**決策**：現有的 License Server 邏輯遷移到 Zeabur 上的 Supastarter，License 管理整合 Stripe/Lemon Squeezy 計費模組。

**Alternatives Considered**：
1. ~~保留獨立 License Server~~ — 多一個服務要維護，計費邏輯跟 Supastarter 重複
2. ~~自建計費~~ — Supastarter 已有 Stripe 整合，自建等於白買

**Rationale**：把 License 視為「訂閱」的一種形式，用 Supastarter 的 Billing 模組管理。序號綁機邏輯保留，但驗證 API 搬到統一後端。

### D6: 遷移順序採漸進式，不一次全搬

**決策**：分 5 個 Phase 漸進遷移，每個 Phase 獨立可驗證。

| Phase | 內容 | 依賴 |
|-------|------|------|
| 0 | 底盤建置（Zeabur + Supastarter + DB + Auth） | 購買 Supastarter |
| 1 | License Server 遷移 | Phase 0 |
| 2 | AIRE Web 版 Auth/DB 切換 | Phase 1 |
| 3 | AIRE 桌面版 Electron 重構 | Phase 2 |
| 4 | 其他產品遷移（MOLTOS 等） | Phase 0 |

**Alternatives Considered**：
1. ~~一次全搬~~ — 風險太高，一個環節出問題全部卡住
2. ~~先搬其他產品再搬 AIRE~~ — AIRE 有客戶在等，優先處理

**Rationale**：Phase 0-3 是 AIRE 主線，Phase 4 可並行。每個 Phase 完成後都有可運行的系統。

## Implementation Contract

### 行為契約

- **Phase 0 完成後**：Zeabur 上跑著 Supastarter，可登入、可建組織、可管理用戶
- **Phase 1 完成後**：AIRE App 的 License 驗證改走 Zeabur 後端，舊 Vercel License Server 下線
- **Phase 2 完成後**：AIRE Web 版的 Auth 使用 Better-Auth，DB 使用 Drizzle + PostgreSQL
- **Phase 3 完成後**：AIRE Electron App 不再 spawn 本地 server，白畫面問題消失，可正常打包安裝
- **Phase 4 完成後**：所有產品共用統一底盤

### 驗證方式

- 每個 Phase 完成後跑對應的 E2E 測試
- Phase 3 驗收：Mac arm64 + x64 DMG 安裝後正常顯示 UI、Windows EXE 安裝後正常運作
- auto-update 驗證：舊版 App 能偵測到新版並自動更新

## Risks / Trade-offs

- [Risk] Supastarter 更新可能跟自訂代碼衝突 → Mitigation: 用 monorepo packages 隔離，Supastarter 核心放獨立 package，業務邏輯放另一個 package
- [Risk] Zeabur 如果服務中斷，AIRE 桌面版的線上功能會不可用 → Mitigation: 本機保留離線功能（PDF/OCR），離線模式下只是不能驗證 License 和存檔到雲端
- [Risk] Better-Auth 遷移期間現有用戶密碼需要 rehash → Mitigation: Phase 2 實作時加密碼遷移邏輯，首次登入自動轉換
- [Risk] 遷移期間兩套系統並存造成技術債 → Mitigation: 每個 Phase 結束後立即拆除舊系統，不允許長期並存

## Open Questions

- Supastarter 的 Turborepo monorepo 結構是否適合放 Electron 相關代碼？（Phase 0 建置時確認）
- Zeabur 的 PostgreSQL 方案和定價？（購買前確認）
- 現有客戶的 License 序號遷移策略？（Phase 1 開始前決定）
