"use client";

// AIRE 案件列表頁（Task 5.2）
//
// - invoke('list_cases') 取資料
// - 空表顯示「尚無案件，按右上角『新增案件』開始」
// - 表格欄位翻譯成中文（成屋/土地、草稿/已完成/已匯出）
// - updated_at 用 Intl.DateTimeFormat('zh-TW', { timeZone: 'Asia/Taipei' }) 格式化

import Link from "next/link";
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

/** 依狀態回傳 Badge variant */
function StatusBadge({ status }: { status: CaseRow["status"] }) {
  if (status === "completed" || status === "exported") {
    return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">完成</Badge>;
  }
  return <Badge variant="secondary">草稿</Badge>;
}

export default function CasesPage() {
  const [cases, setCases] = useState<CaseRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await casesApi.list();
        if (!cancelled) setCases(rows);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          載入失敗：{error}
        </div>
      )}

      {/* 載入中 */}
      {!error && cases === null && (
        <p className="text-muted-foreground text-sm">載入中…</p>
      )}

      {/* 空狀態 */}
      {!error && cases !== null && cases.length === 0 && (
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
      {!error && cases !== null && cases.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>物件名稱</TableHead>
              <TableHead>案件類型</TableHead>
              <TableHead>狀態</TableHead>
              <TableHead>建立日期</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cases.map((c) => (
              <TableRow key={c.id}>
                {/* 物件名稱（地址 or case_no） */}
                <TableCell className="font-medium">
                  {c.address || c.case_no || c.id.slice(0, 8)}
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
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/cases/${c.id}`}>查看</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </main>
  );
}
