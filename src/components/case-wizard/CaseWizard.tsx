"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Dot } from "lucide-react";
import { casesApi, type CaseRow, type UpdateCaseInput } from "@/lib/cases-api";
import { safeInvoke } from "@/lib/safe-invoke";
import { CaseWizardStep1 } from "@/components/case-wizard/CaseWizardStep1";
import { CaseWizardStep2 } from "@/components/case-wizard/CaseWizardStep2";
import { CaseWizardStep3Disclosure } from "@/components/case-wizard/CaseWizardStep3Disclosure";
import { CaseWizardStep4 } from "@/components/case-wizard/CaseWizardStep4";
import { CaseWizardStep5 } from "@/components/case-wizard/CaseWizardStep5";

interface CaseWizardProps {
  caseId: string;
}

const STEP_OPTIONS = [
  { step: 1, label: "基本資料" },
  { step: 2, label: "地政資料" },
  { step: 3, label: "揭露資料" },
  { step: 4, label: "實價登錄" },
  { step: 5, label: "預覽匯出" },
] as const;

export function CaseWizard({ caseId }: CaseWizardProps) {
  const [caseData, setCaseData] = useState<CaseRow | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [draft, setDraft] = useState<UpdateCaseInput>({});
  const [step1Valid, setStep1Valid] = useState(false);
  const [step3Enabled, setStep3Enabled] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // C1: 載入 case 加 try/catch，失敗時顯示 error state
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [row, flags] = await Promise.all([
          casesApi.get(caseId),
          safeInvoke<Array<{ id: string; enabled: boolean }>>("get_feature_flags"),
        ]);
        if (cancelled) return;
        setCaseData(row);
        setCurrentStep(row.current_step ?? 1);
        const step3Flag = flags.find((flag) => flag.id === "premium_real_price_enabled");
        setStep3Enabled(Boolean(step3Flag?.enabled));
      } catch (err) {
        if (cancelled) return;
        console.error("[CaseWizard] 載入案件失敗", err);
        setLoadError(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [caseId]);

  // W8: 只在使用者點下一步/上一步時更新 current_step，不在 useEffect 自動更新
  async function updateStep(nextStep: number) {
    setCurrentStep(nextStep);
    if (!caseData) return;
    try {
      await casesApi.update(caseData.id, { current_step: nextStep });
    } catch (err) {
      console.error("[CaseWizard] 更新 current_step 失敗", err);
    }
  }

  // C1: 白屏防護 — 載入失敗顯示錯誤而非空白
  if (loadError) {
    return (
      <div
        role="alert"
        className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive"
      >
        載入失敗：{loadError}
      </div>
    );
  }

  if (!caseData) {
    return <p className="text-sm text-muted-foreground">載入中…</p>;
  }

  // W5: 移除無效的 useMemo，直接在 JSX inline 渲染
  function renderStepContent() {
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
      return <CaseWizardStep2 caseData={caseData} />;
    }
    if (currentStep === 3) {
      return (
        <CaseWizardStep3Disclosure
          caseId={caseId}
          caseData={caseData}
          onNext={() => void updateStep(step3Enabled ? 4 : 5)}
          onPrev={() => void updateStep(2)}
        />
      );
    }
    if (currentStep === 4) {
      return <CaseWizardStep4 />;
    }
    return (
      <CaseWizardStep5
        caseId={caseData.id}
        caseData={caseData}
      />
    );
  }

  // W8: 使用者點下一步才呼叫 API
  function handleNextStep() {
    const next = currentStep === 3 && !step3Enabled ? 5 : Math.min(5, currentStep + 1);
    void updateStep(next);
  }

  function handlePrevStep() {
    const prev = currentStep === 5 && !step3Enabled ? 3 : Math.max(1, currentStep - 1);
    void updateStep(prev);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {STEP_OPTIONS.map(({ step, label }) => {
          if (step === 4 && !step3Enabled) return null;
          const active = step === currentStep;
          const done = step < currentStep;
          const className = `inline-flex min-h-10 items-center gap-2 rounded-md border px-3 py-2 text-sm ${
            active
              ? "border-slate-900 bg-slate-900 text-white"
              : done
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-slate-200 bg-white text-slate-500"
          }`;
          return (
            done ? (
              <button key={label} type="button" onClick={() => void updateStep(step)} className={className}>
                <CheckCircle2 className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ) : (
              <div key={label} aria-current={active ? "step" : undefined} className={className}>
                {active ? <Dot className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                <span>{label}</span>
              </div>
            )
          );
        })}
      </div>

      <div className="rounded-md border p-4">{renderStepContent()}</div>

      {currentStep !== 3 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrevStep}
            disabled={currentStep === 1}
          >
            上一步
          </Button>
          {currentStep < 5 ? (
            <Button
              onClick={handleNextStep}
              disabled={currentStep === 1 && !step1Valid}
            >
              下一步
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
