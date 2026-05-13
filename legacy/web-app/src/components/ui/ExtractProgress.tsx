"use client";

import { useEffect, useState } from "react";

export type ExtractProgressProps = {
  status: "none" | "processing" | "done" | "failed";
  /** 進度值 0–1 */
  progress: number;
};

/**
 * ExtractProgress — 章節標題旁的 OCR 解析進度指示
 *
 * - none      → 不顯示
 * - processing → spinner + 百分比
 * - done       → 綠色勾（3 秒後自動隱藏）
 * - failed     → 紅色警示
 */
export default function ExtractProgress({
  status,
  progress,
}: ExtractProgressProps) {
  // done 狀態 3 秒後自動隱藏；其他狀態預設可見
  // 用 status 推導初始值，讓 useState 的 initializer 處理首次渲染
  const [visible, setVisible] = useState(() => status !== "done");

  useEffect(() => {
    // 進入 done 狀態後：先等 3 秒，再隱藏
    // 注意：此 effect 只觸發 setTimeout callback，不在 effect 主體同步呼叫 setState
    if (status !== "done") {
      // 非 done 狀態進入 → 確保可見（由 status 變化驅動，非同步 setState）
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 此為 status prop 變化後的一次性重置，外部驅動
      setVisible(true);
      return;
    }

    // done 狀態：3 秒後隱藏
    const timer = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(timer);
  }, [status]);

  if (status === "none") return null;
  if (status === "done" && !visible) return null;

  const percent = Math.round(Math.min(1, Math.max(0, progress)) * 100);

  if (status === "processing") {
    return (
      <span className="ml-2 inline-flex items-center gap-1.5 text-xs text-slate-500">
        {/* 旋轉圓圈 — 純 Tailwind animate-spin */}
        <svg
          className="h-3.5 w-3.5 animate-spin text-blue-500"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"
          />
        </svg>
        OCR 解析中... {percent}%
      </span>
    );
  }

  if (status === "done") {
    return (
      <span className="ml-2 inline-flex items-center gap-1 text-xs text-emerald-600">
        {/* 勾勾 icon */}
        <svg
          className="h-3.5 w-3.5"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
            clipRule="evenodd"
          />
        </svg>
        解析完成
      </span>
    );
  }

  // failed
  return (
    <span className="ml-2 inline-flex items-center gap-1 text-xs text-red-600">
      {/* X icon */}
      <svg
        className="h-3.5 w-3.5"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
      </svg>
      部分解析失敗
    </span>
  );
}
