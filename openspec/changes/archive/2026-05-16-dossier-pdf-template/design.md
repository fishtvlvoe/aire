## Context

`document.tsx` 是 stub（只有「封面頁 Page 1」三行佔位字串）。3 個主題的 components 是 HTML div/table，在 `@react-pdf/renderer` 環境中無法使用（React-PDF 只接受 View/Text/Image 等 PDF 原生元素）。`engine.ts` 完全繞過 document.tsx，自己用 inline `Document + Page + Text` 渲染純文字。

目標：把 Fish 在 `docs/dossier-chapter-structure.md` 和 `docs/dossier-implementation-spec.md` 定義的土地版 7 章節接上 engine，並讓主題 token 影響輸出樣式。

## Goals / Non-Goals

**Goals:**
- 土地版 7 章節可正確渲染為 A4 PDF
- 三個主題切換時，顏色 / 字型 / 邊框色不同，章節結構不變
- 缺值顯示「待補」不報錯
- preview/page.tsx 不需要額外輸入，從現有 CaseRow 組裝 CaseData

**Non-Goals:**
- 建物版（成屋）章節
- 稅費自動計算
- AI 摘要文字
- PDF 加密 / AcroForm
- 新增 font 資產（沿用現有 NotoSansTC-Subset.ttf）

## Decisions

### Decision 1：新增 `react-pdf-components.tsx` 而非替換既有 theme components

**決定**：`src/lib/pdf-engine/react-pdf-components.tsx` 放 React-PDF 版基底元件。現有 `theme-a/b/c` 的 HTML components 保留不動（有既有 spec 和測試依賴它）。

**Alternatives Considered**：
- 直接在 `theme-a/b/c/index.tsx` 改 HTML → React-PDF：會破壞現有 PdfThemeComponents 型別和測試（HTML props ≠ React-PDF props）
- 在 `document.tsx` 內 inline 所有元件：document.tsx 會超過 800 行，難維護

**介面**：
```typescript
// src/lib/pdf-engine/react-pdf-components.tsx
interface PdfTokens {
  primary: string;      // 主色（邊框/標題）
  text: string;         // 內文色
  textMuted: string;    // 次要文字色
  bg: string;           // 頁面底色
  bgAlt: string;        // 表頭交替底色
  border: string;       // 線條色
  fontFamily: string;   // 字型名稱（已在 engine 初始化時 register）
}

// 從 ThemeTokens 轉換
function toPdfTokens(t: ThemeTokens): PdfTokens

// 元件（React-PDF View/Text/Image）
PdfCover: FC<{ tokens: PdfTokens; caseNo: string; address: string; propertyType: string; companyName: string; generatedAt: string; logoBytes?: number[] }>
PdfPageHeader: FC<{ tokens: PdfTokens; caseNo: string; pageNum?: number; totalPages?: number }>
PdfPageFooter: FC<{ tokens: PdfTokens; generatedAt: string }>
PdfSectionTitle: FC<{ tokens: PdfTokens; title: string }>
PdfFieldTable: FC<{ tokens: PdfTokens; rows: Array<[string, string]> }>  // [欄位名, 值]
PdfLegalBlock: FC<{ tokens: PdfTokens; clauses: string[] }>
```

### Decision 2：CaseDossierData 從 CaseRow 提取，缺值填「待補」

**決定**：在 `preview/page.tsx` 組裝 `CaseDossierData` 傳給 engine，不改 SQLite schema。

```typescript
// src/lib/pdf-engine/document.tsx 匯出此型別
export interface CaseDossierData {
  caseNo: string;           // case_no ?? id.slice(0,8)
  address: string;          // address
  propertyType: 'land' | 'building';  // property_type
  landLotNo: string;        // land_lot_no
  ownerName: string;        // owner_name ?? '待補'
  companyName: string;      // 固定 '建安不動產'（Phase 1）
  generatedAt: string;      // new Date().toLocaleDateString('zh-TW')
  logoBytes?: number[];     // 從 safeInvoke('load_logo') 取得
}
```

**Alternatives Considered**：
- 在 Rust 端組裝並序列化整份資料：需改 IPC，影響範圍大
- 讀 land_registry 快取補充謄本資料：超出本 change 範圍，留 Phase 2

### Decision 3：document.tsx 用 property_type switch，土地版 7 章節各一個 Page

**決定**：
```typescript
// document.tsx
export function PdfDocument(props: { data: CaseDossierData; themeId: string; }): ReactElement
```

土地版頁面順序（7 章）：
1. `<LandCoverPage>` — 封面（物件編號、地址、日期、LOGO）
2. `<LegalNoticePage>` — 法規告知（固定條文 v3，無需資料）
3. `<LandTitlePage>` — 產權調查表－土地標示（地號、地目、面積、分區）
4. `<LandRightsPage>` — 產權調查表－權利/他項權利（所有權、他項）
5. `<LandSiteSurveyPage>` — 基地/土地現況調查（臨路/排水/管制）
6. `<TaxFeePage>` — 稅費/規費（項目列表，金額全部「待補」）
7. `<MarketDataPage>` — 成交行情/周遭設施（外部資料，全部「待補」）

建物版：渲染一頁「建物版說明書製作中，本 App 版本 v0.x 僅支援土地版」。

**Alternatives Considered**：
- 全部章節塞進單一 `<Page>`：超過 A4 高度，React-PDF 無法分頁
- 用 Chapter component 包再讓 React-PDF 自動分頁：React-PDF 的 break 行為在 CJK 字型下不穩定，手動 Page 更可控

### Decision 4：engine.ts 新增 `renderDossier()` 保留原 `render()` 相容

**決定**：不破壞現有 `render(options: RenderOptions)` 簽章（現有測試依賴），新增：
```typescript
interface DossierRenderOptions {
  data: CaseDossierData;
  themeId: string;
}
async function renderDossier(opts: DossierRenderOptions): Promise<Blob>
```

`preview/page.tsx` 改呼叫 `renderDossier`。

**Alternatives Considered**：
- 合併進 render()：RenderOptions 會需要 union type，破壞現有呼叫者

## Implementation Contract

**`PdfCover`**：接收 `tokens`、`caseNo`、`address`、`propertyType`（'土地'/'成屋'）、`generatedAt`，渲染 A4 封面頁，主色條使用 `tokens.primary`。驗證：截圖可見「不動產說明書」標題 + 案件編號。

**`PdfFieldTable`**：接收 `rows: [string, string][]`，渲染兩欄表格（左欄位名灰底、右欄位值白底），`border` 使用 `tokens.border`。驗證：每列 key/value 正確對應，缺值顯示「待補」。

**`PdfDocument`**：`property_type === 'land'` 輸出 7 Page；否則輸出 1 Page（coming soon 文字）。驗證：`pdf(doc).toBlob()` 成功且 blob size > 1KB。

**`renderDossier`**：接收 `DossierRenderOptions`，內部呼叫 `PdfDocument`，回傳 Blob。Vitest 環境回傳 `toUtf8SafePdfBlob(blob)`，browser 回傳 raw blob。驗證：在 preview page 重新整理後 iframe 顯示 7 頁 PDF（頁碼 1/7 到 7/7）。

## Risks / Trade-offs

[Risk] React-PDF 對 CJK 字型在 View wrap 時偶有截斷 → Mitigation：表格欄位用 fixed width（左欄 120pt，右欄 auto），避免自動換行計算 CJK

[Risk] `load_logo` 在 browser mock 回傳 null → Mitigation：`logoBytes` 為 optional，Cover 無 logo 時留空不報錯

[Risk] 現有 `react-pdf-render-engine` spec 有 1600+ 行，delta spec 寫錯易導致 analyzer 不一致 → Mitigation：本 change 只新增 `renderDossier` requirement，不修改現有 requirement block

## Migration Plan

1. 新增 `react-pdf-components.tsx` 和修改 `document.tsx`（無 breaking change）
2. engine.ts 新增 `renderDossier`（原 `render` 不動）
3. `preview/page.tsx` 改呼叫 `renderDossier`
4. 本機 `pnpm dev` 驗證 preview 頁 PDF 顯示 7 頁
5. 回滾：`preview/page.tsx` 改回呼叫 `render()`（一行改動）
