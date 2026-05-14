"use client";

import React from "react";
import "@testing-library/jest-dom/vitest";
import { invoke } from "@tauri-apps/api/core";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatDateTwnShort, formatRocDate } from "@/lib/date-format-twn";

type SyncStatusType = "ok" | "fallback" | "empty_no_network";

interface LegalClauseSummary {
  law_id: string;
  title: string;
  version_date: string;
  fetched_at: string;
}

interface SyncStatusResponse {
  last_synced_at: string | null;
  clauses: LegalClauseSummary[];
  sync_status: SyncStatusType;
  fallback_days?: number | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function calcDaysAgo(iso: string): number {
  const target = new Date(iso);
  if (Number.isNaN(target.getTime())) return 0;
  const diff = Date.now() - target.getTime();
  if (diff <= 0) return 0;
  return Math.floor(diff / DAY_MS);
}

function statusBanner(state: SyncStatusResponse | null): React.ReactNode {
  if (!state) return null;

  if (state.sync_status === "ok") {
    return (
      <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
        <CheckCircle className="h-4 w-4" aria-hidden />
        <span>✓ 法規同步正常</span>
      </div>
    );
  }

  if (state.sync_status === "fallback") {
    return (
      <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
        <AlertTriangle className="h-4 w-4" aria-hidden />
        <span>⚠ 法規同步失敗（使用 {state.fallback_days ?? 0} 天前快取）</span>
      </div>
    );
  }

  return (
    <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      <XCircle className="h-4 w-4" aria-hidden />
      <span>無法連線取得法規資料</span>
    </div>
  );
}

export default function SyncStatusPage(): React.ReactElement {
  const [syncStatus, setSyncStatus] = React.useState<SyncStatusResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [syncing, setSyncing] = React.useState(false);

  const loadSyncStatus = React.useCallback(async () => {
    const data = (await invoke("get_sync_status")) as SyncStatusResponse;
    setSyncStatus(data);
  }, []);

  React.useEffect(() => {
    let active = true;
    (async () => {
      const data = (await invoke("get_sync_status")) as SyncStatusResponse;
      if (!active) return;
      setSyncStatus(data);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const onManualSync = async (): Promise<void> => {
    setSyncing(true);
    try {
      const synced = (await invoke("sync_legal_clauses")) as SyncStatusResponse;
      if (synced && typeof synced === "object" && "sync_status" in synced) {
        setSyncStatus(synced);
      } else {
        await loadSyncStatus();
      }
    } finally {
      setSyncing(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">法規同步狀態</h1>
        <Button onClick={onManualSync} disabled={syncing || loading} type="button">
          立即同步
        </Button>
      </div>

      {statusBanner(syncStatus)}

      {syncStatus?.last_synced_at ? (
        <p className="mb-4 text-sm text-muted-foreground">
          最後同步：{formatRocDate(syncStatus.last_synced_at)}
        </p>
      ) : (
        <p className="mb-4 text-sm text-muted-foreground">最後同步：尚無紀錄</p>
      )}

      <div className="space-y-3">
        {syncStatus?.clauses?.[0]?.version_date ? (
          <p className="text-sm text-muted-foreground">
            目前法規版本：{formatRocDate(syncStatus.clauses[0].version_date)}
          </p>
        ) : null}
        {(syncStatus?.clauses ?? []).map((clause) => (
          <section key={clause.law_id} className="rounded-md border border-border p-4">
            <h2 className="font-medium">{clause.title}</h2>
            <p className="text-sm text-muted-foreground">
              版本日期：{formatDateTwnShort(clause.version_date)}
            </p>
            <p className="text-xs text-muted-foreground">{calcDaysAgo(clause.fetched_at)} 天前同步</p>
          </section>
        ))}
      </div>
    </main>
  );
}
