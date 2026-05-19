import sharp from "sharp";

const TILE_SIZE = 256;
const DEFAULT_ZOOM = 17;
const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 400;
// NLSC PHOTO2 WMTS（台灣正射影像 - Google Maps Compatible）
const TILE_URL = (zoom: number, x: number, y: number) =>
  `https://wmts.nlsc.gov.tw/wmts/PHOTO2/default/GoogleMapsCompatible/${zoom}/${y}/${x}`;
const TIMEOUT_MS = 30000;

function deg2rad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function latLngToPixel(lat: number, lng: number, zoom: number) {
  const numTiles = Math.pow(2, zoom);
  const worldSize = numTiles * TILE_SIZE;
  const x = ((lng + 180) / 360) * worldSize;
  const latRad = deg2rad(lat);
  const y =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
    worldSize;
  return { x, y };
}

export async function fetchAerialMap(params: {
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

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    console.warn(`[nlsc-aerial-map] Invalid coordinates: lat=${lat}, lng=${lng}`);
    return new Uint8Array();
  }

  try {
    const numTiles = Math.pow(2, zoom);
    const centerPixel = latLngToPixel(lat, lng, zoom);

    const canvasLeftWorld = centerPixel.x - width / 2;
    const canvasTopWorld = centerPixel.y - height / 2;

    const minTileX = Math.floor(canvasLeftWorld / TILE_SIZE);
    const maxTileX = Math.ceil((canvasLeftWorld + width) / TILE_SIZE) - 1;
    const minTileY = Math.floor(canvasTopWorld / TILE_SIZE);
    const maxTileY = Math.ceil((canvasTopWorld + height) / TILE_SIZE) - 1;

    const compositeInputs: Array<{ input: Buffer; left: number; top: number }> = [];

    for (let ty = minTileY; ty <= maxTileY; ty++) {
      for (let tx = minTileX; tx <= maxTileX; tx++) {
        if (ty < 0 || ty >= numTiles) continue;
        const normTx = ((tx % numTiles) + numTiles) % numTiles;
        const normTy = Math.max(0, Math.min(numTiles - 1, ty));

        const url = TILE_URL(zoom, normTx, normTy);
        const response = await fetch(url, {
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });

        if (!response.ok) {
          console.warn(`[nlsc-aerial-map] Failed to fetch tile: ${url} (${response.status})`);
          return new Uint8Array();
        }

        const arrayBuffer = await response.arrayBuffer();
        const tileBuffer = Buffer.from(arrayBuffer);

        const left = Math.round(tx * TILE_SIZE - canvasLeftWorld);
        const top = Math.round(ty * TILE_SIZE - canvasTopWorld);
        compositeInputs.push({ input: tileBuffer, left, top });
      }
    }

    const canvas = sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 20, g: 20, b: 20, alpha: 1 },
      },
    });

    const markerSvg = Buffer.from(
      `<svg width="20" height="20"><circle cx="10" cy="10" r="8" fill="red" fill-opacity="0.7" stroke="white" stroke-width="2"/></svg>`
    );
    compositeInputs.push({
      input: markerSvg,
      left: Math.round(width / 2 - 10),
      top: Math.round(height / 2 - 10),
    });

    const buffer = await canvas.composite(compositeInputs).png().toBuffer();
    return new Uint8Array(buffer);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[nlsc-aerial-map] Error: ${message}`);
    return new Uint8Array();
  }
}
