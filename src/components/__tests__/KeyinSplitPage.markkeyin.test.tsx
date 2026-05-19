import { describe, expect, it, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";

// 紅燈測試：KeyinSplitPage mount 時呼叫 casesApi.markKeyin（case-status-expansion）

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn().mockResolvedValue(null) }));
vi.mock("sonner", () => ({ toast: vi.fn(), success: vi.fn(), error: vi.fn() }));
vi.mock("@/lib/use-draft-autosave", () => ({
  useDraftAutosave: vi.fn().mockReturnValue({ state: "idle", savedAt: null, flush: vi.fn() }),
}));
vi.mock("@/components/disclosure-form-residential", () => ({
  default: () => <div />,
  DisclosureFormResidential: () => <div />,
}));
vi.mock("@/components/disclosure-form-land", () => ({
  default: () => <div />,
  DisclosureFormLand: () => <div />,
}));
vi.mock("../../lib/map-api", () => ({
  geocodeAddress: vi.fn().mockResolvedValue({ lat: 25.02, lng: 121.54 }),
  fetchAmenities: vi.fn().mockResolvedValue([]),
  MapGeocodingError: class extends Error {},
  MapAmenitiesError: class extends Error {},
}));

const mockMarkKeyin = vi.fn().mockResolvedValue(null);
vi.mock("@/lib/cases-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/cases-api")>();
  return {
    ...actual,
    casesApi: {
      ...actual.casesApi,
      markKeyin: mockMarkKeyin,
    },
  };
});

describe("KeyinSplitPage mark_keyin auto-transition", () => {
  beforeEach(() => vi.clearAllMocks());

  it("呼叫 casesApi.markKeyin(caseId) on mount", async () => {
    const { KeyinSplitPage } = await import("../KeyinSplitPage");
    render(<KeyinSplitPage caseId="test-case-123" propertyType="residential" />);

    await vi.waitFor(() => {
      expect(mockMarkKeyin).toHaveBeenCalledWith("test-case-123");
    });
  });
});
