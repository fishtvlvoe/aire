## Context

AIRE Phase 1 既有 PDF 渲染走 `pdf-lib` + 19 頁固定 PNG 底圖 + 文字座標壓字方向。實作過程踩兩輪：(1) 座標逐欄校準失敗、(2) 5-19 頁動態頁數無法套固定 19 頁底圖。同時客戶完全無法替換 logo / 公司資訊，每張說明書都是同一套寫死的範本。

不動產說明書內容組成（已由 Haiku 摘要 31 個資產確認）：

- 固定頁（4 頁）：封面摘要 / 基本資訊 / 物件位置圖
- 動態頁（13-15 頁）：現況照片 3-5 + 房屋現況調查表 5 + 生活機能 + 土地版本對應
- 半動態區塊：「2-1-不一定要」型（土地才填、房屋才填、有資料才顯示）

商業面 Phase 4 規劃 LVR 雲端代理 + 月租 NT$499 訂閱加值。本 SDD 的主題系統可插拔架構為 Phase 2「補充包」（OpenDesign 擴展更多視覺風格、加量不加價）預留接點。

利害關係人：客戶老闆（選主題、設 logo）、客戶助理（每天產 PDF）、Fish（決定主題出貨數量、補充包架構）、未來補充包設計師（依 docs/pdf-theme-pack-spec.md 加新主題不需動主程式）。

## Goals / Non-Goals

**Goals:**

- A 淡雅 + C 科技優雅雙主題在 MVP 出貨日同時可選
- Logo 上傳到固定錨點 80×30mm 封面 / 25×15mm 頁眉，等比縮放、留白不裁切
- 案件實際資料 5-19 頁動態組裝，半動態區塊條件渲染正確
- PDF 即時預覽（不存檔）+ 下載
- 主題系統可插拔：未來補充包以 npm package 或 plugin 形式註冊新主題，不修改主程式

**Non-Goals:**

- App 內顏色 / 字級 / 漸層自由編輯（Phase 2 評估）
- 客戶上傳完整底圖讓系統還原（已否決）
- 補充包訂閱付費機制（Phase 2 OPCOS 訂閱整合範圍）
- LVR / 周遭行情頁（Phase 4 範圍）
- 從 PNG 底圖漸進遷移 / 雙軌（直接整套換、不雙軌）
- 主題即時切換動畫（單純切換 + 重新渲染即可）
- PDF 加密 / 密碼保護
- 其他 logo 格式（SVG / EPS / WebP 不支援，限 PNG / JPG）

## Decisions

### Decision 1: PDF 引擎採 @react-pdf/renderer（非 Puppeteer / pdf-lib / jsPDF）

採 `@react-pdf/renderer` ^4.x。React 元件描述 PDF 結構，向量輸出，內建字型註冊與多頁分頁支援。

替代方案：

- Puppeteer / Playwright print-to-PDF：要打包 Chromium（Tauri shell 額外 +100MB），桌面 App 安裝檔太肥
- 既有 pdf-lib + PNG 底圖 + 文字壓字：座標校準失敗已踩兩輪、5-19 頁動態無法套固定底圖
- jsPDF + html2canvas：中文 + 漸層背景品質差、踩坑機率高
- @react-pdf/renderer：純 JS、無 Chromium 依賴、CSS 子集（足夠不動產說明書場景）、學習曲線低、社群活躍

理由：Tauri 桌面 App 已有體積壓力（避免 +100MB Chromium），@react-pdf 的 React 開發體驗 + 動態頁數場景最契合。

### Decision 2: 主題系統採「Theme Provider + 註冊表」可插拔架構（非寫死 if/else）

每個主題是一個獨立 React 元件包，提供 `Cover`、`Header`、`Footer`、`Section`、`Table` 共 5 個元件 + 一份 `tokens` 物件（色彩 / 邊距 / 字級）。主程式透過 `getTheme(id)` 拿主題物件、`<ThemeProvider theme={...}>` 包住 PDF Document。

替代方案：

- 寫死 if/else：每加一個主題要動主程式條件分支、Phase 2 補充包要 fork
- CSS variables 切換：@react-pdf 不支援 CSS variables（純 inline style 系統）
- HOC 包裝：實作複雜、type 較難維護
- Theme Provider + 註冊表：Phase 2 新主題只要 `registerTheme({ id, ...components })` 就能加入、主程式 0 改

理由：補充包模式要求「新主題不動主程式」，註冊表 + Provider 是 React 生態最標準作法（同 Material-UI / Chakra）。

### Decision 3: 雙主題出貨採 A 淡雅 + C 科技優雅（不出 B 商務）

MVP 出 A + C 兩套，理由：

- A 淡雅：受眾廣、列印油墨成本低、長輩 / 銀行客戶可用
- C 科技優雅：延續 AIRE 既有設計 DNA、品牌識別最強、年輕仲介喜歡
- B 商務：受眾窄（重複 A 的權威感）、開發 ROI 低，列為 Phase 2 補充包候選

替代方案：

- 只出 1 套：客戶無選擇感、無法驗證主題系統可插拔架構
- 3 套全出：B 開發成本不划算、MVP 範圍膨脹
- A + B：少 C 等於放棄 AIRE 品牌延續

理由：A + C 對比最大（極簡 vs 品牌延續），讓客戶有意義選擇 + 驗證主題系統正確切換。

### Decision 4: Logo 兩個固定錨點（封面 80×30mm + 頁眉 25×15mm）

封面 logo 框 80×30mm（A4 寬約 210mm，logo 區佔比合理）；頁眉 logo 25×15mm（每頁右上小 logo）。

替代方案：

- 單一尺寸：封面太小不顯眼、頁眉太大干擾內容
- 客戶自選位置：複雜度高、版面破壞風險、MVP 不做
- 不放頁眉 logo：每頁缺品牌識別、客戶反彈機率高

理由：固定錨點 = 100% 可控版面，等比縮放 + 留白機制保證上傳任意尺寸都不變形。

### Decision 5: Logo 客戶端 size 驗證 + reject（非自動壓縮）

Client-side `<input type="file">` change 事件即測 `file.size`，> 2 MiB 立刻顯示錯誤「請壓縮後再上傳」並不呼叫 IPC。後端再驗一次 `image::load_from_memory` 確認是合法 PNG/JPG。

替代方案：

- 自動壓縮：圖像處理 lib 增加打包體積、品質下降客戶看了不爽、隱形變更不透明
- 純後端驗：上傳完才說太大、浪費 IPC 與時間
- 不限 size：1080×1080 高 DPI 客戶 logo 可能 5-10 MB，SQLite BLOB 膨脹

理由：兩階段（client + server）防呆，一致拒絕策略最透明。

### Decision 6: Logo 儲存採 SQLite BLOB（非檔案系統 + 路徑）

Logo 存 SQLite `branding` 表的 BLOB 欄位（連同主題選擇）。

替代方案：

- 檔案系統 + 路徑：跨機 .aire 匯出時要打包檔案、容易遺失
- IndexedDB：桌面 App 場景無理由、不便 backend 存取
- SQLite BLOB：跟 .aire 匯出機制天然相容（#1c data-portability 直接帶走）、單檔備份完整

理由：對齊 #1c 資料可攜性 SDD（.aire 匯出含全部設定），BLOB 最簡單。檔案大小限 2 MiB 不會撐爆 SQLite。

### Decision 7: 動態頁數採「依資料條件渲染 + 自動分頁」（非固定模板插值）

每個區塊元件根據傳入資料決定是否渲染：

- `<ConditionalSection condition={landData.optional1 != null}>` 包住「不一定要」區塊
- `<ConditionSurvey rows={surveyRows}>` 內部按行高自動 wrap 到下一頁（@react-pdf 內建）
- `<PhotoGallery photos={photos}>` 每頁 4 張、自動分頁

替代方案：

- 固定模板每頁插值：5-19 頁根本沒固定模板
- 客戶決定要哪幾頁：UX 太複雜、MVP 不做
- @react-pdf View + auto-pagination：原生支援，最直接

理由：@react-pdf 原生 `wrap` prop + `break` 控制天然支援，不需要自己算頁高。

### Decision 8: PDF 預覽採記憶體渲染 + React PDF Viewer（非預存檔再開）

點「預覽」→ 在記憶體用 `pdf` 函式渲染成 Blob → 直接喂給 `<Document>` viewer 顯示，不存暫檔。下載時才寫到使用者指定路徑。

替代方案：

- 先存暫檔再開：暫檔殘留風險、要清理機制
- 開系統 PDF reader：跳出 App、體驗破碎
- React PDF Viewer：留在 App 內、可邊改邊預覽、UX 連貫

理由：記憶體渲染速度夠快（5-19 頁約 1-3 秒），無暫檔殘留問題。

### Decision 9: AI 標誌右上保留為 AIRE 產品識別

所有主題 PDF 每頁右上角放 AI 圓形 BADGE（不是客戶 logo），表明「此文件由 AIRE 產生」。BADGE 樣式由主題決定（A 藍圓、C 綠圓 / 漸層）。

替代方案：

- 拿掉 AI 標誌：失去產品識別、客戶看不出是 AIRE 生成
- 客戶可關 AI 標誌：本 SDD 不開放（產品識別 + 法規可追溯）
- AI 標誌寫死統一樣式：跟主題視覺脫節

理由：產品識別是 AIRE 跟其他工具差異化的重要符號，且未來 LVR / OPCOS 整合會用到 AI 標誌作為品牌錨點。

### Decision 10: UI 設計系統 — 與 OPCOS 共用視覺 token

依 OPCOS 系產品規範（lessons.md L070），本 SDD 新增的設定 UI（LogoUploader、ThemeSelector、PdfPreviewer）共用 OPCOS design tokens、icon 統一 lucide-react、字型 Noto Sans TC + Inter。

替代方案：

- 各元件獨立樣式：未來 App B/C 視覺不一致
- 跟隨 @react-pdf 預設樣式：跟 OPCOS 既有風格脫鉤

理由：本 SDD 的設定頁（branding settings）是 OPCOS 全系 App 的共用 pattern，必須對齊統一視覺。注意 PDF 內容的視覺由「PDF 主題」決定（A / C），不受 OPCOS UI tokens 影響 — 兩者是不同層次。

### Decision 11: UX 互動模式 — 與 OPCOS 共用行為規則

依 OPCOS 系產品規範（lessons.md L070），本 SDD 的關鍵互動點遵守 OPCOS UX patterns：

- Logo 上傳 > 2 MiB 採 OPCOS 統一錯誤訊息文案（「Logo 檔案過大，請壓縮後再上傳（限 2 MiB 以下）」）
- 主題切換採 OPCOS 卡片選擇 pattern（hover / selected / disabled 三態）
- PDF 預覽 loading 採 OPCOS 三態 UI（loading / empty / error）標準
- 下載成功 Toast 採 OPCOS 通知一致行為

替代方案：

- 各 UI 元件自由設計：與未來 App 行為不一致
- 完全跟隨平台預設 dialog：缺乏可控的 UX 細節

理由：OPCOS 系所有 App 客戶可能是同一群人，互動模式統一可降低學習成本。

## Implementation Contract

**Behavior:**

- 客戶在「設定 → 品牌」首次進入頁，看到 LogoUploader（中央虛線框 + 「點擊或拖曳上傳 PNG/JPG」）+ ThemeSelector（A / C 兩張卡片橫排）
- 客戶上傳 logo 後即時預覽縮圖、可換、可刪
- 客戶選主題後即時看到 PDF 縮圖預覽（首頁 thumbnail）
- 案件詳情頁「產生 PDF」→ 跳到 `/cases/[id]/preview` → React PDF Viewer 顯示完整 PDF（5-19 頁、依案件實際資料動態組裝、套用客戶選的主題與 logo）→ 下載按鈕寫到使用者指定路徑
- 切換主題不需重新上傳 logo（logo 與主題是兩個獨立設定）
- 補充包未來只要在 src/lib/pdf-themes/ 新增資料夾 + 在 registry.ts 註冊就能出現在 ThemeSelector，不動其他檔

**Interface / data shape:**

- `branding` SQLite table:
  ```sql
  CREATE TABLE branding (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    logo_blob BLOB,
    logo_mime TEXT CHECK (logo_mime IN ('image/png', 'image/jpeg')),
    logo_uploaded_at TEXT,
    theme_id TEXT NOT NULL DEFAULT 'theme-a-minimal',
    updated_at TEXT NOT NULL
  );
  ```
- Tauri IPC commands:
  - `save_logo(bytes: Vec<u8>, mime: String) -> Result<(), BrandingError>`
  - `load_logo() -> Result<Option<LogoData>, BrandingError>`（LogoData = { bytes, mime }）
  - `delete_logo() -> Result<(), BrandingError>`
  - `set_theme(theme_id: String) -> Result<(), BrandingError>`
  - `get_theme() -> Result<String, BrandingError>`
- Theme 介面：
  ```typescript
  interface PdfTheme {
    id: string;
    displayName: string;
    description: string;
    Cover: React.ComponentType<CoverProps>;
    Header: React.ComponentType<HeaderProps>;
    Footer: React.ComponentType<FooterProps>;
    Section: React.ComponentType<SectionProps>;
    Table: React.ComponentType<TableProps>;
    tokens: { colors: Record<string, string>; spacing: Record<string, number>; fontSize: Record<string, number> };
  }
  ```
- 主題註冊：`registerTheme(theme: PdfTheme): void` / `getTheme(id: string): PdfTheme | undefined` / `listThemes(): PdfTheme[]`

**Failure modes:**

- Logo > 2 MiB → client-side reject `LogoUploadError::FileTooLarge`，UI 顯示「Logo 檔案過大，請壓縮後再上傳（限 2 MiB 以下）」
- Logo 非 PNG/JPG → `LogoUploadError::UnsupportedFormat`，UI 顯示「僅支援 PNG / JPG 格式」
- Logo 後端 `image::load_from_memory` 解析失敗 → `LogoUploadError::CorruptedImage`，UI 顯示「Logo 圖檔損毀，無法讀取」
- 主題 id 不在 registry → `ThemeError::NotFound`，UI fallback 到 `theme-a-minimal` 並顯示警示「主題已不存在，已切換至預設主題」
- @react-pdf 渲染失敗 → `PdfRenderError::EngineFailure`，UI 顯示「PDF 產生失敗，請聯繫客服」+ console 錯誤訊息

**Acceptance criteria:**

- `npm test -- src/lib/pdf-engine src/lib/pdf-themes` 全綠（含主題註冊 / 主題切換 / 動態頁數測試）
- `cargo test --package aire_core branding` 全綠（含 SQLite BLOB 寫讀 / size limit）
- E2E `e2e/pdf-render.spec.ts` 通過：上傳 logo → 選 A 主題 → 預覽 → 下載 → 重開 logo 與主題仍套用
- E2E：填房屋案件僅 3 張照片無生活機能 → PDF 頁數 < 10、半動態區塊正確隱藏
- E2E：填土地案件全資料 → PDF 頁數 15-19、土地版調查表使用
- 視覺驗收：A / C 兩主題對比 mockups/pdf-themes/ 截圖（容差 < 5% pixel diff）
- 主題切換：set_theme('theme-c-tech-elegant') 後立即重新預覽 → 視覺切到 C，logo 仍在
- 補充包驗證：手動加一個 stub `theme-test` 到 registry → ThemeSelector 立刻多一張卡片，0 改主程式

**Scope boundaries:**

- **In scope**: 換引擎到 @react-pdf/renderer；A + C 雙主題；Logo 上傳 + 兩個錨點；動態頁數；半動態區塊；PDF 即時預覽 + 下載；主題系統可插拔架構；branding SQLite 持久層；舊 pdf-lib 路徑廢除
- **Out of scope**: Phase 2 補充包訂閱機制；App 內顏色 / 字級編輯器；LVR 整合；PDF 加密；客戶上傳完整底圖；漸進遷移；雙軌引擎；其他 logo 格式

## Risks / Trade-offs

- **@react-pdf/renderer 中文字型載入失敗導致 tofu** → Mitigation: 主題包必須引用既有 NotoSansTC subset（src/resources/fonts/NotoSansTC-Subset.ttf 已就緒），測試覆蓋字型註冊路徑、避免 fallback 到 PDF 預設無中文字型
- **5-19 頁動態渲染速度慢** → Mitigation: 預期 1-3 秒可接受，若實測 > 5 秒考慮 worker thread 渲染
- **Logo 2 MiB 限制客戶反彈（覺得太小）** → Mitigation: 設定頁顯示「建議上傳 200×100 px 以上、2 MiB 以下」教育文案，紙本印刷 200 dpi 等同 5×2.5 cm 已夠用
- **既有 disclosure-document-generation / disclosure-form-* 元件耦合 pdf-lib API** → Mitigation: src/lib/pdf-renderer.ts 改 thin wrapper 轉派新引擎，既有呼叫端 0 改
- **Phase 2 補充包格式與 Theme 介面不向後相容** → Mitigation: 介面採 readonly + version 欄位（TBD：實作時加 `version: '1'`），未來新增屬性走 optional + default
- **AI 標誌客戶覺得多餘 / 不專業** → Mitigation: 主題包可以調整 BADGE 樣式（位置 / 顏色 / 大小）但不能拿掉，產品識別不可選
- **舊 PDF assets（residential.pdf / land.pdf 共 5.5 MB）刪除後若客戶資料還引用** → Mitigation: 刪檔同時搜全 codebase 確認無引用，git 歷史保留可追溯

## Migration Plan

**部署：**

1. 安裝新版本 binary
2. 啟動時跑 migration `002_branding.sql` 建表
3. 自動寫入預設 row（id=1, theme_id='theme-a-minimal', logo_blob=NULL）
4. 進入「設定 → 品牌」上傳 logo + 選主題（可選，跳過則用預設）

**現有資料移轉：**

- 既有案件 SQLite 資料完全不動（PDF 渲染是輸出側、不影響資料）
- 舊 PDF assets `src/resources/templates/{residential,land}.pdf` 在 commit 中刪除
- 客戶若已存的 PDF 檔案（外部硬碟）保留可開啟（PDF 1.4 格式不變）

**Rollback：**

- 升級失敗 → revert binary，branding 表保留不影響舊版（舊版會無視該表）
- 不支援降級回 pdf-lib + PNG 底圖（已廢方向）

## Open Questions

- React PDF Viewer 套件選型（react-pdf / pdfjs-dist / @react-pdf-viewer/core）：實作時評估，本 SDD 暫不鎖
- 是否要做主題卡片的真實 PDF thumbnail 或用 PNG 預覽圖：實作時評估（thumbnail 動態渲染要 1-2 秒、PNG 預覽要先做設計圖）
- 補充包 Phase 2 是否走 npm workspace 還是動態 import：留 Phase 2 設計時決定
