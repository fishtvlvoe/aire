"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ComingSoonCard } from "@/components/ComingSoonCard";
import { getApiKey, setApiKey, testConnection, type ApiKeyInfo } from "@/lib/land-registry-api";

export function LandApiSection() {
  const [loading, setLoading] = React.useState(true);
  const [clientId, setClientId] = React.useState("");
  const [secret, setSecret] = React.useState("");
  const [storedKey, setStoredKey] = React.useState<ApiKeyInfo | null>(null);
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
        const res = await getApiKey();
        if (cancelled) return;
        setStoredKey(res);
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
  const canTest = hasValues || storedKey !== null;
  const saveDisabled = !hasValues || loading || saving || testing;
  const testDisabled = !canTest || loading || saving || testing;

  async function handleSave() {
    setSaving(true);
    try {
      await setApiKey(clientId.trim(), secret.trim());
      setStoredKey(await getApiKey());
      setClientId("");
      setSecret("");
      toast.success("地政查詢帳號已儲存");
    } catch (error) {
      const message = error instanceof Error ? error.message : "儲存失敗，請重試";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleTestConnection() {
    setTesting(true);
    setConnectionStatus(null);
    try {
      if (hasValues) {
        await setApiKey(clientId.trim(), secret.trim());
        setStoredKey(await getApiKey());
        setClientId("");
        setSecret("");
      }
      const result = await testConnection();
      const data = {
        success: result.success,
        latency_ms: "latency_ms" in result && typeof result.latency_ms === "number" ? result.latency_ms : undefined,
        error: result.success ? undefined : result.message || "連線失敗",
      };
      setConnectionStatus(data);
      if (data.success) {
        toast.success(`連線成功（延遲 ${data.latency_ms ?? 0}ms）`);
      } else {
        toast.error(data.error ?? "連線失敗");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "連線逾時";
      setConnectionStatus({ success: false, error: message });
      toast.error(message);
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

            {storedKey !== null && (
              <div className="rounded-lg border bg-emerald-50 p-4 text-sm text-emerald-900">
                <div className="font-semibold">已儲存地政查詢帳號</div>
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  <div className="rounded-md bg-white px-3 py-2">
                    <div className="text-xs text-muted-foreground">帳號識別碼</div>
                    <div className="font-mono text-sm">{storedKey.client_id_masked}</div>
                  </div>
                  <div className="rounded-md bg-white px-3 py-2">
                    <div className="text-xs text-muted-foreground">安全碼</div>
                    <div className="font-medium">{storedKey.has_secret ? "已設定" : "尚未設定"}</div>
                  </div>
                </div>
                <p className="mt-2 text-xs text-emerald-800">
                  安全碼儲存在本機系統鑰匙圈，不會在畫面顯示原文；要更換時請重新輸入整組帳號與安全碼。
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="land-api-client-id">帳號識別碼</Label>
              <Input
                id="land-api-client-id"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder={storedKey ? "輸入新帳號以更換" : undefined}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="land-api-secret">安全碼</Label>
              <Input
                id="land-api-secret"
                type="password"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder={storedKey ? "輸入新安全碼以更換" : undefined}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={handleSave} disabled={saveDisabled}>
                儲存
              </Button>
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={testDisabled}
                title={!canTest ? "請先填入帳號識別碼和安全碼" : undefined}
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
