import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CaseWizardStep2 } from "../case-wizard/CaseWizardStep2";
import type { CaseRow } from "@/lib/cases-api";

const mocks = vi.hoisted(() => ({
  updateCase: vi.fn(),
}));

vi.mock("@/lib/cases-api", () => ({
  casesApi: {
    update: mocks.updateCase,
  },
}));

vi.mock("@/components/PullParcelDataButton", () => ({
  PullParcelDataButton: (props: { onSaved?: (data: Record<string, unknown>) => void }) => (
    <button
      onClick={() =>
        props.onSaved?.({
          land_registry: { data: { lot_number: "0456-0000" } },
          building_registry: { data: { building_number: "建號 778-2" } },
        })
      }
      type="button"
    >
      mock-pull
    </button>
  ),
}));

const baseCase: CaseRow = {
  id: "case-002",
  case_no: "AIRE-2026-002",
  case_name: "文化路土地案",
  property_type: "land",
  land_lot_no: "板橋段二小段 88-1",
  building_lot_no: null,
  address: "新北市板橋區文化路一段 188 號",
  owner_name: "林大華",
  land_registry_data: null,
  current_step: 2,
  status: "draft",
  created_at: 1,
  updated_at: 1,
};

describe("CaseWizardStep2", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.updateCase.mockResolvedValue(baseCase);
  });

  it("fills land/building lot numbers from nested land_registry_data and persists", async () => {
    render(<CaseWizardStep2 caseData={baseCase} />);

    fireEvent.click(screen.getByRole("button", { name: "mock-pull" }));

    await waitFor(() => {
      expect(screen.getByDisplayValue("0456-0000")).toBeInTheDocument();
      expect(screen.getByDisplayValue("建號 778-2")).toBeInTheDocument();
    });

    expect(mocks.updateCase).toHaveBeenCalledWith("case-002", {
      land_lot_no: "0456-0000",
      building_lot_no: "建號 778-2",
    });
  });
});
