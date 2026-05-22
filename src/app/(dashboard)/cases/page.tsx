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
import { getCaseRowDestination, getVisibleCaseManagementScope } from "@/lib/product-navigation-ia";

export default function CasesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scope = getVisibleCaseManagementScope(searchParams.get("view"));
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
  const scopedCases = scope.showsSupplementTasks
    ? caseRows.filter((item) => item.status === "keyin" || !item.owner_name)
    : caseRows;

  function openCaseDestination(caseId: string) {
    router.push(getCaseRowDestination(scope.id, caseId));
  }

  return (
    <section aria-label="案件管理內容" className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{scope.eyebrow}</p>
          <h1 className="text-2xl font-semibold tracking-normal">{scope.heading}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{scope.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/cases/new">新增案件</Link>
          </Button>
        </div>
      </header>

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

      {scope.showsWorkbenchPrompt && !error && !requiresTauri && cases !== null && cases.length > 0 && (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" aria-label="選擇案件進入工作台">
          <h2 className="text-base font-semibold">請先選擇案件</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            物件審核是單一案件內的操作區。請從下方選擇案件後，再處理欄位、資料來源、補件與現場確認、PDF 檢查。
          </p>
        </section>
      )}

      {scope.showsSupplementTasks && !error && !requiresTauri && cases !== null && cases.length > 0 && (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" aria-label="補件任務說明">
          <h2 className="text-base font-semibold">待補資料</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            這裡只列出目前缺少屋主、現場或正式文件資料的案件。選擇案件後再進入案件內補件。
          </p>
        </section>
      )}

      {/* 案件工作入口 */}
      {!error && !requiresTauri && cases !== null && cases.length > 0 && (
        <section className="space-y-4" aria-label="案件工作入口">
          {scope.showsCaseOverview ? (
            <div className="grid gap-3 md:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                  <div className="mt-2 text-2xl font-semibold">{stat.value}</div>
                </div>
              ))}
            </div>
          ) : null}

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="grid grid-cols-[minmax(220px,1.3fr)_minmax(260px,1.7fr)_120px_110px_200px] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-muted-foreground max-xl:hidden">
              <div>案件名稱</div>
              <div>地址與所有權人</div>
              <div>案件類型</div>
              <div>狀態</div>
              <div className="text-right">操作</div>
            </div>
            {scopedCases.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                目前沒有符合條件的案件
              </div>
            ) : null}
            {scopedCases.map((c) => (
              <article
                key={c.id}
                className="grid cursor-pointer gap-4 border-b border-slate-100 px-4 py-4 transition-colors last:border-b-0 hover:bg-slate-50/70 xl:grid-cols-[minmax(220px,1.3fr)_minmax(260px,1.7fr)_120px_110px_200px] xl:items-center"
                onClick={() => openCaseDestination(c.id)}
                role="link"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openCaseDestination(c.id);
                  }
                }}
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

                <div className="flex flex-wrap items-center justify-start gap-1 xl:justify-end">
                  <CaseListActions
                    caseId={c.id}
                    onPreview={() => router.push(`/cases/${c.id}/preview`)}
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
    </section>
  );
}
