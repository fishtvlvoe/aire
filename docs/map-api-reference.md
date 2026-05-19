# AIRE 地圖 API 參考文件

> 建立日期：2026-05-19
> 用途：不動產說明書「周遭設施分佈圖」頁面所需地圖服務

---

## 決策：不使用 Google Maps

Google Maps 需信用卡、每月計費、申請繁瑣。
AIRE 系統已有 `cop.land.moi.gov.tw` 地政整合平台帳號，該平台本身提供 WMS 地圖服務，
加上完全免費的 OSM 生態系，可滿足所有需求。

---

## 採用方案：三層組合

### 層一：地圖底圖

**cop.land.moi.gov.tw WMS（首選）**

| 項目 | 內容 |
|------|------|
| 來源 | 內政部地政整合資訊服務平台 |
| API Key | 使用現有 AIRE 帳號，無需另申請 |
| 服務類型 | WMS（Web Map Service）× 5 種 |
| 台灣資料品質 | ⭐⭐⭐⭐⭐ 官方地籍圖，最準確 |
| 費用 | 含在現有地政 API 帳號中 |
| 文件 | 見 `docs/land-registry-api-research.md` |

備用底圖：OSM + Leaflet.js
- 完全免費，無 API Key
- CDN：`https://tile.openstreetmap.org/{z}/{x}/{y}.png`
- 台灣資料品質：市區 ⭐⭐⭐⭐，郊區 ⭐⭐⭐

---

### 層二：地址轉座標（Geocoding）

**OSM Nominatim（免費）**

```
GET https://nominatim.openstreetmap.org/search
  ?q=台南市永康區勝利街58巷4號
  &format=json
  &countrycodes=tw
  &limit=1

回傳：
{
  "lat": "22.9xxxx",
  "lon": "120.2xxxx",
  "display_name": "...",
  "importance": 0.xxx
}
```

| 項目 | 內容 |
|------|------|
| API Key | 不需要 |
| 費用 | 完全免費 |
| 速率限制 | 1 req/sec（桌面 app 夠用） |
| 台灣資料品質 | 門牌查詢準確率約 85-90% |
| User-Agent | 必須帶，格式：`AIRE/1.0 (contact@example.com)` |

備用：內政部門牌地號查詢 API（cop.land.moi.gov.tw）
- 準確率更高，但需計費（每筆）

---

### 層三：周遭設施查詢（POI）

**Overpass API（免費）**

查詢物件 1km 內的設施：

```
POST https://overpass-api.de/api/interpreter

data=[out:json][timeout:25];
(
  node["amenity"~"school|hospital|pharmacy|bank|supermarket|market"](around:1000,LAT,LON);
  node["public_transport"~"stop_position|platform"](around:500,LAT,LON);
  node["shop"~"supermarket|convenience"](around:500,LAT,LON);
);
out body;

回傳：設施名稱、類別、座標
```

**設施分類對應表**（不動產說明書用語）

| OSM tag | 說明書類別 |
|---------|-----------|
| amenity=school | 學校 |
| amenity=hospital | 醫療 |
| amenity=pharmacy | 醫療 |
| amenity=bank | 生活便利 |
| amenity=market / shop=supermarket | 生活便利 |
| public_transport=stop_position | 交通 |
| amenity=police | 治安 |

| 項目 | 內容 |
|------|------|
| API Key | 不需要 |
| 費用 | 完全免費 |
| 速率限制 | 合理使用（桌面 app 無問題） |
| 台灣資料品質 | 市區 ⭐⭐⭐⭐，農村 ⭐⭐⭐ |

---

## Leaflet.js 整合方式（Tauri + React）

```typescript
// 安裝
// npm install leaflet @types/leaflet

import L from 'leaflet';

// 初始化地圖
const map = L.map('map-container').setView([lat, lon], 15);

// 底圖（OSM）
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// 物件位置（紅點）
L.marker([lat, lon], { icon: redIcon }).addTo(map);

// 周遭設施（藍點）
facilities.forEach(f => {
  L.marker([f.lat, f.lon]).bindPopup(f.name).addTo(map);
});

// 截圖用於 PDF
// 使用 leaflet-image 套件產生 canvas → toDataURL
```

---

## PDF 輸出地圖

Tauri 桌面 app 截圖流程：
1. 在隱藏 div 渲染 Leaflet 地圖
2. 用 `html2canvas` 截取地圖 canvas → base64
3. 嵌入 HTML 模板右側預覽
4. 隨 HTML → PDF 一起輸出

---

## 周遭設施資料格式（系統內部）

```typescript
interface SurroundingFacility {
  name: string;
  category: '生活便利' | '學校' | '醫療' | '交通' | '治安';
  distanceMeters: number;
  lat: number;
  lon: number;
}

interface SurroundingMap {
  propertyLat: number;
  propertyLon: number;
  facilities: SurroundingFacility[];
  mapImageBase64?: string;  // 截圖後存入
  generatedAt: string;      // ISO 8601
}
```

---

## 相關文件

- 地政 API（謄本、公告現值等）→ `docs/land-registry-api-research.md`
- 業務邏輯 → `docs/aire-business-logic.md`
- 不動產說明書章節結構 → `docs/dossier-chapter-structure.md`
