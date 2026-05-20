"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { renderDisclosureHtml } from "@/lib/pdf-engine/html-renderer";
import {
  casesApi,
  propertyTypeLabel,
  type CaseRow,
} from "@/lib/cases-api";
import type { CaseDossierData } from "@/lib/pdf-engine/engine";
import { assembleDossierData } from "@/lib/pdf-engine/assemble-dossier-data";
import { PdfDocument } from "@/lib/pdf-engine/document";
import React from "react";
import { resolveThemeOrFallback } from "@/lib/pdf-themes/registry";
import { BRANDING_CHANGED_EVENT } from "@/lib/pdf-themes/persistence";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { isTauriEnv, safeInvoke } from "@/lib/safe-invoke";

interface LoadedLogo {
  bytes: number[];
  mime: string;
}

function bytesToObjectUrl(bytes: number[], mime: string): string {
  const data = new Uint8Array(bytes);
  const blob = new Blob([data], { type: mime });
  return URL.createObjectURL(blob);
}

export default function CasePreviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [c, setCase] = useState<CaseRow | null>(null);
  const [themeId, setThemeId] = useState("theme-a-minimal");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoBytes, setLogoBytes] = useState<number[] | undefined>(undefined);
  const [caseDossierData, setCaseDossierData] = useState<CaseDossierData | undefined>(undefined);
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  async function renderCurrentPdfBlob(dossier: CaseDossierData) {
    const { initReactPdfEngine } = await import("@/lib/pdf-engine/react-pdf-init");
    initReactPdfEngine();
    const { pdf, Document } = await import("@react-pdf/renderer");
    const element = React.createElement(PdfDocument, {
      data: dossier,
      themeId,
    }) as React.ReactElement<React.ComponentProps<typeof Document>>;
    return pdf(element).toBlob();
  }

  async function handleExport() {
    setExporting(true);
    try {
      if (!id) throw new Error("案件 ID 不存在");
      const dossier = caseDossierData;
      if (!dossier) throw new Error("說明書資料尚未載入");

      const blob = await renderCurrentPdfBlob(dossier);
      if (await isTauriEnv()) {
        const { save } = await import("@tauri-apps/plugin-dialog");
        const outputPath = await save({
          defaultPath: `${dossier.caseNo ?? id}-說明書.pdf`,
          filters: [{ name: "PDF", extensions: ["pdf"] }],
          title: "選擇輸出位置",
        });
        if (!outputPath) {
          toast.info("已取消匯出");
          return;
        }
        const pdfBytes = new Uint8Array(await blob.arrayBuffer());
        const writtenPath = await safeInvoke<string>("export_pdf", {
          args: {
            caseId: id,
            pdfBytes: Array.from(pdfBytes),
            outputPath,
          },
        });
        toast.success("PDF 已匯出", { description: writtenPath });
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${dossier.caseNo ?? id}-說明書.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF 已下載");
    } catch (e) {
      toast.error("匯出失敗", { description: String(e) });
    } finally {
      setExporting(false);
    }
  }

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    let createdLogoUrl: string | null = null;

    void (async () => {
      try {
        const [row, storedThemeId, storedLogo] = await Promise.all([
          casesApi.get(id),
          safeInvoke<string>("get_theme"),
          safeInvoke<LoadedLogo | null>("load_logo"),
        ]);

        if (cancelled) return;

        setCase(row);
        const resolved = resolveThemeOrFallback(storedThemeId);
        setThemeId(resolved.theme.id);
        window.dispatchEvent(
          new CustomEvent(BRANDING_CHANGED_EVENT, {
            detail: { themeId: resolved.theme.id },
          }),
        );

        let resolvedLogoBytes: number[] | undefined;
        if (storedLogo?.bytes?.length && storedLogo.mime) {
          createdLogoUrl = bytesToObjectUrl(storedLogo.bytes, storedLogo.mime);
          setLogoUrl(createdLogoUrl);
          setLogoBytes(storedLogo.bytes);
          resolvedLogoBytes = storedLogo.bytes;
        } else {
          setLogoUrl(null);
          setLogoBytes(undefined);
        }

        // 組裝完整 dossier data（含 IPC 呼叫）
        const assembled = await assembleDossierData(row);
        if (!cancelled) {
          const dossier = { ...assembled, logoBytes: resolvedLogoBytes };
          setCaseDossierData(dossier);
          const html = renderDisclosureHtml(dossier, {
            themeId: resolved.theme.id,
            generatedAt: new Date().toISOString().slice(0, 10),
          });
          setHtmlContent(html);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      }
    })();

    return () => {
      cancelled = true;
      if (createdLogoUrl) {
        URL.revokeObjectURL(createdLogoUrl);
      }
    };
  }, [id]);

  if (error && !c) {
    return (
      <main style={{ padding: 24 }}>
        <p style={{ color: "#b00020" }}>載入失敗：{error}</p>
      </main>
    );
  }

  if (!c) {
    return (
      <main style={{ padding: 24 }}>
        <p>載入中…</p>
      </main>
    );
  }

  return (
    <main
      style={{
        maxWidth: 960,
        margin: "32px auto",
        padding: 24,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <header style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              type="button"
              onClick={() => router.push(`/cases/${c.id}`)}
              style={{
                padding: "4px 12px",
                background: "white",
                border: "1px solid #ccc",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              ← 返回案件
            </button>
            <h1 style={{ margin: 0 }}>PDF 預覽</h1>
          </div>
          <Button
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            匯出 PDF
          </Button>
        </div>
        <p style={{ color: "#666", fontSize: 13, marginTop: 8 }}>
          主題：{themeId} ・ Logo：{logoUrl ? "已載入" : "未設定"}
        </p>
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="公司 Logo"
            style={{
              marginTop: 8,
              maxHeight: 44,
              maxWidth: 220,
              objectFit: "contain",
            }}
          />
        ) : null}
      </header>

      <div dangerouslySetInnerHTML={{ __html: htmlContent }} style={{ background: '#f5f5f5', padding: 24, borderRadius: 8 }} />
    </main>
  );
}
