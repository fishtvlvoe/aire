"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** GET /api/listings/[id]/extract-status 的回傳結構 */
export type ExtractStatusResponse = {
  status: "none" | "processing" | "done" | "failed";
  /** 已完成附件數 */
  done: number;
  /** 總附件數 */
  total: number;
  /** 失敗附件數 */
  failed: number;
  /** 進度 0–1（由 API 計算或由 hook 推導） */
  progress: number;
};

/**
 * useExtractStatus — 輪詢 OCR 解析狀態
 *
 * - 每 2 秒呼叫 GET /api/listings/[id]/extract-status
 * - status 為 'done' 或 'failed' 時自動停止輪詢
 * - enabled === false 時不啟動輪詢
 *
 * @param listingId  物件 ID（null 時不啟動）
 * @param enabled    外部開關，預設 true
 */
export function useExtractStatus(
  listingId: number | null,
  enabled: boolean = true,
): ExtractStatusResponse & { refresh: () => void } {
  const [state, setState] = useState<ExtractStatusResponse>({
    status: "none",
    done: 0,
    total: 0,
    failed: 0,
    progress: 0,
  });

  // 以 ref 追蹤 interval id，避免閉包問題
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // 以 ref 追蹤最新 status，避免在 setInterval callback 中讀到舊值
  const statusRef = useRef<string>("none");

  const clearPolling = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const fetchStatus = useCallback(async () => {
    if (listingId === null) return;

    try {
      const res = await fetch(`/api/listings/${listingId}/extract-status`, {
        cache: "no-store",
      });

      if (!res.ok) return;

      const data = (await res.json()) as Partial<ExtractStatusResponse>;

      // 正規化欄位，防止 API 結構不完整
      const done = data.done ?? 0;
      const total = data.total ?? 0;
      const failed = data.failed ?? 0;
      const progress =
        typeof data.progress === "number"
          ? data.progress
          : total > 0
            ? done / total
            : 0;
      const status =
        (data.status as ExtractStatusResponse["status"] | undefined) ?? "none";

      const next: ExtractStatusResponse = {
        status,
        done,
        total,
        failed,
        progress,
      };

      setState(next);
      statusRef.current = status;

      // 終止狀態：停止輪詢
      if (status === "done" || status === "failed") {
        clearPolling();
      }
    } catch {
      // 網路錯誤靜默忽略，繼續下次輪詢
    }
  }, [listingId]);

  useEffect(() => {
    // 條件不滿足就確保清掉舊 interval
    if (!enabled || listingId === null) {
      clearPolling();
      return;
    }

    // 立即執行第一次（fetchStatus 為 async，setState 在 callback 內觸發，不屬於同步 setState in effect）
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch，非同步更新 state，符合 React 建議做法
    void fetchStatus();

    // 建立輪詢（2 秒一次）
    intervalRef.current = setInterval(() => {
      // 終止狀態不再 fetch（理論上 fetchStatus 內會清，但雙重保險）
      if (statusRef.current === "done" || statusRef.current === "failed") {
        clearPolling();
        return;
      }
      void fetchStatus();
    }, 2000);

    return () => {
      clearPolling();
    };
  }, [enabled, fetchStatus, listingId]);

  return { ...state, refresh: fetchStatus };
}
