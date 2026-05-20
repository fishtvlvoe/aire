## Tasks

- [x] T1: 建立 `src/app/api/location-map/route.ts`
  - `GET` handler：讀 `lat`, `lng`, `zoom` query params
  - lat/lng 缺少或超出範圍 → `NextResponse.json({error:"invalid coordinates"}, {status:400})`
  - 呼叫 `fetchStaticMap({ lat, lng, zoom })` from `@/lib/osm-static-map`
  - 回傳空 bytes → `NextResponse.json({error:"map fetch failed"}, {status:502})`
  - 成功 → `new Response(buffer, { headers: { "Content-Type": "image/png" } })`
  - 驗證：`curl "http://localhost:3000/api/location-map?lat=25.04&lng=121.51" -o /tmp/map.png && file /tmp/map.png` 輸出 `PNG image data`

- [x] T2: 修改 `src/lib/pdf-engine/assemble-dossier-data.ts`
  - 在 `fetch_location_map` catch 區塊內新增 helper `fetchLocationMapWeb(lat: number, lng: number): Promise<Uint8Array | null>`
  - helper 呼叫 `fetch(\`/api/location-map?lat=\${lat}&lng=\${lng}\`)` → `arrayBuffer()` → `Uint8Array`；失敗回傳 null
  - catch 區塊：有 `geoLat`/`geoLng` → `fetchLocationMapWeb(geoLat, geoLng)` 賦值給 `locationMapImage`
  - 若 `geoLat === undefined` 且 `caseRow.address`非空：在 geoLat/geoLng 取值區塊前（lines ~242-248），補充 geocoding fallback：`const { lat: fbLat, lng: fbLng } = await geocodeAddress(caseRow.address)` → 再 `fetchLocationMapWeb`
  - 所有新邏輯在 try/catch 包裹
  - 驗證：web 預覽（CaseWizardStep5）說明書中「位置圖」顯示 OSM 地圖，非「待取得地圖資料後自動填入」

- [x] T3: 建立 `src/app/api/street-view/route.ts`（Mapillary 街景圖）
  - `GET /api/street-view?lat={lat}&lng={lng}`
  - 呼叫 `https://graph.mapillary.com/images?fields=id,thumb_2048_url&access_token=MAPILLARY_ACCESS_TOKEN&closeto={lng},{lat}&radius=100&limit=1`
  - 無結果 → HTTP 404 JSON `{"error":"no street view found"}`
  - 取得 `thumb_2048_url` → `fetch(url)` → 回傳 JPEG bytes（`Content-Type: image/jpeg`）
  - 驗證：`curl "http://localhost:3000/api/street-view?lat=25.04&lng=121.51" -o /tmp/sv.jpg && file /tmp/sv.jpg` 輸出 JPEG

- [x] T4: 建立 `src/lib/nlsc-aerial-map.ts` + `src/app/api/aerial-photo/route.ts`（NLSC 空拍圖）
  - `nlsc-aerial-map.ts`：`fetchAerialMap({ lat, lng, zoom?, width?, height? }): Promise<Uint8Array>`
  - WMTS tile URL：`https://wmts.nlsc.gov.tw/wmts/PHOTO2/default/GoogleMapsCompatible/{zoom}/{y}/{x}.png`
  - 拼貼邏輯與 `osm-static-map.ts` 相同（複製 tile fetch + sharp composite 邏輯，替換 URL pattern）
  - `aerial-photo/route.ts`：同 `location-map/route.ts` 結構，呼叫 `fetchAerialMap`
  - 驗證：`curl "http://localhost:3000/api/aerial-photo?lat=25.04&lng=121.51" -o /tmp/aerial.png && file /tmp/aerial.png`

- [x] T5: 修改 `assemble-dossier-data.ts`（street view + aerial fallback）
  - 參照 T2 模式，在 `fetch_aerial_photo` catch 加 fallback → `/api/aerial-photo`
  - 在 `fetch_street_view` catch 加 fallback → `/api/street-view`
  - 驗證：web 預覽說明書中「空拍圖」與「建物外觀」顯示真實圖片
