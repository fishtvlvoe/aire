"use client";

// AIRE 啟用畫面（Task 4.5）
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

import { useState } from "react";
import { useRouter } from "next/navigation";

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

export default function ActivationPage() {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorCode(null);
    setErrorDetail(null);
    if (!key.trim()) {
      setErrorCode("INVALID_KEY");
      return;
    }
    setLoading(true);
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("activate_license", { key: key.trim() });
      router.push("/cases");
    } catch (err) {
      const e = err as ActivationErrorShape;
      if (e && typeof e === "object" && "code" in e) {
        setErrorCode(e.code);
        setErrorDetail(e.message);
      } else {
        setErrorCode("NETWORK_FAILED");
        setErrorDetail(String(err));
      }
    } finally {
      setLoading(false);
    }
  }

  const errorText = errorCode
    ? ERROR_TEXT[errorCode] ?? errorDetail ?? "啟用失敗，請稍後再試。"
    : null;

  return (
    <main
      style={{
        maxWidth: 480,
        margin: "80px auto",
        padding: 24,
        fontFamily: "system-ui, sans-serif",
        lineHeight: 1.6,
      }}
    >
      <h1 style={{ marginBottom: 8 }}>啟用 AIRE</h1>
      <p style={{ color: "#555", marginBottom: 24 }}>
        請輸入您的授權序號以啟用本機 App。啟用後可離線使用 30 天。
      </p>
      <form onSubmit={handleSubmit}>
        <label
          htmlFor="license-key"
          style={{ display: "block", marginBottom: 8, fontWeight: 600 }}
        >
          授權序號
        </label>
        <input
          id="license-key"
          type="text"
          autoComplete="off"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="例：AIRE-XXXX-XXXX-XXXX"
          style={{
            width: "100%",
            padding: "10px 12px",
            border: "1px solid #ccc",
            borderRadius: 6,
            fontSize: 16,
            marginBottom: 16,
          }}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !key.trim()}
          style={{
            width: "100%",
            padding: "10px 16px",
            background: loading ? "#999" : "#111",
            color: "white",
            border: "none",
            borderRadius: 6,
            fontSize: 16,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "啟用中…" : "啟用"}
        </button>
      </form>
      {errorText ? (
        <div
          role="alert"
          style={{
            marginTop: 16,
            padding: 12,
            background: "#fdecea",
            color: "#b00020",
            borderRadius: 6,
            border: "1px solid #f5c2c0",
          }}
        >
          {errorText}
        </div>
      ) : null}
    </main>
  );
}
