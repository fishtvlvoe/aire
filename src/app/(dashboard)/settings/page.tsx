"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { safeInvoke } from "@/lib/tauri-bridge";

type LicenseStatus = "none" | "valid" | "expired";

interface LicenseResponse {
  status: LicenseStatus;
  serial_key: string | null;
}

interface AppSettingsResponse {
  landApi: {
    clientId: string;
    secret: string;
  };
  premiumUnlocked: boolean;
}

const LICENSE_ERROR_MESSAGES: Record<string, string> = {
  INVALID_KEY: "序號無效，請確認輸入是否正確",
  ALREADY_ACTIVATED_OTHER_DEVICE: "此序號已綁定其他裝置，請先解除舊裝置授權",
  QUOTA_EXHAUSTED: "授權額度已用盡，請聯繫客服",
};

const LAND_API_HELP_URL =
  "https://lisp.land.moi.gov.tw/MMSRMS/ODMNS/odmns-main.aspx";
const OPCOS_UPGRADE_URL =
  process.env.NEXT_PUBLIC_OPCOS_UPGRADE_URL ?? "https://opcos.com.tw";

function maskSerialKey(serialKey: string): string {
  if (serialKey.length < 3) {
    return "****";
  }
  const suffix = serialKey.slice(-3);
  return `AIRE-****-****-${suffix}`;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus>("none");
  const [serialKey, setSerialKey] = useState<string | null>(null);
  const [serialInput, setSerialInput] = useState("");
  const [licenseError, setLicenseError] = useState<string | null>(null);

  const [clientId, setClientId] = useState("");
  const [secret, setSecret] = useState("");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [premiumUnlocked, setPremiumUnlocked] = useState(false);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const [license, appSettings] = await Promise.all([
          safeInvoke<LicenseResponse>("get_license_status"),
          safeInvoke<AppSettingsResponse>("get_app_settings"),
        ]);

        if (!active) {
          return;
        }

        setLicenseStatus(license.status);
        setSerialKey(license.serial_key);
        setClientId(appSettings.landApi.clientId ?? "");
        setSecret(appSettings.landApi.secret ?? "");
        setPremiumUnlocked(Boolean(appSettings.premiumUnlocked));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  async function handleActivateLicense() {
    setLicenseError(null);

    if (!serialInput.trim()) {
      setLicenseError("請輸入授權序號");
      return;
    }

    try {
      await safeInvoke("activate_license", {
        serial_key: serialInput.trim(),
      });

      setLicenseStatus("valid");
      setSerialKey(serialInput.trim());
      setSerialInput("");
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      setLicenseError(LICENSE_ERROR_MESSAGES[code] ?? "啟動失敗，請稍後再試");
    }
  }

  async function handleDeactivateLicense() {
    setLicenseError(null);
    await safeInvoke("deactivate_license", undefined);
    setLicenseStatus("none");
    setSerialKey(null);
  }

  async function handleSaveLandApi() {
    setSaveMessage(null);
    await safeInvoke("save_app_settings", {
      landApi: {
        clientId,
        secret,
      },
    });
    setSaveMessage("設定已儲存");
  }

  function handleOpenUpgrade() {
    window.open(OPCOS_UPGRADE_URL, "_blank", "noopener,noreferrer");
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>序號管理</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {licenseStatus === "valid" && serialKey ? (
            <>
              <div className="flex items-center gap-2 text-emerald-600">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-sm font-medium">已啟動</span>
              </div>
              <p className="text-sm text-muted-foreground">{maskSerialKey(serialKey)}</p>
              <Button variant="outline" onClick={handleDeactivateLicense}>
                解除授權
              </Button>
            </>
          ) : (
            <>
              <Input
                placeholder="AIRE-XXXX-XXXX-XXXX"
                value={serialInput}
                onChange={(event) => setSerialInput(event.target.value)}
              />
              <Button onClick={handleActivateLicense}>啟動授權</Button>
            </>
          )}

          {licenseError ? <p className="text-sm text-destructive">{licenseError}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>地政 API 設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="land-api-client-id">Client ID</Label>
            <Input
              id="land-api-client-id"
              value={clientId}
              onChange={(event) => setClientId(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="land-api-secret">安全碼</Label>
            <Input
              id="land-api-secret"
              type="password"
              value={secret}
              onChange={(event) => setSecret(event.target.value)}
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <a
              href={LAND_API_HELP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              如何申請地政 API？
            </a>
            <Button onClick={handleSaveLandApi}>儲存</Button>
          </div>

          <div className="overflow-hidden rounded-md border">
            <iframe
              title="地政 API 教學影片"
              src=""
              className="aspect-video w-full"
              allowFullScreen
            />
          </div>

          {saveMessage ? <p className="text-sm text-emerald-600">{saveMessage}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>進階功能</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {premiumUnlocked ? (
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-medium">實價登錄 MCP Hub — 已開通</span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-amber-600">
                <Lock className="h-4 w-4" />
                <span className="text-sm font-medium">實價登錄 MCP Hub — 月費訂閱</span>
              </div>
              <Button onClick={handleOpenUpgrade}>前往 OPCOS 開通</Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
