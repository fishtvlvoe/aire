"use client";

import * as React from "react";
import { toast } from "sonner";
import { mockInvoke } from "@/lib/mock-backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

type LicenseStatus = "none" | "valid" | "expired";

type LicenseStatusResponse = {
  status: LicenseStatus;
  serial_key: string | null;
};

function mapActivateError(err: unknown): string {
  if (err instanceof Error) {
    if (err.message === "INVALID_KEY") {
      return "序號無效";
    }
    if (err.message === "MISSING_DEVICE") {
      return "缺少裝置識別碼，請重新啟動 AIRE 後再試";
    }
    if (err.message === "ALREADY_ACTIVATED_OTHER_DEVICE") {
      return "此序號已綁定其他裝置，請聯絡客服或申請授權轉移";
    }
  }
  return "啟用失敗";
}

export function LicenseSection() {
  const [licenseStatus, setLicenseStatus] = React.useState<LicenseStatus>("none");
  const [serialKey, setSerialKey] = React.useState<string | null>(null);
  const [inputValue, setInputValue] = React.useState<string>("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await mockInvoke<LicenseStatusResponse>("get_license_status");
        if (cancelled) return;
        setLicenseStatus(res.status);
        setSerialKey(res.serial_key);
      } catch {
        if (cancelled) return;
        setError("載入失敗");
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

  async function handleActivate() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/licenses/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serialKey: inputValue, deviceId: "web-dev" }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (res.ok) {
        setLicenseStatus("valid");
        setSerialKey(inputValue);
        toast.success("授權啟用成功");
      } else {
        const msg = mapActivateError(new Error(data.error ?? "啟用失敗"));
        setError(msg);
        toast.error(msg);
      }
    } catch {
      setError("啟用失敗");
      toast.error("啟用失敗");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeactivate() {
    const ok = window.confirm("確定要停用授權嗎？");
    if (!ok) return;

    setError(null);
    setSubmitting(true);
    try {
      await mockInvoke("deactivate_license");
      setLicenseStatus("none");
      setSerialKey(null);
      setInputValue("");
    } catch {
      setError("停用失敗");
    } finally {
      setSubmitting(false);
    }
  }

  const statusBadge = (() => {
    if (licenseStatus === "valid") {
      return (
        <Badge className="border-transparent bg-green-100 text-green-700">已啟用</Badge>
      );
    }
    if (licenseStatus === "expired") {
      return (
        <Badge className="border-transparent bg-red-100 text-red-700">授權已過期</Badge>
      );
    }
    return (
      <Badge variant="secondary" className="text-muted-foreground">
        尚未啟用授權
      </Badge>
    );
  })();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle>授權管理</CardTitle>
          {statusBadge}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-32" />
          </div>
        ) : licenseStatus === "valid" ? (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">序號：{serialKey ?? "—"}</div>
            <Button variant="destructive" onClick={handleDeactivate} disabled={submitting}>
              停用授權
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Input
              placeholder="輸入序號"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={submitting}
            />
            {error ? <div className="text-sm text-red-600">{error}</div> : null}
            <Button
              onClick={handleActivate}
              disabled={submitting || inputValue.trim().length === 0}
            >
              啟用授權
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
