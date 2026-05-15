# AIRE - 不動產說明書自動化桌面應用

自動產生符合台灣法規的不動產說明書 PDF，專為不動產經紀人設計的桌面工具。

---

## 產品概要

AIRE（AI Real Estate）是一款專業的不動產說明書自動化應用，針對台灣不動產經紀人與仲介公司開發。透過圖形化介面和智慧化流程，將繁瑣的文件製作時間從數小時縮短至分鐘級，同時確保完整的法規合規性。

- **售價**: NT$30,000 買斷制（單一授權）
- **開發商**: 核流有限公司（Fishot Co., Ltd.）
- **應用識別碼**: com.fishot.aire
- **目前版本**: 0.1.0
- **授權**: Proprietary / 私有授權

---

## 系統需求

### 最低系統配置

- **macOS**: 12.0 或更新版本（Intel / Apple Silicon）
- **Windows**: 10 或更新版本（Build 1909+）
- **記憶體**: 4GB RAM
- **磁碟空間**: 500MB（安裝及本地資料庫）
- **網路**: 初次啟動需網路連線驗證授權；之後可離線操作

---

## 核心功能

### 1. 授權啟動（License Activation）
- 序號驗證與金鑰管理
- 離線授權模式支援
- 授權到期提醒

### 2. 案件管理（Case Management）
- 建立、編輯、查詢不動產案件
- 成屋 / 土地分類
- 草稿 / 完成 / 已匯出狀態追蹤

### 3. 法規文件產生（Disclosure Document Generation）
- 一鍵產生符合《不動產說明書應記載事項》的 PDF
- 自動帶入最新法條與政府定版文本
- 依法規版本自動更新（全國一致、直轄市別規定、自治法規）
- 支援兩種視覺主題：淡雅 / 專業

### 4. 品牌客製化（Branding）
- Logo 上傳與位置調整
- 公司名稱、電話、地址整合
- PDF 主題選擇（視覺風格統一）
- 預覽即時反映

### 5. 操作日誌（Operation Logs）
- 完整的操作紀錄追蹤（建檔、編輯、匯出時間）
- 使用者行為分析基礎
- 合規審計需求支援

### 6. 應用外殼（App Shell）
- 直觀的側邊欄導航（案件管理、品牌設定、日誌）
- 響應式設計（桌面固定側邊欄、行動裝置 Sheet 覆蓋）

---

## 技術架構

### 前端

| 層級 | 技術 | 用途 |
|------|------|------|
| **框架** | Next.js 16 + React 19 | UI 框架 / 路由 / SSR |
| **語言** | TypeScript | 型別安全 |
| **樣式** | Tailwind CSS + shadcn/ui | 設計系統 / 元件庫 |
| **PDF** | @react-pdf/renderer | 動態 PDF 渲染 |
| **字型** | Noto Sans TC / Inter / JetBrains Mono | 漢字 / 英文 / 等寬 |
| **圖標** | Lucide React | 統一圖標風格 |
| **測試** | Vitest | 前端單元測試 |

### 後端

| 層級 | 技術 | 用途 |
|------|------|------|
| **框架** | Tauri 2.x | 跨平台桌面應用 |
| **語言** | Rust | 系統效能 / 安全性 |
| **資料庫** | SQLite（本地） | 離線數據持久化 |
| **IPC** | Tauri Commands | 前後端通訊 |
| **測試** | Cargo test + E2E | Rust 單元測試 + 集成測試 |

### IPC 命令清冊

```
license:
  - get_license_status()
  - activate_license(serial_key: String)
  - deactivate_license()
  - check_license()

cases:
  - list_cases()
  - get_case(id: String)
  - create_case(data: CaseData)
  - update_case(id: String, data: CaseData)
  - delete_case(id: String)
  - mark_completed(id: String)

pdf:
  - export_pdf(pdfBytes: Bytes, outputPath: String)

drafts:
  - save_draft(case_id: String, content: JSON)
  - load_draft(case_id: String)

log:
  - list_recent_logs(limit: Int)

branding:
  - get_brand_settings()
  - save_brand_settings(data: BrandingData)
  - upload_logo(file: Bytes)
  - get_logo() -> Bytes
  - list_themes() -> [String]

legal:
  - get_clause(key: String)
  - list_clauses()
  - sync_clauses()
```

---

## 專案結構

```
AIRE/
├── src/                           # Next.js 前端程式碼
│   ├── app/
│   │   ├── (dashboard)/           # 受授權保護的儀表板頁面
│   │   │   ├── cases/             # 案件管理介面
│   │   │   ├── settings/          # 設定頁面（品牌、日誌、同步狀態）
│   │   │   └── layout.tsx
│   │   ├── activation/            # 授權啟動流程
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/                    # shadcn/ui 元件庫（16+ 個原子元件）
│   │   ├── AppSidebar.tsx         # 側邊欄導航
│   │   ├── AppTopbar.tsx          # 頂部欄
│   │   └── [其他共用元件]
│   ├── hooks/
│   │   ├── useLicenseStatus.ts    # 授權狀態管理
│   │   └── [其他 React hooks]
│   ├── lib/
│   │   ├── pdf-blocks/            # PDF 區塊元件庫
│   │   ├── pdf-engine/            # PDF 渲染引擎核心
│   │   ├── pdf-themes/            # 淡雅 / 專業主題定義
│   │   ├── cases-api.ts           # 案件 API 封裝層
│   │   └── [其他工具函式]
│   ├── styles/
│   │   └── globals.css            # 全局樣式
│   └── middleware.ts              # 授權驗證中介軟體
│
├── src-tauri/                      # Rust 後端程式碼
│   ├── src/
│   │   ├── commands/              # Tauri IPC 指令定義
│   │   │   ├── cases.rs
│   │   │   ├── license.rs
│   │   │   ├── pdf.rs
│   │   │   ├── drafts.rs
│   │   │   └── log.rs
│   │   ├── db/                    # SQLite 資料層
│   │   │   ├── cases.rs
│   │   │   ├── drafts.rs
│   │   │   └── mod.rs
│   │   ├── legal_clauses/         # 法條快取與同步邏輯
│   │   ├── branding/              # 品牌設定管理
│   │   └── lib.rs
│   ├── tests/
│   │   └── e2e_smoke.rs           # 端對端整合測試
│   ├── Cargo.toml
│   └── tauri.conf.json
│
├── openspec/                      # Spectra SDD 規格
│   ├── config.yaml
│   ├── specs/
│   └── changes/
│
├── public/                        # 靜態資源
│   └── [字型、圖檔、品牌資產]
│
├── package.json                   # 前端依賴管理
├── pnpm-lock.yaml
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── CLAUDE.md                      # Claude 開發指引
└── README.md                      # 本文檔
```

---

## 快速開始

### 環境準備

確保已安裝下列工具：
- Node.js 18+ 與 pnpm 9+
- Rust 1.70+ 與 Cargo
- Git

### 安裝依賴

```bash
pnpm install
```

### 啟動開發伺服器

**完整模式**（前端 + Tauri 桌面應用）：
```bash
pnpm tauri dev
```

**前端獨立模式**（用於 UI 開發）：
```bash
pnpm dev
```

瀏覽器將自動開啟 `http://localhost:3000`。

### 建構應用

```bash
pnpm build
```

輸出位置：
- macOS: `src-tauri/target/release/bundle/macos/`
- Windows: `src-tauri/target/release/bundle/msi/`

---

## 開發指令參考

### 前端

```bash
# 開發伺服器
pnpm dev

# 生產建構
pnpm build

# 啟動生產伺服器
pnpm start

# 執行前端測試
npx vitest run

# 監看模式測試
npx vitest

# 代碼檢查與格式化
pnpm lint
pnpm format
```

### 後端（Rust）

```bash
cd src-tauri

# 運行所有測試
cargo test

# 執行端對端整合測試
cargo test --test e2e_smoke

# 釋出模式建構
cargo build --release

# 檢查代碼品質
cargo clippy
cargo fmt --check
```

### Tauri 整合

```bash
# 開發模式（自動熱重新載入）
pnpm tauri dev

# 建構應用（包含代碼簽署）
pnpm tauri build

# 更新檢查
pnpm tauri info
```

---

## 開發工作流

本專案採用 **Spectra 規格驅動開發**（Spec-Driven Development, SDD）：

- **討論階段**: 需求澄清 → `/spectra-discuss`
- **規劃階段**: 功能設計 → `/spectra-propose`
- **實作階段**: 程式碼編寫 → `/spectra-apply` / `/spectra-ingest`
- **完成階段**: 合併與歸檔 → `/spectra-archive`

詳見 `CLAUDE.md` 與 `openspec/` 目錄。

---

## 代碼規範

- **前端**: TypeScript + React，遵循 ESLint 設定
- **後端**: Rust，遵循 rustfmt 與 clippy 檢查
- **註解**: 繁體中文（邏輯複雜或非顯而易見的地方）
- **提交**: Conventional Commits 格式
  - `feat: 新功能`
  - `fix: 修正缺陷`
  - `docs: 文件更新`
  - `refactor: 代碼重構`
  - `test: 測試相關`
  - `chore: 工具 / 依賴`

---

## 授權與合規

### 軟體授權

AIRE 為專有軟體（Proprietary Software），受著作權法保護。未經授權不得複製、修改、散布或商業使用。

### 法規合規

AIRE 遵循以下台灣法規生成文件：
- 《不動產說明書應記載事項》（內政部定版）
- 各直轄市 / 縣市自治條例
- 《動產擔保交易法》、《消費者保護法》等相關規定

使用者應自行確保產出文件符合當地法規要求。

---

## 支援與回報

- **問題回報**: GitHub Issues（內部開發用）
- **功能建議**: 聯繫核流有限公司
- **技術支援**: fish@fishot.com

---

## 開發人員指引

### 常見問題

**Q: Tauri 開發模式無法連結？**
A: 檢查 macOS 防火牆設定與 Rust toolchain 完整性，執行 `rustup update`。

**Q: PDF 匯出出現字型缺失？**
A: 確認 Noto Sans TC 字型已正確載入，檢查 `src/lib/pdf-themes/fonts.ts`。

**Q: SQLite 鎖定錯誤？**
A: 多進程同時存取，確認應用實例唯一性，重啟應用。

---

---

**版本**: 0.1.0 | **更新日期**: 2026-05-15 | **維護者**: 核流有限公司
