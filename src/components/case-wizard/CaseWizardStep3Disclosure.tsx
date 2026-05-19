"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { CaseRow } from "@/lib/cases-api";
import { loadDraft, useDraftAutosave } from "@/lib/use-draft-autosave";
import { DisclosureFormResidential } from "@/components/disclosure-form-residential";
import { DisclosureFormLand } from "@/components/disclosure-form-land";

interface CaseWizardStep3DisclosureProps {
  caseId: string;
  caseData: CaseRow;
  onNext: () => void;
  onPrev: () => void;
}

export function CaseWizardStep3Disclosure({
  caseId,
  caseData,
  onNext,
  onPrev,
}: CaseWizardStep3DisclosureProps) {
  const [payload, setPayload] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const draft = await loadDraft(caseId);
      if (cancelled) return;
      setPayload(draft ?? {});
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [caseId]);

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
