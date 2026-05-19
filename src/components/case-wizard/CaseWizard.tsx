"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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

const STEP_LABELS = ["基本資料", "地政資料", "揭露資料", "實價登錄", "預覽匯出"];

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
          onNext={() => void updateStep(4)}
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
    void updateStep(Math.max(1, currentStep - 1));
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-5 gap-2">
        {STEP_LABELS.map((label, index) => {
          const step = index + 1;
          const active = step === currentStep;
          const done = step < currentStep;
          return (
            <div key={label} className="flex items-center gap-2">
              {done ? (
                <button
                  type="button"
                  onClick={() => void updateStep(step)}
                  className="h-8 w-8 cursor-pointer rounded-full border border-green-600 bg-green-600 text-xs font-medium text-white transition-opacity hover:opacity-90"
                >
                  {step}
                </button>
              ) : (
                <div className={`h-8 w-8 rounded-full border text-xs font-medium flex items-center justify-center ${active ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground"}`}>
                  {step}
                </div>
              )}
              <span className={`text-xs ${active ? "text-foreground" : "text-muted-foreground"}`}>
                {step === 4 && !step3Enabled ? `${label}（跳過）` : label}
              </span>
            </div>
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
