"use client";

// AIRE 啟用畫面（Task 4.5 → Task 11 重寫）
//
// 對應 design.md D3 / Phase 1：
//   - 未啟用或被遠端撤銷時的入口
//   - 助理輸入序號 → invoke('activate_license', { key }) → 進主畫面
//   - 錯誤碼對應文案：
//       409 ALREADY_ACTIVATED_OTHER_DEVICE → 「此序號已綁定其他裝置...」
//       422 INVALID_KEY                     → 「序號無效，請確認...」
//       422 QUOTA_EXHAUSTED                 → 「授權額度已用盡...」
//       CREDENTIAL_STORE_UNAVAILABLE        → 「無法寫入系統憑證儲存區...」
//       NETWORK_FAILED                      → 「無法連線 OPCOS...」

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { isTauriEnv, safeInvoke } from "@/lib/tauri-bridge";

interface ActivationErrorShape {
  code: string;
  message: string;
}

const ERROR_TEXT: Record<string, string> = {
  ALREADY_ACTIVATED_OTHER_DEVICE:
    "此序號已綁定其他裝置，請聯絡客服解除原裝置綁定後再試。",
  INVALID_KEY: "序號無效，請確認輸入是否正確（注意大小寫與連字號）。",
  QUOTA_EXHAUSTED: "授權額度已用盡，請聯絡客服加購授權。",
  CREDENTIAL_STORE_UNAVAILABLE:
    "無法寫入系統憑證儲存區。請以管理員身份開啟，或檢查系統 Keychain / 認證管理員是否正常。",
  NETWORK_FAILED: "無法連線 OPCOS 伺服器，請確認網路狀態後再試。",
  OPCOS_UNAVAILABLE: "OPCOS 伺服器目前暫時無法服務，請稍後再試。",
};

export function ActivationPage() {
  const router = useRouter();
  const isDevelopment = process.env.NODE_ENV === "development";
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [isCheckingEnv, setIsCheckingEnv] = useState(true);
  const [isTauri, setIsTauri] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const detected = await isTauriEnv();
      if (!mounted) return;
      setIsTauri(detected);
      setIsCheckingEnv(false);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldError(null);

    if (!key.trim()) {
      setFieldError("請輸入授權序號");
      return;
    }

    setLoading(true);
    try {
      await safeInvoke("activate_license", { key: key.trim() });
      toast.success("授權啟動成功");
      router.replace("/cases");
    } catch (err) {
      const e = err as ActivationErrorShape;
      const code =
        e && typeof e === "object" && "code" in e ? e.code : "NETWORK_FAILED";
      const text =
        ERROR_TEXT[code] ??
        (e && typeof e === "object" && "message" in e
          ? (e.message as string)
          : "啟用失敗，請稍後再試。");
      toast.error(text);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md shadow-md">
        <CardHeader className="space-y-1 pb-4">
          <h1 className="text-center text-2xl font-bold tracking-tight">
            AIRE
          </h1>
          <p className="text-center text-sm text-muted-foreground">
            不動產說明書自動化系統
          </p>
        </CardHeader>
        <CardContent>
          {isCheckingEnv ? (
            <div className="flex items-center justify-center py-8" role="status" aria-live="polite">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="ml-2 text-sm text-muted-foreground">偵測桌面環境中…</span>
            </div>
          ) : isTauri || isDevelopment ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="license-key">授權序號</Label>
                <Input
                  id="license-key"
                  type="text"
                  autoComplete="off"
                  value={key}
                  onChange={(e) => {
                    setKey(e.target.value);
                    setFieldError(null);
                  }}
                  placeholder="AIRE-XXXX-XXXX-XXXX"
                  disabled={loading}
                  className={fieldError ? "border-destructive" : ""}
                />
                {fieldError && (
                  <p className="text-sm text-destructive">{fieldError}</p>
                )}
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading ? "啟動中…" : "啟動授權"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                啟動後可離線使用 30 天
              </p>
            </form>
          ) : (
            <div className="py-6 text-center">
              <p className="text-sm text-muted-foreground">
                請在 AIRE 桌面 App 中開啟
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// SSR 關閉：window.__TAURI__ 偵測需要在 client 執行
export default dynamic(() => Promise.resolve(ActivationPage), { ssr: false });
