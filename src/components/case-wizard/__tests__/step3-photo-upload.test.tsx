import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CaseWizardStep3Disclosure } from "@/components/case-wizard/CaseWizardStep3Disclosure";
import { casesApi } from "@/lib/cases-api";
import { importFloorPlanAsset, listFloorPlanAssets } from "@/lib/floor-plan-assets";
import type { CaseRow } from "@/lib/cases-api";

vi.mock("@/lib/cases-api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/cases-api")>("@/lib/cases-api");
  return {
    ...actual,
    casesApi: {
      ...actual.casesApi,
      update: vi.fn().mockResolvedValue({}),
    },
  };
});

vi.mock("@/lib/storage", () => ({
  storage: {
    getCaseDisclosures: vi.fn().mockResolvedValue(null),
    saveCaseDisclosures: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("@/lib/use-draft-autosave", () => ({
  loadDraft: vi.fn().mockResolvedValue(null),
  useDraftAutosave: vi.fn().mockReturnValue({ flush: vi.fn(), state: "idle", savedAt: null }),
}));

vi.mock("@/lib/floor-plan-assets", async () => {
  const actual = await vi.importActual<typeof import("@/lib/floor-plan-assets")>(
    "@/lib/floor-plan-assets",
  );
  return {
    ...actual,
    importFloorPlanAsset: vi.fn().mockResolvedValue({ id: "asset-1" }),
    listFloorPlanAssets: vi.fn().mockResolvedValue([]),
    readCaseAssetBytes: vi.fn(),
  };
});

vi.mock("@/components/disclosure-form-residential", () => ({
  DisclosureFormResidential: () => <div data-testid="disclosure-form-residential" />,
}));

vi.mock("@/components/disclosure-form-land", () => ({
  DisclosureFormLand: () => <div data-testid="disclosure-form-land" />,
}));

const baseCase: CaseRow = {
  id: "case-photo-001",
  case_no: "AIRE-PHOTO",
  property_type: "residential",
  land_lot_no: "",
  land_lots: [],
  address: "台南市永康區勝利街58巷4號1樓",
  owner_name: "測試屋主",
  land_registry_data: null,
  status: "draft",
  created_at: 1700000000,
  updated_at: 1700000000,
};

function renderStep(caseData: CaseRow) {
  render(
    <CaseWizardStep3Disclosure
      caseId={caseData.id}
      caseData={caseData}
      onNext={vi.fn()}
      onPrev={vi.fn()}
    />,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("URL", {
    createObjectURL: vi.fn(() => "blob:floor-plan-preview"),
    revokeObjectURL: vi.fn(),
  });
});

describe("CaseWizardStep3Disclosure photo upload", () => {
  it("renders floor-plan upload input for residential cases", async () => {
    renderStep({ ...baseCase, property_type: "residential" });

    expect(await screen.findByTestId("floor-plan-file-input")).toBeInTheDocument();
  });

  it("renders planning-map upload input for land cases", async () => {
    renderStep({ ...baseCase, property_type: "land" });

    expect(await screen.findByTestId("planning-map-file-input")).toBeInTheDocument();
  });

  it("rejects files larger than 10MB without persisting", async () => {
    renderStep({ ...baseCase, property_type: "residential" });
    const input = await screen.findByTestId("floor-plan-file-input");
    const file = new File([new Uint8Array([1])], "large.png", { type: "image/png" });
    Object.defineProperty(file, "size", { value: 10 * 1024 * 1024 + 1 });

    fireEvent.change(input, { target: { files: [file] } });

    expect(await screen.findByText("圖片大小不超過 10MB")).toBeInTheDocument();
    expect(casesApi.update).not.toHaveBeenCalled();
    expect(importFloorPlanAsset).not.toHaveBeenCalled();
  });

  it("imports a valid PNG through case_assets instead of land_registry_data", async () => {
    renderStep({
      ...baseCase,
      land_registry_data: { existing_key: "keep-me" },
    });
    const input = await screen.findByTestId("floor-plan-file-input");
    const file = new File([new Uint8Array([1, 2, 3])], "floor-plan.png", {
      type: "image/png",
    });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(importFloorPlanAsset).toHaveBeenCalledWith(
        expect.objectContaining({
          caseId: baseCase.id,
          fileName: "floor-plan.png",
          mimeType: "image/png",
          fileBytes: new Uint8Array([1, 2, 3]),
          metadata: {
            uploaded_from: "case_wizard_step_3",
          },
        }),
      );
    });
    expect(casesApi.update).not.toHaveBeenCalled();
  });

  it("restores preview from case asset when present", async () => {
    vi.mocked(listFloorPlanAssets).mockResolvedValueOnce([
      {
        id: "asset-existing",
        case_id: baseCase.id,
        kind: "floor_plan",
        source: "manual_upload",
        trust_tier: "assistant_uploaded",
        review_status: "approved",
        is_primary: true,
        file_name: "floor.png",
        mime_type: "image/png",
        size_bytes: 3,
        storage_path: "/tmp/floor.png",
        metadata_json: "{}",
        created_at: "2026-05-20T12:00:00+08:00",
        updated_at: "2026-05-20T12:00:00+08:00",
      },
    ]);
    const { readCaseAssetBytes } = await import("@/lib/floor-plan-assets");
    vi.mocked(readCaseAssetBytes).mockResolvedValueOnce({ bytes: [1, 2, 3], mime: "image/png" });

    renderStep(baseCase);

    await waitFor(() => {
      expect(screen.getByTestId("floor-plan-preview")).toBeInTheDocument();
    });
  });

  it("restores preview from persisted floor_plan_photo data", async () => {
    renderStep({
      ...baseCase,
      land_registry_data: {
        floor_plan_photo: {
          base64: "AQID",
          mime: "image/png",
        },
      },
    });

    await waitFor(() => {
      expect(screen.getByTestId("floor-plan-preview")).toBeInTheDocument();
    });
  });
});
