"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Spinner — 旋轉載入指示器
 */
interface SpinnerProps extends React.HTMLAttributes<SVGSVGElement> {
  size?: number;
}

function Spinner({ className, size = 16, ...props }: SpinnerProps) {
  return (
    <Loader2
      className={cn("animate-spin text-muted-foreground", className)}
      style={{ width: size, height: size }}
      {...props}
    />
  );
}

export { Spinner };
