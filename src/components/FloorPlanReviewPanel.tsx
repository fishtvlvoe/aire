"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { safeInvoke } from "@/lib/tauri-bridge";

export interface FloorPlanReviewPanelProps {
  caseId: string;
  conversionId: string;
  sketchImageUrl?: string; // original sketch (from file path or data URL)
  svgContent?: string; // rendered clean SVG string
  onApproved?: () => void;
  onRevoked?: (reason: string) => void;
}

type ChecklistBooleans = {
  room_count_confirmed: boolean;
  kitchen_confirmed: boolean;
  bathrooms_confirmed: boolean;
  balcony_confirmed: boolean;
  entrance_confirmed: boolean;
  openings_confirmed: boolean;
  dimensions_source_confirmed: boolean;
  uncertainty_resolved: boolean;
};

type ChecklistPayload = ChecklistBooleans & {
  approval_statement: string;
};

const CHECKBOX_ITEMS: Array<{ key: keyof ChecklistBooleans; label: string }> = [
  { key: "room_count_confirmed", label: "房間數確認" },
  { key: "kitchen_confirmed", label: "廚房確認" },
  { key: "bathrooms_confirmed", label: "衛浴確認" },
  { key: "balcony_confirmed", label: "陽台確認" },
  { key: "entrance_confirmed", label: "入口確認" },
  { key: "openings_confirmed", label: "門窗確認" },
  { key: "dimensions_source_confirmed", label: "尺寸來源確認" },
  { key: "uncertainty_resolved", label: "不確定項目已處理" },
];

function makeDefaultChecklist(): ChecklistBooleans {
  return {
    room_count_confirmed: false,
    kitchen_confirmed: false,
    bathrooms_confirmed: false,
    balcony_confirmed: false,
    entrance_confirmed: false,
    openings_confirmed: false,
    dimensions_source_confirmed: false,
    uncertainty_resolved: false,
  };
}

export function FloorPlanReviewPanel({
  caseId: _caseId,
  conversionId,
  sketchImageUrl,
  svgContent,
  onApproved,
  onRevoked,
}: FloorPlanReviewPanelProps) {
  const storageKey = React.useMemo(
    () => `aire-floor-plan-approved:${conversionId}`,
    [conversionId],
  );

  const [checklist, setChecklist] = React.useState<ChecklistBooleans>(() =>
    makeDefaultChecklist(),
  );
  const [approvalStatement, setApprovalStatement] = React.useState<string>("");
  const [approving, setApproving] = React.useState(false);
  const [revoking, setRevoking] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isApproved, setIsApproved] = React.useState(false);

  React.useEffect(() => {
    try {
      setIsApproved(window.localStorage.getItem(storageKey) === "1");
    } catch {
      setIsApproved(false);
    }
  }, [storageKey]);

  const canApprove =
    CHECKBOX_ITEMS.every((item) => checklist[item.key]) &&
    approvalStatement.trim().length > 0 &&
    !approving &&
    !revoking;

  async function handleApprove() {
    if (!canApprove) {
      return;
    }

    setErrorMessage(null);
    setApproving(true);

    const payload: ChecklistPayload = {
      ...checklist,
      approval_statement: approvalStatement.trim(),
    };

    try {
      await safeInvoke("approve_floor_plan_conversion", {
        conversion_id: conversionId,
        checklist: payload,
      });

      try {
        window.localStorage.setItem(storageKey, "1");
      } catch {
        // ignore
      }
      setIsApproved(true);
      onApproved?.();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "核准失敗");
    } finally {
      setApproving(false);
    }
  }

  async function handleRevoke() {
    if (revoking) {
      return;
    }

    const reason = window.prompt("請輸入撤銷原因")?.trim() ?? "";
    if (!reason) {
      return;
    }

    setErrorMessage(null);
    setRevoking(true);

    try {
      await safeInvoke("revoke_floor_plan_conversion", {
        conversion_id: conversionId,
        reason,
      });

      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        // ignore
      }

      setIsApproved(false);
      onRevoked?.(reason);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "撤銷失敗");
    } finally {
      setRevoking(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <section className="space-y-2">
          <h3 className="text-sm font-medium">原始手稿</h3>
          {sketchImageUrl ? (
            <img
              data-testid="original-sketch-img"
              src={sketchImageUrl}
              alt="原始手稿"
              className="w-full rounded-md border bg-background object-contain"
            />
          ) : (
            <div className="flex h-64 items-center justify-center rounded-md border bg-muted text-sm text-muted-foreground">
              尚未提供手稿
            </div>
          )}
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-medium">乾淨格局圖</h3>
          {svgContent ? (
            <div
              data-testid="clean-floor-plan-svg"
              className="w-full overflow-auto rounded-md border bg-background p-2"
              // SVG is generated by our pipeline; render as-is for review.
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          ) : (
            <div className="flex h-64 items-center justify-center rounded-md border bg-muted text-sm text-muted-foreground">
              尚未提供格局圖
            </div>
          )}
        </section>
      </div>

      <section className="space-y-3">
        <h3 className="text-sm font-medium">核准檢核</h3>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {CHECKBOX_ITEMS.map((item) => {
            const id = `check-${item.key}`;
            return (
              <label
                key={item.key}
                htmlFor={id}
                className="flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm"
              >
                <input
                  id={id}
                  type="checkbox"
                  checked={checklist[item.key]}
                  onChange={(e) =>
                    setChecklist((prev) => ({
                      ...prev,
                      [item.key]: e.target.checked,
                    }))
                  }
                />
                <span>{item.label}</span>
              </label>
            );
          })}
        </div>

        <div className="space-y-1">
          <label htmlFor="approval-statement" className="text-sm">
            確認聲明
          </label>
          <input
            id="approval-statement"
            type="text"
            value={approvalStatement}
            onChange={(e) => setApprovalStatement(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            required
            minLength={1}
          />
        </div>

        {errorMessage ? (
          <p className="text-sm text-destructive" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <div className="flex items-center gap-2">
          <Button
            type="button"
            data-testid="approve-btn"
            onClick={handleApprove}
            disabled={!canApprove}
          >
            {approving ? "核准中…" : "核准"}
          </Button>

          {isApproved ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleRevoke}
              disabled={revoking || approving}
            >
              {revoking ? "撤銷中…" : "撤銷"}
            </Button>
          ) : null}
        </div>
      </section>
    </div>
  );
}
