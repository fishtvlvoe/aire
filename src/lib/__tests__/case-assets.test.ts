import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  safeInvoke: vi.fn(),
}));

vi.mock("@/lib/tauri-bridge", () => ({
  safeInvoke: mocks.safeInvoke,
}));

describe("case asset slots", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.safeInvoke.mockResolvedValue({ id: "asset-1" });
  });

  it("exposes all MVP image slots beyond floor_plan", async () => {
    const { CASE_ASSET_KINDS, isAcceptedCaseAssetKind } = await import("@/lib/floor-plan-assets");

    expect(CASE_ASSET_KINDS).toEqual([
      "company_logo",
      "floor_plan",
      "exterior_photo",
      "location_map",
      "surrounding_map",
      "cadastral_map",
      "field_survey_photo",
      "other_site_photo",
    ]);
    expect(isAcceptedCaseAssetKind("location_map")).toBe(true);
    expect(isAcceptedCaseAssetKind("unknown")).toBe(false);
  });

  it("imports a non-floor-plan image through the generic import_case_asset payload", async () => {
    const { importCaseAsset } = await import("@/lib/floor-plan-assets");

    await importCaseAsset({
      caseId: "case-1",
      kind: "location_map",
      fileName: "map.png",
      mimeType: "image/png",
      fileBytes: new Uint8Array([1, 2, 3]),
      source: "manual_upload",
      metadata: { slot: "location_map" },
    });

    expect(mocks.safeInvoke).toHaveBeenCalledWith("import_case_asset", {
      payload: {
        case_id: "case-1",
        kind: "location_map",
        source: "manual_upload",
        file_name: "map.png",
        mime_type: "image/png",
        file_bytes: [1, 2, 3],
        metadata_json: JSON.stringify({ slot: "location_map" }),
      },
    });
  });

  it("keeps floor-plan compatibility wrappers on top of generic case assets", async () => {
    const { importFloorPlanAsset, listFloorPlanAssets } = await import("@/lib/floor-plan-assets");

    await importFloorPlanAsset({
      caseId: "case-2",
      fileName: "floor.webp",
      mimeType: "image/webp",
      fileBytes: new Uint8Array([9]),
    });
    await listFloorPlanAssets("case-2");

    expect(mocks.safeInvoke).toHaveBeenNthCalledWith(1, "import_case_asset", {
      payload: expect.objectContaining({
        case_id: "case-2",
        kind: "floor_plan",
        source: "manual_upload",
      }),
    });
    expect(mocks.safeInvoke).toHaveBeenNthCalledWith(2, "list_case_assets", {
      case_id: "case-2",
      kind: "floor_plan",
    });
  });
});
