# 討論：BYOK API 模式 & 產品橋接架構

> 日期：2026-04-03
> 模式：討論模式（自動存檔）

---

## 第 1 輪

### 用戶提出

1. **影片 API BYOK（Bring Your Own Key）**：讓用戶自行申請影片 API key（如 fal.ai），填進系統就能免費使用影片生成功能。我們不負擔 API 成本。

2. **三大塊的橋接問題**：目前產品線拆成三塊——(a) Input、(b) VideoGo 製作、(c) PostGo Output。問題是：三個專案要怎麼接在一起？是否需要另開一個專案做橋接？

### 分析

**BYOK 模式分析：**

好處：
- 我們零 API 成本，用戶自帶 key
- 免費方案有實質功能（不只看 demo）
- 降低用戶「被賺差價」疑慮

風險：
- fal.ai 跟 Kling API prompt 格式不同，需做 provider adapter，工程量大
- 兩種商業模式並行（BYOK 免費 vs 代管收點數），可能蠶食付費用戶
- 不同 provider 影片品質不一致，影響用戶體驗
- 現有 pipeline（Element Binding、定妝照、v14 prompt）都針對 Kling 調校

待確認：fal.ai 是要替代 Kling 還是多一個選擇？

**三產品橋接分析：**

三塊產品線：Input（trending-topics）→ VideoGo（影片製作）→ PostGo（發布）

| 方案 | 做法 | 優點 | 缺點 |
|------|------|------|------|
| A. 中央橋接 | 新開 pipeline-hub 專案 | 解耦乾淨 | 多一個服務維護 |
| B. 直接串接 | VideoGo 當核心節點 | 簡單、少服務 | VideoGo 會變胖 |

初步傾向 B（直接串接），理由：一人公司規模不需多一個服務。

---

## 第 2 輪

### 用戶回應

- Input 產品目前在 `/Users/fishtv/Development/2-顧問/trending-topics`
- 傾向 B（直接串接），但要符合他的設計哲學「熵減原則」（位於 `/Users/fishtv/Development/1-設計哲學/`）
- 用戶決定先讓另一個 AI 去處理橋接 + 熵減原則的整合設計
- 本輪討論暫停此議題

### 狀態

- BYOK 模式：待確認 fal.ai 定位（替代 vs 額外選擇）
- 三產品橋接：方向確認 B，細節由另一個 AI 接手設計
