"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { CaseRow } from "@/lib/cases-api";
import { safeInvoke } from "@/lib/safe-invoke";
import { toast } from "sonner";

interface CaseWizardStep5Props {
  caseId: string;
  caseData: CaseRow;
}

export function CaseWizardStep5({ caseId, caseData: _caseData }: CaseWizardStep5Props) {
  const [exporting, setExporting] = useState(false);

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
      <div className="rounded border p-4 text-sm text-muted-foreground">
        詳細欄位請至「補件 / Key-in」頁面填寫與預覽。
      </div>
      <p className="text-sm text-muted-foreground">請確認資料後匯出 PDF。</p>
      <Button type="button" onClick={handleExport} disabled={exporting}>
        {exporting ? "匯出中…" : "匯出"}
      </Button>
    </div>
  );
}
