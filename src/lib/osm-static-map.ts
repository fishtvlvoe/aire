import sharp from 'sharp';

const TILE_SIZE = 256;
const DEFAULT_ZOOM = 16;
const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 400;
const USER_AGENT = 'AIRE/1.0 (real-estate disclosure)';
const TIMEOUT_MS = 30000;

/**
 * 將角度轉換為弧度
 */
function deg2rad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * 將經緯度轉換為指定 zoom 層級的世界像素座標（連續值）
 */
function latLngToPixel(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const numTiles = Math.pow(2, zoom);
  const worldSize = numTiles * TILE_SIZE;

  // x 方向為等距投影
  const x = ((lng + 180) / 360) * worldSize;

  // y 方向為 Mercator 投影
  const latRad = deg2rad(lat);
  const y =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
    worldSize;

  return { x, y };
}

/**
 * 根據中心經緯度與縮放層級，下載 OpenStreetMap tiles 並拼貼成靜態地圖。
 * 輸出包含紅色標記與版權宣告的 PNG 圖片（Uint8Array）。
 */
export async function fetchStaticMap(params: {
  lat: number;
  lng: number;
  zoom?: number;
  width?: number;
  height?: number;
}): Promise<Uint8Array> {
  const {
    lat,
    lng,
    zoom = DEFAULT_ZOOM,
    width = DEFAULT_WIDTH,
    height = DEFAULT_HEIGHT,
  } = params;

  // 1. 座標驗證：lat 必須在 -90~90，lng 必須在 -180~180
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    console.warn(`[osm-static-map] Invalid coordinates: lat=${lat}, lng=${lng}`);
    return new Uint8Array();
  }

  try {
    const numTiles = Math.pow(2, zoom);
    const centerPixel = latLngToPixel(lat, lng, zoom);

    // 計算畫布左上角在世界像素座標系中的位置
    const canvasLeftWorld = centerPixel.x - width / 2;
    const canvasTopWorld = centerPixel.y - height / 2;

    // 計算需要下載的 tile 索引範圍（含）
    const minTileX = Math.floor(canvasLeftWorld / TILE_SIZE);
    const maxTileX = Math.ceil((canvasLeftWorld + width) / TILE_SIZE) - 1;
    const minTileY = Math.floor(canvasTopWorld / TILE_SIZE);
    const maxTileY = Math.ceil((canvasTopWorld + height) / TILE_SIZE) - 1;

    const compositeInputs: Array<{ input: Buffer; left: number; top: number }> = [];

    // 2. 下載所有需要的 tiles
    for (let ty = minTileY; ty <= maxTileY; ty++) {
      for (let tx = minTileX; tx <= maxTileX; tx++) {
        // 處理 x 方向 wrap-around（經度跨越 +/-180 時）
        const normTx = ((tx % numTiles) + numTiles) % numTiles;
        // 限制 y 方向在合法範圍內（避免極點外溢）
        const normTy = Math.max(0, Math.min(numTiles - 1, ty));

        // 若 y 超出合法範圍，跳過該 tile（實務上極少發生）
        if (ty < 0 || ty >= numTiles) {
          continue;
        }

        const url = `https://tile.openstreetmap.org/${zoom}/${normTx}/${normTy}.png`;

        const response = await fetch(url, {
          headers: { 'User-Agent': USER_AGENT },
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });

        if (!response.ok) {
          console.warn(
            `[osm-static-map] Failed to fetch tile: ${url} (status: ${response.status})`
          );
          return new Uint8Array();
        }

        const arrayBuffer = await response.arrayBuffer();
        const tileBuffer = Buffer.from(arrayBuffer);

        // 計算該 tile 在畫布上的像素偏移（使用原始 tx/ty 維持連續座標）
        const left = Math.round(tx * TILE_SIZE - canvasLeftWorld);
        const top = Math.round(ty * TILE_SIZE - canvasTopWorld);

        compositeInputs.push({ input: tileBuffer, left, top });
      }
    }

    // 3. 建立空白畫布（白色背景）
    const canvas = sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    });

    // 4. 加入紅色圓圈標記（置於中心點，即物件位置）
    const markerSvg = Buffer.from(
      `<svg width="20" height="20"><circle cx="10" cy="10" r="8" fill="red" fill-opacity="0.7" stroke="white" stroke-width="2"/></svg>`
    );
    compositeInputs.push({
      input: markerSvg,
      left: Math.round(width / 2 - 10),
      top: Math.round(height / 2 - 10),
    });

    // 5. 加入版權宣告（右下角）
    const attributionSvg = Buffer.from(
      `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <text x="${width - 10}" y="${height - 10}" font-family="Arial, sans-serif" font-size="12" fill="rgba(0,0,0,0.5)" text-anchor="end">© OpenStreetMap contributors</text>
      </svg>`
    );
    compositeInputs.push({
      input: attributionSvg,
      left: 0,
      top: 0,
    });

    // 6. 拼貼所有圖層並輸出為 PNG Buffer，再轉為 Uint8Array
    const buffer = await canvas.composite(compositeInputs).png().toBuffer();
    return new Uint8Array(buffer);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[osm-static-map] Network or processing error: ${message}`);
    return new Uint8Array();
  }
}
