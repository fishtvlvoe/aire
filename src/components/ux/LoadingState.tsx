"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LoadingStateProps {
  label?: string;
  className?: string;
}

/**
 * LoadingState — 三態 UI 之 Loading
 * 規格：高 200px、寬 100%、置中 spinner + 標籤
 * 對應 docs/ux-patterns.md 一節
 */
export function LoadingState({ label, className }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex h-[200px] w-full flex-col items-center justify-center gap-3",
        className,
      )}
    >
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden />
      {label ? (
        <span className="text-sm text-muted-foreground">{label}</span>
      ) : null}
    </div>
  );
}
