"use client";

import * as React from "react";
import "@testing-library/jest-dom/vitest";
import { AlertTriangle, CalendarClock, FileWarning } from "lucide-react";
import { Button } from "@/components/ui/Button";

type ConflictStrategy = "overwrite" | "keep_newer" | "skip";

interface ConflictRecord {
  caseId: number | string;
  caseName?: string;
  existingUpdatedAt: string;
  incomingUpdatedAt: string;
  remainingCount: number;
}

interface DecisionPayload {
  caseId: number | string;
  strategy: ConflictStrategy;
  applyToAll: boolean;
}

export interface ImportConflictDialogProps {
  isOpen: boolean;
  conflict: ConflictRecord;
  onDecide: (payload: DecisionPayload) => void;
  onDecideAll: (payload: DecisionPayload) => void;
}

const strategyLabels: Record<ConflictStrategy, string> = {
  overwrite: "覆蓋",
  keep_newer: "保留較新",
  skip: "跳過",
};

export default function ImportConflictDialog({
  isOpen,
  conflict,
  onDecide,
  onDecideAll,
}: ImportConflictDialogProps) {
  const [applyToAll, setApplyToAll] = React.useState(false);
  const [confirmApplyAll, setConfirmApplyAll] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) {
      setApplyToAll(false);
      setConfirmApplyAll(false);
    }
  }, [isOpen]);

  const applyAllActive = applyToAll;

  const handleDecision = (strategy: ConflictStrategy) => {
    const payload: DecisionPayload = {
      caseId: conflict.caseId,
      strategy,
      applyToAll: applyAllActive,
    };

    if (applyAllActive) {
      onDecideAll(payload);
      return;
    }

    onDecide(payload);
  };

  if (!isOpen) return null;

  return (
    <div aria-modal="true" className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog">
      <div aria-hidden="true" className="fixed inset-0 bg-foreground/40 backdrop-blur-sm" />
      <section className="relative z-10 grid w-full max-w-xl gap-4 rounded-lg border border-border bg-background p-6 shadow-lg">
        <header className="space-y-1.5 text-left">
          <h2 className="inline-flex items-center gap-2 text-lg font-semibold leading-none tracking-tight">
            <FileWarning className="h-5 w-5 text-destructive" />
            偵測到匯入衝突
          </h2>
          <p className="text-sm text-muted-foreground" id="import-conflict-description">
            此案件在本機與匯入檔都存在，請選擇處理方式。
          </p>
        </header>

        <div className="space-y-3 rounded-md border border-border bg-muted/20 p-4 text-sm">
          <p className="font-medium">
            {conflict.caseName ?? "未命名案件"} <span className="text-muted-foreground">#{conflict.caseId}</span>
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded border border-border bg-background p-2">
              <p className="mb-1 inline-flex items-center gap-1 text-muted-foreground">
                <CalendarClock className="h-4 w-4" />
                本機 updated_at
              </p>
              <p>{conflict.existingUpdatedAt}</p>
            </div>
            <div className="rounded border border-border bg-background p-2">
              <p className="mb-1 inline-flex items-center gap-1 text-muted-foreground">
                <CalendarClock className="h-4 w-4" />
                匯入版 updated_at
              </p>
              <p>{conflict.incomingUpdatedAt}</p>
            </div>
          </div>
          <p className="text-muted-foreground">剩餘 {conflict.remainingCount} 個衝突待處理</p>
        </div>

        <div className="space-y-2 rounded-md border border-border p-3 text-sm">
          <label className="flex items-start gap-2">
            <input
              checked={applyToAll}
              onChange={(event) => {
                const checked = event.target.checked;
                setApplyToAll(checked);
                if (!checked) setConfirmApplyAll(false);
              }}
              type="checkbox"
            />
            <span>套用至所有剩餘衝突</span>
          </label>

          {applyToAll ? (
            <label className="flex items-start gap-2 pl-6 text-destructive">
              <input
                checked={confirmApplyAll}
                onChange={(event) => setConfirmApplyAll(event.target.checked)}
                type="checkbox"
              />
              <span className="inline-flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                我確認要套用到所有剩餘衝突
              </span>
            </label>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button onClick={() => handleDecision("overwrite")} type="button" variant="destructive">
            {strategyLabels.overwrite}
          </Button>
          <Button onClick={() => handleDecision("keep_newer")} type="button" variant="secondary">
            {strategyLabels.keep_newer}
          </Button>
          <Button onClick={() => handleDecision("skip")} type="button" variant="outline">
            {strategyLabels.skip}
          </Button>
        </div>
      </section>
    </div>
  );
}
