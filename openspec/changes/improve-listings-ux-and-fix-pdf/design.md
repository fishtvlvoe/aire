## Context

本 change 合併四個獨立議題（A/C/D/E）到同一個 sprint，因為它們全部落在同一批檔案（`FieldVisitForm`、`fill/page.tsx`、listings 頁群）上，分開做會造成同檔案重複改動、merge conflict 風險升高。

**既有狀態**：
- Next.js 16.2.4 + Turbopack（App Router + React Server/Client Components 混用）
- SQLite 經由 `better-sqlite3`，listings 透過 `getListing(id)`（sync）取用
- 5 頁 UI flow 已存在：`/listings/new → /listings/[id]/fill → supplementary → generating → documents`
- `listing.status` 狀態機四態：`draft` / `field-visit-complete` / `ready-for-generation` / `documents-ready`
- `FieldVisitForm` 為 client component，用 `propertyType` + `onSave` 兩 prop 運作，內部 useState 一律 `{}`

**核心約束**：
- 顧問案 — 不能引入新 npm 套件（避免客戶自架時的相依維運成本）
- 客戶已反映操作不直覺，屬於阻塞級缺陷
- 交付目標：修完四個 Bug 且不破壞既有 spec 的既有 requirement

## Goals / Non-Goals

**Goals:**

- 恢復 PDF 下載（A）— 以最小 diff（1 行）修復 `__dirname` 失效問題
- 在表單填寫流程中建立清楚的進度感（D1 Stepper、D4 章節 badge）
- 讓使用者可直達任意已完成的階段（D2 列表跳對頁、D3 側邊欄最近物件）
- 按鈕永不灰掉陷入死路（C）— 按了才告訴你缺哪裡
- 編輯既有物件時不遺失已填資料（E）— 支援 initialData 回填

**Non-Goals:**

- 本 change 不重寫 PDF 版型（B 議題獨立處理）
- 不改變 `listing.status` 狀態機（不新增中間態）
- 不引入 Zustand/Redux 等 global state
- 不做表單 autosave（只修「再次進入回填」）
- 不動 `/listings/new` 頁面 UI

## Decisions

### Decision: 以 process.cwd() 取代 __dirname 解析 PDF template 路徑

**選擇**：在 `src/lib/pdf-generator/dossier.ts` 將 `TEMPLATES_DIR = path.join(__dirname, 'templates')` 改成 `path.join(process.cwd(), 'src/lib/pdf-generator/templates')`。

**理由**：
- Next.js 16 + Turbopack 的 server bundling 下，`__dirname` 解析為 `/ROOT/src/...` 假路徑（實測捕獲 `ENOENT: no such file or directory, open '/ROOT/src/lib/pdf-generator/templates/dossier.html'`）
- `process.cwd()` 在 dev（`npm run dev`）與 production（`npm run start`）下皆為專案根目錄，行為一致
- 此修法為 1 行變更，符合 A 議題的「hotfix 規模」

**Alternatives Considered**:
1. **用 `import.meta.url` + `fileURLToPath`**：更符合 ESM 慣例，但 Next.js Turbopack 對 `import.meta` 的支援仍在演進，且當前 `dossier.ts` 是 CommonJS 風格（`__dirname` 可用的舊風格），改 `import.meta` 需同步改 tsconfig 與 import 風格，超出 hotfix 範疇。否決。
2. **把 template 改成 inline string（直接寫進 .ts）**：避免檔案讀取問題，但會讓 HTML/CSS 失去檔案層級的語法高亮與可測性，且未來 B 議題要大改版型時更難維護。否決。
3. **把 templates 移進 `public/` 目錄用 URL fetch**：Next.js public 支援但會讓 server-side 產 PDF 變成「server 打自己的 HTTP」，循環依賴且 port 不一定穩定。否決。

### Decision: Stepper 使用 5 格映射既有 4 個狀態 + 當前頁 URL

**選擇**：建立 `src/components/Stepper.tsx` 為 client component，吃 props `currentStep: 1-5` 與 `listingStatus: ListingStatus`。5 格固定：選類型/現勘/補件/產生中/文件輸出。狀態色以下列規則決定：

| listing.status | 格 1 | 格 2 | 格 3 | 格 4 | 格 5 |
|---|---|---|---|---|---|
| （新增中，尚未建立）| 藍 | 灰 | 灰 | 灰 | 灰 |
| `draft` | 綠 | 藍/綠* | 灰 | 灰 | 灰 |
| `field-visit-complete` | 綠 | 綠 | 藍/綠* | 灰 | 灰 |
| `ready-for-generation` | 綠 | 綠 | 綠 | 藍/綠* | 灰 |
| `documents-ready` | 綠 | 綠 | 綠 | 綠 | 藍/綠* |

*藍=當前頁；綠=已完成但非當前頁（由 `currentStep` prop 決定）。

**理由**：
- 5 格對應真實頁面數，不需使用者對照「12 格」這類抽象刻度
- 當前頁用 `currentStep` 顯式傳入（避免在 Stepper 內部做 `usePathname` 解析導致可測性下降）
- 可點規則：綠 + 藍可點；灰禁用（CSS `pointer-events: none` + `cursor-not-allowed`）

**Alternatives Considered**:
1. **在 Stepper 內部用 `usePathname()` 推斷當前步**：耦合 Next.js 路由，unit test 時需 mock；顯式傳 `currentStep` 讓元件純且可測。否決。
2. **12 格對應 chapter 數**：使用者原話的「1 到 12 格」其實是混用了「頁面」和「章節」兩概念。12 格跟真實頁面數不一致會造成「第 12 格對應什麼？」的語意不明。章節進度由 D4 的 tab badge 處理，不在 Stepper 內。否決。

### Decision: 列表頁與側邊欄以 listing.status 單一條件決定跳轉目的

**選擇**：封裝一個純函式 `resolveListingHref(listing)` 於 `src/lib/listing-routes.ts`（新檔），規則：
```ts
function resolveListingHref(listing): string {
  if (listing.status === 'documents-ready') return `/listings/${listing.id}/documents`;
  return `/listings/${listing.id}/fill`;
}
```

按鈕文案同步規則：`documents-ready` → 「查看文件」；其他 → 「進入填寫」。D2（列表）與 D3（側邊欄最近物件）共用此函式。

**理由**：
- 只有 `documents-ready` 是「終點可直達」的狀態；其他三態仍在工作流程中，統一跳 `/fill` 讓使用者從工作點續走
- 純函式抽出可單元測試，且避免 D2/D3 各寫一套邏輯造成未來不一致

**Alternatives Considered**:
1. **依 status 分四條跳不同頁**（draft→fill、field-visit-complete→supplementary、ready-for-generation→generating、documents-ready→documents）：符合「直接跳當前階段」精神，但 `generating` 頁是暫態（應自動 redirect 到 documents），且 `supplementary` 需要 fill 完成的資料，沒從 fill 走過直接跳 supplementary 會看到空頁面。否決（增加中介邏輯不划算）。
2. **讓使用者在列表看到下拉選單選目的頁**：UI 複雜度暴增且非必要。否決。

### Decision: 側邊欄最近物件採 client 端 fetch + slice 前 5 筆

**選擇**：`Sidebar.tsx` 改為 client component，用 `useEffect` 打 `GET /api/listings`（既有 API），在 client 端按 `created_at` desc 排序取前 5 筆。

**理由**：
- 既有 `/api/listings` 已回傳全部 listings（用戶自架顧問案預期 listings 總數 < 1000，全量 fetch 可接受）
- 不需為「側邊欄最近 5 筆」增加新 API 端點（query 參數 `?limit=5&sort=recent` 原 route 不支援，加支援又需動 route.ts 與資料層）
- 側邊欄跨頁共用，每頁首次載入打一次 API 是可接受成本

**Alternatives Considered**:
1. **新增 `/api/listings?limit=5&sort=recent` query 支援**：資料層改動較多且本 change 重點不在 API。未來若 listings 量大再做。否決。
2. **讓 Sidebar 透過 Server Component 預取**：Sidebar 目前已經是 client-less（單純 render），改 server component 需連動 layout.tsx 架構。本 change 以最小改動優先。否決。

### Decision: Tab badge 改「已填/總欄」+ 必填紅點指示器

**選擇**：`FieldVisitForm.tsx` 的 `chapterCompletion` 計算除原有 `filledRequired/totalRequired` 外，新增 `filledAll/totalAll`；badge 顯示 `filledAll/totalAll`；若 `filledRequired < totalRequired` 在 badge 右上角掛一個 `w-2 h-2 bg-red-500 rounded-full` 小紅點。顏色規則調整為：

- 必填未填（`filledRequired < totalRequired`）→ 紅點 + 灰底 badge
- 必填全填但非必填未填（`filledRequired === totalRequired && filledAll < totalAll`）→ 琥珀底 badge
- 全部填完（`filledAll === totalAll`）→ 綠底 badge + 勾

**理由**：
- 使用者原訴求：「非必填欄位沒有任何顯示」— 改成 `filledAll/totalAll` 直接解決可見性
- 紅點獨立於數字，讓「必填未完」訊號不被數字稀釋

**Alternatives Considered**:
1. **只改數字不加紅點**：使用者可能仍看不出「這個 badge 的 3/10 有 2 個是必填未填」。否決。
2. **用兩個 badge 並排**（必填 x/y + 全欄 x/y）：視覺擁擠，行動裝置可能 overflow。否決。

### Decision: 按鈕不再 disabled，改為按下時做驗證跳轉

**選擇**：`fill/page.tsx` 的「儲存並前往補件」按鈕移除 `!isComplete` 判斷。`handleSave` 改為：

1. 若 `!isComplete` → 遍歷 `chapterCompletion` 找第一個 `filledRequired < totalRequired` 的 chapter，呼叫 `FieldVisitForm` 暴露的 `onJumpToIncomplete` callback 切 tab + 觸發「高亮缺欄」狀態 + 設定頁首橫幅；不送出。
2. 若 `isComplete` → 照原流程送 API。

`FieldVisitForm` 透過 `useImperativeHandle` + `forwardRef` 暴露 `jumpToFirstIncomplete()` 方法，或改用 prop `highlightMissing: boolean` 傳入。選後者（prop driven）避免 ref 複雜度。

**理由**：
- 使用者明確選擇「按鈕始終可點，按了才提示缺哪裡」
- 按鈕永遠可點避免「灰按鈕陷阱」的不直覺體驗
- `highlightMissing` prop 做為單向資料流比 imperative handle 更符合 React 慣例

**Alternatives Considered**:
1. **用 `ref.current.jumpToFirstIncomplete()`** imperative 呼叫：語意清楚但增加 ref 樣板。在這個場景 prop driven 更輕。否決。
2. **把章節狀態 lift up 到 page.tsx**：會讓 FieldVisitForm 變得很空，且 page 裡要重做 schema 計算。否決。

### Decision: FieldVisitForm 以 initialData prop 支援回填

**選擇**：新增 `initialData?: Record<string, unknown>` prop。內部 `useState` 初始值改為 `normalizeInitialData(initialData)`（將 unknown 值轉 string）。新增 `useEffect([initialData])`：當 prop 內容首次變成非 null（父層 async 載完）時，setForm 更新值；之後 prop 再變化不再蓋掉（避免覆蓋使用者正在編輯的內容）— 以 `didHydrate` flag 控制只 hydrate 一次。

property type 切換時的清空邏輯保留，但僅 `propPropertyType === undefined` 時才清（外部控制型態時 = 編輯現有物件，不該清）。

**理由**：
- 父層 `fill/page.tsx` 是 async 載入 listing，第一次 render 時 `initialData` 可能還是 undefined；必須在 prop 變化時補 hydrate 一次
- `didHydrate` flag 防止使用者已在輸入後被資料庫的舊值覆蓋（雖然本 change 沒 autosave，仍要防禦未來併發）

**Alternatives Considered**:
1. **每次 `initialData` 變都重置 form state**：使用者正在輸入時若父層 re-fetch 會被覆蓋，體驗差。否決。
2. **把資料載入移進 FieldVisitForm**：違反「元件只做 UI」原則。否決。

## Risks / Trade-offs

- **[Risk] `process.cwd()` 在未來 serverless 部署（如 Vercel）可能指向不同路徑** → Mitigation：在 `dossier.ts` 加註解說明 CWD 依賴，並保留「未來遷移到 serverless 時改用 `import.meta.url`」的 Open Question 追蹤；driver 客戶目前是本機或 VPS 部署，短期不受影響。

- **[Risk] Stepper 在 supplementary 頁面實際跳轉後，若 status 尚未推進（仍是 `field-visit-complete`），格 3 的色票會從藍變綠需要 refetch** → Mitigation：每個頁面掛載時從 `/api/listings/[id]` 取 listing 一次即可；`currentStep` 由頁面自己寫死（`/supplementary` 永遠是 3）。不做即時多視窗同步。

- **[Risk] 側邊欄最近 5 筆每頁都打一次 API** → Mitigation：既有 `/api/listings` 回傳量小（顧問案場景），且未來 Next.js 可加 `cache: 'force-cache'` 或 SWR。本 change 先簡做。

- **[Risk] 按鈕永不灰掉的體驗改變可能讓已經習慣舊 UI 的使用者誤以為按壞了** → Mitigation：點擊後必有明確回饋（切章節 + 紅框 + 頂部橫幅），比舊版「按不動」的回饋更強。風險可接受。

- **[Risk] `initialData` hydrate 時機若跟 property type 選擇衝突，會導致欄位錯位（例如 initialData 是 townhouse 的資料，但內部 `internalType` state 還是 apartment）** → Mitigation：`fill/page.tsx` 已經用 `propPropertyType` 傳入，external control 模式下 `internalType` 不影響；編輯流程永遠外控。新增的 `didHydrate` flag 也會防禦初次重複 hydrate。

- **[Trade-off] Stepper 第 1 格「選類型」在 listing 已存在時是否可點**：設計為可點（跳 `/listings/new`），但會讓使用者以為可以改類型。實際 `/new` 是建立新 listing，不是編輯。決定：第 1 格在 listing 已存在（`/listings/[id]/*` 頁）時顯示綠色但 **不可點**（視為只讀的完成標記）；`/listings/new` 頁時第 1 格為藍色可點。

## Migration Plan

**部署步驟**：
1. 合併到主線前先在 dev 跑 `npm run dev` 實測：
   - PDF 下載 200（列表選一個 `documents-ready` 的 listing → 點下載 PDF → 收到 binary）
   - Stepper 5 頁顯示正確色票
   - 按鈕缺欄提示流程
   - 資料回填（編輯已填過的 listing）
2. 跑 `npm run test`（若有測試腳本）與 `npm run build` 確認 TypeScript/lint 全通
3. commit + push，顧問案無 staging，直接給客戶驗收

**回滾策略**：
- 單 commit，回滾用 `git revert <sha>`
- PDF template 路徑改動如果在客戶端出現 CWD 問題：臨時 fallback 可快速改回 `__dirname` 並搭配 `NEXT_RUNTIME` 判斷 — 但這只是備案，不寫進本 change

## Open Questions

- **未來 serverless 部署時，`process.cwd()` 是否仍指向 repo 根？** 若客戶要求 Vercel 部署，需另開 change 改用 `import.meta.url` + `fileURLToPath` 或 `fs.readFileSync` 配合 Next.js 的 `@/..` alias 解析。本 change 只保證本機 / VPS 部署能用。
- **Stepper 第 1 格的「選類型」點擊行為是否需要是「新增新物件」**：目前決定在 `/listings/[id]/*` 頁時為不可點（只讀）。若未來客戶反饋希望能在 Stepper 直達「新增另一個物件」，再開新 change。
