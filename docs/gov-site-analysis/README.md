# 政府地政網站分析總覽

> 分析日期：2026-05-26
> 分析目的：評估各網站對「不動產說明書自動化」的資料對接潛力

## 快速對照表

| # | 網站 | 機關 | 地號 | 建號 | 地段 | 地址 | 憑證 | API | 詳見 |
|---|------|------|:----:|:----:|:----:|:----:|:----:|:---:|------|
| 1 | [實價登錄資料供應](https://plvr.land.moi.gov.tw/Main) | 內政部地政司 | ✅ | ⚠️ | ✅ | ✅ | 需登入計費 | ❌ | [01-plvr-main.md](01-plvr-main.md) |
| 2 | [全國土地使用分區查詢](https://luz.nlma.gov.tw/web/) | 國土管理署城鄉分署 | ✅ | ❌ | ✅ | ✅ | 免登入 | ArcGIS REST | [02-luz-landuse.md](02-luz-landuse.md) |
| 3 | [國土規劃地理資訊系統](https://nsp.nlma.gov.tw/ngis/) | 國土管理署城鄉分署 | ✅ | ⚠️ | ✅ | ✅ | 免登入 | ArcGIS REST | [03-nsp-ngis.md](03-nsp-ngis.md) |
| 4 | [地籍圖資便民系統 R02](https://easymap.moi.gov.tw/R02/Index) | 內政部資訊中心 | ✅ | ✅ | ✅ | ✅ | 免登入 | 無文件 | [04-easymap-r02.md](04-easymap-r02.md) |
| 5 | [國土測繪圖資服務雲 T09](https://maps.nlsc.gov.tw/T09/mobilemap.action) | 國土測繪中心 | ✅ | ⚠️ | ✅ | ✅ | 免登入 | WMTS/WMS/API | [05-nlsc-t09-mobile.md](05-nlsc-t09-mobile.md) |
| 6 | [地籍圖資便民系統 Z10Web](https://easymap.moi.gov.tw/Z10Web/Normal) | 內政部資訊中心 | ✅ | ✅ | ✅ | ✅ | 免登入 | 無文件 | [06-easymap-z10.md](06-easymap-z10.md) |
| 7 | [地籍圖資便民系統 W10Web](https://easymap.land.moi.gov.tw/W10Web/Normal) | 內政部地政司 | ✅ | ✅ | ✅ | ✅ | 免登入 | 無文件 | [07-easymap-w10.md](07-easymap-w10.md) |
| 8 | [地籍圖資便民系統入口](https://easymap.moi.gov.tw/Index) | 內政部 | ✅ | ✅ | ✅ | ✅ | 免登入 | 導向頁 | [08-easymap-index.md](08-easymap-index.md) |
| 9 | [實價登錄開放資料](https://plvr.land.moi.gov.tw/DownloadOpenData) | 內政部地政司 | ✅ | ✅ | ✅ | ✅ | 免登入免費 | 檔案下載 | [09-plvr-opendata.md](09-plvr-opendata.md) |
| 10 | [公有土地開放資料](https://easymap.moi.gov.tw/R01OpenData/Index) | 內政部地政司 | ✅ | ⚠️ | ✅ | ⚠️ | 免登入 | 無文件 | [10-r01-opendata.md](10-r01-opendata.md) |
| 11 | [國土測繪 API 文件](https://maps.nlsc.gov.tw/S09SOA/homePage.action) | 國土測繪中心 | ✅ | ⚠️ | ✅ | ✅ | 瀏覽免登入 | WMS/WMTS/WFS/API | [11-nlsc-s09-soa.md](11-nlsc-s09-soa.md) |
| 12 | [COP 地政整合平台](https://cop.land.moi.gov.tw/) | 內政部 | ✅ | ✅ | ✅ | ✅ | **需 COP 帳號** | 46 支官方 API | [12-cop-platform-api.md](12-cop-platform-api.md) |

**圖例**：✅ 支援 / ⚠️ 間接支援 / ❌ 不支援

---

## 核心發現

### 🔑 最適合 AIRE 對接的網站（按優先順序）

#### 🥇 1. COP 地政整合平台（#12）— 首選
- **為什麼**：有**官方 API**，地址→建號 **免費**（MOI_API_036），地號→建號 **1 元/筆**（MOI_API_015）
- **限制**：**必須申請 COP 帳號**，審核通過後才能使用
- **用途**：核心「地籍資料」與「建物資料」自動化查詢

#### 2. 實價登錄開放資料（#9）
- **為什麼**：完全免費、無需登入、含完整地號/門牌/價格
- **限制**：無即時 API，需定期下載全量 CSV/JSON 建立本機資料庫
- **用途**：不動產說明書「周邊實價行情」章節

#### 3. easymap 地籍圖資系統（#4, #6, #7）
- **為什麼**：免登入即可做地號↔門牌雙向對照
- **限制**：無官方 API，需逆向工程前端 AJAX 呼叫
- **用途**：COP 帳號還沒下來時的過渡方案，或做資料交叉驗證

#### 4. 國土測繪圖資服務雲（#5, #11）
- **為什麼**：有完整的 WMTS/WMS 服務 + API 文件
- **限制**：地籍相關 API 限政府機關/學術單位申請
- **用途**：地圖底圖、門牌定位（若申請成功）

#### 5. 全國土地使用分區查詢（#2）
- **為什麼**：唯一可查全國土地使用分區的單一入口
- **限制**：有 reCAPTCHA，ArcGIS REST API 需 Token
- **用途**：不動產說明書「土地使用分區與編定」章節

---

## 技術可行路徑建議

### 路徑 A：地址 → 地號/建號（最常被需要）

**方案 1：COP 官方 API（推薦）**
```
地址/門牌
    │
    ├─→ MOI_API_012 QueryCity → 縣市代碼
    │
    └─→ MOI_API_036 QueryByAddress(CITY, ADDRESS)
            → {UNIT, SEC, NO(建號), ADDRESS}
            → 得到建號 + 地段代碼 + 事務所代碼
    
    成本：免費｜前提：需 COP 帳號｜單次上限 1 筆
```

**方案 2：easymap 逆向工程（過渡方案）**
```
地址/門牌
    │
    └─→ easymap (Z10/W10/R02) 門牌查詢 → 地號 + 建號
           └─ 優點：免費、免登入、免申請
           └─ 缺點：無官方 API，需逆向工程，可能隨時失效
```

**方案 3：國土測繪中心門牌定位 API**
```
地址/門牌
    │
    └─→ 門牌定位 API（需申請）→ 座標 → 地籍圖 WMTS
           └─ 優點：標準 API
           └─ 缺點：民營企業可能無法申請地籍 API
```

### 路徑 B：地號 → 建號

**方案 1：COP 官方 API（推薦）**
```
地號(UNIT, SEC, NO)
    │
    └─→ MOI_API_015 QueryByLandNo(UNIT, SEC, NO)
            → 建號列表 {NO(地號), BNO(建號)}
    
    成本：1 元/筆｜前提：需 COP 帳號｜單次上限 25 筆
```

**方案 2：easymap 逆向工程**
```
地號
    │
    └─→ easymap 地籍查詢 → 地籍圖形 + 公告現值/地價 + 建號
           └─ 缺點：無官方 API
```

### 路徑 C：地號 → 圖形/屬性

```
地號
    │
    ├─→ easymap 地籍查詢 → 地籍圖形 + 公告現值/地價
    │
    ├─→ COP MOI_API_001 土地標示部資料 → 面積、公告現值、公告地價（1 元/筆）
    │
    ├─→ 國土測繪中心地籍 API（需申請）→ GeoJSON/KML/SHP
    │
    └─→ twland.ronny.tw（第三方 API，資料較舊）→ GeoJSON
```

### 路徑 C：地號 → 實價登錄

```
地號/門牌
    │
    └─→ 本機實價登錄 Open Data 資料庫 → 歷史成交紀錄
           └─ 需定期從 #9 下載更新
```

---

## 重要外部資源

| 資源 | 網址 | 說明 |
|------|------|------|
| 地政整合 OPEN API | https://openapi.land.moi.gov.tw/ | 地政整合資訊服務共享協作平台 |
| 地政協作平台 | https://cop.moi.gov.tw | 可查詢可用 API 及服務介面 |
| 第三方地號 API | https://twland.ronny.tw/ | 資料來自 easymap（2015 年前）|
| 實價登錄查詢 | https://lvr.land.moi.gov.tw/ | 免登入查詢（無法批次下載）|

---

## 目前資料對接缺口

根據分析，AIRE 目前可能缺少以下對接：

1. **地址→地號/建號自動轉換**：COP MOI_API_036（免費，需帳號）是最佳官方方案；easymap 是免申請的過渡方案
2. **建號查詢**：COP MOI_API_015（1 元/筆）是最佳官方方案
3. **土地使用分區**：luz.nlma.gov.tw 有完整資料，但有 reCAPTCHA 阻擋；COP 也有 WMS 服務
4. **地籍圖形**：國土測繪中心有，但需申請且限特定資格；COP 也有 WMS/WFS
5. **環境敏感地區**：nsp.nlma.gov.tw 有，但無公開 API；COP 有多項 WMS（斷層、山坡地等）

---

## 備註

- 所有 `.land.moi.gov.tw` 與 `.nlsc.gov.tw` 網站均有 SSL 憑證問題，程式介接時需設定忽略憑證驗證
- 政府網站介面與 API 可能無預警變更，需定期維護
