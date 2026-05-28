import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn().mockResolvedValue(null) }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("sonner", () => ({ toast: vi.fn(), success: vi.fn(), error: vi.fn() }));
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

describe("KeyinSplitPage object survey fields", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows building-oriented survey fields for building cases", async () => {
    const { KeyinSplitPage } = await import("../KeyinSplitPage");

    render(<KeyinSplitPage caseId="building-case" propertyType="residential" />);

    expect(screen.getByText("現場必問")).toBeInTheDocument();
    expect(screen.getByLabelText("銷售樓別")).toBeInTheDocument();
    expect(screen.getByLabelText("總樓層")).toBeInTheDocument();
    expect(screen.getByLabelText("格局")).toBeInTheDocument();
    expect(screen.getByLabelText("現況")).toBeInTheDocument();
    expect(screen.getByLabelText("用途")).toBeInTheDocument();
    expect(screen.getByLabelText("管理方式")).toBeInTheDocument();
    expect(screen.getByText("格局圖")).toBeInTheDocument();
    expect(screen.getByText("室內照片")).toBeInTheDocument();
  });

  it("shows land-oriented survey fields for land cases", async () => {
    const user = userEvent.setup();
    const { KeyinSplitPage } = await import("../KeyinSplitPage");

    render(<KeyinSplitPage caseId="land-case" propertyType="land" />);

    expect(screen.getByLabelText("使用分區")).toBeInTheDocument();
    expect(screen.getByLabelText("地目 / 使用現況")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "現況" }));
    expect(screen.getByLabelText("臨路")).toBeInTheDocument();
    expect(screen.getByLabelText("面寬")).toBeInTheDocument();
    expect(screen.getByLabelText("深度")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "圖資" }));
    expect(screen.getByLabelText("地籍圖")).toBeInTheDocument();
    expect(screen.getByLabelText("空拍圖")).toBeInTheDocument();
    expect(screen.getByLabelText("地標圖")).toBeInTheDocument();
  });
});
