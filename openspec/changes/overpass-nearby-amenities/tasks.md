## 1. Overpass API Client

- [x] 1.1 新增 src/lib/overpass-client.ts（涵蓋 Query nearby amenities via Tauri IPC 與 Amenity categories mapping to OSM tags）：實作 queryNearbyAmenities 函式，接收 {lat: number, lng: number, radiusM: number}，用 fetch 呼叫 https://overpass-api.de/api/interpreter，建構 Overpass QL 查詢五個類別（學校 amenity=school|university、醫院 amenity=hospital、公園 leisure=park、捷運 station=subway|railway=station、市場 amenity=marketplace|shop=supermarket），解析 JSON 回應轉為 NearbyAmenity[] 格式 {name, category, distanceM, address}，依 distanceM 遞增排序。網路失敗或 429 回傳空陣列並 console.warn。30 秒 timeout。[Tool: copilot]

## 2. 整合 assemble-dossier-data

- [x] 2.1 修改 src/lib/pdf-engine/assemble-dossier-data.ts 的 assembleDossierData 函式（nearby-amenities-api spec）：在土地版和建物版的 nearbyAmenities 欄位，import 並呼叫 queryNearbyAmenities（來自 src/lib/overpass-client.ts）。需要經緯度參數：先從 apiData 的 land_registry 或 building_registry 取 lat/lng，若無則跳過（回傳空陣列）。半徑固定 1000 公尺。用 try/catch 包裹，失敗時維持空陣列。[Tool: copilot]

## 3. 修正測試資料

- [x] 3.1 修正 scripts/test-html-pdf.ts 的 nearbyAmenities 測試資料格式：將 distance 字串欄位（如 "200m"）改為 distanceM 數字欄位（如 200），符合 NearbyAmenity 型別定義 {name, category, distanceM, address}。[Tool: copilot]

## 4. PDF 輸出驗證

- [x] 4.1 執行 npx tsx scripts/test-html-pdf.ts，確認土地版和建物版 PDF 的「生活機能」頁面顯示設施表格（名稱、距離 m、地址），而非「尚未查詢周邊設施」。[Tool: sonnet]
