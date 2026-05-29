"use client";

import * as React from "react";
import { Loader2, FileSearch, CheckCircle, AlertTriangle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OwnerAuthorizationDialog } from "@/components/OwnerAuthorizationDialog";
import { PreChargeConfirmDialog } from "@/components/PreChargeConfirmDialog";
import { ManualFallbackInput } from "@/components/ManualFallbackInput";
import { formalPullData, mapErrorToMessage, type ApiResult } from "@/lib/land-registry-api";
import { casesApi } from "@/lib/cases-api";
import {
  buildRegistryPreviewSections,
  summarizeRegistryPreview,
} from "@/lib/registry-preview";
import { createRegistryProvenancePayload } from "@/lib/registry-provenance";
import { estimateFormalCopCost } from "@/lib/formal-cop-api-set";

/**
 * PullParcelDataButton — 正式查詢按鈕（整合所有授權/確認/查詢流程）
 *
 * 點擊流程：
 *   1. OwnerAuthorizationDialog（所有權人授權）
 *   2. PreChargeConfirmDialog（扣款確認）
 *   3. 呼叫 formalPullData → 顯示結果
 *   4. 失敗的 API 項目 → 顯示 ManualFallbackInput
 */
interface PullParcelDataButtonProps {
  caseId: string;
  parcelId: string;
  apiIds: string[];
  label?: string;
  beforePull?: () => Promise<void>;
  preparePayload?: (data: Record<string, unknown>) => Record<string, unknown>;
  onPreview?: (data: Record<string, unknown> | null) => void;
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
  label = "正式查詢",
  beforePull,
  preparePayload,
  onPreview,
  onSaved,
}: PullParcelDataButtonProps) {
  const [step, setStep] = React.useState<FlowStep>("idle");
  const [results, setResults] = React.useState<Record<string, ApiResult> | null>(null);
  const [totalCost, setTotalCost] = React.useState<number>(0);
  const [pullError, setPullError] = React.useState<string | null>(null);
  const [cacheHit, setCacheHit] = React.useState(false);
  const [sourceRunId, setSourceRunId] = React.useState<string | null>(null);
  // 需要手動填入的 API 列表（apiId → 已填資料 or null）
  const [manualEntries, setManualEntries] = React.useState<ManualEntry[]>([]);
  const [savingResult, setSavingResult] = React.useState(false);
  const [saveMessage, setSaveMessage] = React.useState<string | null>(null);

  const estimatedCost = estimateFormalCopCost(apiIds);

  // 步驟 1：點擊「拉謄本」→ 打開授權 Dialog
  function handleClick() {
    setStep("auth-dialog");
    setResults(null);
    onPreview?.(null);
    setPullError(null);
    setManualEntries([]);
    setSaveMessage(null);
    setCacheHit(false);
    setSourceRunId(null);
  }

  // 步驟 2：授權確認後 → 打開扣款確認 Dialog
  function handleAuthConfirm() {
    setStep("charge-dialog");
  }

  // 任何步驟取消 → 回到 idle
  function handleCancel() {
    setStep("idle");
  }

  // 步驟 3：扣款確認後 → 呼叫正式查詢
  async function handleChargeConfirm() {
    setStep("pulling");
    try {
      await beforePull?.();
      const result = await formalPullData(caseId, apiIds);
      const normalizedResults = result.results as Record<string, ApiResult>;
      setResults(normalizedResults);
      setTotalCost(result.total_cost);
      setCacheHit(result.cache_hit);
      setSourceRunId(result.source_run_id);

      // 找出失敗的 API，建立手動填入清單
      const failed: ManualEntry[] = Object.entries(normalizedResults)
        .filter(([, r]) => !r.success)
        .map(([apiId]) => ({ apiId, data: null }));
      setManualEntries(failed);
      const preview = buildPreviewData(normalizedResults, failed, result.total_cost);
      onPreview?.(preview);

      if (preview) {
        await persistPreviewData(preview);
      }

      setStep("done");
    } catch (err) {
      setPullError(mapErrorToMessage(err));
      setStep("done");
    }
  }

  // 手動填入完成
  function handleManualSubmit(apiId: string, data: Record<string, string>) {
    setManualEntries((prev) => {
      const next = prev.map((e) => (e.apiId === apiId ? { ...e, data } : e));
      const preview = buildPreviewData(results, next, totalCost);
      onPreview?.(preview);
      if (preview) {
        void persistPreviewData(preview);
      }
      return next;
    });
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

  function failedItemLabel(index: number): string {
    return `補填項目 ${index + 1}`;
  }

  function buildPreviewData(
    sourceResults: Record<string, ApiResult> | null,
    sourceManualEntries: ManualEntry[],
    sourceTotalCost = totalCost,
  ) {
    if (!sourceResults) return null;
    const payload = createRegistryProvenancePayload({
      parcelId,
      totalCost: sourceTotalCost,
      isPaid: true,
      pricingNote: "付費正式查詢：已於執行前確認費用與授權，結果可作為正式地政資料來源",
      results: sourceResults,
      manualEntries: sourceManualEntries,
    });
    return Object.keys(payload.entries).length > 0 ? payload : null;
  }

  const previewData = React.useMemo(
    () => buildPreviewData(results, manualEntries),
    [manualEntries, results],
  );

  const previewSections = React.useMemo(
    () => buildRegistryPreviewSections(previewData),
    [previewData],
  );
  const previewSummary = React.useMemo(
    () => summarizeRegistryPreview(previewSections),
    [previewSections],
  );
  const acquiredPreviewFields = previewSections.flatMap((section) =>
    section.fields.map((field) => ({
      ...field,
      sectionTitle: section.title,
      pdfTarget: readablePdfTarget(field.target),
    })),
  );
  const missingPreviewFields = previewSections.flatMap((section) =>
    section.missing.map((label) => ({
      sectionTitle: section.title,
      label,
      reason: "上游未回或需補正式資料",
    })),
  );

  async function persistPreviewData(data: Record<string, unknown>) {
    setSavingResult(true);
    setSaveMessage(null);
    const payload = preparePayload ? preparePayload(data) : data;
    try {
      await casesApi.update(caseId, { land_registry_data: payload });
      setSaveMessage("已寫入案件，可用於預覽與 PDF");
      onSaved?.(payload);
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
            : label}
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
          <p className="text-xs text-muted-foreground">
            {cacheHit ? "本次使用既有紀錄，不重複計費。" : "本次已建立正式查詢紀錄。"}
            {cacheHit && sourceRunId ? `（來源紀錄 ${sourceRunId.slice(0, 8)}）` : ""}
          </p>
          {previewSections.length > 0 ? (
            <div className="rounded-md border bg-muted/20 p-3 text-sm space-y-3">
              <p className="font-medium">已寫入案件資料預覽</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {previewSummary.statusText}。完整欄位會同步到資料來源、補件判斷與 PDF。
              </p>
              <div className="rounded-md border bg-white p-3" aria-label="正式資料匯入明細">
                <p className="font-medium">正式資料匯入明細</p>
                <div className="mt-2 overflow-hidden rounded-md border">
                  {acquiredPreviewFields.map((field) => (
                    <div
                      key={`${field.sectionTitle}-${field.label}-${field.value}`}
                      className="grid gap-2 border-b p-2 text-xs last:border-b-0 md:grid-cols-[140px_minmax(0,1fr)_160px]"
                    >
                      <span className="font-medium">{field.label}</span>
                      <span>{field.value}</span>
                      <span className="text-muted-foreground">{field.pdfTarget}</span>
                    </div>
                  ))}
                </div>
                {missingPreviewFields.length > 0 ? (
                  <div className="mt-3 rounded-md bg-amber-50 p-2 text-xs text-amber-800">
                    <p className="font-medium">未取得欄位</p>
                    <p className="mt-1">
                      {missingPreviewFields.map((field) => `${field.sectionTitle}／${field.label}：${field.reason}`).join("；")}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
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
          {manualEntries.map((entry, index) => (
            <div key={entry.apiId}>
              {entry.data ? (
                <div className="flex items-center gap-2 text-xs text-green-700 px-3 py-2 rounded-md bg-green-50 border border-green-200">
                  <CheckCircle className="h-4 w-4" />
                  <span>{failedItemLabel(index)} — 已儲存手動資料</span>
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
        apiIds={apiIds}
        estimatedCost={estimatedCost}
        open={step === "charge-dialog"}
        onConfirm={handleChargeConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
}

function readablePdfTarget(target: string): string {
  if (target.startsWith("建物標示/")) return "產權調查表—建物標示";
  if (target.startsWith("土地標示/")) return "產權調查表—土地標示";
  if (target.startsWith("產權注意事項/")) return "產權調查表—所有權及他項權利";
  if (target.startsWith("稅費/") || target.startsWith("增值稅/")) return "費用與土地增值稅估算";
  if (target.startsWith("物件資料表/")) return "物件資料表";
  return target;
}
