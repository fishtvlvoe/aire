"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { CaseRow } from "@/lib/cases-api";
import { isTauriEnv, safeInvoke } from "@/lib/safe-invoke";
import { toast } from "sonner";
import { assembleDossierData } from "@/lib/pdf-engine/assemble-dossier-data";
import { PdfDocument } from "@/lib/pdf-engine/document";
import type { CaseDossierData } from "@/lib/pdf-engine/document";
import { Loader2, Download } from "lucide-react";
import React from "react";

interface CaseWizardStep5Props {
  caseId: string;
  caseData: CaseRow;
}

async function renderDossierPdfBlob(dossier: CaseDossierData): Promise<Blob> {
  const { initReactPdfEngine } = await import("@/lib/pdf-engine/react-pdf-init");
  initReactPdfEngine();
  const { pdf, Document } = await import("@react-pdf/renderer");
  const element = React.createElement(PdfDocument, {
    data: dossier,
    themeId: "theme-a-minimal",
  }) as React.ReactElement<React.ComponentProps<typeof Document>>;
  return pdf(element).toBlob();
}

export function CaseWizardStep5({ caseId, caseData }: CaseWizardStep5Props) {
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const dossierRef = useRef<CaseDossierData | null>(null);

  useEffect(() => {
    let cancelled = false;
    let createdPreviewUrl = "";
    void (async () => {
      setLoading(true);
      setLoadError(null);
      setPdfBlob(null);
      setPreviewUrl("");
      try {
        const dossier = await assembleDossierData(caseData);
        if (cancelled) return;
        dossierRef.current = dossier;
        const blob = await renderDossierPdfBlob(dossier);
        createdPreviewUrl = URL.createObjectURL(blob);
        if (cancelled) {
          URL.revokeObjectURL(createdPreviewUrl);
          return;
        }
        setPdfBlob(blob);
        setPreviewUrl(createdPreviewUrl);
      } catch (err) {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      if (createdPreviewUrl) {
        URL.revokeObjectURL(createdPreviewUrl);
      }
    };
  }, [caseData]);

  async function handleExport() {
    setExporting(true);
    try {
      const dossier = dossierRef.current;
      if (!dossier || !pdfBlob) throw new Error("說明書 PDF 尚未載入");

      if (await isTauriEnv()) {
        const { save } = await import("@tauri-apps/plugin-dialog");
        const outputPath = await save({
          defaultPath: `${dossier.caseNo ?? caseId}-說明書.pdf`,
          filters: [{ name: "PDF", extensions: ["pdf"] }],
          title: "選擇輸出位置",
        });
        if (!outputPath) {
          toast.info("已取消匯出");
          return;
        }
        const pdfBytes = new Uint8Array(await pdfBlob.arrayBuffer());
        const writtenPath = await safeInvoke<string>("export_pdf", {
          args: {
            caseId,
            pdfBytes: Array.from(pdfBytes),
            outputPath,
          },
        });
        toast.success("PDF 已匯出", { description: writtenPath });
      } else {
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${dossier.caseNo ?? caseId}-說明書.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("PDF 已下載");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "匯出失敗");
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        產生預覽中…
      </div>
    );
  }

  if (loadError) {
    return (
      <div role="alert" className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
        預覽產生失敗：{loadError}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-4 py-3">
        <div>
          <p className="text-sm font-medium text-slate-950">不動產說明書預覽</p>
          <p className="mt-1 text-xs text-slate-500">預覽與下載共用同一份 PDF，不會影響案件頁操作介面。</p>
        </div>
        <Button
          type="button"
          onClick={handleExport}
          disabled={exporting || !pdfBlob}
          size="sm"
        >
          <Download className="mr-1.5 h-4 w-4" />
          {exporting ? "匯出中…" : "匯出 PDF"}
        </Button>
      </div>
      <iframe
        data-testid="dossier-preview-frame"
        title="不動產說明書預覽"
        className="h-[72vh] w-full rounded-md border border-slate-200 bg-slate-100"
        src={previewUrl}
      />
    </div>
  );
}
