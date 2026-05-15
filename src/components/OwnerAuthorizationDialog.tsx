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

/**
 * OwnerAuthorizationDialog — 屋主授權確認 Dialog
 * 強制使用者勾選授權 checkbox 才能確認，
 * 確認後呼叫 recordConsent 記錄同意紀錄。
 */
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

  // 每次開啟重置狀態
  React.useEffect(() => {
    if (open) {
      setChecked(false);
      setError(null);
    }
  }, [open]);

  async function handleConfirm() {
    if (!checked) return;
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

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <DialogTitle>屋主授權確認</DialogTitle>
          </div>
          <DialogDescription>
            依個人資料保護法，查詢不動產登記資料前須取得當事人書面授權。
          </DialogDescription>
        </DialogHeader>

        {/* 授權 Checkbox */}
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            disabled={loading}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border border-border accent-primary"
          />
          <span className="text-sm leading-snug">
            客戶已書面授權查詢不動產資料
          </span>
        </label>

        {/* 錯誤訊息 */}
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            取消
          </Button>
          <Button onClick={handleConfirm} disabled={!checked || loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            確認
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
