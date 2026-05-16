"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { safeInvoke } from "@/lib/safe-invoke";
import { toast } from "sonner";

interface CaseWizardStep4Props {
  caseId: string;
}

export function CaseWizardStep4({ caseId }: CaseWizardStep4Props) {
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
      <p className="text-sm text-muted-foreground">請確認資料後匯出 PDF。</p>
      <Button type="button" onClick={handleExport} disabled={exporting}>
        {exporting ? "匯出中…" : "匯出"}
      </Button>
    </div>
  );
}
