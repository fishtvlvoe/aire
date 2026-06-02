export class MapGeocodingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MapGeocodingError";
  }
}

export class MapAmenitiesError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MapAmenitiesError";
  }
}

export interface Amenity {
  id: number;
  type: string;
  name: string;
  lat: number;
  lng: number;
}

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number }> {
  const trimmed = address.trim();
  if (!trimmed) {
    throw new MapGeocodingError("address is required");
  }
  let nominatimError: unknown;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmed)}`;
    const headers: Record<string, string> = { "Accept-Language": "zh-TW" };
    if (typeof window === "undefined") {
      headers["User-Agent"] = "AIRE local dossier generator";
    }
    const resp = await fetch(url, { headers });
    if (!resp.ok) throw new MapGeocodingError(`HTTP ${resp.status}`);
    const data = (await resp.json()) as Array<{ lat: string; lon: string }>;
    if (!data.length) throw new MapGeocodingError("geocoding returned empty results");
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch (err) {
    nominatimError = err;
  }

  const googleResult = await geocodeAddressWithGoogle(trimmed);
  if (googleResult) return googleResult;

  if (nominatimError instanceof MapGeocodingError) throw nominatimError;
  throw new MapGeocodingError(nominatimError instanceof Error ? nominatimError.message : "geocoding failed");
}

async function geocodeAddressWithGoogle(address: string): Promise<{ lat: number; lng: number } | null> {
  const key = typeof process !== "undefined" ? process.env.GOOGLE_MAPS_API_KEY : undefined;
  if (!key) return null;

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address", address);
    url.searchParams.set("region", "tw");
    url.searchParams.set("language", "zh-TW");
    url.searchParams.set("key", key);
    const resp = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) });
    if (!resp.ok) return null;
    const data = (await resp.json()) as {
      status?: string;
      results?: Array<{ geometry?: { location?: { lat?: number; lng?: number } } }>;
    };
    if (data.status !== "OK") return null;
    const location = data.results?.[0]?.geometry?.location;
    if (
      typeof location?.lat !== "number" ||
      !Number.isFinite(location.lat) ||
      typeof location.lng !== "number" ||
      !Number.isFinite(location.lng)
    ) {
      return null;
    }
    return { lat: location.lat, lng: location.lng };
  } catch {
    return null;
  }
}

export async function fetchAmenities(lat: number, lng: number, radiusM: number): Promise<Amenity[]> {
  try {
    const query = `[out:json];(node(around:${radiusM},${lat},${lng})[amenity];);out body;`;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new MapAmenitiesError(`HTTP ${resp.status}`);
    const data = (await resp.json()) as {
      elements: Array<{ id: number; type: string; tags: Record<string, string>; lat: number; lon: number }>;
    };
    return data.elements.map((el) => ({
      id: el.id,
      type: el.tags.amenity ?? el.tags.public_transport ?? "unknown",
      name: el.tags.name ?? "",
      lat: el.lat,
      lng: el.lon,
    }));
  } catch (err) {
    if (err instanceof MapAmenitiesError) throw err;
    throw new MapAmenitiesError(err instanceof Error ? err.message : "amenities fetch failed");
  }
}
