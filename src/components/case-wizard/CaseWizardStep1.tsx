"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CaseRow, UpdateCaseInput } from "@/lib/cases-api";
import { useEffect, useRef } from "react";

interface CaseWizardStep1Props {
  draft: UpdateCaseInput;
  caseData: CaseRow;
  onChange: (next: UpdateCaseInput) => void;
  onValidChange: (isValid: boolean) => void;
}

export function CaseWizardStep1({
  draft,
  caseData,
  onChange,
  onValidChange,
}: CaseWizardStep1Props) {
  const isResidential = (draft.property_type ?? caseData.property_type) === "residential";
  const addressValue = (draft.address ?? caseData.address ?? "").trim();

  // W4: useRef 儲存 callback，useEffect 只依賴 addressValue，不依賴 onValidChange
  const onValidChangeRef = useRef(onValidChange);
  onValidChangeRef.current = onValidChange;

  useEffect(() => {
    onValidChangeRef.current(addressValue.length > 0);
  }, [addressValue]);

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="wizard-owner-name">所有權人</Label>
        {/* W4: ?? "" 防 undefined 造成 uncontrolled input */}
        <Input
          id="wizard-owner-name"
          value={draft.owner_name ?? caseData.owner_name ?? ""}
          onChange={(event) => onChange({ ...draft, owner_name: event.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="wizard-address">地址</Label>
        {/* W4: ?? "" 防 caseData.address 為 null/undefined */}
        <Input
          id="wizard-address"
          value={draft.address ?? caseData.address ?? ""}
          onChange={(event) => onChange({ ...draft, address: event.target.value })}
        />
        {addressValue.length === 0 ? (
          <p className="text-xs text-destructive">地址為必填</p>
        ) : null}
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
            {/* W4: ?? "" 防 land_lot_no 為 null/undefined */}
            <Input
              id="wizard-land-lot-no"
              value={draft.land_lot_no ?? caseData.land_lot_no ?? ""}
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
