import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { CaseWizardStep4 } from "../case-wizard/CaseWizardStep4";
import type { CaseRow } from "@/lib/cases-api";

const mocks = vi.hoisted(() => ({
  assembleDossierData: vi.fn(),
}));

vi.mock("@/lib/pdf-engine/assemble-dossier-data", () => ({
  assembleDossierData: mocks.assembleDossierData,
}));

vi.mock("@/components/PdfPreviewer", () => ({
  PdfPreviewer: (props: { caseId: string; caseData?: { caseNo?: string } }) => (
    <div data-testid="step4-pdf-previewer">
      {props.caseId}|{props.caseData?.caseNo ?? "missing"}
    </div>
  ),
}));

const baseCase: CaseRow = {
  id: "case-001",
  case_no: "AIRE-001",
  case_name: "測試案件",
  property_type: "land",
  land_lot_no: "0001-0001",
  building_lot_no: null,
  address: "台南市東區測試路 1 號",
  owner_name: "王小明",
  land_registry_data: null,
  current_step: 4,
  status: "draft",
  created_at: 1,
  updated_at: 1,
};

describe("CaseWizardStep4", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.assembleDossierData.mockResolvedValue({
      caseNo: "AIRE-001",
      address: "台南市東區測試路 1 號",
      propertyType: "land",
      landLotNo: "0001-0001",
      ownerName: "王小明",
      companyName: "",
      generatedAt: "2026/05/16",
    });
  });

  it("assembles dossier data and passes it to PdfPreviewer", async () => {
    render(
      <CaseWizardStep4
        caseId={baseCase.id}
        caseData={baseCase}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("step4-pdf-previewer")).toHaveTextContent("case-001|AIRE-001");
    });

    expect(mocks.assembleDossierData).toHaveBeenCalledWith(baseCase);
  });
});
