import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { CaseWizardStep3Disclosure } from "@/components/case-wizard/CaseWizardStep3Disclosure";
import type { CaseRow } from "@/lib/cases-api";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/use-draft-autosave", () => ({
  loadDraft: vi.fn().mockResolvedValue(null),
  useDraftAutosave: vi.fn().mockReturnValue({ flush: vi.fn(), state: "idle", savedAt: null }),
}));

vi.mock("@/components/disclosure-form-residential", () => ({
  DisclosureFormResidential: () => <div data-testid="disclosure-form-residential" />,
}));

vi.mock("@/components/disclosure-form-land", () => ({
  DisclosureFormLand: () => <div data-testid="disclosure-form-land" />,
}));

const baseCase: CaseRow = {
  id: "case-001",
  case_no: "AIRE-001",
  property_type: "residential",
  case_name: "測試",
  owner_name: "測試屋主",
  address: "台南市",
  status: "draft",
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
  current_step: 3,
} as CaseRow;

describe("CaseWizardStep3Disclosure", () => {
  it("成屋案件渲染 DisclosureFormResidential", async () => {
    render(
      <CaseWizardStep3Disclosure
        caseId="case-001"
        caseData={{ ...baseCase, property_type: "residential" }}
        onNext={vi.fn()}
        onPrev={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("disclosure-form-residential")).toBeTruthy();
    });
    expect(screen.queryByTestId("disclosure-form-land")).toBeNull();
  });

  it("土地案件渲染 DisclosureFormLand", async () => {
    render(
      <CaseWizardStep3Disclosure
        caseId="case-001"
        caseData={{ ...baseCase, property_type: "land" }}
        onNext={vi.fn()}
        onPrev={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("disclosure-form-land")).toBeTruthy();
    });
    expect(screen.queryByTestId("disclosure-form-residential")).toBeNull();
  });

  it("「下一步」按鈕在欄位全空時不被 disabled", async () => {
    render(
      <CaseWizardStep3Disclosure
        caseId="case-001"
        caseData={baseCase}
        onNext={vi.fn()}
        onPrev={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText("載入中…")).toBeNull();
    });

    const nextButton = screen.getByRole("button", { name: "下一步" });
    expect(nextButton).not.toBeDisabled();
  });
});
