import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("../../lib/map-api", () => ({
  geocodeAddress: vi.fn().mockResolvedValue({ lat: 25.02, lng: 121.54 }),
  fetchAmenities: vi.fn().mockResolvedValue([]),
  MapGeocodingError: class extends Error {},
  MapAmenitiesError: class extends Error {},
}));

describe("DisclosureHtmlPreview integration", () => {
  it("renders fee-stamp-tax=1800 when taxInputs provided", async () => {
    const { DisclosureHtmlPreview } = await import("../DisclosureHtmlPreview");
    render(
      <DisclosureHtmlPreview
        formState={{}}
        propertyType="residential"
        taxInputs={{
          contractPrice: 1000000,
          officialLandValue: 800000,
          shareRatio: 1,
          buildingCurrentValue: 200000,
          transactionDate: "2024-01-01",
          usage: "residential",
        }}
      />
    );
    expect(screen.getByTestId("fee-stamp-tax").textContent).toMatch(/1800/);
  });

  it("renders — when taxInputs is undefined", async () => {
    const { DisclosureHtmlPreview } = await import("../DisclosureHtmlPreview");
    render(<DisclosureHtmlPreview formState={{}} propertyType="residential" />);
    expect(screen.getByText("—")).toBeTruthy();
  });
});
