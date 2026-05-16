"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { casesApi, type CaseRow, type UpdateCaseInput } from "@/lib/cases-api";
import { CaseWizardStep1 } from "@/components/case-wizard/CaseWizardStep1";
import { CaseWizardStep2 } from "@/components/case-wizard/CaseWizardStep2";
import { CaseWizardStep3 } from "@/components/case-wizard/CaseWizardStep3";
import { CaseWizardStep4 } from "@/components/case-wizard/CaseWizardStep4";

interface CaseWizardProps {
  caseId: string;
}

const STEP_LABELS = ["基本資料", "地政資料", "實價登錄", "預覽匯出"];

export function CaseWizard({ caseId }: CaseWizardProps) {
  const router = useRouter();
  const [caseData, setCaseData] = useState<CaseRow | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [draft, setDraft] = useState<UpdateCaseInput>({});
  const [step1Valid, setStep1Valid] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const row = await casesApi.get(caseId);
      if (cancelled) return;
      setCaseData(row);
      setCurrentStep(row.current_step ?? 1);
    })();
    return () => {
      cancelled = true;
    };
  }, [caseId]);

  useEffect(() => {
    if (!caseData) return;
    void casesApi.update(caseData.id, { current_step: currentStep });
  }, [caseData, currentStep]);

  const stepContent = useMemo(() => {
    if (!caseData) return null;
    if (currentStep === 1) {
      return (
        <CaseWizardStep1
          caseData={caseData}
          draft={draft}
          onChange={setDraft}
          onValidChange={setStep1Valid}
        />
      );
    }
    if (currentStep === 2) {
      return <CaseWizardStep2 caseData={caseData} draft={draft} />;
    }
    if (currentStep === 3) {
      return <CaseWizardStep3 />;
    }
    return <CaseWizardStep4 onExport={() => router.push(`/cases/${caseData.id}/preview`)} />;
  }, [caseData, currentStep, draft, router]);

  if (!caseData) {
    return <p className="text-sm text-muted-foreground">載入中…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-2">
        {STEP_LABELS.map((label, index) => {
          const step = index + 1;
          const active = step === currentStep;
          const done = step < currentStep;
          return (
            <div key={label} className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-full border text-xs font-medium flex items-center justify-center ${active ? "bg-primary text-primary-foreground border-primary" : done ? "bg-green-600 text-white border-green-600" : "bg-background text-muted-foreground"}`}>
                {step}
              </div>
              <span className={`text-xs ${active ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
            </div>
          );
        })}
      </div>

      <div className="rounded-md border p-4">{stepContent}</div>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
          disabled={currentStep === 1}
        >
          上一步
        </Button>
        <Button
          onClick={() => setCurrentStep((prev) => Math.min(4, prev + 1))}
          disabled={currentStep === 4 || (currentStep === 1 && !step1Valid)}
        >
          下一步
        </Button>
      </div>
    </div>
  );
}
