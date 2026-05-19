"use client";

import { useEffect, useState } from "react";
import { PdfPreviewer } from "@/components/PdfPreviewer";
import { Button } from "@/components/ui/button";
import type { CaseRow } from "@/lib/cases-api";
import { assembleDossierData } from "@/lib/pdf-engine/assemble-dossier-data";
import { safeInvoke } from "@/lib/safe-invoke";
import { toast } from "sonner";

interface CaseWizardStep5Props {
  caseId: string;
  caseData: CaseRow;
}

export function CaseWizardStep5({ caseId, caseData }: CaseWizardStep5Props) {
  const [exporting, setExporting] = useState(false);
  const [dossierData, setDossierData] = useState<Awaited<ReturnType<typeof assembleDossierData>>>();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const assembled = await assembleDossierData(caseData);
        if (!cancelled) setDossierData(assembled);
      } catch (error) {
        if (!cancelled) {
          console.error("[CaseWizardStep5] 組裝預覽資料失敗", error);
          toast.error("預覽資料載入失敗");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [caseData]);

  async function handleExport() {
    setExporting(true);
    try {
      await safeInvoke("export_pdf", { caseId });
      toast.success("已觸發 PDF 匯出");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "匯出失敗");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <PdfPreviewer caseId={caseId} caseData={dossierData} />
      <p className="text-sm text-muted-foreground">請確認資料後匯出 PDF。</p>
      <Button type="button" onClick={handleExport} disabled={exporting}>
        {exporting ? "匯出中…" : "匯出"}
      </Button>
    </div>
  );
}
