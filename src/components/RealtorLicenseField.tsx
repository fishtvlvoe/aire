"use client";

import React from "react";
import { invoke } from "@tauri-apps/api/core";
import { AlertTriangle, CheckCircle, XCircle, WifiOff } from "lucide-react";
import { Input } from "@/components/ui/input";

type VerifyResultStatus = "verified" | "not_found" | "expired";
type VerifySource = "fresh" | "offline";

/** Tauri IPC 回傳格式 */
interface VerifyRealtorLicenseResponse {
  status: VerifyResultStatus;
  verified_at?: string;
  source?: VerifySource;
}

/** 驗證狀態（外部 form 可接收的類型） */
export interface LicenseVerificationState {
  status: VerifyResultStatus;
  verifiedAt: string | null;
  source: VerifySource;
}

/** 元件 Props */
export interface RealtorLicenseFieldProps {
  initialValue?: string;
  /** 證號文字變更時呼叫 */
  onChange: (value: string) => void;
  /**
   * 每次驗證結果更新時呼叫（null 表示清空輸入）
   * 外部 form 透過此 callback 取得 verification_status
   */
  onVerificationChange?: (state: LicenseVerificationState | null) => void;
}

function toDateOnly(iso: string | null): string {
  if (!iso) return "";
  const match = iso.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : iso;
}

export function RealtorLicenseField({
  initialValue = "",
  onChange,
  onVerificationChange,
}: RealtorLicenseFieldProps): React.ReactElement {
  const [licenseNumber, setLicenseNumber] = React.useState(initialValue);
  const [verification, setVerification] = React.useState<LicenseVerificationState | null>(null);
  const requestIdRef = React.useRef(0);
  const debounceTimerRef = React.useRef<number | null>(null);

  // 元件卸載時清除 debounce timer，避免記憶體洩漏
  React.useEffect(() => {
    return () => {
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  /** 更新驗證狀態，並同時通知外部 form */
  const applyVerification = React.useCallback(
    (next: LicenseVerificationState | null) => {
      setVerification(next);
      onVerificationChange?.(next);
    },
    [onVerificationChange],
  );

  const scheduleVerification = React.useCallback(
    (input: string): void => {
      // 清除上一個 debounce timer
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      const nextValue = input.trim();
      if (!nextValue) {
        // 清空輸入 → 重置驗證狀態
        applyVerification(null);
        return;
      }

      // 500ms debounce：快速輸入只發一次 IPC
      debounceTimerRef.current = window.setTimeout(async () => {
        const requestId = requestIdRef.current + 1;
        requestIdRef.current = requestId;

        try {
          const response = (await invoke("verify_realtor_license", {
            licenseNumber: nextValue,
          })) as VerifyRealtorLicenseResponse;

          // 若有更新的請求已發出，丟棄這次結果（防競態條件）
          if (requestIdRef.current !== requestId) return;

          applyVerification({
            status: response.status,
            verifiedAt: response.verified_at ?? null,
            source: response.source ?? "fresh",
          });
        } catch {
          // IPC 失敗（如 Tauri bridge 未就緒）不阻擋
          if (requestIdRef.current !== requestId) return;
          applyVerification(null);
        }
      }, 500);
    },
    [applyVerification],
  );

  const renderStatus = (): React.ReactNode => {
    if (!verification) return null;

    const isOffline = verification.source === "offline";
    const hasCache = Boolean(verification.verifiedAt);

    // 離線且無任何 cache：無法驗證
    if (isOffline && !hasCache) {
      return (
        <div className="mt-2 inline-flex items-center gap-1.5 text-sm text-amber-600">
          <WifiOff className="h-4 w-4" aria-hidden />
          <span>離線中、無法驗證</span>
        </div>
      );
    }

    if (verification.status === "verified") {
      return (
        <div className="mt-2 flex flex-col gap-0.5">
          <div className="inline-flex items-center gap-1.5 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" aria-hidden />
            {isOffline ? (
              // 離線 + 有 cache：附加最後驗證日期提示
              <span>
                已驗證（最後驗證日期 {toDateOnly(verification.verifiedAt)}，目前離線中）
              </span>
            ) : (
              <span>已驗證</span>
            )}
          </div>
        </div>
      );
    }

    if (verification.status === "not_found") {
      return (
        <div className="mt-2 inline-flex items-center gap-1.5 text-sm text-destructive">
          <XCircle className="h-4 w-4" aria-hidden />
          <span>證號不存在</span>
        </div>
      );
    }

    // expired
    return (
      <div className="mt-2 flex flex-col gap-0.5">
        <div className="inline-flex items-center gap-1.5 text-sm text-amber-600">
          <AlertTriangle className="h-4 w-4" aria-hidden />
          {isOffline ? (
            <span>
              證號已過期（最後驗證日期 {toDateOnly(verification.verifiedAt)}，目前離線中）
            </span>
          ) : (
            <span>證號已過期</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-1">
      <label className="text-sm font-medium" htmlFor="realtor-license-input">
        經紀人證號
      </label>
      <Input
        id="realtor-license-input"
        type="text"
        value={licenseNumber}
        onChange={(event) => {
          const value = event.target.value;
          setLicenseNumber(value);
          // 通知父元件文字變更
          onChange(value);
          // 500ms debounce 觸發驗證
          scheduleVerification(value);
        }}
      />
      {renderStatus()}
    </div>
  );
}
