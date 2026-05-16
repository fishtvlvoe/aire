"use client";

import * as React from "react";
import { Loader2, FileSearch, CheckCircle, AlertTriangle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OwnerAuthorizationDialog } from "@/components/OwnerAuthorizationDialog";
import { PreChargeConfirmDialog } from "@/components/PreChargeConfirmDialog";
import { ManualFallbackInput } from "@/components/ManualFallbackInput";
import { pullData, type ApiResult } from "@/lib/land-registry-api";
import { casesApi } from "@/lib/cases-api";

/**
 * 每支 API 的費用估算（新台幣）
 * 實際費用以後端計算為準，這裡僅用於 UI 顯示預估
 */
const COST_PER_API = 30;

/**
 * PullParcelDataButton — 拉謄本按鈕（整合所有授權/確認/查詢流程）
 *
 * 點擊流程：
 *   1. OwnerAuthorizationDialog（所有權人授權）
 *   2. PreChargeConfirmDialog（扣款確認）
 *   3. 呼叫 pullData → 顯示結果
 *   4. 失敗的 API 項目 → 顯示 ManualFallbackInput
 */
interface PullParcelDataButtonProps {
  caseId: string;
  parcelId: string;
  apiIds: string[];
  onSaved?: (data: Record<string, unknown>) => void;
}

type FlowStep = "idle" | "auth-dialog" | "charge-dialog" | "pulling" | "done";

interface ManualEntry {
  apiId: string;
  data: Record<string, string> | null; // null = 未填
}

export function PullParcelDataButton({
  caseId,
  parcelId,
  apiIds,
  onSaved,
}: PullParcelDataButtonProps) {
  const [step, setStep] = React.useState<FlowStep>("idle");
  const [results, setResults] = React.useState<Record<string, ApiResult> | null>(null);
  const [totalCost, setTotalCost] = React.useState<number>(0);
  const [pullError, setPullError] = React.useState<string | null>(null);
  // 需要手動填入的 API 列表（apiId → 已填資料 or null）
  const [manualEntries, setManualEntries] = React.useState<ManualEntry[]>([]);
  const [savingResult, setSavingResult] = React.useState(false);
  const [saveMessage, setSaveMessage] = React.useState<string | null>(null);

  const estimatedCost = apiIds.length * COST_PER_API;

  // 步驟 1：點擊「拉謄本」→ 打開授權 Dialog
  function handleClick() {
    setStep("auth-dialog");
    setResults(null);
    setPullError(null);
    setManualEntries([]);
    setSaveMessage(null);
  }

  // 步驟 2：授權確認後 → 打開扣款確認 Dialog
  function handleAuthConfirm() {
    setStep("charge-dialog");
  }

  // 任何步驟取消 → 回到 idle
  function handleCancel() {
    setStep("idle");
  }

  // 步驟 3：扣款確認後 → 呼叫 pullData
  async function handleChargeConfirm() {
    setStep("pulling");
    try {
      const result = await pullData(parcelId, apiIds);
      setResults(result.results);
      setTotalCost(result.total_cost);

      // 找出失敗的 API，建立手動填入清單
      const failed: ManualEntry[] = Object.entries(result.results)
        .filter(([, r]) => !r.success)
        .map(([apiId]) => ({ apiId, data: null }));
      setManualEntries(failed);

      setStep("done");
    } catch (err) {
      setPullError(err instanceof Error ? err.message : "查詢失敗，請稍後再試");
      setStep("done");
    }
  }

  // 手動填入完成
  function handleManualSubmit(apiId: string, data: Record<string, string>) {
    setManualEntries((prev) =>
      prev.map((e) => (e.apiId === apiId ? { ...e, data } : e))
    );
  }

  // 成功項目數
  const successCount = results
    ? Object.values(results).filter((r) => r.success).length
    : 0;
  const failedCount = results
    ? Object.values(results).filter((r) => !r.success).length
    : 0;

  // 按鈕在查詢中或已完成時都 disabled，防止重複觸發扣款
  const buttonDisabled = step === "pulling" || step === "done" || apiIds.length === 0;

  const previewData = React.useMemo(() => {
    if (!results) return null;
    const preview: Record<string, unknown> = {};
    for (const [apiId, result] of Object.entries(results)) {
      if (result.success && result.data) {
        preview[apiId] = result.data;
      }
    }
    for (const entry of manualEntries) {
      if (entry.data) {
        preview[entry.apiId] = entry.data;
      }
    }
    return Object.keys(preview).length > 0 ? preview : null;
  }, [manualEntries, results]);

  async function handleConfirmSave() {
    if (!previewData) return;
    setSavingResult(true);
    setSaveMessage(null);
    try {
      await casesApi.update(caseId, { land_registry_data: previewData });
      setSaveMessage("已儲存");
      onSaved?.(previewData);
    } catch (error) {
      setSaveMessage(
        error instanceof Error ? `儲存失敗：${error.message}` : "儲存失敗，請稍後再試",
      );
    } finally {
      setSavingResult(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* 主按鈕 */}
      <Button
        onClick={handleClick}
        disabled={buttonDisabled}
        className="gap-2"
      >
        {step === "pulling" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : step === "done" ? (
          <CheckCircle className="h-4 w-4" />
        ) : (
          <FileSearch className="h-4 w-4" />
        )}
        {step === "pulling"
          ? "查詢中…"
          : step === "done"
            ? "已完成"
            : "拉謄本"}
        {step !== "pulling" && step !== "done" && (
          <ChevronRight className="h-4 w-4 ml-auto opacity-60" />
        )}
      </Button>

      {/* 查詢結果摘要 */}
      {step === "done" && !pullError && results && (
        <div className="rounded-md border border-border p-4 space-y-2">
          <p className="text-sm font-medium">查詢完成</p>
          <div className="flex gap-4 text-sm">
            {successCount > 0 && (
              <span className="text-green-700">
                已取得 {successCount} 項地政資料
              </span>
            )}
            {failedCount > 0 && (
              <span className="flex items-center gap-1.5 text-amber-700">
                <AlertTriangle className="h-4 w-4" />
                {failedCount} 項失敗
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            實際扣款：NT${totalCost.toLocaleString()}
          </p>
          {previewData ? (
            <Button onClick={handleConfirmSave} disabled={savingResult} size="sm">
              {savingResult ? "儲存中…" : "確認儲存"}
            </Button>
          ) : null}
          {saveMessage ? (
            <p className="text-xs text-muted-foreground">{saveMessage}</p>
          ) : null}
        </div>
      )}

      {/* 查詢錯誤 */}
      {step === "done" && pullError && (
        <div className="flex items-center gap-2 text-sm text-destructive rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{pullError}</span>
        </div>
      )}

      {/* 手動填入表單（失敗的 API） */}
      {manualEntries.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            以下項目查詢失敗，請手動填入資料：
          </p>
          {manualEntries.map((entry) => (
            <div key={entry.apiId}>
              {entry.data ? (
                <div className="flex items-center gap-2 text-xs text-green-700 px-3 py-2 rounded-md bg-green-50 border border-green-200">
                  <CheckCircle className="h-4 w-4" />
                  <span>{entry.apiId} — 已儲存手動資料</span>
                </div>
              ) : (
                <ManualFallbackInput
                  apiId={entry.apiId}
                  onSubmit={(data) => handleManualSubmit(entry.apiId, data)}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <OwnerAuthorizationDialog
        caseId={caseId}
        open={step === "auth-dialog"}
        onConfirm={handleAuthConfirm}
        onCancel={handleCancel}
      />

      <PreChargeConfirmDialog
        apiCount={apiIds.length}
        estimatedCost={estimatedCost}
        open={step === "charge-dialog"}
        onConfirm={handleChargeConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
}
