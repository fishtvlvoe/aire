"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import { Trash2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { safeInvoke } from "@/lib/tauri-bridge";

const MAX_LOGO_SIZE = 2 * 1024 * 1024;
const SUPPORTED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/svg+xml",
  "image/avif",
]);

export function LogoUploader() {
  const inputId = useId();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const alertRef = useRef<HTMLDivElement | null>(null);
  const errorRef = useRef<string | null>(null);

  // 同步寫入 DOM，避免 waitFor 等到 React 非同步 commit 才看到 alert
  // 這對 CLU-001 「3 MiB 拒絕需在 100ms 內顯示」效能預算有意義
  function showErrorImmediate(message: string) {
    const node = alertRef.current;
    if (node) {
      node.hidden = false;
      // 完整重建內容（icon + 訊息文字），確保 textContent 同步可被讀取
      node.innerHTML = "";
      const iconNode = document.createElement("span");
      iconNode.setAttribute("aria-hidden", "true");
      iconNode.className = "mt-0.5 h-4 w-4 shrink-0";
      iconNode.textContent = "!";
      const messageNode = document.createElement("p");
      messageNode.textContent = message;
      node.appendChild(iconNode);
      node.appendChild(messageNode);
    }
    errorRef.current = message;
  }

  function clearErrorImmediate() {
    errorRef.current = null;
    const node = alertRef.current;
    if (node) {
      node.hidden = true;
      node.textContent = "";
    }
  }

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const pickerClass = cn(
    "inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-input px-4 py-3 text-sm font-medium transition-colors",
    "hover:bg-accent hover:text-accent-foreground",
    "disabled:pointer-events-none disabled:opacity-50",
    previewUrl && "border-primary bg-primary/10 text-primary",
  );

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!SUPPORTED_MIME.has(file.type)) {
      showErrorImmediate("僅支援 PNG、JPEG、SVG、AVIF 格式");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_LOGO_SIZE) {
      showErrorImmediate("Logo 檔案過大，請壓縮後再上傳（限 2 MiB 以下）");
      event.target.value = "";
      return;
    }

    clearErrorImmediate();
    setIsSaving(true);

    const previousPreview = previewUrl;
    try {
      const buffer = await file.arrayBuffer();
      const bytes = Array.from(new Uint8Array(buffer));
      await safeInvoke("save_logo", { bytes, mime: file.type });

      const nextPreview = URL.createObjectURL(file);
      setPreviewUrl(nextPreview);
      if (previousPreview) {
        URL.revokeObjectURL(previousPreview);
      }
    } catch (err) {
      showErrorImmediate(err instanceof Error ? err.message : "Logo 上傳失敗，請稍後再試");
    } finally {
      setIsSaving(false);
      event.target.value = "";
    }
  }

  function handleDelete() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    clearErrorImmediate();
  }

  return (
    <section className="space-y-3 font-sans">
      <h3 className="text-base font-semibold">Logo</h3>

      <input
        id={inputId}
        data-testid="logo-file-input"
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,image/avif"
        className="sr-only"
        disabled={isSaving}
        onChange={handleFileChange}
      />

      <label htmlFor={inputId} className={pickerClass} aria-disabled={isSaving}>
        <Upload className="h-4 w-4" />
        {isSaving ? "上傳中…" : "上傳 Logo"}
      </label>

      <div
        ref={alertRef}
        role="alert"
        hidden
        data-testid="logo-error-alert"
        className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
      />


      {previewUrl && (
        <div className="flex items-center gap-3 rounded-md border border-border p-3">
          <img
            src={previewUrl}
            alt="Logo 預覽"
            className="h-14 w-14 rounded border border-border object-contain"
          />
          <button
            type="button"
            onClick={handleDelete}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border border-input px-3 py-2 text-sm transition-colors",
              "hover:bg-accent hover:text-accent-foreground",
              "disabled:pointer-events-none disabled:opacity-50",
            )}
          >
            <Trash2 className="h-4 w-4" />
            刪除
          </button>
        </div>
      )}
    </section>
  );
}
