# Sonnet 執行指令 — AI 不動產說明書系統 全功能實作

> 貼到另一個 Claude Code session（Sonnet 模型），它會自主執行 4 個 Spectra changes。

---

## 你的角色

你是實作工程師。你的任務是依序執行 4 個 Spectra changes 的所有 tasks，每個 Wave 完成後自動繼續下一個。遇到 bug 自己修，不需要問我。

## 專案位置

```
/Users/fishtv/Development/2-顧問/real-estate-AI/AIRE
```

## 技術棧

- Next.js 16 + React 19 + TypeScript
- SQLite (better-sqlite3) — 本機資料庫
- Tailwind CSS 4
- Puppeteer（PDF 生成）
- Vitest（單元測試）+ Playwright（E2E）

## 執行順序（有依賴關係）

```
1. user-management        ← 其他 change 依賴此帳號系統
2. listing-ux-enhancement ← 資料夾/封存/搜尋
3. supplementary-independence ← 補件 icon
4. electron-desktop-app   ← 最後打包
```

## 每個 Change 的執行 SOP

對每個 change 依序執行：

```bash
# 1. Unpark
spectra unpark <change-name>

# 2. 讀取 tasks
cat openspec/changes/<change-name>/tasks.md

# 3. 讀取 design（理解架構決策）
cat openspec/changes/<change-name>/design.md

# 4. 依 Wave 順序執行 tasks（同 group 可並行，不同 group 串行）

# 5. 每個 Wave 完成後：
npm run build        # 必須 0 error
npm run test         # 必須全過
git add -A && git commit -m "feat(<domain>): <描述>"

# 6. 全部 task 完成後：
spectra archive <change-name>
```

## 強制規則

1. **先讀 design.md 再動手** — design.md 有所有架構決策（表結構、API 路由、邏輯流程），不要自己猜
2. **每個 task 對應一個 commit** — 不要把多個 task 壓成一個 commit
3. **build + test 通過才 commit** — 紅燈不准 commit
4. **不改 openspec/ 目錄** — 你只改 src/、package.json、設定檔
5. **遇到衝突或 breaking change → 自己修** — 不要停下來問
6. **E2E 測試放在每個 change 的最後一個 task** — 確保整合正確
7. **繁體中文 commit message** — 格式：`feat(user-mgmt): 實作登入 API`

## Change 1: user-management

**目的**：加入帳號系統 — admin（老闆）+ agent（業務員），物件綁定建立者，案件轉移，audit log。

**DB Schema 重點（D1-D4）**：
- `users` 表：id, email, password_hash, display_name, role('admin'|'agent'), is_active, created_at, updated_at
- `sessions` 表：id(TEXT), user_id, expires_at
- `audit_logs` 表：id, user_id, action, target_type, target_id, detail, created_at
- `listings` 表新增 `owner_id INTEGER REFERENCES users(id)`

**認證機制（D5）**：
- POST /api/auth/login → 驗 email+password → 建 session → httpOnly cookie
- Next.js middleware 檢查 cookie → 無效 redirect /login
- 公用電腦場景：登出 → 換人登入

**權限邏輯（D2）**：
- agent → `WHERE owner_id = ?`
- admin → 不過濾（看全部）
- 建立物件自動帶入 owner_id

**密碼用 bcrypt（npm install bcryptjs）**

## Change 2: listing-ux-enhancement

**目的**：自定資料夾（樹狀結構）、物件封存、FTS5 全文搜尋。

**重點**：
- folders 表（parent_id 自引用）
- listings.folder_id + listings.is_archived
- SQLite FTS5 虛擬表（address + notes 全文搜尋）
- 封存 = soft delete（is_archived=1），不真刪
- 樹狀 UI 用遞迴元件

## Change 3: supplementary-independence

**目的**：補件從建立流程獨立出來，在列表上用三態 icon 顯示。

**重點**：
- 列表每筆物件右側加 icon：⚪ not-started / 🟡 missing / 🟢 complete
- 點 icon 進入獨立的 /listings/[id]/supplementary 頁面
- 判斷邏輯：全部欄位空 = not-started，部分填 = missing，全填 = complete

## Change 4: electron-desktop-app

**目的**：打包成 Electron 桌面應用 + License 驗證 + 自動更新 + Feature Toggle。

**重點**：
- electron-builder（Win NSIS + Mac DMG）
- License Server（Vercel Edge Function）：email + IP CIDR 綁定
- 啟動時驗證 license → 失敗鎖定
- auto-updater：GitHub Actions build → 上傳 R2 → app 檢查更新
- Feature toggle：server 下發開關，鎖住的功能 UI 不顯示
- Codex CLI 打包進 app，客戶用自己的 ChatGPT Plus API key
- 開發者設定面板（dev mode only）

**package 新增**：electron, electron-builder, electron-updater, @anthropic-ai/sdk (或 openai)

## 完成標準

每個 change 完成後：
1. `npm run build` — 0 errors
2. `npm run test` — all pass
3. E2E 測試覆蓋核心流程
4. git log 乾淨（每 task 一 commit）
5. `spectra archive <change-name>` 成功

全部 4 個 change 完成後：
- `spectra list` 應顯示 0 active changes
- `spectra list --parked` 不應包含這 4 個（已 archive）
- 整個 app 可以 `npm run dev` 正常啟動

## 開始

```bash
cd /Users/fishtv/Development/2-顧問/real-estate-AI/AIRE
spectra unpark user-management
cat openspec/changes/user-management/design.md
cat openspec/changes/user-management/tasks.md
```

然後依 tasks.md 的順序開始實作。Go.
