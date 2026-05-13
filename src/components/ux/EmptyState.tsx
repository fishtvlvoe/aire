"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/Card";

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * EmptyState — 三態 UI 之 Empty
 * 規格：卡片樣式、padding 48px、置中、可選 action
 */
export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="flex flex-col items-center justify-center gap-3 p-12 text-center">
        <h3 className="text-lg font-semibold">{title}</h3>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
        {action ? <div className="mt-2">{action}</div> : null}
      </CardContent>
    </Card>
  );
}
