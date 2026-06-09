"use client";

import * as React from "react";
import { Loader2, FileSearch, CheckCircle, AlertTriangle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OwnerAuthorizationDialog } from "@/components/OwnerAuthorizationDialog";
import { PreChargeConfirmDialog } from "@/components/PreChargeConfirmDialog";
import {
  formalPullData,
  mapErrorToMessage,
  type ApiResult,
  type FormalLookupTargetInput,
} from "@/lib/land-registry-api";
import { casesApi } from "@/lib/cases-api";
import {
  buildRegistryPreviewDiagnostics,
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
 *   4. 失敗的 API 項目 → 彈窗顯示 API 項目與失敗原因
 */
interface PullParcelDataButtonProps {
  caseId: string;
  parcelId: string;
  apiIds: string[];
  label?: string;
  expectedAddress?: string;
  formalLookupTarget?: FormalLookupTargetInput;
  beforePull?: () => Promise<void>;
  onAddressMismatch?: (message: string) => Promise<void>;
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
  expectedAddress,
  formalLookupTarget,
  beforePull,
  onAddressMismatch,
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
  const [failureDialogOpen, setFailureDialogOpen] = React.useState(false);
  const [importDetailDialogOpen, setImportDetailDialogOpen] = React.useState(false);

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
    setFailureDialogOpen(false);
    setImportDetailDialogOpen(false);
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
      const result = await formalPullData(caseId, apiIds, formalLookupTarget);
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
      setFailureDialogOpen(failed.length > 0);
      const preview = buildPreviewData(
        normalizedResults,
        failed,
        result.total_cost,
        result.source_run_id ?? result.run_id,
      );
      const mismatchError = validateFormalPreviewAddress(preview, expectedAddress);
      if (mismatchError) {
        await onAddressMismatch?.(mismatchError);
        setPullError(mismatchError);
        setFailureDialogOpen(true);
        onPreview?.(null);
        setStep("done");
        return;
      }
      onPreview?.(preview);
      setImportDetailDialogOpen(Boolean(preview));

      if (preview) {
        await persistPreviewData(preview);
      }

      setStep("done");
    } catch (err) {
      setPullError(mapErrorToMessage(err));
      setFailureDialogOpen(true);
      setStep("done");
    }
  }

  // 成功項目數
  const successCount = results
    ? Object.values(results).filter((r) => r.success).length
    : 0;
  const failedCount = results
    ? Object.values(results).filter((r) => !r.success).length
    : 0;
  const hasFailure = Boolean(pullError) || failedCount > 0;

  // 按鈕在查詢中或已完成時都 disabled，防止重複觸發扣款
  const buttonDisabled = step === "pulling" || step === "done" || apiIds.length === 0;

  function buildPreviewData(
    sourceResults: Record<string, ApiResult> | null,
    sourceManualEntries: ManualEntry[],
    sourceTotalCost = totalCost,
    formalSourceRunId = sourceRunId ?? undefined,
  ) {
    if (!sourceResults) return null;
    const payload = createRegistryProvenancePayload({
      parcelId,
      totalCost: sourceTotalCost,
      isPaid: true,
      pricingNote: "付費正式查詢：已於執行前確認費用與授權，結果可作為正式地政資料來源",
      sourceRunId: formalSourceRunId,
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
  const previewDiagnostics = React.useMemo(
    () => buildRegistryPreviewDiagnostics(previewSections),
    [previewSections],
  );
  const acquiredPreviewFields = previewSections.flatMap((section) =>
    section.fields.map((field) => ({
      ...field,
      sectionTitle: section.title,
      pdfTarget: readablePdfTarget(field.target),
    })),
  );
  const missingPreviewFields = previewDiagnostics.missingFields.map((field) => ({
    sectionTitle: field.sectionTitle,
    label: field.label,
    reason: field.reasonLabel,
    reasonCode: field.reasonCode,
  }));
  const failureDetails = React.useMemo(
    () => buildFailureDetails(results, pullError),
    [results, pullError],
  );

  async function persistPreviewData(data: Record<string, unknown>) {
    setSavingResult(true);
    setSaveMessage(null);
    const basePayload = preparePayload ? preparePayload(data) : data;
    const payloadSections = buildRegistryPreviewSections(basePayload);
    const payload = {
      ...basePayload,
      registry_preview_diagnostics: buildRegistryPreviewDiagnostics(payloadSections),
    };
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
        ) : step === "done" && hasFailure ? (
          <AlertTriangle className="h-4 w-4" />
        ) : step === "done" ? (
          <CheckCircle className="h-4 w-4" />
        ) : (
          <FileSearch className="h-4 w-4" />
        )}
        {step === "pulling"
          ? "查詢中…"
          : step === "done" && hasFailure
            ? "查詢失敗"
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
          <p className="text-sm font-medium">{failedCount > 0 ? "查詢失敗" : "查詢完成"}</p>
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
            <div className="rounded-md border bg-muted/20 p-3 text-sm space-y-2">
              <p className="font-medium">已寫入案件資料</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {previewSummary.statusText}。完整欄位已同步到資料來源、補件判斷與 PDF。
              </p>
              {previewDiagnostics.counts.missing > 0 ? (
                <p className="text-xs text-muted-foreground">
                  缺欄位分類：verified fallback {previewDiagnostics.counts.verifiedTargetFallback}、上游未回 {previewDiagnostics.counts.upstreamMissing}、mapping gap {previewDiagnostics.counts.mappingGap}
                </p>
              ) : null}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setImportDetailDialogOpen(true)}
              >
                查看匯入明細
              </Button>
            </div>
          ) : null}
          {saveMessage ? (
            <p className="text-xs text-muted-foreground">{saveMessage}</p>
          ) : null}
          {failureDetails.length > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-amber-300 text-amber-800 hover:bg-amber-50"
              onClick={() => setFailureDialogOpen(true)}
            >
              查看失敗原因
            </Button>
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

      <Dialog open={failureDialogOpen && failureDetails.length > 0} onOpenChange={setFailureDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>地政查詢失敗</DialogTitle>
            <DialogDescription>
              {pullError
                ? "正式查詢沒有送出成功，請依下方原因處理後重試。"
                : `本次地政 API 有 ${failureDetails.length} 項沒有成功，資料不會標記為正式謄本。`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
              <p>實際扣款：NT${totalCost.toLocaleString()}</p>
              <p>
                {pullError
                  ? "本次未建立成功查詢紀錄。"
                  : cacheHit
                    ? "使用既有查詢紀錄，未重複計費。"
                    : "本次已建立查詢紀錄。"}
                {sourceRunId ? ` 來源紀錄：${sourceRunId}` : ""}
              </p>
            </div>
            {failureDetails.map((item) => (
              <div key={item.apiId} className="rounded-md border border-amber-200 bg-amber-50/60 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-amber-950">{item.label}</p>
                  <code className="rounded bg-white px-2 py-1 text-xs text-amber-900">{item.apiId}</code>
                </div>
                <p className="mt-2 text-sm text-amber-900">{item.reason}</p>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setFailureDialogOpen(false)}>
              知道了
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={importDetailDialogOpen && previewSections.length > 0}
        onOpenChange={setImportDetailDialogOpen}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>地政資料匯入明細</DialogTitle>
            <DialogDescription>
              {previewSummary.statusText}。這些欄位已寫入案件，供補件判斷、預覽與 PDF 使用。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
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
                <details className="mt-3 rounded-md bg-amber-50 p-2 text-xs text-amber-800">
                  <summary className="cursor-pointer font-medium">
                    未取得欄位（{missingPreviewFields.length}）
                  </summary>
                  <div className="mt-2 grid gap-1 text-[11px] text-amber-900 md:grid-cols-3">
                    <span>verified fallback：{previewDiagnostics.counts.verifiedTargetFallback}</span>
                    <span>COP 上游未回：{previewDiagnostics.counts.upstreamMissing}</span>
                    <span>mapping gap：{previewDiagnostics.counts.mappingGap}</span>
                  </div>
                  <div className="mt-2 max-h-40 overflow-y-auto">
                    <ul className="space-y-1">
                      {missingPreviewFields.map((field) => (
                        <li key={`${field.sectionTitle}-${field.label}`}>
                          {field.sectionTitle}／{field.label}：{field.reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                </details>
              ) : null}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setImportDetailDialogOpen(false)}>
              關閉明細
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

function buildFailureDetails(results: Record<string, ApiResult> | null, pullError: string | null) {
  if (pullError) {
    return [{ apiId: "formal_pull", label: "正式查詢", reason: pullError }];
  }
  if (!results) return [];
  return Object.entries(results)
    .filter(([, result]) => !result.success)
    .map(([apiId, result]) => ({
      apiId,
      label: readableApiLabel(apiId),
      reason: result.error?.trim() || "地政 API 未回傳成功原因",
    }));
}

function validateFormalPreviewAddress(
  preview: Record<string, unknown> | null,
  expectedAddress: string | undefined,
): string | null {
  const expectedKey = extractDoorplateKey(expectedAddress);
  if (!preview || !expectedKey) return null;
  const actualAddress = readBuildingAddressFromPreview(preview);
  const actualKey = extractDoorplateKey(actualAddress);
  if (!actualKey || expectedKey === actualKey) return null;
  return `正式資料門牌與案件地址不一致：案件是 ${expectedAddress}，地政回傳是 ${actualAddress}。本次資料已擋下，請重新確認地段、地號、建號後再匯入。`;
}

function readBuildingAddressFromPreview(preview: Record<string, unknown>): string {
  const entries = isRecord(preview.entries) ? preview.entries : null;
  const buildingEntry = isRecord(entries?.building_registry) ? entries.building_registry : null;
  const data = isRecord(buildingEntry?.data) ? buildingEntry.data : null;
  const nested = isRecord(data?.data) ? data.data : data;
  const value = firstString(nested, ["BNUMBER", "building_address", "address"]);
  return value ?? "";
}

function extractDoorplateKey(address: string | undefined): string | null {
  const normalized = normalizeAddressText(address);
  if (!normalized) return null;
  const laneMatch = normalized.match(/(\d+)巷(?:(\d+)弄)?(\d+)號/);
  if (laneMatch) return `${laneMatch[1]}巷${laneMatch[2] ? `${laneMatch[2]}弄` : ""}${laneMatch[3]}號`;
  const numberMatch = normalized.match(/(?:路|街|大道|段)(\d+)號/);
  if (numberMatch) return `${numberMatch[1]}號`;
  return null;
}

function normalizeAddressText(value: string | undefined): string {
  const fullWidthDigits = "０１２３４５６７８９";
  return String(value ?? "")
    .replace(/[０-９]/g, (char) => String(fullWidthDigits.indexOf(char)))
    .replace(/[之\-－]\d+樓.*$/, "")
    .replace(/\s+/g, "")
    .trim();
}

function firstString(record: unknown, keys: string[]): string | null {
  if (!isRecord(record)) return null;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readableApiLabel(apiId: string): string {
  const labels: Record<string, string> = {
    land_registry: "土地標示資料",
    land_ownership: "土地所有權資料",
    land_other_rights: "土地他項權利",
    building_registry: "建物標示資料",
    building_ownership: "建物所有權資料",
    building_other_rights: "建物他項權利",
  };
  return labels[apiId] ?? "地政 API 項目";
}
