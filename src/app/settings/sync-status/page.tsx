"use client";

import React from "react";
import { invoke } from "@tauri-apps/api/core";
import { AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LoadingState } from "@/components/ux/LoadingState";
import { EmptyState } from "@/components/ux/EmptyState";
import { ErrorState } from "@/components/ux/ErrorState";
import { formatRocDate } from "@/lib/date-format-twn";

interface LegalClause {
  law_id: string;
  title: string;
  version_date: string;
  fetched_at: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function calcDaysAgo(iso: string): number {
  const target = new Date(iso);
  if (Number.isNaN(target.getTime())) return 0;
  const diff = Date.now() - target.getTime();
  if (diff <= 0) return 0;
  return Math.floor(diff / DAY_MS);
}

/** 30 天以內視為已同步，超過則視為過期 */
function isUpToDate(fetchedAt: string): boolean {
  return calcDaysAgo(fetchedAt) <= 30;
}

function StatusIcon({ fetchedAt }: { fetchedAt: string }) {
  if (isUpToDate(fetchedAt)) {
    return (
      <span className="inline-flex items-center gap-1 text-sm text-success">
        <CheckCircle className="h-4 w-4" aria-hidden />
        已同步
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-sm text-amber-600">
      <AlertTriangle className="h-4 w-4" aria-hidden />
      過期
    </span>
  );
}

export default function SyncStatusPage(): React.ReactElement {
  const [laws, setLaws] = React.useState<LegalClause[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [syncing, setSyncing] = React.useState(false);
  const [syncError, setSyncError] = React.useState<string | null>(null);

  const loadLaws = React.useCallback(async () => {
    setError(null);
    try {
      const data = await invoke<LegalClause[]>("list_legal_clauses");
      setLaws(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLaws([]);
    }
  }, []);

  React.useEffect(() => {
    void loadLaws();
  }, [loadLaws]);

  const onManualSync = async (): Promise<void> => {
    setSyncing(true);
    setSyncError(null);
    try {
      await invoke("sync_legal_clauses");
      await loadLaws();
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : String(err));
    } finally {
      setSyncing(false);
    }
  };

  const isLoading = laws === null && error === null;

  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      {/* 頁面標題 + 同步按鈕 */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">法規同步狀態</h1>
        <Button
          onClick={onManualSync}
          disabled={syncing || isLoading}
          type="button"
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} aria-hidden />
          立即同步
        </Button>
      </div>

      {/* 同步失敗 banner */}
      {syncError ? (
        <div
          role="alert"
          className="mb-4 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
          <span>同步失敗：{syncError}</span>
        </div>
      ) : null}

      {/* 三態 UI */}
      {isLoading ? (
        <LoadingState label="載入法規資料中" />
      ) : error ? (
        <ErrorState reason={error} onRetry={loadLaws} />
      ) : laws?.length === 0 ? (
        <EmptyState
          title="尚無法規資料"
          description="請確認網路連線後按「立即同步」"
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="px-4 py-3 font-medium">法規名稱</th>
                <th className="px-4 py-3 font-medium">版本日期</th>
                <th className="px-4 py-3 font-medium">同步時間</th>
                <th className="px-4 py-3 font-medium">狀態</th>
              </tr>
            </thead>
            <tbody>
              {(laws ?? []).map((clause) => (
                <tr key={clause.law_id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{clause.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatRocDate(clause.version_date)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {calcDaysAgo(clause.fetched_at)} 天前
                  </td>
                  <td className="px-4 py-3">
                    <StatusIcon fetchedAt={clause.fetched_at} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </main>
  );
}
