"use client";

import { cn } from "@/lib/utils";

/**
 * Skeleton — 載入佔位元件（shadcn/ui 標準風格）
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };
