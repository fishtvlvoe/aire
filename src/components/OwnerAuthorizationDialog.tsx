"use client";

import * as React from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { recordConsent } from "@/lib/land-registry-api";

interface OwnerAuthorizationDialogProps {
  caseId: string;
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function OwnerAuthorizationDialog({
  caseId,
  open,
  onConfirm,
  onCancel,
}: OwnerAuthorizationDialogProps) {
  const [checked, setChecked] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showConsentError, setShowConsentError] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setChecked(false);
      setError(null);
      setShowConsentError(false);
    }
  }, [open]);

  async function handleConfirm() {
    if (!checked) {
      setShowConsentError(true);
      return;
    }
    setShowConsentError(false);
    setLoading(true);
    setError(null);
    try {
      await recordConsent(caseId);
      onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "記錄授權失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  }

  function handleCheckboxChange(e: React.ChangeEvent<HTMLInputElement>) {
    setChecked(e.target.checked);
    if (e.target.checked) {
      setShowConsentError(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <DialogTitle>所有權人授權確認</DialogTitle>
          </div>
          <DialogDescription>
            依個人資料保護法，查詢不動產登記資料前須取得當事人書面授權。
          </DialogDescription>
        </DialogHeader>

        {/* 授權 Checkbox */}
        <div
          className={`rounded p-2 -mx-2 ${showConsentError ? "border border-red-500" : ""}`}
        >
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={checked}
              onChange={handleCheckboxChange}
              disabled={loading}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border border-border accent-primary"
            />
            <span className="text-sm leading-snug">
              客戶已書面授權查詢不動產資料
            </span>
          </label>
          {showConsentError && (
            <p className="text-sm text-red-500 mt-1">請先勾選授權同意</p>
          )}
        </div>

        {/* API 錯誤訊息 */}
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            取消
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            確認
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
