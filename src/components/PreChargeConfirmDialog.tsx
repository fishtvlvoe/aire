"use client";

import * as React from "react";
import { CreditCard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FORMAL_COP_UNIT_COST_TWD } from "@/lib/formal-cop-api-set";

/**
 * PreChargeConfirmDialog — 查詢扣款前二次確認 Dialog
 * 顯示本次預計查詢的 API 數量與預估費用，
 * 讓使用者確認後才執行扣款查詢。
 */
interface PreChargeConfirmDialogProps {
  /** 本次預計查詢的 API 數量 */
  apiCount: number;
  /** 本次查詢的 API 項目 */
  apiIds?: string[];
  /** 預估費用（新台幣） */
  estimatedCost: number;
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

type QueryDetail = {
  queryItem: string;
  resultItem: string;
  unitCost: number;
};

const API_COPY: Record<string, QueryDetail> = {
  land_registry: {
    queryItem: "土地標示資料",
    resultItem: "地段、地號、土地面積、使用分區、公告現值與公告地價",
    unitCost: FORMAL_COP_UNIT_COST_TWD,
  },
  building_registry: {
    queryItem: "建物標示資料",
    resultItem: "建號、法定用途、面積、樓層、建築完成日期",
    unitCost: FORMAL_COP_UNIT_COST_TWD,
  },
  building_ownership: {
    queryItem: "建物所有權資料",
    resultItem: "所有權人、權利範圍、登記日期與取得原因",
    unitCost: FORMAL_COP_UNIT_COST_TWD,
  },
  building_other_rights: {
    queryItem: "建物他項權利資料",
    resultItem: "抵押、他項權利與限制設定狀態",
    unitCost: FORMAL_COP_UNIT_COST_TWD,
  },
};

function buildDialogDetails(apiIds: string[]): QueryDetail[] {
  const rows = apiIds
    .map((apiId) => API_COPY[apiId])
    .filter((item): item is QueryDetail => Boolean(item));

  if (rows.length > 0) return rows;

  return [
    {
      queryItem: "正式地政資料",
      resultItem: "正式地政欄位會寫入案件，供正式版 PDF 使用",
      unitCost: FORMAL_COP_UNIT_COST_TWD,
    },
  ];
}

export function PreChargeConfirmDialog({
  apiCount,
  apiIds = [],
  estimatedCost,
  open,
  onConfirm,
  onCancel,
}: PreChargeConfirmDialogProps) {
  const details = buildDialogDetails(apiIds);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="h-5 w-5 text-primary" />
            <DialogTitle>確認查詢並扣款</DialogTitle>
          </div>
          <DialogDescription>
            本操作會向地政資訊系統取得正式資料並產生費用。免費前查不收費，只有正式查詢才會計費。
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border border-border bg-muted/30 px-4 py-3 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">預計查詢項目</span>
            <span className="font-medium">{apiCount} 項</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">預估費用</span>
            <span className="font-semibold text-foreground">
              NT${estimatedCost.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div className="rounded-md border px-4 py-3">
            <p className="font-medium">費用明細</p>
            <div className="mt-2 overflow-hidden rounded-md border">
              <div className="grid grid-cols-[1fr_auto] bg-muted/40 px-3 py-2 font-medium text-foreground">
                <span>查詢項目</span>
                <span>費用</span>
              </div>
              {details.map((detail) => (
                <div
                  key={`price-${detail.queryItem}`}
                  className="grid grid-cols-[1fr_auto] border-t px-3 py-2 text-muted-foreground"
                >
                  <span>{detail.queryItem}</span>
                  <span className="font-medium text-foreground">
                    NT${detail.unitCost.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-md border px-4 py-3">
            <p className="font-medium">本次將查詢</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              {details.map((detail) => (
                <li key={`query-${detail.queryItem}`}>{detail.queryItem}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-md border px-4 py-3">
            <p className="font-medium">你將取得</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              {details.map((detail) => (
                <li key={`result-${detail.resultItem}`}>{detail.resultItem}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-1 text-xs text-muted-foreground">
          <p>前面的地址候選、附近實價登錄與免費欄位補齊不收費。</p>
          <p>正式查詢結果會寫入案件，供正式版 PDF 使用。</p>
          <p>實際費用依查詢結果計算，可能與預估略有不同；上游系統異常時仍可能產生費用。</p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            取消
          </Button>
          <Button onClick={onConfirm}>
            確定，開始查詢
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
