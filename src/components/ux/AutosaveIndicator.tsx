"use client";

import { Loader2, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type AutosaveState = "idle" | "saving" | "saved" | "error";

export interface AutosaveIndicatorProps {
  state: AutosaveState;
  savedAt?: Date;
  className?: string;
  /** 是否使用 fixed 定位（預設 absolute,讓父容器決定位置） */
  fixed?: boolean;
}

/**
 * 格式化時間為 HH:MM:SS（台北時區）
 */
function formatTaipeiTime(date: Date): string {
  return date.toLocaleTimeString("zh-TW", {
    timeZone: "Asia/Taipei",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * AutosaveIndicator — 自動儲存狀態指示器
 * 規格對齊 docs/ux-patterns.md：右上角,三色文字（idle/saving/saved/error）
 */
export function AutosaveIndicator({
  state,
  savedAt,
  className,
  fixed = false,
}: AutosaveIndicatorProps) {
  if (state === "idle") return null;

  const positionCls = fixed
    ? "fixed right-4 top-4 z-40"
    : "absolute right-4 top-4";

  let content: React.ReactNode = null;
  let colorCls = "";

  if (state === "saving") {
    colorCls = "text-muted-foreground";
    content = (
      <>
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        <span>儲存中…</span>
      </>
    );
  } else if (state === "saved") {
    colorCls = "text-success";
    content = (
      <>
        <Check className="h-3.5 w-3.5" aria-hidden />
        <span>已儲存{savedAt ? ` ${formatTaipeiTime(savedAt)}` : ""}</span>
      </>
    );
  } else {
    colorCls = "text-destructive";
    content = (
      <>
        <AlertCircle className="h-3.5 w-3.5" aria-hidden />
        <span>儲存失敗</span>
      </>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        positionCls,
        "inline-flex items-center gap-1.5 text-xs",
        colorCls,
        className,
      )}
    >
      {content}
    </div>
  );
}
