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

/**
 * PreChargeConfirmDialog — 查詢扣款前二次確認 Dialog
 * 顯示本次預計查詢的 API 數量與預估費用，
 * 讓使用者確認後才執行扣款查詢。
 */
interface PreChargeConfirmDialogProps {
  /** 本次預計查詢的 API 數量 */
  apiCount: number;
  /** 預估費用（新台幣） */
  estimatedCost: number;
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function PreChargeConfirmDialog({
  apiCount,
  estimatedCost,
  open,
  onConfirm,
  onCancel,
}: PreChargeConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="h-5 w-5 text-primary" />
            <DialogTitle>確認查詢並扣款</DialogTitle>
          </div>
          <DialogDescription>
            本操作將向地政資訊系統查詢並產生費用，請確認後繼續。
          </DialogDescription>
        </DialogHeader>

        {/* 查詢摘要 */}
        <div className="rounded-md border border-border bg-muted/30 px-4 py-3 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">預計查詢項目</span>
            <span className="font-medium">{apiCount} 支 API</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">預估費用</span>
            <span className="font-semibold text-foreground">
              NT${estimatedCost.toLocaleString()}
            </span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          實際費用依查詢結果計算，可能與預估略有不同。
        </p>

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
