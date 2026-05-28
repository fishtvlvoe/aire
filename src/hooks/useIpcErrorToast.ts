"use client";

import { toast } from "sonner";
import { formatIpcError, parseIpcError } from "@/lib/ipc-error";

export function useIpcErrorToast() {
  function handleError(err: unknown): void {
    const ipcErr = parseIpcError(err);
    if (ipcErr !== null) {
      toast.error(ipcErr.message || formatIpcError(ipcErr.code));
    } else {
      toast.error(err instanceof Error ? err.message : "操作失敗");
    }
  }

  return { handleError };
}
