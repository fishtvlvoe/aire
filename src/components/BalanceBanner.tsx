"use client";

import * as React from "react";
import { AlertTriangle, X } from "lucide-react";

/**
 * BalanceBanner — 案件頁面餘額警告橫幅
 * 只在 low_balance_warning = true 時顯示，可在 session 內關閉。
 */
interface BalanceBannerProps {
  /** 是否顯示低餘額警告 */
  lowBalanceWarning: boolean;
}

export function BalanceBanner({ lowBalanceWarning }: BalanceBannerProps) {
  const [dismissed, setDismissed] = React.useState(false);

  // lowBalanceWarning 從 false 變 true 時重置關閉狀態
  React.useEffect(() => {
    if (lowBalanceWarning) {
      setDismissed(false);
    }
  }, [lowBalanceWarning]);

  if (!lowBalanceWarning || dismissed) return null;

  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-3 rounded-md border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800"
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0 text-yellow-600" />
        <span>
          餘額不足：剩餘查詢次數低於 10 次，請儘速補值
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        aria-label="關閉警告"
        className="shrink-0 rounded-sm p-0.5 text-yellow-600 transition-colors hover:bg-yellow-100 hover:text-yellow-800 focus:outline-none focus:ring-2 focus:ring-yellow-400"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
