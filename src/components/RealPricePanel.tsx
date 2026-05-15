"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { safeInvoke } from "@/lib/safe-invoke";

interface RealPricePanelProps {
  district: string;
  keyword: string;
}

type PanelState = "idle" | "loading" | "success" | "error";

type RealPriceRecord = {
  address: string;
  total_price: number;
  area: number;
  unit_price: number;
  date: string;
  type: string;
};

export function RealPricePanel({ district, keyword }: RealPricePanelProps) {
  const [state, setState] = React.useState<PanelState>("idle");
  const [records, setRecords] = React.useState<RealPriceRecord[]>([]);
  const [errorMessage, setErrorMessage] = React.useState<string>("");

  async function handleQuery() {
    setState("loading");
    setErrorMessage("");

    try {
      const result = await safeInvoke<RealPriceRecord[]>("query_real_price", {
        district,
        keyword,
        limit: 20,
      });
      setRecords(result.slice(0, 20));
      setState("success");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
      setState("error");
    }
  }

  return (
    <div className="space-y-3">
      {state === "idle" && <Button onClick={handleQuery}>查實價登錄</Button>}

      {state === "loading" && (
        <div
          className="flex items-center gap-2 text-sm text-muted-foreground"
          data-testid="real-price-loading"
          role="status"
        >
          <Spinner size={16} aria-label="loading" />
          <span>查詢中…</span>
        </div>
      )}

      {state === "error" && (
        <div className="text-sm text-destructive" role="alert">
          查詢失敗：{errorMessage}
        </div>
      )}

      {state === "success" && (
        <div className="space-y-2">
          {records.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              查無符合條件的實價登錄資料
            </div>
          ) : (
            records.map((record, index) => (
              <div
                key={`${record.address}-${index}`}
                className="space-y-1 rounded-md border p-3"
              >
                <div className="font-medium">{record.address}</div>
                <div className="text-sm text-muted-foreground">
                  成交總價：NT${record.total_price.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  坪數：{record.area.toFixed(1)} 坪
                </div>
                <div className="text-sm text-muted-foreground">
                  單價：NT${record.unit_price.toLocaleString()}/坪
                </div>
                <div className="text-sm text-muted-foreground">
                  交易日期：{record.date}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
