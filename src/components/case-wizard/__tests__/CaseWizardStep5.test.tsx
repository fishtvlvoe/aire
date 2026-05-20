import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CaseWizardStep5 } from "../CaseWizardStep5";
import type { CaseRow } from "@/lib/cases-api";

vi.mock("@/lib/pdf-engine/assemble-dossier-data", () => ({
  assembleDossierData: vi.fn().mockResolvedValue({
    caseNo: "AIRE-TEST",
    propertyType: "building",
  }),
}));

vi.mock("@/lib/pdf-engine/react-pdf-init", () => ({
  initReactPdfEngine: vi.fn(),
}));

vi.mock("@/lib/pdf-engine/document", () => ({
  PdfDocument: () => React.createElement("div", null, "PDF"),
}));

vi.mock("@react-pdf/renderer", () => ({
  Document: ({ children }: { children: React.ReactNode }) => React.createElement("div", null, children),
  pdf: vi.fn(() => ({
    toBlob: vi.fn().mockResolvedValue(new Blob(["PDF"], { type: "application/pdf" })),
  })),
}));

const caseData: CaseRow = {
  id: "case-step5",
  case_no: "AIRE-TEST",
  case_name: "測試案件",
  property_type: "residential",
  land_lot_no: "",
  land_lots: [],
  building_lot_no: null,
  address: "台北市測試路 1 號",
  owner_name: "測試屋主",
  land_registry_data: null,
  current_step: 5,
  status: "draft",
  asking_price: null,
  created_at: 1,
  updated_at: 1,
};

describe("CaseWizardStep5", () => {
  const pdfBlob = new Blob(["PDF"], { type: "application/pdf" });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      "URL",
      Object.assign(URL, {
        createObjectURL: vi.fn().mockReturnValue("blob:case-step5-preview"),
        revokeObjectURL: vi.fn(),
      }),
    );
  });

  it("renders the same PDF blob inside an iframe that export downloads", async () => {
    const { pdf } = await import("@react-pdf/renderer");
    vi.mocked(pdf).mockReturnValue({
      toBlob: vi.fn().mockResolvedValue(pdfBlob),
    } as unknown as ReturnType<typeof pdf>);
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<CaseWizardStep5 caseId={caseData.id} caseData={caseData} />);

    const frame = await screen.findByTestId("dossier-preview-frame");

    await waitFor(() => {
      expect(frame).toHaveAttribute("src", "blob:case-step5-preview");
    });
    expect(frame).not.toHaveAttribute("srcdoc");
    expect(document.querySelector(".page")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /匯出 PDF/ }));

    await waitFor(() => {
      expect(anchorClick).toHaveBeenCalled();
    });
    expect(URL.createObjectURL).toHaveBeenNthCalledWith(1, pdfBlob);
    expect(URL.createObjectURL).toHaveBeenNthCalledWith(2, pdfBlob);
  });
});
