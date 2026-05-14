# AIRE PDF 主題設計稿

不動產說明書 PDF 渲染引擎 — 3 套主題 Mockup

## 主題差異

| 主題 | 風格 | 主色 | 適合客群 |
|------|------|------|---------|
| **A — 淡雅 Minimal** | 純白 + 細灰邊 + 藍強調 | `#FFFFFF` + `#3B82F6` | 重視專業感的傳統/律師系客戶 |
| **B — 商務 Corporate** | 深藍 header bar + 紅強調 | `#1E3A8A` + `#DC2626` | 老牌仲介、傳統銀行文件感 |
| **C — 科技優雅 Tech Elegant** | 粉漸層 + 深藍 + 金邊 | `#3B5E7A` + `#C9A961` | AIRE 既有風格延續，年輕仲介 |

## 目錄結構

```
theme-a-minimal/       # 淡雅
  cover.html           # 封面
  content.html         # 內頁（房屋現況調查表）
  style.css

theme-b-corporate/     # 商務
  cover.html
  content.html
  style.css

theme-c-tech-elegant/  # 科技優雅
  cover.html
  content.html
  style.css

screenshot.spec.ts     # Playwright 截圖腳本
playwright.config.ts   # Playwright 設定
README.md
```

## 截圖

```bash
cd mockups/pdf-themes
npx playwright test --config=playwright.config.ts screenshot.spec.ts
```

截圖輸出至 `/tmp/aire-mockups/theme-{a|b|c}-{cover|content}.png`
