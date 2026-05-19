"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { CaseRow } from "@/lib/cases-api";
import { loadDraft, useDraftAutosave } from "@/lib/use-draft-autosave";
import { DisclosureFormResidential } from "@/components/disclosure-form-residential";
import { DisclosureFormLand } from "@/components/disclosure-form-land";
import { storage } from "@/lib/storage";
import type { DisclosureData } from "@/lib/storage";

interface CaseWizardStep3DisclosureProps {
  caseId: string;
  caseData: CaseRow;
  onNext: () => void;
  onPrev: () => void;
}

function toDisclosureData(p: Record<string, unknown>): DisclosureData {
  const tri = (v: unknown) => v === "true";
  return {
    conditionLeakage: tri(p.condition_leakage),
    conditionRenovation: tri(p.condition_renovation),
    conditionIllegalStructure: tri(p.condition_illegal_addition),
  };
}

function fromDisclosureData(d: DisclosureData): Record<string, string> {
  return {
    condition_leakage: d.conditionLeakage ? "true" : "false",
    condition_renovation: d.conditionRenovation ? "true" : "false",
    condition_illegal_addition: d.conditionIllegalStructure ? "true" : "false",
  };
}

const CONDITION_KEYS = ["condition_leakage", "condition_renovation", "condition_illegal_addition"];

export function CaseWizardStep3Disclosure({
  caseId,
  caseData,
  onNext,
  onPrev,
}: CaseWizardStep3DisclosureProps) {
  const [payload, setPayload] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const prevConditionRef = useRef<string>("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [draft, disclosures] = await Promise.all([
        loadDraft(caseId),
        storage.getCaseDisclosures(caseId),
      ]);
      if (cancelled) return;
      const base = draft ?? {};
      const merged = disclosures
        ? { ...base, ...fromDisclosureData(disclosures) }
        : base;
      setPayload(merged);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [caseId]);

  // Persist condition fields whenever they change
  useEffect(() => {
    if (loading) return;
    const hasCondition = CONDITION_KEYS.some((k) => k in payload);
    if (!hasCondition) return;
    const data = toDisclosureData(payload);
    const key = JSON.stringify(data);
    if (key === prevConditionRef.current) return;
    prevConditionRef.current = key;
    void storage.saveCaseDisclosures(caseId, data);
  }, [payload, caseId, loading]);

  const { flush } = useDraftAutosave({ caseId, payload, enabled: !loading });

  function renderForm() {
    if (loading) return <p>載入中…</p>;
    if (caseData.property_type === "residential") {
      return (
        <DisclosureFormResidential caseId={caseId} initialPayload={payload} onChange={setPayload} />
      );
    }
    if (caseData.property_type === "land") {
      return (
        <DisclosureFormLand caseId={caseId} initialPayload={payload} onChange={setPayload} />
      );
    }
    return null;
  }

  return (
    <div className="space-y-6">
      {renderForm()}

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={async () => {
            await flush();
            onPrev();
          }}
        >
          上一步
        </Button>
        <Button
          onClick={async () => {
            await flush();
            onNext();
          }}
        >
          下一步
        </Button>
      </div>
    </div>
  );
}
