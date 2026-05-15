"use client";

import * as React from "react";
import { Loader2, CheckCircle, XCircle, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  getApiKey,
  setApiKey,
  testConnection,
  type ApiKeyInfo,
  type ConnectionTestResult,
} from "@/lib/land-registry-api";

/**
 * ApiKeySettings — 地政 API 金鑰設定表單
 * 用在設定頁，讓使用者儲存 Client ID + Client Secret，
 * 並可測試連線是否正常。
 */
export function ApiKeySettings() {
  const [keyInfo, setKeyInfo] = React.useState<ApiKeyInfo | null>(null);
  const [clientId, setClientId] = React.useState("");
  const [clientSecret, setClientSecret] = React.useState("");
  const [saveState, setSaveState] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const [testState, setTestState] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const [testResult, setTestResult] = React.useState<ConnectionTestResult | null>(null);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  // 載入現有 API key 資訊
  React.useEffect(() => {
    getApiKey()
      .then((info) => setKeyInfo(info))
      .catch(() => setKeyInfo(null));
  }, []);

  async function handleSave() {
    if (!clientId.trim() || !clientSecret.trim()) return;
    setSaveState("loading");
    setSaveError(null);
    try {
      await setApiKey(clientId.trim(), clientSecret.trim());
      // 重新讀取 masked key
      const updated = await getApiKey();
      setKeyInfo(updated);
      setClientId("");
      setClientSecret("");
      setSaveState("success");
      setTimeout(() => setSaveState("idle"), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "儲存失敗");
      setSaveState("error");
    }
  }

  async function handleTestConnection() {
    setTestState("loading");
    setTestResult(null);
    try {
      const result = await testConnection();
      setTestResult(result);
      setTestState(result.success ? "success" : "error");
    } catch (err) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : "連線測試失敗",
      });
      setTestState("error");
    }
  }

  const isSaving = saveState === "loading";
  const isTesting = testState === "loading";

  return (
    <Card className="p-6 space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <Key className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-base font-semibold">地政 API 金鑰設定</h3>
      </div>

      {/* 已儲存的 key 狀態 */}
      {keyInfo && (
        <div className="rounded-md border border-border bg-muted/40 px-4 py-3 text-sm">
          <span className="text-muted-foreground">已儲存的 Client ID：</span>
          <span className="font-mono ml-1">{keyInfo.client_id_masked}</span>
          {keyInfo.has_secret && (
            <span className="ml-2 text-xs text-muted-foreground">（已設定 Secret）</span>
          )}
        </div>
      )}

      {/* Client ID */}
      <div className="space-y-1.5">
        <Label htmlFor="land-client-id">Client ID</Label>
        <Input
          id="land-client-id"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          placeholder="輸入新的 Client ID"
          disabled={isSaving}
        />
      </div>

      {/* Client Secret */}
      <div className="space-y-1.5">
        <Label htmlFor="land-client-secret">Client Secret</Label>
        <Input
          id="land-client-secret"
          type="password"
          value={clientSecret}
          onChange={(e) => setClientSecret(e.target.value)}
          placeholder="輸入 Client Secret"
          disabled={isSaving}
        />
      </div>

      {/* 儲存結果訊息 */}
      {saveState === "success" && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span>金鑰已成功儲存</span>
        </div>
      )}
      {saveState === "error" && saveError && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <XCircle className="h-4 w-4" />
          <span>{saveError}</span>
        </div>
      )}

      {/* 按鈕列 */}
      <div className="flex gap-3">
        <Button
          onClick={handleSave}
          disabled={isSaving || !clientId.trim() || !clientSecret.trim()}
        >
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          儲存
        </Button>
        <Button
          variant="outline"
          onClick={handleTestConnection}
          disabled={isTesting}
        >
          {isTesting && <Loader2 className="h-4 w-4 animate-spin" />}
          測試連線
        </Button>
      </div>

      {/* 連線測試結果 */}
      {testResult && (
        <div
          className={`flex items-center gap-2 text-sm rounded-md px-3 py-2 ${
            testResult.success
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-destructive/10 text-destructive border border-destructive/20"
          }`}
        >
          {testResult.success ? (
            <CheckCircle className="h-4 w-4 shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{testResult.message}</span>
        </div>
      )}
    </Card>
  );
}
