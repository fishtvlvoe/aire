"use client";

// AIRE 案件列表頁（Task 5.2）
//
// - invoke('list_cases') 取資料
// - 空表顯示「尚無案件，按右上角『新增案件』開始」
// - 表格欄位翻譯成中文（成屋/土地、草稿/已完成/已匯出）
// - updated_at 用 Intl.DateTimeFormat('zh-TW', { timeZone: 'Asia/Taipei' }) 格式化

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  casesApi,
  formatTpeDate,
  propertyTypeLabel,
  statusLabel,
  type CaseRow,
} from "@/lib/cases-api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TauriRequired } from "@/components/TauriRequired";
import { NotInTauriError } from "@/lib/tauri-bridge";
import { CaseListActions } from "@/components/CaseListActions";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { CaseSupplementDialog } from "@/components/CaseSupplementDialog";
import { safeInvoke } from "@/lib/safe-invoke";
import { toast } from "sonner";

/** 依狀態回傳 Badge variant */
function StatusBadge({ status }: { status: CaseRow["status"] }) {
  if (status === "completed" || status === "exported") {
    return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">完成</Badge>;
  }
  return <Badge variant="secondary">草稿</Badge>;
}

export default function CasesPage() {
  const router = useRouter();
  const [cases, setCases] = useState<CaseRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requiresTauri, setRequiresTauri] = useState(false);
  const [deletingCase, setDeletingCase] = useState<CaseRow | null>(null);
  const [supplementCaseId, setSupplementCaseId] = useState<string | null>(null);
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

  return (
    <main className="p-6">
      {/* 頁首 */}
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">案件列表</h1>
        <Button asChild>
          <Link href="/cases/new">新增案件</Link>
        </Button>
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
        <p className="text-muted-foreground text-sm">載入中…</p>
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

      {/* 資料表格 */}
      {!error && !requiresTauri && cases !== null && cases.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>案件名稱</TableHead>
              <TableHead>地址 + 所有權人</TableHead>
              <TableHead>案件類型</TableHead>
              <TableHead>狀態</TableHead>
              <TableHead>建立日期</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cases.map((c) => (
              <TableRow
                key={c.id}
                className="cursor-pointer"
                onClick={() => router.push(`/cases/${c.id}`)}
              >
                <TableCell className="font-medium">
                  {c.case_name ?? c.case_no ?? c.id.slice(0, 8)}
                </TableCell>

                <TableCell>
                  <div className="text-sm">{c.address || "-"}</div>
                  <div className="text-xs text-muted-foreground">
                    所有權人：{c.owner_name || "-"}
                  </div>
                </TableCell>

                {/* 案件類型 */}
                <TableCell>{propertyTypeLabel(c.property_type)}</TableCell>

                {/* 狀態 Badge */}
                <TableCell>
                  <StatusBadge status={c.status} />
                </TableCell>

                {/* 建立日期 */}
                <TableCell>{formatTpeDate(c.updated_at)}</TableCell>

                {/* 操作 */}
                <TableCell className="text-right">
                  <CaseListActions
                    onSupplement={() => setSupplementCaseId(c.id)}
                    onView={() => router.push(`/cases/${c.id}`)}
                    onEdit={() => router.push(`/cases/${c.id}`)}
                    onDelete={() => setDeletingCase(c)}
                    onDownload={() => void handleDownload(c.id)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <DeleteConfirmDialog
        open={Boolean(deletingCase)}
        onCancel={() => setDeletingCase(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={deleting}
      />
      {supplementCaseId ? (
        <CaseSupplementDialog
          caseId={supplementCaseId}
          open={Boolean(supplementCaseId)}
          onClose={() => {
            setSupplementCaseId(null);
            void refreshCases();
          }}
        />
      ) : null}
    </main>
  );
}
