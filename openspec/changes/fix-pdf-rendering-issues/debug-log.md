# Debug Log: fix-pdf-rendering-issues

## 修復時間：2026-05-17

## 根因分析（與原始 proposal 不同的發現）

### Issue 1 & 2：封面 + 法規告知 — 改錯檔案

**原始假設**：修改 `src/lib/pdf-blocks/cover-page.tsx` 和 `src/lib/pdf-blocks/legal-page.tsx`

**實際根因**：`document.tsx` 完全不 import 這兩個檔案。
- 封面用的是 `react-pdf-components.tsx` 的 `PdfCover` 元件（line 8 import）
- 法規告知用的是 `document.tsx` 內 inline 的 `LegalPage()` 函式（line 181-210）
- 第一輪 Sonnet 子代理改了 `cover.tsx` 和 `legal-notice.tsx`，但這兩個檔案根本沒被引用

**教訓**：派代理改 UI 前，必須先確認「document.tsx 實際 import 和使用的元件是哪個」，不能只看檔名推測。

**修正方式**：
- `react-pdf-components.tsx`：擴充 `PdfCoverProps` 加入 `CoverDetail` 介面和 `cover?` prop，InfoRow 渲染完整欄位
- `document.tsx`：PdfCover 傳入 `data.cover`、LegalPage 加 `DEFAULT_LEGAL_CLAUSES` 常數（4 條法規），`clauses.length < 4` 時 fallback 到預設

### Issue 2 補充：CJK 斷行溢出

**現象**：法規第 2、3 條文字超出 A4 右邊界，被截斷

**根因**：`@react-pdf/renderer` 不支援 CJK 自動斷行。CJK 字元間沒有空格，layout engine 不知道在哪裡可以斷行。

**嘗試過的方案**：
1. `flexDirection: "row"` + `flex: 1` — 失敗，CJK 行寬計算不正確
2. `maxWidth: "100%"` — 失敗，同上

**最終方案**：`insertCjkBreaks()` 函式，用 regex 在每個 CJK 字元前插入 zero-width space（`​`），讓 layout engine 有斷行機會。
```ts
function insertCjkBreaks(text: string): string {
  return text.replace(/([一-鿿㐀-䶿])/g, "​$1");
}
```

**注意**：此方案只套用在 LegalPage。如果其他頁面也有長 CJK 文字溢出問題，需要同樣處理。

### Issue 3：「待補」改空白

**實際修改位置**：`react-pdf-components.tsx:337` 的 `PENDING` 常數
- 原值：`const PENDING = "待補"`
- 改為：`const PENDING = ""`

### Issue 6：成交行情表標題

**實際修改位置**：`src/lib/pdf-blocks/transaction-history-page.tsx:50,65`（兩處）
- 原值：`透明房價一覽表`
- 改為：`附近地段實價登錄成交行情`

### Issue 5：圖片頁亂碼

**根因**：`location-map.tsx`、`exterior-photo-page.tsx`、`life-amenities.tsx` 缺少 `fontFamily: "NotoSansTC"` 設定，中文字元 fallback 到預設字型導致亂碼。

**修正**：所有佔位文字的 style 加入 `fontFamily: "NotoSansTC"`。

## 實際修改的檔案（與 proposal Impact 不同）

| 檔案 | 修改內容 |
|------|---------|
| `src/lib/pdf-engine/react-pdf-components.tsx` | PdfCover 加 cover prop + CoverDetail 介面 + PENDING 改空白 |
| `src/lib/pdf-engine/document.tsx` | PdfCover 傳 cover + LegalPage 預設法規 + insertCjkBreaks + 頁面排序 + 移除重複簽章 + 成交統計自動帶入 |
| `src/lib/pdf-blocks/transaction-history-page.tsx` | 標題改名 |
| `src/lib/pdf-blocks/location-map.tsx` | fontFamily 修正 + 佔位文字改中文 |
| `src/lib/pdf-blocks/exterior-photo-page.tsx` | fontFamily 修正 + 佔位文字改中文 |
| `src/lib/pdf-blocks/life-amenities.tsx` | fontFamily 修正 |

**未修改的檔案（proposal 列出但實際不需要）**：
- `src/lib/pdf-blocks/cover-page.tsx` — 改了但沒用（document.tsx 不引用）
- `src/lib/pdf-blocks/legal-notice.tsx` — 改了但沒用（document.tsx 不引用）
- `src/lib/pdf-blocks/land-detail-pages.tsx` — PENDING 改在 react-pdf-components.tsx

## 驗收結果

| 版本 | 頁數 | 結果 |
|------|------|------|
| 土地版 | 21 頁 | 7/7 項通過 |
| 建物版 | 18 頁 | 7/7 項通過 |

## 已知遺留問題

1. `PdfFieldTable` label 欄寬 120px 太窄，「非都市土地使用分區及編定」被截斷（頁 8）
2. `cover.tsx` 和 `legal-notice.tsx` 已修改但未被引用 — 未來如果 document.tsx 改用這些元件需同步
3. `insertCjkBreaks()` 只套用在 LegalPage，其他頁面長文字可能也需要
