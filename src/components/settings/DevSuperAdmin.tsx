"use client";

import * as React from "react";
import { mockInvoke } from "@/lib/mock-backend";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type FeatureFlag = {
  id: string;
  name: string;
  enabled: boolean;
};

type ToggleFeatureFlagResponse = {
  success: true;
  enabled: boolean;
};

export function DevSuperAdmin() {
  const [flags, setFlags] = React.useState<FeatureFlag[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // 非開發環境不載入 feature flags
    if (process.env.NODE_ENV !== "development") return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await mockInvoke<FeatureFlag[]>("get_feature_flags");
        if (cancelled) return;
        setFlags(res);
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Guard 放在所有 hook 之後
  if (process.env.NODE_ENV !== "development") return null;

  async function toggleFlag(flag: FeatureFlag) {
    const res = await mockInvoke<ToggleFeatureFlagResponse>("toggle_feature_flag", {
      id: flag.id,
    });

    setFlags((prev) =>
      prev.map((row) => (row.id === flag.id ? { ...row, enabled: res.enabled } : row)),
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-orange-500">Super Admin</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-28" />
          </div>
        ) : (
          <div className="space-y-3">
            {flags.map((flag) => (
              <div key={flag.id} className="flex items-center justify-between gap-4">
                <div className="text-sm">{flag.name}</div>
                <input
                  type="checkbox"
                  checked={flag.enabled}
                  onChange={() => {
                    void toggleFlag(flag);
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
