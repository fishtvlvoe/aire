"use client";

import * as React from "react";
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getBalance, type BalanceInfo } from "@/lib/land-registry-api";

/**
 * BalanceMonitor — 地政 API 餘額監控元件
 * 顯示本月查詢次數與費用，低餘額時顯示黃色警告 Badge。
 */
export function BalanceMonitor() {
  const [balance, setBalance] = React.useState<BalanceInfo | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  async function fetchBalance() {
    setLoading(true);
    setError(null);
    try {
      const data = await getBalance();
      setBalance(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "無法取得餘額資訊");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    fetchBalance();
  }, []);

  return (
    <Card className="p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">本月使用量</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={fetchBalance}
          disabled={loading}
          aria-label="重新整理"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {loading && !balance && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>載入中…</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {balance && (
        <div className="space-y-2">
          {/* 主要數據 */}
          <p className="text-sm text-muted-foreground">
            本月查詢{" "}
            <span className="font-semibold text-foreground">
              {balance.month_query_count}
            </span>{" "}
            次，費用{" "}
            <span className="font-semibold text-foreground">
              NT${balance.month_total_cost.toLocaleString()}
            </span>
          </p>

          {/* 低餘額警告 */}
          {balance.low_balance_warning && (
            <Badge
              className="gap-1.5 bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-100"
              variant="outline"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              餘額不足警告
            </Badge>
          )}
        </div>
      )}
    </Card>
  );
}
