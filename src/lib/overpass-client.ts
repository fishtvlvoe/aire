export interface NearbyAmenity {
  name: string;
  category: string;
  distanceM: number;
  address: string;
}

/**
 * 用 Haversine 公式計算兩個經緯度座標之間的直線距離（公尺）
 */
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // 地球半徑（公尺）
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * 根據 element tags 推斷所屬中文類別
 */
function inferCategory(tags: Record<string, string>): string | null {
  const amenity = tags.amenity;
  const shop = tags.shop;
  const leisure = tags.leisure;
  const railway = tags.railway;
  const station = tags.station;

  if (amenity === 'school' || amenity === 'university') return '學校';
  if (amenity === 'hospital') return '醫院';
  if (leisure === 'park') return '公園';
  if (station === 'subway' || railway === 'station') return '捷運';
  if (amenity === 'marketplace' || shop === 'supermarket') return '市場';

  return null;
}

/**
 * 從 tags 組合出地址字串
 */
function extractAddress(tags: Record<string, string>): string {
  if (tags['addr:full']) {
    return tags['addr:full'];
  }

  const street = tags['addr:street'] || '';
  const housenumber = tags['addr:housenumber'] || '';

  if (street && housenumber) {
    return `${street} ${housenumber}`;
  }

  return street || housenumber;
}

/**
 * 組合 Overpass QL 查詢語句
 */
function buildOverpassQuery(lat: number, lng: number, radiusM: number): string {
  return `
[out:json];
(
  node["amenity"="school"](around:${radiusM},${lat},${lng});
  node["amenity"="university"](around:${radiusM},${lat},${lng});
  node["amenity"="hospital"](around:${radiusM},${lat},${lng});
  node["leisure"="park"](around:${radiusM},${lat},${lng});
  way["leisure"="park"](around:${radiusM},${lat},${lng});
  node["station"="subway"](around:${radiusM},${lat},${lng});
  node["railway"="station"](around:${radiusM},${lat},${lng});
  node["amenity"="marketplace"](around:${radiusM},${lat},${lng});
  node["shop"="supermarket"](around:${radiusM},${lat},${lng});
);
out center;
  `.trim();
}

/**
 * 向 Overpass API 查詢指定經緯度與半徑內的附近設施
 */
export async function queryNearbyAmenities(params: {
  lat: number;
  lng: number;
  radiusM: number;
}): Promise<NearbyAmenity[]> {
  const { lat, lng, radiusM } = params;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 秒逾時

    const query = buildOverpassQuery(lat, lng, radiusM);

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Overpass API responded with ${response.status}`);
    }

    const data = await response.json();
    const elements = Array.isArray(data.elements) ? data.elements : [];

    const amenities: NearbyAmenity[] = [];

    for (const element of elements) {
      const tags: Record<string, string> = element.tags || {};
      const name = tags.name || tags['name:zh'] || '';

      // 過濾掉沒有名稱的項目
      if (!name.trim()) {
        continue;
      }

      const category = inferCategory(tags);
      if (!category) {
        continue;
      }

      const elLat = element.lat ?? element.center?.lat;
      const elLon = element.lon ?? element.center?.lon;

      if (typeof elLat !== 'number' || typeof elLon !== 'number') {
        continue;
      }

      const distanceM = haversine(lat, lng, elLat, elLon);
      const address = extractAddress(tags);

      amenities.push({
        name: name.trim(),
        category,
        distanceM: Math.round(distanceM),
        address,
      });
    }

    // 依距離遞增排序
    amenities.sort((a, b) => a.distanceM - b.distanceM);

    return amenities;
  } catch (err) {
    console.warn('[overpass-client] query failed:', err);
    return [];
  }
}
