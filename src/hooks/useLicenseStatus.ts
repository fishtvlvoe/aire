"use client";
import { useState, useEffect } from "react";

type LicenseStatus = "valid" | "expired" | "none";

export function useLicenseStatus() {
  const [status, setStatus] = useState<LicenseStatus>("none");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function check() {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        const result = await invoke("get_license_status") as { status: string };
        if (result.status === "valid") setStatus("valid");
        else if (result.status === "expired") setStatus("expired");
        else setStatus("none");
      } catch {
        // Tauri IPC 不可用（瀏覽器環境）→ fallback
        setStatus("none");
      } finally {
        setIsLoading(false);
      }
    }
    check();
  }, []);

  return { status, isLoading };
}
