# 不動產物件分析助手（Real Estate AI）

不動產物件分析助手顧問案，從 FlowGo docs/ 分離出來（2026-04-19）。

> 此專案獨立於 FlowGo（`~/Development/6-產品/flowgo/`），勿再混放。
> FlowGo 是「可視化內容生產整合平台」，與本顧問案無關。

## 專案內容

### 頂層文件

| 文件 | 用途 |
|------|------|
| `PRD.md` | 產品需求文件（Product Requirements） |
| `product-b-cli-spec.md` | Product B — CLI 工具規格 |
| `product-b-video-spec.md` | Product B — 影片產出規格 |
| `客戶接案流程.md` | 顧問案接案 SOP |
| `客戶安裝指南.md` | 客戶端安裝說明 |

### 子資料夾

| 資料夾 | 內容 | 檔數 |
|--------|------|------|
| `discovery/` | 前期需求探索、客戶訪談、問題拆解筆記 | 22 |
| `saas-planning/` | SaaS 化規劃（架構、訂閱、roadmap） | 11 |
| `客戶簡報/` | 提案/進度/成果簡報素材 | 10 |
| `影片製作標準化/` | 影片產出流程 SOP | 3 |
| `three-ai/` | 既有子專案（搬移前已存在，非本次搬入） |

## 搬移來源

以上除 `three-ai/` 外，皆於 2026-04-19 從 `~/Development/6-產品/flowgo/docs/` 搬入。
原因：FlowGo 是產品，本顧問案是獨立客戶案，不應共用 docs/。

## 維護原則

- 新增不動產顧問案相關文件 → 放這裡，**不要**放回 FlowGo
- FlowGo 相關文件 → 回 `~/Development/6-產品/flowgo/docs/`
- 兩邊有疑問時，以「是否服務同一客戶/產品」判斷歸屬
