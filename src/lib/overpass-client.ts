export interface NearbyAmenity {
  name: string;
  category: string;
  distanceM: number;
  address: string;
}

const LIFE_AMENITY_LIMITS: Record<string, number> = {
  學校: 10,
  醫療: 3,
  醫院: 3,
  公園: 1,
  捷運: 1,
  市場: 2,
};

const GOOGLE_PLACE_TYPES: Array<{ category: NearbyAmenity["category"]; type: string }> = [
  { category: "學校", type: "school" },
  { category: "醫療", type: "hospital" },
  { category: "醫療", type: "doctor" },
  { category: "公園", type: "park" },
  { category: "捷運", type: "subway_station" },
  { category: "市場", type: "supermarket" },
];

const FORMAL_SCHOOL_NAME_PATTERNS = [
  /國民小學/,
  /國小/,
  /小學/,
  /國民中學/,
  /國中/,
  /(?:^|[^\u4e00-\u9fa5])中學/,
  /高中/,
  /高級中學/,
  /高職/,
  /高級職業/,
  /高工/,
  /高商/,
  /高農/,
  /專科學校/,
  /大學/,
  /科技大學/,
  /學院/,
];

const NON_FORMAL_SCHOOL_NAME_PATTERNS = [
  /幼兒園/,
  /托嬰/,
  /補習班/,
  /文理/,
  /才藝/,
  /音樂/,
  /樂團/,
  /古箏/,
  /舞蹈/,
  /美語/,
  /語言/,
  /教室/,
  /教學/,
  /展演/,
  /工作室/,
];

export function isFormalSchoolName(name: string): boolean {
  const normalized = name.trim();
  if (!normalized) return false;
  if (NON_FORMAL_SCHOOL_NAME_PATTERNS.some((pattern) => pattern.test(normalized))) return false;
  return FORMAL_SCHOOL_NAME_PATTERNS.some((pattern) => pattern.test(normalized));
}

function isAllowedAmenity(item: Pick<NearbyAmenity, "category" | "name">): boolean {
  if (item.category === "學校") return isFormalSchoolName(item.name);
  if (item.category === "醫療" || item.category === "醫院") return isRelevantMedicalAmenity(item.name);
  return true;
}

function isRelevantMedicalAmenity(name: string): boolean {
  const normalized = name.trim();
  if (!normalized) return false;
  if (/牙醫|齒科|牙科|植牙|矯正|醫美|美容|動物醫院|獸醫/.test(normalized)) return false;
  return /醫院|醫學中心|成大|診所|小兒科|兒科|家醫科|家庭醫學|內科|耳鼻喉科|聯合診所/.test(normalized);
}

function amenityRank(item: NearbyAmenity): number {
  if (item.category === "醫療" || item.category === "醫院") {
    if (/成大|成功大學|醫學中心|醫院/.test(item.name)) return 0;
    if (/小兒科|兒科|家醫科|家庭醫學|內科|耳鼻喉科|聯合診所/.test(item.name)) return 1;
    return 2;
  }
  return 0;
}

export function summarizeNearbyAmenities(items: NearbyAmenity[]): NearbyAmenity[] {
  const counts = new Map<string, number>();
  return [...items]
    .sort((a, b) => (amenityRank(a) - amenityRank(b)) || (a.distanceM - b.distanceM))
    .filter((item) => {
      if (!isAllowedAmenity(item)) return false;
      const limit = LIFE_AMENITY_LIMITS[item.category] ?? 0;
      if (limit === 0) return false;
      const count = counts.get(item.category) ?? 0;
      if (count >= limit) return false;
      counts.set(item.category, count + 1);
      return true;
    });
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
  if (amenity === 'hospital' || amenity === 'clinic' || amenity === 'doctors') return '醫療';
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
  way["amenity"="school"](around:${radiusM},${lat},${lng});
  relation["amenity"="school"](around:${radiusM},${lat},${lng});
  node["amenity"="university"](around:${radiusM},${lat},${lng});
  way["amenity"="university"](around:${radiusM},${lat},${lng});
  relation["amenity"="university"](around:${radiusM},${lat},${lng});
  node["amenity"="hospital"](around:${radiusM},${lat},${lng});
  way["amenity"="hospital"](around:${radiusM},${lat},${lng});
  relation["amenity"="hospital"](around:${radiusM},${lat},${lng});
  node["amenity"="clinic"](around:${radiusM},${lat},${lng});
  way["amenity"="clinic"](around:${radiusM},${lat},${lng});
  relation["amenity"="clinic"](around:${radiusM},${lat},${lng});
  node["amenity"="doctors"](around:${radiusM},${lat},${lng});
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
      if (!isAllowedAmenity({ category, name })) {
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
  } catch {
    return [];
  }
}

export async function queryGoogleNearbyAmenities(params: {
  lat: number;
  lng: number;
  radiusM: number;
  apiKey: string;
}): Promise<NearbyAmenity[]> {
  const { lat, lng, radiusM, apiKey } = params;
  if (!apiKey.trim()) return [];

  try {
    const rows = await Promise.all(
      GOOGLE_PLACE_TYPES.map(async ({ category, type }) => {
        const url = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json");
        url.searchParams.set("location", `${lat},${lng}`);
        url.searchParams.set("radius", String(radiusM));
        url.searchParams.set("type", type);
        url.searchParams.set("language", "zh-TW");
        url.searchParams.set("key", apiKey);

        const response = await fetch(url.toString());
        if (!response.ok) return [];
        const data = await response.json() as {
          status?: string;
          results?: Array<{
            place_id?: string;
            name?: string;
            vicinity?: string;
            formatted_address?: string;
            geometry?: { location?: { lat?: number; lng?: number } };
          }>;
        };
        if (data.status && !["OK", "ZERO_RESULTS"].includes(data.status)) return [];
        return (Array.isArray(data.results) ? data.results : [])
          .map((place): NearbyAmenity | null => {
            const name = place.name?.trim();
            const placeLat = place.geometry?.location?.lat;
            const placeLng = place.geometry?.location?.lng;
            if (!name || typeof placeLat !== "number" || typeof placeLng !== "number") return null;
            if (!isAllowedAmenity({ category, name })) return null;
            return {
              name,
              category,
              distanceM: Math.round(haversine(lat, lng, placeLat, placeLng)),
              address: place.vicinity?.trim() || place.formatted_address?.trim() || "",
            };
          })
          .filter((item): item is NearbyAmenity => Boolean(item));
      }),
    );

    const seen = new Set<string>();
    return rows
      .flat()
      .filter((item) => {
        const key = `${item.category}:${item.name}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => a.distanceM - b.distanceM);
  } catch {
    return [];
  }
}

export async function queryNearbyAmenitiesWithGoogleFallback(params: {
  lat: number;
  lng: number;
  radiusM: number;
  googleApiKey?: string;
}): Promise<NearbyAmenity[]> {
  const [googleItems, overpassItems] = await Promise.all([
    params.googleApiKey
      ? queryGoogleNearbyAmenities({ ...params, apiKey: params.googleApiKey })
      : Promise.resolve([]),
    queryNearbyAmenities(params),
  ]);
  return [...googleItems, ...overpassItems];
}
