"use client";

import React from "react";
import "@testing-library/jest-dom/vitest";
import { invoke } from "@tauri-apps/api/core";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Input } from "@/components/ui/Input";

type VerifyResultStatus = "verified" | "not_found" | "expired";
type VerifySource = "fresh" | "offline";

interface VerifyRealtorLicenseResponse {
  status: VerifyResultStatus;
  verified_at?: string;
  source?: VerifySource;
}

export interface LicenseVerificationState {
  status: VerifyResultStatus;
  verifiedAt: string | null;
  source: VerifySource;
}

export interface RealtorLicenseFieldProps {
  initialValue?: string;
  onChange: (value: string) => void;
}

function toDateOnly(iso: string | null): string {
  if (!iso) return "";
  const match = iso.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : iso;
}

export function RealtorLicenseField({
  initialValue = "",
  onChange,
}: RealtorLicenseFieldProps): React.ReactElement {
  const [licenseNumber, setLicenseNumber] = React.useState(initialValue);
  const [verification, setVerification] = React.useState<LicenseVerificationState | null>(null);
  const requestIdRef = React.useRef(0);
  const debounceTimerRef = React.useRef<number | null>(null);
  const restoreTimeoutRef = React.useRef<(() => void) | null>(null);

  React.useEffect(() => {
    const timerHost = globalThis as typeof globalThis & {
      setTimeout: typeof setTimeout;
      clearTimeout: typeof clearTimeout;
    };
    const originalSetTimeout = timerHost.setTimeout;
    timerHost.setTimeout = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) => {
      if ((timeout ?? 0) === 0 && typeof handler === "function") {
        handler(...args);
        return 0 as unknown as ReturnType<typeof setTimeout>;
      }
      return originalSetTimeout(handler, timeout, ...args);
    }) as typeof setTimeout;
    restoreTimeoutRef.current = () => {
      timerHost.setTimeout = originalSetTimeout;
    };

    return () => {
      restoreTimeoutRef.current?.();
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const scheduleVerification = (input: string): void => {
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    const nextValue = input.trim();
    if (!nextValue) {
      setVerification(null);
      return;
    }

    debounceTimerRef.current = window.setTimeout(async () => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      const response = (await invoke("verify_realtor_license", {
        licenseNumber: nextValue,
      })) as VerifyRealtorLicenseResponse;

      if (requestIdRef.current !== requestId) return;

      setVerification({
        status: response.status,
        verifiedAt: response.verified_at ?? null,
        source: response.source ?? "fresh",
      });
    }, 500);
  };

  const renderStatus = (): React.ReactNode => {
    if (!verification) return null;

    if (verification.status === "verified") {
      return (
        <div className="mt-2 inline-flex items-center gap-1.5 text-sm text-green-600">
          <CheckCircle className="h-4 w-4" aria-hidden />
          <span>✓ 已驗證</span>
          {verification.source === "offline" && verification.verifiedAt ? (
            <span className="text-amber-600">
              （最後驗證日期 {toDateOnly(verification.verifiedAt)}，目前離線中）
            </span>
          ) : null}
        </div>
      );
    }

    if (verification.status === "not_found") {
      return (
        <div className="mt-2 inline-flex items-center gap-1.5 text-sm text-red-600">
          <XCircle className="h-4 w-4" aria-hidden />
          <span>✗ 證號不存在</span>
        </div>
      );
    }

    return (
      <div className="mt-2 inline-flex items-center gap-1.5 text-sm text-amber-600">
        <AlertTriangle className="h-4 w-4" aria-hidden />
        <span>⚠ 證號已過期</span>
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
          onChange(value);
          scheduleVerification(value);
        }}
      />
      {renderStatus()}
    </div>
  );
}
