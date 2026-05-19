import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CaseWizard } from "../case-wizard/CaseWizard";
import type { CaseRow } from "@/lib/cases-api";

const mocks = vi.hoisted(() => ({
  getCase: vi.fn(),
  updateCase: vi.fn(),
  safeInvoke: vi.fn(),
}));

vi.mock("@/lib/cases-api", () => ({
  casesApi: {
    get: mocks.getCase,
    update: mocks.updateCase,
  },
}));

vi.mock("@/lib/safe-invoke", () => ({
  safeInvoke: mocks.safeInvoke,
}));

vi.mock("@/components/case-wizard/CaseWizardStep1", () => ({
  CaseWizardStep1: () => <div data-testid="wizard-step1">Step 1</div>,
}));

vi.mock("@/components/case-wizard/CaseWizardStep2", () => ({
  CaseWizardStep2: () => <div data-testid="wizard-step2">Step 2</div>,
}));

vi.mock("@/components/case-wizard/CaseWizardStep4", () => ({
  CaseWizardStep4: () => <div data-testid="wizard-step4">Step 4</div>,
}));

vi.mock("@/components/case-wizard/CaseWizardStep5", () => ({
  CaseWizardStep5: (props: { caseId: string; caseData?: { id: string } }) => (
    <div data-testid="wizard-step5-props">
      {props.caseId}|{props.caseData?.id ?? "missing"}
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
  current_step: 5,
  status: "draft",
  created_at: 1,
  updated_at: 1,
};

describe("CaseWizard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCase.mockResolvedValue(baseCase);
    mocks.updateCase.mockResolvedValue(baseCase);
    mocks.safeInvoke.mockResolvedValue([{ id: "premium_real_price_enabled", enabled: true }]);
  });

  it("passes caseData into step 5 and hides next button on final step", async () => {
    render(<CaseWizard caseId={baseCase.id} />);

    await waitFor(() => {
      expect(screen.getByTestId("wizard-step5-props")).toHaveTextContent("case-001|case-001");
    });

    expect(screen.queryByRole("button", { name: "下一步" })).toBeNull();
  });

  it("allows navigating back by clicking completed step indicator", async () => {
    render(<CaseWizard caseId={baseCase.id} />);

    await waitFor(() => {
      expect(screen.getByTestId("wizard-step5-props")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "1" }));

    await waitFor(() => {
      expect(screen.getByTestId("wizard-step1")).toBeInTheDocument();
    });

    expect(mocks.updateCase).toHaveBeenCalledWith("case-001", { current_step: 1 });
  });
});
