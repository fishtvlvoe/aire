"use client";

import * as React from "react";
import { toast } from "sonner";
import { mockInvoke } from "@/lib/mock-backend";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ComingSoonCard } from "@/components/ComingSoonCard";

type LandApiSettingsResponse = {
  clientId: string;
  secret: string;
};

export function LandApiSection() {
  const [loading, setLoading] = React.useState(true);
  const [clientId, setClientId] = React.useState("");
  const [secret, setSecret] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [testing, setTesting] = React.useState(false);
  const [connectionStatus, setConnectionStatus] = React.useState<{
    success: boolean;
    latency_ms?: number;
    error?: string;
  } | null>(null);

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

  async function handleSave() {
    setSaving(true);
    try {
      await mockInvoke("save_land_api_settings", { clientId, secret });
      toast.success("地政查詢帳號已儲存");
    } catch {
      toast.error("儲存失敗，請重試");
    } finally {
      setSaving(false);
    }
  }

  async function handleTestConnection() {
    setTesting(true);
    setConnectionStatus(null);
    try {
      const res = await fetch("/api/land-api/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, secret }),
      });
      const data = (await res.json()) as { success: boolean; latency_ms?: number; error?: string };
      setConnectionStatus(data);
      if (data.success) {
        toast.success(`連線成功（延遲 ${data.latency_ms ?? 0}ms）`);
      } else {
        toast.error(data.error ?? "連線失敗");
      }
    } catch {
      setConnectionStatus({ success: false, error: "連線逾時" });
      toast.error("連線逾時");
    } finally {
      setTesting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>地政查詢帳號</CardTitle>
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
            <div className="rounded-lg bg-slate-50 p-4 text-sm">
              <h3 className="font-semibold">申請說明</h3>
              <p className="mt-2 text-muted-foreground">
                請使用自然人憑證或是工商憑證註冊帳號，即可開始使用。
              </p>
              <a
                className="mt-3 inline-flex rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white"
                href="https://cop.moi.gov.tw/Register"
                rel="noreferrer"
                target="_blank"
              >
                前往地政註冊
              </a>
            </div>

            <div className="space-y-2">
              <Label htmlFor="land-api-client-id">帳號識別碼</Label>
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
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={actionsDisabled}
                title={!hasValues ? "請先填入帳號識別碼和安全碼" : undefined}
              >
                測試連線
              </Button>
            </div>

            {connectionStatus !== null && (
              <div className={`text-sm ${connectionStatus.success ? "text-green-700" : "text-red-600"}`}>
                {connectionStatus.success
                  ? `連線成功（延遲 ${connectionStatus.latency_ms ?? 0}ms）`
                  : connectionStatus.error ?? "連線失敗"}
              </div>
            )}

            <ComingSoonCard title="教學影片" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
