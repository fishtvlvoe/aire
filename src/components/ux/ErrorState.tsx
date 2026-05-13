"use client";

import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export interface ErrorStateProps {
  reason: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * ErrorState — 三態 UI 之 Error
 * 規格：紅色卡片 + 錯誤原因 + 重試按鈕
 */
export function ErrorState({ reason, onRetry, className }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex w-full flex-col items-center justify-center gap-3 rounded-lg border border-destructive bg-destructive/10 p-6 text-center",
        className,
      )}
    >
      <AlertCircle className="h-6 w-6 text-destructive" aria-hidden />
      <p className="text-sm text-destructive">{reason}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          重試
        </Button>
      ) : null}
    </div>
  );
}
