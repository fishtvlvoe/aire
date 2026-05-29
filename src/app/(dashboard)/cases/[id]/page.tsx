"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  casesApi,
  formatTpeDate,
  propertyTypeLabel,
  statusLabel,
  type CaseRow,
} from "@/lib/cases-api";
import { DemoAlignedWorkbench } from "@/components/workbench/DemoAlignedWorkbench";
import { useIpcErrorToast } from "@/hooks/useIpcErrorToast";
import { resolveRuntimeCaseId } from "@/lib/case-routes";

type DossierStatusSummary = {
  tier: "reference" | "formal";
  title: string;
  description: string;
  tone: "amber" | "emerald";
};

export default function CaseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = resolveRuntimeCaseId(params?.id, searchParams);

  const { handleError } = useIpcErrorToast();
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
          handleError(loadError);
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
    <main className="mx-auto w-full max-w-[1600px] space-y-6 px-4 py-6 lg:px-6">
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
        <DossierStatusBanner caseData={caseData} />
      </header>

      <DemoAlignedWorkbench caseData={caseData} initialTab={searchParams.get("tab")} />
    </main>
  );
}

function DossierStatusBanner({ caseData }: { caseData: CaseRow }) {
  const summary = summarizeDossierStatus(caseData);
  return (
    <section
      aria-label="案件資料狀態"
      className={
        summary.tone === "emerald"
          ? "rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3"
          : "rounded-lg border border-amber-200 bg-amber-50 px-4 py-3"
      }
    >
      <p className={summary.tone === "emerald" ? "text-sm font-medium text-emerald-900" : "text-sm font-medium text-amber-900"}>
        {summary.title}
      </p>
      <p className={summary.tone === "emerald" ? "mt-1 text-sm text-emerald-800" : "mt-1 text-sm text-amber-800"}>
        {summary.description}
      </p>
    </section>
  );
}

function summarizeDossierStatus(caseData: CaseRow): DossierStatusSummary {
  const registryData = caseData.land_registry_data;
  if (!registryData || typeof registryData !== "object" || Array.isArray(registryData)) {
    return {
      tier: "reference",
      title: "目前為參考版案件資料",
      description: "尚未寫入正式地政資料；你可以先整理補件、檢查免費前查結果，之後再決定是否進行付費正式查詢。",
      tone: "amber",
    };
  }

  const isPaid = registryData.isPaid === true;
  const entryValues = registryData.entries && typeof registryData.entries === "object" && !Array.isArray(registryData.entries)
    ? Object.values(registryData.entries as Record<string, unknown>)
    : [];
  const hasTrustedFormalEntry = entryValues.some((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return false;
    const record = entry as Record<string, unknown>;
    return record.trustedForPdf === true &&
      record.status === "success" &&
      record.source === "moi_api";
  });

  if (isPaid && hasTrustedFormalEntry) {
    return {
      tier: "formal",
      title: "目前為正式版案件資料",
      description: "已寫入正式地政資料，可直接用於正式版 PDF 與後續說明書流程。",
      tone: "emerald",
    };
  }

  return {
    tier: "reference",
    title: "目前為參考版案件資料",
    description: "目前以免費前查或補件資料為主；若需要正式地政資料，可之後再進行付費正式查詢。",
    tone: "amber",
  };
}
