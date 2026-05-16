"use client";

import { Clock } from "lucide-react";

interface ComingSoonCardProps {
  title: string;
}

export function ComingSoonCard({ title }: ComingSoonCardProps) {
  return (
    <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
      <p className="mb-2 font-medium text-foreground">{title}</p>
      <div className="inline-flex items-center gap-2">
        <Clock className="h-4 w-4" data-testid="coming-soon-clock-icon" />
        <span>敬請期待</span>
      </div>
    </div>
  );
}
