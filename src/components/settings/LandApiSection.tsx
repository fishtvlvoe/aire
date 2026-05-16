"use client";

import * as React from "react";
import { mockInvoke } from "@/lib/mock-backend";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ComingSoonCard } from "@/components/ComingSoonCard";

type ConnectionStatus = null | { success: boolean; latency_ms?: number };

type LandApiSettingsResponse = {
  clientId: string;
  secret: string;
};

type LandApiConnectionResponse = {
  success: true;
  latency_ms: number;
};

export function LandApiSection() {
  const [loading, setLoading] = React.useState(true);
  const [clientId, setClientId] = React.useState("");
  const [secret, setSecret] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [testing, setTesting] = React.useState(false);
  const [connectionStatus, setConnectionStatus] = React.useState<ConnectionStatus>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await mockInvoke<LandApiSettingsResponse>("get_land_api_settings");
        if (cancelled) return;
        setClientId(res.clientId ?? "");
        setSecret(res.secret ?? "");
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

  const hasValues = clientId.trim().length > 0 && secret.trim().length > 0;
  const actionsDisabled = !hasValues || loading || saving || testing;
  const testConnectionTooltip = !hasValues ? "請先填入 Client ID 和安全碼" : undefined;

  async function handleSave() {
    setSaving(true);
    try {
      await mockInvoke("save_land_api_settings", {
        clientId,
        secret,
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleTestConnection() {
    setTesting(true);
    setConnectionStatus(null);
    try {
      const res = await mockInvoke<LandApiConnectionResponse>("test_land_api_connection");
      setConnectionStatus({ success: true, latency_ms: res.latency_ms });
    } catch {
      setConnectionStatus({ success: false });
    } finally {
      setTesting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>地政 API 設定</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-40" />
          </div>
        ) : (
          <div className="space-y-4">
            <ComingSoonCard title="申請說明" />

            <div className="space-y-2">
              <Label htmlFor="land-api-client-id">Client ID</Label>
              <Input
                id="land-api-client-id"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="land-api-secret">安全碼</Label>
              <Input
                id="land-api-secret"
                type="password"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={handleSave} disabled={actionsDisabled}>
                儲存
              </Button>
              <span title={actionsDisabled ? testConnectionTooltip : undefined}>
                <Button
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={actionsDisabled}
                >
                  測試連線
                </Button>
              </span>
            </div>

            {connectionStatus ? (
              connectionStatus.success ? (
                <div className="text-sm text-green-700">
                  連線成功（延遲 {connectionStatus.latency_ms ?? 0}ms）
                </div>
              ) : (
                <div className="text-sm text-red-600">連線失敗</div>
              )
            ) : null}

            <ComingSoonCard title="教學影片" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
