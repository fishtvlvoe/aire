import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/use-draft-autosave", () => ({
  useDraftAutosave: vi.fn().mockReturnValue({ state: "idle", savedAt: null, flush: vi.fn() }),
  loadDraft: vi.fn().mockResolvedValue(null),
}));
vi.mock("../../lib/map-api", () => ({
  geocodeAddress: vi.fn().mockResolvedValue({ lat: 25.02, lng: 121.54 }),
  fetchAmenities: vi.fn().mockResolvedValue([]),
  MapGeocodingError: class extends Error {},
  MapAmenitiesError: class extends Error {},
}));
vi.mock("@/components/disclosure-form-residential", () => ({
  DisclosureFormResidential: ({ onChange }: { onChange?: (v: Record<string, unknown>) => void }) => {
    return <div data-testid="mock-form-residential" onClick={() => onChange?.({
      transaction_price: 1000000,
      tax_land_value: 800000,
      tax_building_value: 200000,
      usage_type: "residential",
      transfer_date: "2024-01-01",
    })} />;
  },
  default: ({ onChange }: { onChange?: (v: Record<string, unknown>) => void }) => {
    return <div data-testid="mock-form-residential" onClick={() => onChange?.({
      transaction_price: 1000000,
      tax_land_value: 800000,
      tax_building_value: 200000,
      usage_type: "residential",
      transfer_date: "2024-01-01",
    })} />;
  },
}));
vi.mock("@/components/disclosure-form-land", () => ({
  DisclosureFormLand: () => <div data-testid="mock-form-land" />,
  default: () => <div data-testid="mock-form-land" />,
}));

describe("KeyinSplitPage fee-stamp-tax preview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows fee-stamp-tax=1800 when formState has valid tax fields", async () => {
    const { invoke } = await import("@tauri-apps/api/core");
    (invoke as ReturnType<typeof vi.fn>).mockResolvedValue({
      payload_json: JSON.stringify({
        transaction_price: 1000000,
        tax_land_value: 800000,
        tax_building_value: 200000,
        usage_type: "residential",
        transfer_date: "2024-01-01",
      }),
    });
    const { KeyinSplitPage } = await import("../KeyinSplitPage");
    render(<KeyinSplitPage caseId="test-case" propertyType="residential" />);
    await waitFor(() => {
      expect(screen.getByTestId("fee-stamp-tax").textContent).toMatch(/1800/);
    });
  });

  it("shows — when formState is empty", async () => {
    const { invoke } = await import("@tauri-apps/api/core");
    (invoke as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const { KeyinSplitPage } = await import("../KeyinSplitPage");
    render(<KeyinSplitPage caseId="test-case" propertyType="residential" />);
    await waitFor(() => {
      expect(screen.getByText("—")).toBeTruthy();
    });
  });
});
