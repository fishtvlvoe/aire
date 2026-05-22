"use client";

// AIRE 案件列表頁（Task 5.2）
//
// - invoke('list_cases') 取資料
// - 空表顯示「尚無案件，按右上角『新增案件』開始」
// - 表格欄位翻譯成中文（成屋/土地、草稿/已完成/已匯出）
// - updated_at 用 Intl.DateTimeFormat('zh-TW', { timeZone: 'Asia/Taipei' }) 格式化

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  casesApi,
  formatTpeDate,
  propertyTypeLabel,
  statusLabel,
  type CaseRow,
} from "@/lib/cases-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TauriRequired } from "@/components/TauriRequired";
import { NotInTauriError } from "@/lib/tauri-bridge";
import { CaseListActions } from "@/components/CaseListActions";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { safeInvoke } from "@/lib/safe-invoke";
import { toast } from "sonner";
import { StatusBadge } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";

export default function CasesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = searchParams.get("view") ?? "overview";
  const [cases, setCases] = useState<CaseRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requiresTauri, setRequiresTauri] = useState(false);
  const [deletingCase, setDeletingCase] = useState<CaseRow | null>(null);
  // W6: 刪除 loading state，防連點
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await casesApi.list();
        if (!cancelled) setCases(rows);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof NotInTauriError) {
          setRequiresTauri(true);
          return;
        }
        setError(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function refreshCases() {
    const rows = await casesApi.list();
    setCases(rows);
  }

  // W1: 加 try/catch，W6: 加 loading state 防連點
  async function handleDeleteConfirm() {
    if (!deletingCase) return;
    setDeleting(true);
    try {
      await casesApi.delete(deletingCase.id);
      setDeletingCase(null);
      await refreshCases();
    } catch (err) {
      console.error("[CasesPage] 刪除案件失敗", err);
      toast.error(err instanceof Error ? err.message : "刪除失敗，請稍後再試");
    } finally {
      setDeleting(false);
    }
  }

  async function handleDownload(caseId: string) {
    try {
      await safeInvoke("export_pdf", { caseId });
      toast.success("已觸發 PDF 匯出");
    } catch (downloadError) {
      toast.error(downloadError instanceof Error ? downloadError.message : "匯出失敗");
    }
  }

  const caseRows = cases ?? [];
  const draftCount = caseRows.filter((item) => item.status === "draft").length;
  const completedCount = caseRows.filter((item) =>
    item.status === "completed" || item.status === "exported"
  ).length;
  const supplementCount = caseRows.filter((item) =>
    item.status === "keyin" || !item.owner_name
  ).length;
  const stats = [
    { label: "全部案件", value: caseRows.length },
    { label: "草稿", value: draftCount },
    { label: "待補件", value: supplementCount },
    { label: "已完成", value: completedCount },
  ];
  const shortcuts = [
    { label: "案件總覽", href: "/cases", active: view === "overview" },
    { label: "說明書工作台", href: "/cases?view=workbench", active: view === "workbench" },
    { label: "補件清單", href: "/cases?view=supplements", active: view === "supplements" },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">案件、說明書、補件</p>
          <h1 className="text-2xl font-semibold tracking-normal">案件管理</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/settings?section=billing">費用紀錄</Link>
          </Button>
          <Button asChild>
            <Link href="/cases/new">新增案件</Link>
          </Button>
        </div>
      </header>

      <nav aria-label="案件分類" className="flex flex-wrap gap-2">
        {shortcuts.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
              item.active
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* 錯誤 */}
      {requiresTauri && <TauriRequired />}

      {error && !requiresTauri && (
        <div
          role="alert"
          className="mb-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          載入失敗：{error}
        </div>
      )}

      {/* 載入中 */}
      {!error && !requiresTauri && cases === null && (
        <p className="text-sm text-muted-foreground">載入中…</p>
      )}

      {/* 空狀態 */}
      {!error && !requiresTauri && cases !== null && cases.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16">
            <p className="text-muted-foreground">尚無案件</p>
            <Button asChild>
              <Link href="/cases/new">新增第一個案件</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 案件工作入口 */}
      {!error && !requiresTauri && cases !== null && cases.length > 0 && (
        <section className="space-y-4" aria-label="案件工作入口">
          <div className="grid gap-3 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-sm text-muted-foreground">{stat.label}</div>
                <div className="mt-2 text-2xl font-semibold">{stat.value}</div>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="grid grid-cols-[minmax(220px,1.3fr)_minmax(260px,1.7fr)_120px_120px_180px] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-muted-foreground max-xl:hidden">
              <div>案件名稱</div>
              <div>地址與所有權人</div>
              <div>案件類型</div>
              <div>狀態</div>
              <div className="text-right">下一步</div>
            </div>
            {cases.map((c) => (
              <article
                key={c.id}
                className="grid cursor-pointer gap-4 border-b border-slate-100 px-4 py-4 transition-colors last:border-b-0 hover:bg-slate-50/70 xl:grid-cols-[minmax(220px,1.3fr)_minmax(260px,1.7fr)_120px_120px_180px] xl:items-center"
                onClick={() => router.push(`/cases/${c.id}`)}
              >
                <div className="min-w-0">
                  <div className="font-medium">{c.case_name ?? c.case_no ?? c.id.slice(0, 8)}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.case_no ?? "尚未設定案件編號"} · {formatTpeDate(c.updated_at)}
                  </div>
                </div>

                <div className="min-w-0 text-sm">
                  <div>{c.address || "-"}</div>
                  <div className="text-xs text-muted-foreground">所有權人：{c.owner_name || "待補件"}</div>
                </div>

                <div className="text-sm">{propertyTypeLabel(c.property_type)}</div>

                <div className="flex items-center gap-2">
                  <StatusBadge status={c.status} />
                  <span className="sr-only">{statusLabel(c.status)}</span>
                </div>

                <div className="flex flex-wrap items-center justify-start gap-2 xl:justify-end">
                  <Button
                    type="button"
                    aria-label={`開啟${c.case_name ?? c.case_no ?? c.id.slice(0, 8)}工作台`}
                    onClick={(event) => {
                      event.stopPropagation();
                      router.push(`/cases/${c.id}`);
                    }}
                  >
                    開啟工作台
                  </Button>
                  <CaseListActions
                    caseId={c.id}
                    onView={() => router.push(`/cases/${c.id}`)}
                    onEdit={() => router.push(`/cases/${c.id}`)}
                    onDelete={() => setDeletingCase(c)}
                    onDownload={() => void handleDownload(c.id)}
                  />
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <DeleteConfirmDialog
        open={Boolean(deletingCase)}
        onCancel={() => setDeletingCase(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={deleting}
      />
    </div>
  );
}
