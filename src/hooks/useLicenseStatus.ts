"use client";
import { useState, useEffect } from "react";
import { safeInvoke, NotInTauriError } from "@/lib/tauri-bridge";

type LicenseStatus = "valid" | "expired" | "none";

export function useLicenseStatus() {
  const [status, setStatus] = useState<LicenseStatus>("none");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const result = await safeInvoke<{ status: string }>("get_license_status");
        if (cancelled) return;
        if (result.status === "valid") setStatus("valid");
        else if (result.status === "expired") setStatus("expired");
        else setStatus("none");
      } catch (err) {
        if (cancelled) return;
        if (err instanceof NotInTauriError) {
          setStatus("none");
        } else {
          setStatus("none");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    check();
    return () => { cancelled = true; };
  }, []);

  return { status, isLoading };
}
