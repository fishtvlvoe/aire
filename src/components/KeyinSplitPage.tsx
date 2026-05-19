"use client";

import { useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { casesApi } from "@/lib/cases-api";
import { toast } from "sonner";
import { useDraftAutosave } from "@/lib/use-draft-autosave";
import DisclosureFormResidential from "@/components/disclosure-form-residential";
import DisclosureFormLand from "@/components/disclosure-form-land";
import DisclosureHtmlPreview from "@/components/DisclosureHtmlPreview";
import type { TaxInputs } from "@/components/DossierPage7FeeTable";

export function formStateToTaxInputs(
  formState: Record<string, unknown>
): TaxInputs | undefined {
  const contractPrice = Number(formState.transaction_price ?? 0);
  const officialLandValue = Number(formState.tax_land_value ?? 0);
  const buildingCurrentValue = Number(formState.tax_building_value ?? 0);
  if (contractPrice === 0 || officialLandValue === 0 || buildingCurrentValue === 0) {
    return undefined;
  }
  return {
    contractPrice,
    officialLandValue,
    shareRatio: Number(formState.share_ratio ?? 1),
    buildingCurrentValue,
    transactionDate: String(formState.transfer_date ?? ""),
    usage: formState.usage_type === "commercial" ? "commercial" : "residential",
  };
}

interface KeyinSplitPageProps {
  caseId: string;
  propertyType: "residential" | "land";
}

export function KeyinSplitPage({ caseId, propertyType }: KeyinSplitPageProps) {
  const [formState, setFormState] = useState<Record<string, unknown>>({});
  const taxInputs = useMemo(() => formStateToTaxInputs(formState), [formState]);

  const { flush } = useDraftAutosave({
    caseId,
    payload: formState,
    debounceMs: 2000,
  });

  useEffect(() => {
    void casesApi.markKeyin(caseId).catch(() => {});
  }, [caseId]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const draft = await invoke<{ payload_json: string } | null>("get_draft", { caseId });
      if (!cancelled && draft) {
        setFormState(JSON.parse(draft.payload_json) as Record<string, unknown>);
        toast("已還原上次未儲存的草稿");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [caseId]);

  return (
    <section className="flex min-h-[calc(100vh-10rem)] gap-6">
      <div data-testid="keyin-left-panel" className="w-1/2 overflow-y-auto p-4">
        {propertyType === "residential" ? (
          <DisclosureFormResidential
            caseId={caseId}
            initialPayload={formState}
            onChange={(data) => setFormState(data)}
          />
        ) : null}
        {propertyType === "land" ? (
          <DisclosureFormLand
            caseId={caseId}
            initialPayload={formState}
            onChange={(data) => setFormState(data)}
          />
        ) : null}
        <button type="button" onClick={() => flush()}>
          儲存並輸出 PDF
        </button>
      </div>
      <div data-testid="keyin-right-panel" className="w-1/2">
        <div className="sticky top-4">
          <DisclosureHtmlPreview formState={formState} propertyType={propertyType} taxInputs={taxInputs} />
        </div>
      </div>
    </section>
  );
}
