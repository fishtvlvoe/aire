import React from "react";

export interface ConditionalSectionProps {
  condition: boolean;
  children?: React.ReactNode;
}

export function ConditionalSection({
  condition,
  children,
}: ConditionalSectionProps): React.ReactElement | null {
  if (!condition) return null;
  return <>{children}</>;
}

