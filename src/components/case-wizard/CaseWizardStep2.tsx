"use client";

import { PullParcelDataButton } from "@/components/PullParcelDataButton";
import type { CaseRow, UpdateCaseInput } from "@/lib/cases-api";

interface CaseWizardStep2Props {
  caseData: CaseRow;
  draft: UpdateCaseInput;
}

export function CaseWizardStep2({ caseData }: CaseWizardStep2Props) {
  return (
    <div className="space-y-4">
      <PullParcelDataButton caseId={caseData.id} parcelId={caseData.land_lot_no} apiIds={["A1", "A2", "A3"]} />
    </div>
  );
}
