import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { ReactNode } from "react";

interface TauriRequiredProps {
  children?: ReactNode;
}

export function TauriRequired({ children }: TauriRequiredProps) {
  if (process.env.NODE_ENV === "development") {
    return <>{children ?? null}</>;
  }

  return (
    <Card className="mx-auto w-full max-w-xl">
      <CardHeader className="space-y-1 pb-2">
        <h2 className="text-center text-xl font-semibold">AIRE</h2>
      </CardHeader>
      <CardContent className="space-y-2 text-center">
        <p className="text-base font-medium">此功能需在 AIRE 桌面 App 中使用</p>
        <p className="text-sm text-muted-foreground">
          請開啟 AIRE 桌面應用程式以使用完整功能
        </p>
      </CardContent>
    </Card>
  );
}
