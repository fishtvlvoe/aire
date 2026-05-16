"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  casesApi,
  formatTpeDate,
  propertyTypeLabel,
  statusLabel,
  type CaseRow,
} from "@/lib/cases-api";
import { CaseWizard } from "@/components/case-wizard/CaseWizard";

export default function CaseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [caseData, setCaseData] = useState<CaseRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    void (async () => {
      try {
        const row = await casesApi.get(id);
        if (!cancelled) {
          setCaseData(row);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : String(loadError));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error && !caseData) {
    return (
      <main className="p-6">
        <p className="text-destructive">載入失敗：{error}</p>
      </main>
    );
  }

  if (!caseData || !id) {
    return (
      <main className="p-6">
        <p className="text-muted-foreground">載入中…</p>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto py-8 px-6 space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push("/cases")}>
            ← 返回
          </Button>
          <h1 className="text-xl font-semibold">
            {caseData.case_name ?? caseData.case_no ?? caseData.id.slice(0, 8)}
          </h1>
          <span className="text-xs rounded bg-muted px-2 py-0.5">{statusLabel(caseData.status)}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {propertyTypeLabel(caseData.property_type)} ・ 建立於 {formatTpeDate(caseData.created_at)}
        </p>
      </header>

      <Tabs value={caseData.property_type}>
        <TabsList>
          <TabsTrigger value="residential">成屋</TabsTrigger>
          <TabsTrigger value="land">土地</TabsTrigger>
        </TabsList>
      </Tabs>

      <CaseWizard caseId={id} />
    </main>
  );
}
