"use client";

import { useEffect, useState } from "react";

import {
  formatLogTime,
  labelForAction,
  listRecentLogs,
  type LogEntry,
} from "@/lib/log";
import { Card } from "@/components/ui/Card";
import { LoadingState } from "@/components/ux/LoadingState";
import { EmptyState } from "@/components/ux/EmptyState";
import { ErrorState } from "@/components/ux/ErrorState";

/**
 * 設定 → 操作紀錄頁
 *
 * 對應 AIRE Phase 1 Group 9.2 frontend 對應。
 * 顯示最近 100 筆 operation_log，給老闆 / 助理查驗操作歷程用。
 */
export default function LogsPage() {
  const [entries, setEntries] = useState<LogEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const result = await listRecentLogs(100);
      setEntries(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setEntries([]);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  if (entries === null) {
    return <LoadingState label="載入操作紀錄中" />;
  }

  if (error) {
    return <ErrorState reason={error} onRetry={load} />;
  }

  if (entries.length === 0) {
    return (
      <EmptyState
        title="尚無操作紀錄"
        description="完成首次啟用、新增案件、匯出 PDF 等動作後會出現在此"
      />
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">操作紀錄</h2>
      <p className="text-sm text-muted-foreground">
        最近 100 筆，依時間倒序。所有時間為 Asia/Taipei。
      </p>

      <Card className="overflow-hidden p-0">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="px-4 py-2 font-medium">時間</th>
              <th className="px-4 py-2 font-medium">動作</th>
              <th className="px-4 py-2 font-medium">結果</th>
              <th className="px-4 py-2 font-medium">備註</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <LogRow key={entry.id} entry={entry} />
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function LogRow({ entry }: { entry: LogEntry }) {
  const resultClass =
    entry.result === "ok"
      ? "text-success"
      : "text-destructive";

  let detail = "";
  if (entry.payload) {
    try {
      const obj = JSON.parse(entry.payload) as Record<string, unknown>;
      detail = Object.entries(obj)
        .map(([k, v]) => `${k}=${String(v)}`)
        .join(", ");
    } catch {
      detail = entry.payload;
    }
  }

  return (
    <tr className="border-b last:border-0">
      <td className="px-4 py-2 font-mono text-xs">{formatLogTime(entry.ts)}</td>
      <td className="px-4 py-2">{labelForAction(entry.action)}</td>
      <td className={`px-4 py-2 ${resultClass}`}>
        {entry.result === "ok" ? "成功" : "失敗"}
      </td>
      <td className="px-4 py-2 text-xs text-muted-foreground">{detail || "—"}</td>
    </tr>
  );
}
