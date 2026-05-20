/**
 * TDD: Bug#4 揭露資料持久化
 * mount 時呼叫 storage.getCaseDisclosures；payload 有 condition 欄位時呼叫 saveCaseDisclosures
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor, act } from "@testing-library/react";

vi.mock("@/lib/storage", () => ({
  storage: {
    getCaseDisclosures: vi.fn().mockResolvedValue(null),
    saveCaseDisclosures: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("@/lib/use-draft-autosave", () => ({
  loadDraft: vi.fn().mockResolvedValue(null),
  useDraftAutosave: vi.fn().mockReturnValue({ state: "idle", savedAt: null, flush: vi.fn() }),
}));

vi.mock("@/components/disclosure-form-residential", () => ({
  DisclosureFormResidential: ({
    onChange,
  }: {
    onChange?: (p: Record<string, unknown>) => void;
  }) => {
    // expose a function on the element so tests can trigger onChange
    return (
      <button
        data-testid="trigger-disclosure-change"
        onClick={() => onChange?.({ condition_leakage: "true", condition_renovation: "false" })}
      >
        trigger
      </button>
    );
  },
}));

vi.mock("@/components/disclosure-form-land", () => ({
  DisclosureFormLand: () => null,
}));

import { storage } from "@/lib/storage";
import { loadDraft } from "@/lib/use-draft-autosave";
import { CaseWizardStep3Disclosure } from "../CaseWizardStep3Disclosure";
import type { CaseRow } from "@/lib/cases-api";

const CASE_ID = "test-case-001";
const caseData = { property_type: "residential" } as unknown as CaseRow;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(storage.getCaseDisclosures).mockResolvedValue(null);
  vi.mocked(storage.saveCaseDisclosures).mockResolvedValue(undefined);
});

describe("CaseWizardStep3Disclosure — Bug#4 揭露資料持久化", () => {
  it("mount 時呼叫 storage.getCaseDisclosures(caseId)", async () => {
    render(
      <CaseWizardStep3Disclosure
        caseId={CASE_ID}
        caseData={caseData}
        onNext={vi.fn()}
        onPrev={vi.fn()}
      />,
    );
    await waitFor(() => {
      expect(storage.getCaseDisclosures).toHaveBeenCalledWith(CASE_ID);
    });
  });

  it("legacy draft payload 有 condition 欄位時仍呼叫 storage.saveCaseDisclosures", async () => {
    vi.mocked(loadDraft).mockResolvedValueOnce({
      condition_leakage: "true",
      condition_renovation: "false",
    });

    render(
      <CaseWizardStep3Disclosure
        caseId={CASE_ID}
        caseData={caseData}
        onNext={vi.fn()}
        onPrev={vi.fn()}
      />,
    );
    await waitFor(() => {
      expect(storage.saveCaseDisclosures).toHaveBeenCalledWith(
        CASE_ID,
        expect.objectContaining({ conditionLeakage: true }),
      );
    });
  });
});
