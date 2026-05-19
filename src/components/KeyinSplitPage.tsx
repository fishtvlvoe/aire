"use client";

import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { useDraftAutosave } from "@/lib/use-draft-autosave";
import DisclosureFormResidential from "@/components/disclosure-form-residential";
import DisclosureFormLand from "@/components/disclosure-form-land";
import DisclosureHtmlPreview from "@/components/DisclosureHtmlPreview";

interface KeyinSplitPageProps {
  caseId: string;
  propertyType: "residential" | "land";
}

export function KeyinSplitPage({ caseId, propertyType }: KeyinSplitPageProps) {
  const [formState, setFormState] = useState<Record<string, unknown>>({});

  const { flush } = useDraftAutosave({
    caseId,
    payload: formState,
    debounceMs: 2000,
  });

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
          <DisclosureHtmlPreview formState={formState} propertyType={propertyType} />
        </div>
      </div>
    </section>
  );
}
