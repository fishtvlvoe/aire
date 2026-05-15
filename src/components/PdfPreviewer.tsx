import { useCallback, useEffect, useRef, useState } from "react";
import "@testing-library/jest-dom/vitest";
import { invoke } from "@tauri-apps/api/core";
import { save as saveDialog } from "@tauri-apps/plugin-dialog";
import { AlertCircle, Download, Loader2, RotateCcw } from "lucide-react";

import { createPdfEngine, type PdfEngine, type RenderOptions } from "../lib/pdf-engine/engine";
import { BRANDING_CHANGED_EVENT } from "../lib/pdf-themes/persistence";

type PreviewState = "idle" | "loading" | "ready" | "error";

interface PdfPreviewerProps {
  caseId: string;
  content: string;
}

type PreviewErrorCode = "ENGINE_FAILURE" | "DOWNLOAD_FAILURE";

class PdfPreviewError extends Error {
  constructor(
    public readonly code: PreviewErrorCode,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "PdfPreviewError";
  }
}

function toUint8Array(blob: Blob): Promise<Uint8Array> {
  return blob.arrayBuffer().then((buffer) => new Uint8Array(buffer));
}

function toPreviewError(err: unknown, code: PreviewErrorCode): PdfPreviewError {
  if (err instanceof PdfPreviewError) return err;
  const message = err instanceof Error ? err.message : String(err);
  return new PdfPreviewError(code, message, err);
}

export function PdfPreviewer({ caseId, content }: PdfPreviewerProps) {
  const engineRef = useRef<PdfEngine | null>(null);
  const latestUrlRef = useRef<string | null>(null);
  const latestBlobRef = useRef<Blob | null>(null);

  const [themeId, setThemeId] = useState<string>("theme-a-minimal");
  const [status, setStatus] = useState<PreviewState>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<PdfPreviewError | null>(null);

  const renderPreview = useCallback(async () => {
    setStatus("loading");
    setError(null);

    try {
      const engine = engineRef.current ?? (await createPdfEngine());
      engineRef.current = engine;

      const renderArgs: RenderOptions & { themeId: string } = { caseId, content, themeId };
      const blob = await engine.render(renderArgs);
      const objectUrl = URL.createObjectURL(blob);

      if (latestUrlRef.current) {
        URL.revokeObjectURL(latestUrlRef.current);
      }

      latestUrlRef.current = objectUrl;
      latestBlobRef.current = blob;
      setPreviewUrl(objectUrl);
      setStatus("ready");
    } catch (err) {
      const typedError = toPreviewError(err, "ENGINE_FAILURE");
      console.error("[PdfPreviewer] render failed", typedError);
      setError(typedError);
      setStatus("error");
    }
  }, [caseId, content, themeId]);

  const handleRetry = useCallback(() => {
    void renderPreview();
  }, [renderPreview]);

  const handleDownload = useCallback(async () => {
    if (!latestBlobRef.current) return;

    try {
      const inTauri = typeof (window as typeof window & { __TAURI__?: unknown }).__TAURI__ !== "undefined";

      if (!inTauri) {
        // Browser dev mode: use native <a> download
        const url = URL.createObjectURL(latestBlobRef.current);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${caseId || "AIRE"}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }

      const chosenPath = await saveDialog({
        title: "下載 PDF",
        defaultPath: `${caseId || "AIRE"}.pdf`,
        filters: [{ name: "PDF", extensions: ["pdf"] }],
      });
      if (!chosenPath) return;

      const bytes = await toUint8Array(latestBlobRef.current);
      await invoke("write_file", {
        path: chosenPath,
        bytes: Array.from(bytes),
      });
    } catch (err) {
      const typedError = toPreviewError(err, "DOWNLOAD_FAILURE");
      console.error("[PdfPreviewer] download failed", typedError);
      setError(typedError);
      setStatus("error");
    }
  }, [caseId]);

  useEffect(() => {
    void renderPreview();
  }, [renderPreview]);

  useEffect(() => {
    const onBrandingChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ themeId?: string }>).detail;
      if (detail?.themeId) {
        setThemeId(detail.themeId);
      }
    };

    window.addEventListener(BRANDING_CHANGED_EVENT, onBrandingChanged);
    return () => {
      window.removeEventListener(BRANDING_CHANGED_EVENT, onBrandingChanged);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (latestUrlRef.current) {
        URL.revokeObjectURL(latestUrlRef.current);
        latestUrlRef.current = null;
      }
    };
  }, []);

  return (
    <section className="space-y-4 font-sans">
      {status === "loading" && (
        <div
          data-testid="pdf-loading-spinner"
          aria-live="polite"
          className="inline-flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          PDF 產生中…
        </div>
      )}

      {status === "error" && (
        <div
          role="alert"
          className="space-y-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-destructive"
        >
          <p className="inline-flex items-center gap-2 text-sm font-medium">
            <AlertCircle className="h-4 w-4" />
            PDF 預覽失敗（{error?.code ?? "ENGINE_FAILURE"}）
          </p>
          <button
            type="button"
            data-testid="pdf-error-retry"
            onClick={handleRetry}
            className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <RotateCcw className="h-4 w-4" />
            重試
          </button>
        </div>
      )}

      {previewUrl && status !== "error" && (
        <iframe
          data-testid="pdf-iframe"
          title="PDF Preview"
          src={previewUrl}
          style={{ width: "100%", height: "70vh", border: 0 }}
        />
      )}

      <button
        type="button"
        data-testid="pdf-download-btn"
        onClick={handleDownload}
        disabled={!latestBlobRef.current || status === "loading"}
        className="inline-flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Download className="h-4 w-4" />
        下載 PDF
      </button>
    </section>
  );
}
