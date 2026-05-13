# AIRE × opcOS 視覺對齊驗收清單

> 對應 AIRE Phase 1 Group 10.4 — 確認 AIRE 桌面 App 與 opcOS 雲端網頁視覺一致。
> 規範來源：`docs/brand-guidelines.md` + `docs/ux-patterns.md` + ST/tooling/tailwind/theme.css

## 驗收方法

1. 啟動 opcOS marketing dev：`cd ~/Development/ST && pnpm --filter marketing dev`（port 3001）
2. 啟動 AIRE dev：`cd ~/Development/products/AIRE && pnpm tauri dev`
3. 對應頁面並排截圖（建議 1280×800 視窗）
4. 用 Pixel-perfect 或目測比對每列 token（主色、圓角、陰影、padding）
5. 紀錄 pass / drift / mismatch；drift 與 mismatch 須修正後重檢

## 自動截圖腳本（搭配 Playwright）

```bash
# OPCOS 截圖
cd ~/Development/ST
node -e "
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const c = await b.newContext({ viewport: { width: 1280, height: 800 } });
  const p = await c.newPage();
  await p.goto('http://localhost:3001/zh-TW');
  await p.waitForLoadState('networkidle');
  await p.screenshot({ path: '/tmp/opcos-marketing.png', fullPage: false });
  await b.close();
})();
"

# AIRE 截圖（需 tauri dev 起來）
# 用 Tauri 視窗截圖工具或 macOS screencapture
```

## 對齊項目（至少 3 列）

### 1. 主按鈕（Button primary）

| 屬性 | opcOS（行銷站「了解 AIRE」按鈕） | AIRE（案件列表「新增案件」按鈕） | 對齊狀態 |
| --- | --- | --- | --- |
| 背景色 | `bg-primary` → light: `--color-stone-900` / dark: `--color-white` | 同左 | ☐ pass ☐ drift ☐ mismatch |
| 前景色 | `text-primary-foreground` → light: `--color-white` / dark: `--color-stone-900` | 同左 | ☐ pass ☐ drift ☐ mismatch |
| 圓角 | `rounded-md` → `calc(0.75rem * 0.8)` = 9.6px | 同左 | ☐ pass ☐ drift ☐ mismatch |
| 高度 | size=default → h-9 (~36px) | 同左 | ☐ pass ☐ drift ☐ mismatch |
| Hover | `hover:bg-primary/90` opacity 90% | 同左 | ☐ pass ☐ drift ☐ mismatch |

### 2. 輸入框（Input）

| 屬性 | opcOS（登入表單 email 輸入框） | AIRE（新增案件「地號」輸入框） | 對齊狀態 |
| --- | --- | --- | --- |
| 邊框色 | `border-input` → `--color-stone-200` | 同左 | ☐ pass ☐ drift ☐ mismatch |
| Focus ring | `ring-ring` → `--color-stone-400` | 同左 | ☐ pass ☐ drift ☐ mismatch |
| 圓角 | `rounded-md` | 同左 | ☐ pass ☐ drift ☐ mismatch |
| 高度 | h-9 (~36px) | 同左 | ☐ pass ☐ drift ☐ mismatch |
| Placeholder 顏色 | `text-muted-foreground` → `--color-stone-500` | 同左 | ☐ pass ☐ drift ☐ mismatch |

### 3. 卡片（Card）

| 屬性 | opcOS（Feature 卡片） | AIRE（案件列表 Empty state 卡片） | 對齊狀態 |
| --- | --- | --- | --- |
| 背景 | `bg-card` → light: white / dark: stone-900 | 同左 | ☐ pass ☐ drift ☐ mismatch |
| 邊框 | `border` → `--color-stone-200` | 同左 | ☐ pass ☐ drift ☐ mismatch |
| 圓角 | `rounded-xl` → 16.8px | 同左 | ☐ pass ☐ drift ☐ mismatch |
| Padding | `p-6` (24px) | 同左 | ☐ pass ☐ drift ☐ mismatch |
| Shadow | 無 (沒 shadow class) | 同左 | ☐ pass ☐ drift ☐ mismatch |

### 4. Modal / Dialog

| 屬性 | opcOS（任一 Dialog） | AIRE（刪除確認 ConfirmDialog） | 對齊狀態 |
| --- | --- | --- | --- |
| Overlay 背景 | `bg-black/80` | 同左 | ☐ pass ☐ drift ☐ mismatch |
| 內容圓角 | `rounded-lg` | 同左 | ☐ pass ☐ drift ☐ mismatch |
| 內容 padding | `p-6` | 同左 | ☐ pass ☐ drift ☐ mismatch |
| 標題字體 | `text-lg font-semibold` | 同左 | ☐ pass ☐ drift ☐ mismatch |

### 5. Toast 通知

| 屬性 | opcOS（沒實作？） | AIRE（匯出成功 toast） | 對齊狀態 |
| --- | --- | --- | --- |
| 位置 | TBD | bottom-right | ☐ pass ☐ drift ☐ mismatch ☐ N/A |
| 成功色 | TBD | `bg-success` `--color-emerald-700` | ☐ pass ☐ drift ☐ mismatch ☐ N/A |
| 自動消失 | TBD | 3 秒 | ☐ pass ☐ drift ☐ mismatch ☐ N/A |

## 驗收紀錄欄

| 驗收日期 | 驗收者 | AIRE 版本 | OPCOS 版本 | 對齊比例 | 截圖目錄 |
| --- | --- | --- | --- | --- | --- |
| YYYY-MM-DD | Fish | 0.1.0 | 0.1.0 | __/5 列 | /tmp/visual-parity-YYYYMMDD/ |

## 若發現 drift / mismatch

1. 確認雙方都 import 相同的 `tokens.css`（AIRE 在 `src/styles/tokens.css`、OPCOS 在 `ST/tooling/tailwind/theme.css`）
2. 若兩邊 token CSS 有差異 → 同步（以 OPCOS 為 source of truth，AIRE 跟它走）
3. 若 token 一樣但渲染差 → 檢查元件實作（atomic 元件 className 是否用 token-based class）
4. 紀錄修正 commit hash，重跑驗收

## 自動化擴充（未來）

Phase 1 此清單為手動。未來可加 Percy / Chromatic / Pixelmatch 自動視覺迴歸測試。
