import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

describe("geocodeAddress", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("returns {lat, lng} for a valid address", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => [{ lat: "25.02", lon: "121.54", display_name: "台北市" }],
    });
    const { geocodeAddress } = await import("../map-api");
    const result = await geocodeAddress("台北市大安區和平東路一段100號");
    expect(result.lat).toBeCloseTo(25.02, 0);
    expect(result.lng).toBeCloseTo(121.54, 0);
  });

  it("throws MapGeocodingError for empty address", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });
    const { geocodeAddress, MapGeocodingError } = await import("../map-api");
    await expect(geocodeAddress("")).rejects.toBeInstanceOf(MapGeocodingError);
  });

  it("throws MapGeocodingError on network failure", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("network error"));
    const { geocodeAddress, MapGeocodingError } = await import("../map-api");
    await expect(geocodeAddress("台北市")).rejects.toBeInstanceOf(MapGeocodingError);
  });

  it("falls back to Google geocoding when Nominatim cannot resolve a Taiwan address", async () => {
    vi.stubEnv("GOOGLE_MAPS_API_KEY", "test-google-key");
    (fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: "OK",
          results: [{ geometry: { location: { lat: 23.001, lng: 120.222 } } }],
        }),
      });

    const { geocodeAddress } = await import("../map-api");
    const result = await geocodeAddress("台南市永康區勝利街58巷4號");

    expect(result).toEqual({ lat: 23.001, lng: 120.222 });
    expect(fetch).toHaveBeenLastCalledWith(
      expect.stringContaining("maps.googleapis.com/maps/api/geocode/json"),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });
});

describe("fetchAmenities", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns Amenity[] from Overpass response", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        elements: [
          { id: 1, type: "node", tags: { amenity: "school", name: "測試學校" }, lat: 25.02, lon: 121.54 },
        ],
      }),
    });
    const { fetchAmenities } = await import("../map-api");
    const amenities = await fetchAmenities(25.02, 121.54, 1000);
    expect(amenities).toHaveLength(1);
    expect(amenities[0].type).toBe("school");
    expect(amenities[0].name).toBe("測試學校");
  });

  it("throws MapAmenitiesError on network failure", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("network error"));
    const { fetchAmenities, MapAmenitiesError } = await import("../map-api");
    await expect(fetchAmenities(25.02, 121.54, 1000)).rejects.toBeInstanceOf(MapAmenitiesError);
  });
});
