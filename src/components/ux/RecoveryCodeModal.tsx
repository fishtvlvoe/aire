"use client";

import * as React from "react";
import "@testing-library/jest-dom/vitest";
import { Download, Printer, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";

type DownloadPdfHandler = (words: string[]) => Promise<void>;

export interface RecoveryCodeModalProps {
  isOpen: boolean;
  recoveryWords: string[];
  onClose: () => void;
  onDownloadPdf?: DownloadPdfHandler;
}

const defaultDownloadPdf: DownloadPdfHandler = async (words) => {
  const { invoke } = await import("@tauri-apps/api/core");
  await invoke("generate_recovery_pdf", { words });
};

export default function RecoveryCodeModal({
  isOpen,
  recoveryWords,
  onClose,
  onDownloadPdf = defaultDownloadPdf,
}: RecoveryCodeModalProps) {
  const [didPrint, setDidPrint] = React.useState(false);
  const [didDownload, setDidDownload] = React.useState(false);
  const [didAcknowledge, setDidAcknowledge] = React.useState(false);
  const [downloadError, setDownloadError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) {
      setDidPrint(false);
      setDidDownload(false);
      setDidAcknowledge(false);
      setDownloadError(null);
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
    };

    document.addEventListener("keydown", handleEscape, { capture: true });
    return () => document.removeEventListener("keydown", handleEscape, { capture: true });
  }, [isOpen]);

  const closeEnabled = didAcknowledge;
  // 保留追蹤以便日後 UX 顯示已完成動作的標記
  void didPrint;
  void didDownload;

  const handlePrint = () => {
    window.print();
    setDidPrint(true);
  };

  const handleDownload = async () => {
    setDownloadError(null);
    try {
      await onDownloadPdf(recoveryWords);
      setDidDownload(true);
    } catch {
      setDownloadError("下載 PDF 失敗，請稍後再試一次。");
    }
  };

  if (!isOpen) return null;

  return (
    <div aria-modal="true" className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog">
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-foreground/40 backdrop-blur-sm"
        data-testid="recovery-modal-backdrop"
      />
      <section
        className="relative z-10 grid w-full max-w-xl gap-4 rounded-lg border border-border bg-background p-6 shadow-lg"
        data-testid="recovery-modal"
      >
        <header className="space-y-1.5 text-left">
          <h2 className="text-lg font-semibold leading-none tracking-tight">請立即保存救援碼</h2>
          <p className="text-sm text-muted-foreground" id="recovery-modal-description">
            救援碼遺失將導致資料永久無法救援，請完成下列三個動作後再關閉。
          </p>
        </header>

        <div className="rounded-md border border-border bg-muted/30 p-4">
          <ol className="grid grid-cols-2 gap-2 text-sm">
            {recoveryWords.map((word, index) => (
              <li
                className="rounded border border-border/80 bg-background px-3 py-2 font-medium"
                key={`${word}-${index}`}
              >
                <span className="mr-2 text-muted-foreground">{index + 1}.</span>
                <span>{word}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={handlePrint} type="button" variant={didPrint ? "secondary" : "outline"}>
            <Printer aria-hidden="true" className="h-4 w-4" />
            Print
          </Button>
          <Button
            onClick={() => void handleDownload()}
            type="button"
            variant={didDownload ? "secondary" : "outline"}
          >
            <Download aria-hidden="true" className="h-4 w-4" />
            Download PDF copy
          </Button>
        </div>

        <label className="flex items-start gap-2 rounded-md border border-border px-3 py-2 text-sm">
          <input
            aria-label="我已將救援碼儲存於實體保險箱 / 安全位置"
            checked={didAcknowledge}
            onChange={(event) => setDidAcknowledge(event.target.checked)}
            type="checkbox"
          />
          <span className="inline-flex items-center gap-1">
            <ShieldCheck aria-hidden="true" className="h-4 w-4 text-primary" />
            我已將救援碼儲存於實體保險箱 / 安全位置
          </span>
        </label>

        {downloadError ? (
          <p className="text-sm text-destructive" role="alert">
            {downloadError}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button disabled={!closeEnabled} onClick={onClose} type="button">
            關閉
          </Button>
        </div>
      </section>
    </div>
  );
}
