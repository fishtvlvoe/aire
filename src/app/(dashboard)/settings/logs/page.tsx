"use client";

import { type ReactNode, useEffect, useState } from "react";

import { mockInvoke } from "@/lib/mock-backend";
import { Card } from "@/components/ui/card";
import { LoadingState } from "@/components/ux/LoadingState";
import { EmptyState } from "@/components/ux/EmptyState";
import { ErrorState } from "@/components/ux/ErrorState";
import { TauriRequired } from "@/components/TauriRequired";
import { SettingsTabs } from "@/components/SettingsTabs";
import { isTauriEnv } from "@/lib/tauri-bridge";

interface OperationLogEntry {
  id: string;
  timestamp: string;
  action: string;
  detail: string;
  user_email: string;
}

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return isoString;
  }

  const formatter = new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return formatter.format(date);
}

export default function LogsPage() {
  const isDevelopment = process.env.NODE_ENV === "development";
  const [entries, setEntries] = useState<OperationLogEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingEnv, setIsLoadingEnv] = useState(true);
  const [isTauri, setIsTauri] = useState(false);

  async function load() {
    setError(null);
    try {
      const result = await mockInvoke<OperationLogEntry[]>("list_logs");
      if (!Array.isArray(result)) { setEntries([]); return; }
      const sorted = [...result].sort((a, b) => {
        const tsa = new Date(a.timestamp).getTime();
        const tsb = new Date(b.timestamp).getTime();
        if (Number.isNaN(tsa) || Number.isNaN(tsb)) return 0;
        return tsb - tsa;
      });
      setEntries(sorted);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setEntries([]);
    }
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      const detected = await isTauriEnv();
      if (!mounted) return;
      setIsTauri(detected);
      setIsLoadingEnv(false);
      if (detected || isDevelopment) {
        await load();
      } else {
        setEntries([]);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  let content: ReactNode;
  if (isLoadingEnv) {
    content = <LoadingState label="偵測桌面環境中" />;
  } else if (!isTauri && !isDevelopment) {
    content = <TauriRequired />;
  } else if (entries === null) {
    content = <LoadingState label="載入操作紀錄中" />;
  } else if (error) {
    content = <ErrorState reason={error} onRetry={load} />;
  } else if (entries.length === 0) {
    content = (
      <EmptyState
        title="尚無操作紀錄"
        description="建立、更新、刪除案件或匯出 PDF 後會顯示在這裡"
      />
    );
  } else {
    content = (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">操作紀錄</h2>
        <Card className="overflow-hidden p-0">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="px-4 py-2 font-medium">時間</th>
                <th className="px-4 py-2 font-medium">操作類型</th>
                <th className="px-4 py-2 font-medium">詳細說明</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b last:border-0">
                  <td className="px-4 py-2 font-mono text-xs">
                    {formatTimestamp(entry.timestamp)}
                  </td>
                  <td className="px-4 py-2">{entry.action}</td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">
                    {entry.detail}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SettingsTabs />
      {content}
    </div>
  );
}
