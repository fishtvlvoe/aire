"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { CaseRow } from "@/lib/cases-api";
import { safeInvoke } from "@/lib/safe-invoke";
import { toast } from "sonner";
import { assembleDossierData } from "@/lib/pdf-engine/assemble-dossier-data";
import { renderDisclosureHtml } from "@/lib/pdf-engine/html-renderer";
import { PdfDocument } from "@/lib/pdf-engine/document";
import type { CaseDossierData } from "@/lib/pdf-engine/document";
import { Loader2, Download } from "lucide-react";
import React from "react";

interface CaseWizardStep5Props {
  caseId: string;
  caseData: CaseRow;
}

export function CaseWizardStep5({ caseId, caseData }: CaseWizardStep5Props) {
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const dossierRef = useRef<CaseDossierData | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const dossier = await assembleDossierData(caseData);
        if (cancelled) return;
        dossierRef.current = dossier;
        const html = renderDisclosureHtml(dossier, {
          themeId: "theme-a-minimal",
          generatedAt: new Date().toLocaleDateString("zh-TW"),
        });
        setHtmlContent(html);
      } catch (err) {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [caseData]);

  async function handleExport() {
    setExporting(true);
    try {
      if ((window as unknown as Record<string, unknown>).__TAURI__) {
        // Tauri 桌面版：呼叫 Rust IPC 匯出 PDF
        const result = await safeInvoke<{ filePath: string }>("export_pdf", {
          caseId,
          html: htmlContent,
        });
        toast.success("PDF 已匯出", { description: result?.filePath });
      } else {
        // 網頁版：用 @react-pdf/renderer 直接生成 PDF blob 觸發下載
        const dossier = dossierRef.current;
        if (!dossier) throw new Error("說明書資料尚未載入");

        const { initReactPdfEngine } = await import("@/lib/pdf-engine/react-pdf-init");
        initReactPdfEngine();
        const { pdf, Document } = await import("@react-pdf/renderer");
        const element = React.createElement(PdfDocument, {
          data: dossier,
          themeId: "theme-a-minimal",
        }) as React.ReactElement<React.ComponentProps<typeof Document>>;
        const blob = await pdf(element).toBlob();
        const url = URL.createObjectURL(blob);
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
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">不動產說明書預覽</p>
        <Button
          type="button"
          onClick={handleExport}
          disabled={exporting || !htmlContent}
          size="sm"
        >
          <Download className="mr-1.5 h-4 w-4" />
          {exporting ? "匯出中…" : "匯出 PDF"}
        </Button>
      </div>
      <div
        className="overflow-auto rounded border bg-white"
        style={{ height: "60vh" }}
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
}
