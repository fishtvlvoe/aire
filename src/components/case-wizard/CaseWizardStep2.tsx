"use client";

import { PullParcelDataButton } from "@/components/PullParcelDataButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { casesApi } from "@/lib/cases-api";
import type { CaseRow, UpdateCaseInput } from "@/lib/cases-api";
import { useMemo, useState } from "react";

interface CaseWizardStep2Props {
  caseData: CaseRow;
  draft: UpdateCaseInput;
}

export function CaseWizardStep2({ caseData }: CaseWizardStep2Props) {
  const [landLotNo, setLandLotNo] = useState(caseData.land_lot_no);
  const [buildingLotNo, setBuildingLotNo] = useState(caseData.building_lot_no ?? "");

  const parcelId = useMemo(() => landLotNo || "0001-0000", [landLotNo]);

  function readStringValue(value: unknown): string {
    return typeof value === "string" ? value : "";
  }

  async function handleSaved(data: Record<string, unknown>) {
    const landRegistry = (data.land_registry ?? data.building_registry ?? {}) as Record<
      string,
      unknown
    >;
    const nextLand = readStringValue(
      data.land_lot_no ?? landRegistry.lot_number ?? landRegistry.lot ?? landLotNo,
    );
    const nextBuilding = readStringValue(
      data.building_lot_no ??
        landRegistry.building_number ??
        landRegistry.building_lot_no ??
        buildingLotNo,
    );
    setLandLotNo(nextLand || landLotNo);
    setBuildingLotNo(nextBuilding || buildingLotNo);
    await casesApi.update(caseData.id, {
      land_lot_no: nextLand || landLotNo,
      building_lot_no: nextBuilding || buildingLotNo || null,
    });
  }

  return (
    <div className="space-y-4">
      <PullParcelDataButton
        caseId={caseData.id}
        parcelId={parcelId}
        apiIds={["land_registry", "building_registry", "mortgages"]}
        onSaved={handleSaved}
      />
      <div className="space-y-1.5">
        <Label htmlFor="wizard-step2-land-lot-no">地號</Label>
        <Input id="wizard-step2-land-lot-no" value={landLotNo} readOnly />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="wizard-step2-building-lot-no">建號</Label>
        <Input id="wizard-step2-building-lot-no" value={buildingLotNo} readOnly />
      </div>
    </div>
  );
}
