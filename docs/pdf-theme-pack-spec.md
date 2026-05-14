# PDF Theme Pack 規格 v1

> AIRE 不動產說明書 PDF 主題擴展包規範。Phase 1 出貨 A 淡雅 + C 科技優雅雙主題；Phase 2 透過 OpenDesign 擴展更多主題當「補充包」加量不加價，**不需動主程式**。

## Theme Pack 結構

每個 theme pack 是一個獨立 npm 套件或本機資料夾，目錄結構如下：

```
themes/<theme-id>/
├── theme.json           # 主題 metadata（id / name / version / author）
├── tokens.ts            # design tokens（color / typography / spacing）
├── components/
│   ├── Cover.tsx        # 封面元件
│   ├── PageHeader.tsx   # 頁眉
│   ├── PageFooter.tsx   # 頁尾
│   └── Section.tsx      # 章節通用包裝
└── assets/              # 主題專屬圖檔（PNG / SVG）
```

`theme.json` 範例：

```json
{
  "id": "theme-a",
  "name": "淡雅",
  "version": "1.0.0",
  "author": "AIRE 官方",
  "compatibleEngine": "^4.0.0"
}
```

## 必要元件

每個主題 MUST 實作以下 4 個 React-PDF 元件：

| 元件 | 用途 | 必要 props |
|------|------|----------|
| `<Cover>` | 封面頁渲染 | `caseData / logo / companyName` |
| `<PageHeader>` | 內頁頁眉（含 Logo + AI badge） | `pageNumber / totalPages / logo` |
| `<PageFooter>` | 內頁頁尾 | `caseId / generatedAt` |
| `<Section>` | 章節包裝（heading + body） | `title / children` |

AI badge（右上角 AIRE 標誌）為**所有主題共用**，不可被覆蓋或移除（產品識別硬約束）。

## Token 規格

`tokens.ts` MUST export 以下 token 集合：

```typescript
export const tokens = {
  color: {
    primary: string;       // 主色
    secondary: string;     // 次要色
    text: string;          // 內文
    textMuted: string;     // 弱化文字
    background: string;    // 背景
    border: string;        // 線條
  },
  typography: {
    fontFamily: { heading: string; body: string };
    fontSize: { h1: number; h2: number; h3: number; body: number; small: number };
    lineHeight: { heading: number; body: number };
  },
  spacing: {
    page: { top: number; right: number; bottom: number; left: number };
    block: number;        // 區塊間距
    inline: number;       // 行內間距
  },
};
```

字型：繁體中文 fallback 鏈 `Noto Sans TC, PingFang TC, 微軟正黑體, sans-serif`，英文/數字 `Inter, Helvetica, sans-serif`。

## 發布格式

Theme pack 支援兩種發布方式：

### 1. npm 套件
```bash
pnpm add @aire-themes/<theme-id>
```
AIRE 啟動時自動掃描 `node_modules/@aire-themes/*` 並註冊。

### 2. 本機資料夾
放置於 `~/.aire/themes/<theme-id>/`，AIRE 啟動時掃描該目錄。
適合客戶自製 / 顧問客製化情境。

兩種格式 metadata 結構一致，`tokens.ts` 必須是預先 compile 過的 ESM。

## 版本管理

- Theme pack 採 **SemVer**（X.Y.Z）。
- `theme.json` 的 `compatibleEngine` 用 npm range 標示相容的 AIRE PDF engine 版本（例：`^4.0.0`）。
- AIRE 載入時檢查 engine 版本相容；不相容則 fallback 至 theme-a 並顯示 banner「主題 X v1.2.0 與目前 engine 不相容」。
- Breaking change（如刪除 token、改 element 簽章）MUST bump major version。
- Theme pack 升級不應強制 AIRE 主程式升級（向後相容是設計目標）。
