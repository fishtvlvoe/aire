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
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
    const resp = await fetch(url, { headers: { "Accept-Language": "zh-TW" } });
    if (!resp.ok) throw new MapGeocodingError(`HTTP ${resp.status}`);
    const data = (await resp.json()) as Array<{ lat: string; lon: string }>;
    if (!data.length) throw new MapGeocodingError("geocoding returned empty results");
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch (err) {
    if (err instanceof MapGeocodingError) throw err;
    throw new MapGeocodingError(err instanceof Error ? err.message : "geocoding failed");
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
