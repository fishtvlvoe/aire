import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

vi.mock("../../lib/map-api", () => ({
  geocodeAddress: vi.fn(),
  fetchAmenities: vi.fn(),
  MapGeocodingError: class MapGeocodingError extends Error {},
  MapAmenitiesError: class MapAmenitiesError extends Error {},
}));

describe("DossierSurroundingMap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows surrounding-map-container on success", async () => {
    const { geocodeAddress, fetchAmenities } = await import("../../lib/map-api");
    (geocodeAddress as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ lat: 25.02, lng: 121.54 });
    (fetchAmenities as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);
    const { DossierSurroundingMap } = await import("../DossierSurroundingMap");
    render(<DossierSurroundingMap address="台北市大安區和平東路一段100號" />);
    await waitFor(() => {
      expect(screen.getByTestId("surrounding-map-container")).toBeTruthy();
    });
  });

  it("shows error message when geocoding fails", async () => {
    const { geocodeAddress, MapGeocodingError } = await import("../../lib/map-api");
    (geocodeAddress as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new MapGeocodingError("geocoding failed")
    );
    const { DossierSurroundingMap } = await import("../DossierSurroundingMap");
    render(<DossierSurroundingMap address="不存在的地址" />);
    await waitFor(() => {
      expect(screen.getByText(/地圖載入失敗，請確認地址/)).toBeTruthy();
    });
  });
});
