## Why

系統目前有 Electron 外殼雛形（main.ts、launcher.ts、updater.ts、preload.ts）和 License Server 基礎架構（server/ 目錄含 Express API），但缺少關鍵的保護與交付機制：沒有路由攔截 middleware、沒有正式登入系統（next-auth）、自動更新未接上 electron-updater 套件、PDF 生成仍綁死 puppeteer 全裝無法 Serverless 部署、也沒有序號產生 CLI 工具。客戶是房仲業務員，需要雙擊 icon 就能用、隨身碟安裝一次後自動更新、連網驗證 License 防盜用。本 change 把兩個舊計畫（electron-desktop-app + fe-software-commercialization）合併，補齊所有缺口，產出可交付的桌面商業軟體。

## What Changes

### 補齊路由保護
- 新增 src/middleware.ts：雙層攔截（License 有效性 → 登入狀態），無效 License 導向 /setup，未登入導向 /login
- License 驗證結果快取 60 秒避免每次請求都打 Server

### 補齊登入系統
- 安裝 next-auth@4.x，建立 Auth.js Credentials Provider
- 改造現有 src/lib/auth.ts（目前是自製 session）為 next-auth 整合
- 新增 Refresh Token 白名單機制（SQLite refresh_tokens 表）
- 新增 src/app/api/auth/[...nextauth]/route.ts 和 src/app/api/auth/refresh/route.ts
- 改造現有 src/app/login/page.tsx 接上 next-auth signIn()

### 補齊自動更新
- 安裝 electron-updater 套件
- 改造現有 electron/updater.ts 接上 electron-updater API（目前是自製 HTTP 下載邏輯）
- 新增前端「檢查更新」按鈕與進度 UI

### 補齊 Serverless PDF
- 安裝 puppeteer-core + @sparticuz/chromium，移除 puppeteer
- 新增 src/lib/pdf-generator/chromium-launcher.ts：依 CHROMIUM_MODE env 切換本機/Serverless
- 修改現有 PDF 生成檔案改用 chromium-launcher

### 補齊序號產生工具
- 新增 scripts/generate-license.ts：CLI 產生 License 序號並寫入 Server DB
- 新增 scripts/create-admin.ts：CLI 建立管理員帳號

### 補齊資料庫 Migration
- 新增 migrations/004_auth_license.sql：建立 users、refresh_tokens 表
- 修改 src/lib/db/index.ts 啟動時自動執行 migration

### 驗證與打包
- 驗證 Electron build 能產出 .app（Mac）和 .exe（Win）
- E2E 測試覆蓋：首次安裝流程、登入流程、更新流程

## Non-Goals

- 不做多租戶 SaaS 架構（單一公司部署）
- 不做 RBAC 角色權限（所有登入用戶同權限）
- 不做離線 License 驗證（必須連網）
- 不做 OAuth 第三方登入（Credentials 方案即可）
- 不做 Linux 版本（只出 Win + Mac）
- 不代客戶付 AI 費用（客戶自付 OpenAI）
- 不做硬體指紋綁定（用 Email + IP 段）

## Capabilities

### New Capabilities

- `serverless-pdf`: 跨環境 Chromium 啟動器，依 CHROMIUM_MODE env 切換本機 puppeteer-core 與 Vercel Serverless @sparticuz/chromium

### Modified Capabilities

- `license-management`: 補 middleware 路由攔截層，License 驗證快取 60 秒
- `user-auth`: 從自製 session 改為 next-auth Credentials Provider + 雙 Token 機制（Access 15 分鐘 + Refresh 7 天）
- `auto-updater`: 從自製 HTTP 下載改為 electron-updater 套件整合
- `electron-packaging`: 驗證 build 流程能產出可安裝的 .app/.exe
- `license-server`: 補序號產生 CLI 工具
- `container-deployment`: Dockerfile 改用 CHROMIUM_MODE=local + puppeteer-core

## Impact

- Affected specs: license-management（修改）、user-auth（修改）、auto-updater（修改）、electron-packaging（修改）、license-server（修改）、container-deployment（修改）、serverless-pdf（新增）
- Affected code:
  - New: src/middleware.ts, src/app/api/auth/[...nextauth]/route.ts, src/app/api/auth/refresh/route.ts, src/lib/pdf-generator/chromium-launcher.ts, scripts/generate-license.ts, scripts/create-admin.ts, migrations/004_auth_license.sql, src/lib/auth/db.ts
  - Modified: src/lib/auth.ts, src/app/login/page.tsx, electron/updater.ts, src/lib/pdf-generator/dossier.ts, src/lib/pdf-generator/survey-sales.ts, Dockerfile, package.json, src/lib/db/index.ts
  - Removed: puppeteer dependency（替換為 puppeteer-core）
- Dependencies 新增: next-auth@4.x, electron-updater, puppeteer-core, @sparticuz/chromium, @types/bcryptjs
- Dependencies 移除: puppeteer
- 環境變數新增: NEXTAUTH_SECRET, NEXTAUTH_URL, CHROMIUM_MODE
