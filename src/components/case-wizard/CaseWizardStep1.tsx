"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CaseRow, UpdateCaseInput } from "@/lib/cases-api";

interface CaseWizardStep1Props {
  draft: UpdateCaseInput;
  caseData: CaseRow;
  onChange: (next: UpdateCaseInput) => void;
}

export function CaseWizardStep1({ draft, caseData, onChange }: CaseWizardStep1Props) {
  const isResidential = (draft.property_type ?? caseData.property_type) === "residential";

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="wizard-owner-name">所有權人</Label>
        <Input
          id="wizard-owner-name"
          value={draft.owner_name ?? caseData.owner_name ?? ""}
          onChange={(event) => onChange({ ...draft, owner_name: event.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="wizard-address">地址</Label>
        <Input
          id="wizard-address"
          value={draft.address ?? caseData.address}
          onChange={(event) => onChange({ ...draft, address: event.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="wizard-case-name">案件名稱</Label>
        <Input
          id="wizard-case-name"
          value={draft.case_name ?? caseData.case_name ?? ""}
          onChange={(event) => onChange({ ...draft, case_name: event.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="wizard-case-no">案件編號</Label>
        <Input
          id="wizard-case-no"
          value={draft.case_no ?? caseData.case_no ?? ""}
          onChange={(event) => onChange({ ...draft, case_no: event.target.value })}
        />
      </div>
      {!isResidential && (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="wizard-land-lot-no">地號</Label>
            <Input
              id="wizard-land-lot-no"
              value={draft.land_lot_no ?? caseData.land_lot_no}
              onChange={(event) => onChange({ ...draft, land_lot_no: event.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wizard-building-lot-no">建號</Label>
            <Input
              id="wizard-building-lot-no"
              value={draft.building_lot_no ?? caseData.building_lot_no ?? ""}
              onChange={(event) => onChange({ ...draft, building_lot_no: event.target.value })}
            />
          </div>
        </>
      )}
    </div>
  );
}
